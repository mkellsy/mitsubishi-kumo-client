import { Location } from "./Location";
import { Credentials } from "./Interfaces/Credentials";

export { Credentials };

export { Thermostat } from "./Devices/Thermostat";
export { ThermostatState } from "./Devices/ThermostatState";

/**
 * Creates a connection and starts mDNS discovery.
 *
 * @returns A location object.
 */
export function connect(credentials: Credentials): Location {
    return new Location(credentials);
}
