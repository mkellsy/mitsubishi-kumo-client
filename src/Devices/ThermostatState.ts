import { DeviceState } from "@mkellsy/hap-device";

/**
 * Defines a thermostat's current status response.
 */
export interface ThermostatState extends DeviceState {
    /**
     * The thermostat target state.
     */
    state: "Off" | "Heat" | "Cool" | "Auto";

    /**
     * The thermostat's current temprature level.
     */
    temprature: number;

    /**
     * The thermostat target minimum temprature.
     */
    heatTarget: number;

    /**
     * The thermostat target maximum temprature.
     */
    coolTarget: number;
}
