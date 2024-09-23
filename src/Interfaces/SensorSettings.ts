export interface SensorSettings {
    battery: number;
    humidity?: number;
    rssi?: number;
    temperature?: number;
    txPower?: number;
    uuid?: string;
    lastUpdated: string;
}
