import base64 from "base-64";
import sjcl from "sjcl";

export function encode(body: string, password?: string, serial?: string) {
    const W = h2l("44c73283b498d432ff25f5c8e06a016aef931e68f0a00ea710e36e6338fb22db");
    const p = base64.decode(password || "");

    const data_hash = sjcl.codec.hex.fromBits(
        sjcl.hash.sha256.hash(
            sjcl.codec.hex.toBits(
                l2h(
                    Array.prototype.map.call(p + body, (m2: string) => {
                        return m2.charCodeAt(0);
                    }),
                ),
            ),
        ),
    );

    const data_hash_byteArray = h2l(data_hash);
    const intermediate = new Uint8Array(88);

    for (let i = 0; i < 32; i++) {
        intermediate[i] = W[i];
        intermediate[i + 32] = data_hash_byteArray[i];
    }

    intermediate[64] = 8;
    intermediate[65] = 64;
    intermediate[66] = 0;

    const cryptoserial = h2l(serial || "");

    intermediate[79] = cryptoserial[8];

    for (let i = 0; i < 4; i++) {
        intermediate[i + 80] = cryptoserial[i + 4];
        intermediate[i + 84] = cryptoserial[i];
    }

    const hash = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(sjcl.codec.hex.toBits(l2h(intermediate))));

    return hash;
}

export function h2l(body: string): number[] {
    const results: number[] = [];

    for (let i = 0; i < body.length; i += 2) {
        results.push(parseInt(body.substring(i, i + 2), 16));
    }

    return results;
}

export function l2h(body: Uint8Array): string {
    let results = "";

    for (let i = 0; i < body.length; ++i) {
        const char = body[i];

        if (char < 16) {
            results += "0";
        }

        results += Number(char).toString(16);
    }

    return results;
}
