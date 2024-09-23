export interface AcoilSettings {
    isAcoil: boolean;
    inputs: {
        humidistat: boolean;
        ervSwitch: boolean;
        floatSwitchWet: boolean;
    };
    outputs: {
        w1: boolean;
        w2: boolean;
        y: boolean;
        g: boolean;
        erv: boolean;
        humidifer: boolean;
        heartbeat: boolean;
    };
    humidifier: {
        targetPcr: number;
        source?: string;
        enable: boolean;
    };
    erv: {
        mode: string;
    };
    ytoo: {
        fan: boolean;
        humidifier: boolean;
        erv: boolean;
    };
    cbp: number;
    oat: number;
    bpcr: string;
    ebp: boolean;
    fDelay: number;
}
