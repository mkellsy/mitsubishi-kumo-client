import { AcoilSettings } from "./AcoilSettings";
import { AutodrySettings } from "./AutodrySettings";
import { ChangeoverSettings } from "./ChangeoverSettings";
import { Condition } from "./Condition";
import { ConnectionStatus } from "./ConnectionStatus";
import { HeatPumpSettings } from "./HeatPumpSettings";
import { InitialSettings } from "./InitialSettings";
import { Profile } from "./Profile";
import { SensorSettings } from "./SensorSettings";

export interface ZoneTable {
    serial: string;
    mac: string;
    ip?: string;
    label: string;
    port: number;
    unitType: string;
    reportedCondition: Condition;
    desiredConditionStack: Condition[];
    lastUpdate?: number;
    overrideSettings?: Record<string, unknown>;
    forceCloudUpdates?: true;
    errorHandler?: Record<string, unknown>;
    equipmentControllerSettings?: Record<string, unknown>;
    eqcStageThreeBacksupChannels?: Record<string, unknown>;
    eqcUpdatedLocally?: Record<string, unknown>;
    mhk2Settings: HeatPumpSettings;
    acoilSettings: AcoilSettings;
    autoDrySettings: AutodrySettings;
    kumoSensorSettings: SensorSettings;
    systemChangeoverSettings?: Record<string, ChangeoverSettings>;
    cryptoSerial?: string;
    password?: string;
    prohibitsChanged?: number;
    holdChanged?: number;
    hasElectricHeatingOption?: true;
    rssi: ConnectionStatus;
    timezone: string;
    lastAdapterUpdate?: string;
    firmwareVersion: string;
    autoModeEnabled?: true;
    roomTempOffset?: number;
    minCoolSetpoint?: number;
    maxHeatSetpoint?: number;
    reportedInitialSettings?: InitialSettings;
    reportedProfile: Profile;
    sendDesiredConditionsPending?: false;
    sendDesiredConditionsTime?: string;
    mvzType?: string;
    systemChangeoverEnabled?: false;
    autoChangeoverEnabled?: true;
    autoDryModeCapable?: number;
}
