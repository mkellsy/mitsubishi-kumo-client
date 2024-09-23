import * as Interfaces from "@mkellsy/hap-device";

import fetch from "node-fetch-native";

import { ARP } from "@mkellsy/arp";
import { Device, DeviceState } from "@mkellsy/hap-device";
import { EventEmitter } from "@mkellsy/event-emitter";

import { AuthToken } from "./Interfaces/AuthToken";
import { Command } from "./Interfaces/Command";
import { Credentials } from "./Interfaces/Credentials";
import { Headers } from "./Interfaces/Headers";
import { SecurityToken } from "./Interfaces/SecurityToken";
import { Site } from "./Interfaces/Site";
import { Thermostat } from "./Devices/Thermostat";
import { ZoneTable } from "./Interfaces/ZoneTable";

import { encode } from "./Cryptography";

export class Location extends EventEmitter<{
    Available: (devices: Device[]) => void;
    Message: (response: Response) => void;
    Update: (device: Device, state: DeviceState) => void;
}> {
    private token?: SecurityToken;
    private tokenTimeout?: NodeJS.Timeout;

    private credentials: Credentials;
    private devices: Map<string, Thermostat> = new Map();

    constructor(credentials: Credentials) {
        super(Infinity);

        this.credentials = credentials;

        this.discoverZones().then(() => {
            Promise.all(Array.from(this.devices.keys()).map((serial) => this.update(serial))).then(() => {
                this.emit("Available", Array.from(this.devices.values()));
            });
        });
    }

    /**
     * Destroys the device.
     */
    public destroy(): void {
        if (this.tokenTimeout != null) {
            clearTimeout(this.tokenTimeout);
        }

        this.tokenTimeout = undefined;
        this.devices.forEach((device) => device.destroy());
    }

    public update(serial: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const device = this.devices.get(serial);

            if (device == null) {
                return reject(new Error("Tried to access a zone that is not discovered."));
            }

            (device.ip != null ? this.updatetLocal(device) : this.updateRemote(device))
                .then((status) => {
                    device.update(status);

                    resolve();
                })
                .catch(() => {
                    this.discoverZones().then(() => {
                        return this.update(serial);
                    });
                });
        });
    }

    public execute<COMMAND extends keyof Command>(
        serial: string,
        command: COMMAND,
        value: Command[COMMAND],
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const device = this.devices.get(serial);

            if (device == null) {
                return reject(new Error("Tried to execute a command for a zone that is not discovered."));
            }

            const payload = this.buildCommand(device, command, value);

            if (payload == null) {
                return reject(new Error("Invalid command."));
            }

            (device.ip != null ? this.executeLocal(device, payload) : this.executeRemote(device, payload))
                .then(() => resolve())
                .catch(() => {
                    this.discoverZones().then(() => {
                        return this.execute(serial, command, value);
                    });
                });
        });
    }

    private buildCommand<COMMAND extends keyof Command>(
        device: Thermostat,
        command: COMMAND,
        value: Command[COMMAND],
    ): Record<string, unknown> | undefined {
        if (device.ip != null) {
            switch (command) {
                case "Mode":
                    return this.buildModeCommandLocal(value as Command["Mode"]);

                case "CoolTarget":
                    return {
                        spCool:
                            (value as Command["CoolTarget"]) < device.limits.min
                                ? device.limits.min
                                : (value as Command["CoolTarget"]),
                    };

                case "HeatTarget":
                    return {
                        spHeat:
                            (value as Command["HeatTarget"]) > device.limits.max
                                ? device.limits.max
                                : (value as Command["HeatTarget"]),
                    };
            }
        } else {
            switch (command) {
                case "Mode":
                    return this.buildModeCommandRemote(value as Command["Mode"]);

                case "CoolTarget":
                    return {
                        spCool:
                            (value as Command["CoolTarget"]) < device.limits.min
                                ? device.limits.min
                                : (value as Command["CoolTarget"]),
                    };

                case "HeatTarget":
                    return {
                        spHeat:
                            (value as Command["HeatTarget"]) > device.limits.max
                                ? device.limits.max
                                : (value as Command["HeatTarget"]),
                    };
            }
        }

        return undefined;
    }

    private buildModeCommandLocal(value: Command["Mode"]): { mode: string } {
        switch (value) {
            case "Heat":
                return { mode: "heat" };

            case "Cool":
                return { mode: "cool" };

            case "Auto":
                return { mode: "auto" };

            default:
                return { mode: "off" };
        }
    }

    private updatetLocal(device: Thermostat): Promise<Interfaces.ThermostatStatus> {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({ c: { indoorUnit: { status: {} } } });
            const url = `http://${device.ip}/api?m=${encode(body, device.password, device.token)}`;

            fetch(url, {
                method: "PUT",
                headers: { Accept: "application/json, text/plain, */*", "Content-Type": "application/json" },
                body,
            })
                .then((response) => {
                    response
                        .json()
                        .then((data) => {
                            if (data.r?.indoorUnit?.status == null) {
                                reject(new Error("Got an invalid status response"));
                            } else {
                                resolve(data.r.indoorUnit.status);
                            }
                        })
                        .catch((error) => reject(error));
                })
                .catch((error) => reject(error));
        });
    }

    private executeLocal(device: Thermostat, command: Record<string, unknown>): Promise<void> {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({ c: { indoorUnit: { status: command } } });
            const url = `http://${device.ip}/api?m=${encode(body, device.password, device.token)}`;

            fetch(url, {
                method: "PUT",
                headers: { Accept: "application/json, text/plain, */*", "Content-Type": "application/json" },
                body,
            })
                .then((response) => {
                    response
                        .json()
                        .then(() => resolve())
                        .catch((error) => reject(error));
                })
                .catch((error) => reject(error));
        });
    }

    private buildModeCommandRemote(value: Command["Mode"]): { power: number; operationMode: number } {
        switch (value) {
            case "Heat":
                return { power: 1, operationMode: 1 };

            case "Cool":
                return { power: 1, operationMode: 3 };

            case "Auto":
                return { power: 1, operationMode: 8 };

            default:
                return { power: 0, operationMode: 16 };
        }
    }

    private updateRemote(device: Thermostat): Promise<Interfaces.ThermostatStatus> {
        return new Promise((resolve, reject) => {
            fetch("https://geo-c.kumocloud.com/getDeviceUpdates", {
                method: "POST",
                headers: Headers,
                body: JSON.stringify([this.token?.uuid, [device.serial]]),
            })
                .then((response) => {
                    response
                        .json()
                        .then((data) => {
                            const status = data[2][0][0];

                            let mode = "off";

                            switch (status.operation_mode) {
                                case 1:
                                    mode = "heat";
                                    break;

                                case 3:
                                    mode = "cool";
                                    break;

                                case 8:
                                    mode = "autoCool";
                                    break;

                                default:
                                    mode = "off";
                                    break;
                            }

                            resolve({
                                id: status.id,
                                name: device.name,
                                roomTemp: status.room_temp,
                                mode,
                                spCool: status.sp_cool,
                                spHeat: status.sp_heat,
                                vaneDir: "",
                                fanSpeed: status.fan_speed,
                                tempSource: "",
                                activeThermistor: "",
                                filterDirty: false,
                                hotAdjust: false,
                                defrost: false,
                                standby: false,
                                runTest: 0,
                                humidTest: 0,
                            });
                        })
                        .catch((error) => reject(error));
                })
                .catch((error) => reject(error));
        });
    }

    private executeRemote(device: Thermostat, command: Record<string, unknown>): Promise<void> {
        return new Promise((resolve, reject) => {
            fetch("https://geo-c.kumocloud.com/sendDeviceCommands/v2", {
                method: "POST",
                headers: Headers,
                body: JSON.stringify([this.token?.uuid, { [device.serial]: command }]),
            })
                .then((response) => {
                    response
                        .json()
                        .then(() => resolve())
                        .catch((error) => reject(error));
                })
                .catch((error) => reject(error));
        });
    }

    private discoverZones(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.tokenTimeout != null) {
                clearTimeout(this.tokenTimeout);
            }

            this.tokenTimeout = undefined;

            fetch("https://geo-c.kumocloud.com/login", {
                method: "POST",
                headers: Headers,
                body: JSON.stringify({
                    ...this.credentials,
                    appVersion: "2.2.0",
                }),
            })
                .then((response) => {
                    if (response == null) {
                        return reject(new Error("Malformed response"));
                    }

                    if (response.status < 200 || response.status > 299) {
                        return reject(new Error(`Request returned status ${response.status} ${response.statusText}`));
                    }

                    response
                        .json()
                        .then((payload: unknown[]) => {
                            const auth = payload[0] as AuthToken;
                            const site = payload[2] as Site;

                            if (auth == null) {
                                return reject(new Error("Malformed auth response"));
                            }

                            this.token = new SecurityToken(auth.token);

                            if (site == null) {
                                return resolve();
                            }

                            this.parseZones(site.children)
                                .then((results) => resolve(results))
                                .catch((error) => reject(error));
                        })
                        .finally(() => {
                            const expiryTime = this.token?.expiryTime || Date.now() + 10_000;
                            const duration = expiryTime - Date.now();

                            this.tokenTimeout = setTimeout(() => this.discoverZones(), duration);
                        })
                        .catch((error) => reject(error));
                })
                .catch((error) => reject(error));
        });
    }

    private parseZones(payload: Site[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const waits: Promise<void>[] = [];

            for (let i = 0; i < payload.length; i++) {
                const data = payload[i].zoneTable;
                const serials = Object.keys(data);

                for (let j = 0; j < serials.length; j++) {
                    const zone = data[serials[j]];

                    waits.push(
                        new Promise((resolve) => {
                            ARP.fromMac(zone.mac)
                                .then((address) => {
                                    this.createDevice(zone, address?.ip);

                                    resolve();
                                })
                                .catch(() => {
                                    this.createDevice(zone);

                                    resolve();
                                });
                        }),
                    );
                }
            }

            Promise.all(waits)
                .then(() => resolve())
                .catch((error) => reject(error));
        });
    }

    private createDevice(zone: ZoneTable, ip?: string): void {
        const device = this.devices.get(zone.serial);

        if (device != null) {
            device.refresh({
                ...zone,
                ip,
            });
        } else {
            this.devices.set(
                zone.serial,
                new Thermostat(this, {
                    ...zone,
                    ip,
                }).on("Update", this.onDeviceUpdate),
            );
        }
    }

    /*
     * When a device updates, this will emit an update event.
     */
    private onDeviceUpdate = (device: Interfaces.Device, state: Interfaces.DeviceState): void => {
        this.emit("Update", device, state);
    };
}
