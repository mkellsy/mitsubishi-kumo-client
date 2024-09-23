export interface Profile {
    fan_speed_stages: number;
    has_air_direction: boolean;
    has_auto_fan_speed: boolean;
    has_dry_function: boolean;
    has_extended_temp_range: boolean;
    has_heat_function: boolean;
    has_swing_direction: boolean;
    has_test_run: boolean;
    has_unit_function_setting: boolean;
    has_ventilation_function: boolean;
    display_setting_temp_of_dry: boolean;
    maximum_auto_temp: number;
    maximum_cool_or_dry_temp: number;
    maximum_heat_temp: number;
    minimum_auto_temp: number;
    minimum_cool_or_dry_temp: number;
    minimum_heat_temp: number;
}
