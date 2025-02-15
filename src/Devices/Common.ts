import Colors from "colors";

import { get as getLogger, ILogger } from "js-logger";

import { Action, Address, Area, Button, Capability, Device, DeviceState, DeviceType } from "@mkellsy/hap-device";
import { EventEmitter } from "@mkellsy/event-emitter";

import { Client } from "../Client";
import { generateId } from "./Devices";

/**
 * Defines common functionallity for a device.
 * @private
 */
export abstract class Common<STATE extends DeviceState> extends EventEmitter<{
    Action: (device: Device, button: Button, action: Action) => void;
    Update: (device: Device, state: STATE) => void;
}> {
    protected client: Client;
    protected state: STATE;
    protected initialized: boolean = false;
    protected fields: Map<string, Capability> = new Map();

    private logger: ILogger;
    private updateInterval?: NodeJS.Timeout;

    private deviceName: string;
    private deviceSerial: string;
    private deviceType: DeviceType;

    /**
     * Creates a base device object.
     *
     * ```
     * class Fan extends Common {
     *     constructor(id: string, connection: Connection, name: string) {
     *         super(DeviceType.Fan, connection, { id, name, "Fan" });
     *
     *         // Device specific code
     *     }
     * }
     * ```
     *
     * @param type The device type.
     * @param client The main connection.
     * @param definition The definition object containing id, name and suffix.
     * @param definition.id The connection id.
     * @param definition.name The connection name.
     * @param definition.suffix The device suffix.
     */
    constructor(type: DeviceType, client: Client, definition: { serial: string; name: string }, state: STATE) {
        super();

        this.client = client;
        this.deviceSerial = definition.serial;
        this.deviceName = definition.name;
        this.deviceType = type;

        this.logger = getLogger(`Device ${Colors.dim(this.id)}`);
        this.state = state;

        this.updateInterval = setInterval(() => {
            this.query().catch((error) => {
                this.log.error(error);
            });
        }, 600_000);
    }

    /**
     * Destroys the device.
     */
    public destroy(): void {
        if (this.updateInterval != null) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = undefined;
    }

    /**
     * The device's manufacturer.
     *
     * @returns The manufacturer.
     */
    public get manufacturer(): string {
        return "Mitsubishi Electric Trane";
    }

    /**
     * The device's unique identifier.
     *
     * @returns The device id.
     */
    public get id(): string {
        return generateId(this.deviceSerial);
    }

    /**
     * The device's serial number.
     *
     * @returns The device serial number.
     */
    public get serial(): string {
        return this.deviceSerial;
    }

    /**
     * The device's configured name.
     *
     * @returns The device's configured name.
     */
    public get name(): string {
        return this.deviceName;
    }

    /**
     * The device's configured room (not supported).
     *
     * @returns The device's configured room.
     */
    public get room(): string {
        return "Default";
    }

    /**
     * The devices capibilities. This is a map of the fields that can be set
     * or read.
     *
     * @returns The device's capabilities.
     */
    public get capabilities(): { [key: string]: Capability } {
        return Object.fromEntries(this.fields);
    }

    /**
     * A logger for the device. This will automatically print the devices name,
     * room and id.
     *
     * @returns A reference to the logger assigned to this device.
     */
    public get log(): ILogger {
        return this.logger;
    }

    /**
     * The href address of the device (not used).
     *
     * @returns The device's href address.
     */
    public get address(): Address {
        return { href: this.deviceSerial };
    }

    /**
     * The device type.
     *
     * @returns The device type.
     */
    public get type(): DeviceType {
        return this.deviceType;
    }

    /**
     * The area the device is in (not used).
     *
     * @returns The device's area.
     */
    public get area(): Area {
        return {
            href: this.address.href,
            Name: "Equipment",
            ControlType: this.type,
            Parent: this.address,
            IsLeaf: true,
            AssociatedZones: [],
            AssociatedControlStations: [],
            AssociatedOccupancyGroups: [],
        };
    }

    /**
     * The current state of the device.
     *
     * @returns The device's state.
     */
    public get status(): STATE {
        return this.state;
    }

    public query = (): Promise<void> => {
        return this.client.update(this.deviceSerial);
    };
}
