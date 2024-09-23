export interface InitialSettings {
    assigned_settings: Record<string, number>;
    restart_after_outage: number;
    vent_air: number;
    voltage: number;
    energy_save: number;
    filter_alerts: number;
    auto_fan: number;
    pla_outlets: number;
    filter_type: number;
    frost_temp: number;
    defrost: number;
    oscillate: number;
    heating_offset: number;
    thermal_off1: number;
    thermal_off2: number;
    pressure1: number;
    pressure2: number;
    electric_heater1: number;
    electric_heater2: number;
    humidifier: number;
    humidifier_modifier: number;
    leftovers_settings: Record<string, number>;
}
