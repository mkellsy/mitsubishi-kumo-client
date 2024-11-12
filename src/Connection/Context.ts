import fs from "fs";
import path from "path";
import os from "os";

import { BSON } from "bson";

import { Credentials } from "../Response/Credentials";

/**
 * Stores login credentials for Kumo Cloud.
 * @private
 */
export class Context {
    private credentials?: Credentials;

    constructor() {
        this.credentials = this.open<Credentials>("credentials");
        this.credentials = this.decrypt(this.credentials);
    }

    /**
     * The account's username.
     */
    public get username(): string | undefined {
        return this.credentials?.username;
    }

    /**
     * The account's password.
     */
    public get password(): string | undefined {
        return this.credentials?.password;
    }

    /**
     * safely sets the username and password for the Kumo Cloud account.
     *
     * @param username The account username.
     * @param password The account password.
     */
    public set(username: string, password: string): void {
        this.credentials = { username, password };

        this.save("credentials", this.credentials);
    }

    /*
     * Decrypts an authentication certificate.
     */
    private decrypt(credentials?: Credentials): Credentials | undefined {
        if (credentials == null) {
            return undefined;
        }

        credentials.username = Buffer.from(credentials.username, "base64").toString("utf8");
        credentials.password = Buffer.from(credentials.password, "base64").toString("utf8");

        return credentials;
    }

    /*
     * Encrypts a certificate for storage. This ensures security at rest.
     */
    private encrypt(credentials?: Credentials): Credentials | undefined {
        if (credentials == null) {
            return undefined;
        }

        credentials.username = Buffer.from(credentials.username).toString("base64");
        credentials.password = Buffer.from(credentials.password).toString("base64");

        return credentials;
    }

    /*
     * Opens the context storage and loads paired processors.
     */
    private open<T>(filename: string): T | undefined {
        const directory = path.join(os.homedir(), ".kumo");

        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }

        if (fs.existsSync(path.join(directory, filename))) {
            const bytes = fs.readFileSync(path.join(directory, filename));

            return BSON.deserialize(bytes) as T;
        }

        return undefined;
    }

    /*
     * Saves the context to storage.
     */
    private save(filename: string, credentials?: Credentials): void {
        const directory = path.join(os.homedir(), ".kumo");

        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }

        const encrypted = this.encrypt(credentials);

        if (encrypted == null) {
            return;
        }

        fs.writeFileSync(path.join(directory, filename), BSON.serialize(encrypted));
    }
}
