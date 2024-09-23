import * as Interfaces from "@mkellsy/hap-device";

import equals from "deep-equal";

import { Common } from "./Common";
import { Location } from "../Location";
import { ThermostatState } from "./ThermostatState";
import { ZoneTable } from "../Interfaces/ZoneTable";
import { stat } from "fs";

/**
 * Defines a thermostat device.
 */
export class Thermostat extends Common<ThermostatState> implements Interfaces.Thermostat {
    private minTarget: number = 0;
    private maxTarget: number = Infinity;

    private ipAddress?: string;
    private devicePassword?: string;
    private deviceToken?: string;

    /**
     * Creates a thermostat device.
     *
     * ```js
     * const thermostat = new Thermostat(location, zone);
     * ```
     *
     * @param location The location this thermostat is in.
     * @param zone The zone information from Kumo Cloud.
     */
    constructor(location: Location, zone: ZoneTable) {
        super(
            Interfaces.DeviceType.Thermostat,
            location,
            { serial: zone.serial, name: zone.label },
            { state: "Off", temprature: 0, heatTarget: 0, coolTarget: 0 },
        );

        this.ipAddress = zone.ip;
        this.devicePassword = zone.password;
        this.deviceToken = zone.cryptoSerial;

        this.minTarget = zone.minCoolSetpoint || 0;
        this.maxTarget = zone.maxHeatSetpoint || Infinity;

        this.fields.set("state", { type: "String", values: ["Off", "Heat", "Cool", "Auto"] });
        this.fields.set("temprature", { type: "Integer", min: 0, max: Infinity });
        this.fields.set("heatTarget", { type: "Integer", min: this.minTarget, max: this.maxTarget });
        this.fields.set("coolTarget", { type: "Integer", min: this.minTarget, max: this.maxTarget });
    }

    /**
     * The local ip address of the thermostat if available.
     */
    public get ip(): string | undefined {
        return this.ipAddress;
    }

    /**
     * The local password for the thermostat if available.
     */
    public get password(): string | undefined {
        return this.devicePassword;
    }

    /**
     * The min and max target temprature limits.
     */
    public get limits(): { min: number; max: number } {
        return { min: this.minTarget, max: this.maxTarget };
    }

    /**
     * The local access token for the thermostat if available.
     */
    public get token(): string | undefined {
        return this.deviceToken;
    }

    /**
     * Updates the zone information for this thermostat.
     *
     * @param zone The zone information from Kumo Cloud.
     */
    public refresh(zone: ZoneTable) {
        this.ipAddress = zone.ip;
        this.devicePassword = zone.password;
        this.deviceToken = zone.cryptoSerial;

        this.minTarget = zone.minCoolSetpoint || 0;
        this.maxTarget = zone.maxHeatSetpoint || Infinity;

        this.query().catch((error) => {
            this.log.error(error);
        });
    }

    /**
     * Recieves a state response from the connection and updates the device
     * state.
     *
     * ```js
     * thermostat.update({ Temprature: 100 });
     * ```
     *
     * @param status The current device state.
     */
    public update(status: Interfaces.ThermostatStatus): void {
        const previous = { ...this.status };

        switch (status.mode) {
            case "autoCool":
            case "autoHeat":
                this.state.state = "Auto";
                break;

            case "cool":
                this.state.state = "Cool";
                break;

            case "heat":
                this.state.state = "Heat";
                break;

            default:
                this.state.state = "Off";
                break;
        }

        if (status.mode != null) {
            this.state.temprature = status.roomTemp;
        }

        if (status.roomTemp != null) {
            this.state.temprature = status.roomTemp;
        }

        if (status.spHeat != null) {
            this.state.heatTarget = status.spHeat;
        }

        if (status.spCool != null) {
            this.state.coolTarget = status.spCool;
        }

        if (this.initialized && !equals(this.state, previous)) {
            this.emit("Update", this, this.state);
        }

        this.initialized = true;
    }

    /**
     * Controls this device.
     *
     * ```js
     * dimmer.set({ state: "Heat", temprature: 28 });
     * ```
     *
     * @param status Desired device state.
     */
    public set(status: Partial<ThermostatState>): Promise<void> {
        return new Promise((resolve, reject) => {
            const waits: Promise<void>[] = [];

            if (status.state != null) {
                waits.push(this.location.execute(this.serial, "Mode", status.state));
            }

            if (status.coolTarget != null) {
                waits.push(this.location.execute(this.serial, "CoolTarget", status.coolTarget));
            }

            if (status.heatTarget != null) {
                waits.push(this.location.execute(this.serial, "HeatTarget", status.heatTarget));
            }

            Promise.all(waits)
                .then(() => {
                    this.query()
                        .then(() => resolve())
                        .catch((error) => reject(error));
                })
                .catch((error) => reject(error));
        });
    }
}
