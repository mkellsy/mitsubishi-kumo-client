/**
 * Stores the security token recieved by login.
 * @private
 */
export class SecurityToken {
    private timeCreated: number;
    private authToken: string;

    constructor(token: string) {
        this.timeCreated = Date.now();
        this.authToken = token;
    }

    /**
     * The unique token id.
     */
    public get uuid(): string {
        return this.authToken;
    }

    /**
     * The timestamp the token expires.
     */
    public get expiryTime(): number {
        return this.timeCreated + 1200_000;
    }
}
