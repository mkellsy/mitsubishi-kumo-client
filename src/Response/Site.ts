import { ZoneTable } from "./ZoneTable";

export interface Site {
    lastScheduleChange: number;
    zoneTable: Record<string, ZoneTable>;
    children: Site[];
    lastUpdate: number;
    level: number;
    id: string;
    label: string;
    version: number;
}
