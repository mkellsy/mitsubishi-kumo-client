import { Thermostat as ThermostatInterface, ThermostatStatus } from "@mkellsy/hap-device";

import { ThermostatState } from "./ThermostatState";

/**
 * Defines a thermostat device.
 * @public
 */
export interface Thermostat extends ThermostatInterface {
    /**
     * The min and max target temprature limits.
     */
    readonly limits: { min: number; max: number };

    /**
     * The current state of the device.
     *
     * @returns The device's state.
     */
    readonly status: ThermostatState;

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
    update(status: ThermostatStatus): void;

    /**
     * Controls this device.
     *
     * ```js
     * dimmer.set({ state: "Heat", temprature: 28 });
     * ```
     *
     * @param status Desired device state.
     */
    set(status: Partial<ThermostatState>): Promise<void>;
}
