/**
 * Discovers and publishes Kumo Cloud enabled heat pumps and mini-splits.
 *
 * @packageDocumentation
 */

import { Client } from "./Client";
import { Command } from "./Connection/Command";
import { Context } from "./Connection/Context";

export { Thermostat } from "./Devices/Thermostat/Thermostat";
export { ThermostatState } from "./Devices/Thermostat/ThermostatState";

/**
 * Creates a connection and starts ARP discovery.
 *
 * @returns A client object.
 */
export function connect(): Client {
    return new Client();
}

/**
 * Authenticates to the Kumo Cloud.
 *
 * @param username The username to use.
 * @param password The password to use.
 */
export function authenticate(username: string, password: string): void {
    const context = new Context();

    context.set(username, password);
}

export { Client, Command };
