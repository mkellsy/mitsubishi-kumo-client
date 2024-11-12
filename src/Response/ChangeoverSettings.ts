export interface ChangeoverSettings {
    minRuntime: number;
    maxStandby: number;
    disable: string;
    activeMode?: boolean;
    durActive?: boolean;
    durInactive?: boolean;
}
