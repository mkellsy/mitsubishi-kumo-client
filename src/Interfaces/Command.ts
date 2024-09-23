/**
 * Kumo command map.
 */
export interface Command {
    /**
     * Mode command.
     */
    Mode: "Off" | "Heat" | "Cool" | "Auto";

    /**
     * Heat target command.
     */
    HeatTarget: number;

    /**
     * Cool target command.
     */
    CoolTarget: number;
}
