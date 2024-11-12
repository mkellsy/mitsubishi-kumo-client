export interface Condition {
    more: {
        operation_mode_text: string;
        fan_speed_text: string;
        air_direction_text: string;
        power_on: boolean;
    };
    _created: number;
    id: string;
    record_time: string;
    device_serial: string;
    it_status?: string;
    rssi: number;
    power: number;
    operation_mode: number;
    set_temp?: number;
    set_temp_a?: number;
    fan_speed: number;
    air_direction: number;
    prohibit_local_remote_control?: boolean;
    room_temp: 21.5;
    room_temp_beyond?: number;
    room_temp_a?: number;
    out_of_use?: number;
    unusual_figures: number;
    two_figures_code: string;
    status_display: {
        filter: false;
        defrost: false;
        hot_adjust: false;
        standby: false;
    };
    actual_fan_speed: number;
    sp_cool: number;
    sp_heat: number;
    sp_auto: number;
    raw_frames?: number;
    run_test: number;
    active_thermistor?: number;
    temp_source?: number;
    seconds_since_contact: number;
    lastAdapterUpdated: string;
}
