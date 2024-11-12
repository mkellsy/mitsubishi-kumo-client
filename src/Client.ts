import { get as getLogger } from "js-logger";

import fetch from "node-fetch-native";

import { ARP } from "@mkellsy/arp";
import { Device, DeviceState, ThermostatStatus } from "@mkellsy/hap-device";
import { EventEmitter } from "@mkellsy/event-emitter";

import { AuthToken } from "./Response/AuthToken";
import { Command } from "./Connection/Command";
import { Context } from "./Connection/Context";
import { Headers } from "./Response/Headers";
import { SecurityToken } from "./Response/SecurityToken";
import { Site } from "./Response/Site";
import { ThermostatController } from "./Devices/Thermostat/ThermostatController";
import { ZoneTable } from "./Response/ZoneTable";

import { encode } from "./Connection/Cryptography";

const log = getLogger("Client");

/**
 * Creates an object that represents a single location, with a single network.
 * @public
 */
export class Client extends EventEmitter<{
    Available: (devices: Device[]) => void;
    Message: (response: Response) => void;
    Update: (device: Device, state: DeviceState) => void;
}> {
    private token?: SecurityToken;
    private tokenTimeout?: NodeJS.Timeout;

    private context: Context;
    private devices: Map<string, ThermostatController> = new Map();

    constructor() {
        super(Infinity);

        this.context = new Context();

        this.discoverZones()
            .then(() => {
                Promise.all(Array.from(this.devices.keys()).map((serial) => this.update(serial))).then(() => {
                    this.emit("Available", Array.from(this.devices.values()));
                });
            })
            .catch((error) => log.error(error.message));
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

    /**
     * Updates a zone.
     *
     * @param serial The serial number of the zone to upodate
     */
    public update(serial: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const device = this.devices.get(serial);

            if (device == null) {
                return reject(new Error("Tried to access a zone that is not discovered."));
            }

            (device.ip != null ? this.updateLocal(device) : this.updateRemote(device))
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

    /**
     * Executes a command on the zone.
     *
     * @param serial The serial of the zone to execute the command on.
     * @param command The command to execute.
     * @param value The value for the command.
     */
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

    /*
     * Builds a command.
     */
    private buildCommand<COMMAND extends keyof Command>(
        device: ThermostatController,
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

    /*
     * Bulds a command for local control.
     */
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

    /*
     * Updates a zone locally.
     */
    private updateLocal(device: ThermostatController): Promise<ThermostatStatus> {
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

    /*
     * Executes a command locally.
     */
    private executeLocal(device: ThermostatController, command: Record<string, unknown>): Promise<void> {
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

    /*
     * Builsa a command for cloud control.
     */
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

    /*
     * Updates a zone from the cloud.
     */
    private updateRemote(device: ThermostatController): Promise<ThermostatStatus> {
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

    /*
     * Executes a command via the cloud.
     */
    private executeRemote(device: ThermostatController, command: Record<string, unknown>): Promise<void> {
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

    /*
     * Discovers zones from a Kumo account.
     */
    private discoverZones(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.context.username == null || this.context.password == null) {
                return reject(new Error("Invalid username or password"));
            }

            if (this.tokenTimeout != null) {
                clearTimeout(this.tokenTimeout);
            }

            this.tokenTimeout = undefined;

            fetch("https://geo-c.kumocloud.com/login", {
                method: "POST",
                headers: Headers,
                body: JSON.stringify({
                    username: this.context.username,
                    password: this.context.password,
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

    /*
     * Reads child information from a zone response.
     */
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

    /*
     * Creates a device from a zone table.
     */
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
                new ThermostatController(this, {
                    ...zone,
                    ip,
                }).on("Update", this.onDeviceUpdate),
            );
        }
    }

    /*
     * When a device updates, this will emit an update event.
     */
    private onDeviceUpdate = (device: Device, state: DeviceState): void => {
        this.emit("Update", device, state);
    };
}
