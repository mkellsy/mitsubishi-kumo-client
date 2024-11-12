export interface HeatPumpSettings {
    auto: {
        owner: string;
        status: string;
        heatSetpoint?: number;
        coolSetpoint?: number;
    };
    connected: {
        thermostat: boolean;
        thermostatBattery: string;
        outdoorAir: boolean;
        outdoorAirBattery: string;
        indoorAir: boolean;
        indoorAirBattery: string;
    };
    dr: {
        override: boolean;
        event: string;
    };
    hold: {
        adapter: {
            cancelMHK2: boolean;
            endTime: number;
        };
        mhk2: {
            cancelAdapter: boolean;
            endTime: number;
        };
    };
    info: {
        model: string;
        serial: string;
        firmware: string;
    };
    schedule: {
        owner: string;
        enabled: string;
    };
    status: {
        outdoorTemp: number;
        outdoorHumid?: number;
        indoorHumid?: number;
    };
}
