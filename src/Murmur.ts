export function murmurHash3(b: Uint8Array, from: number, seed: number) {
    const len = b.length;
    const remainder = len & 3;
    const bytes = len - remainder;
    let i = from;
    let h1 = seed;
    while (i < bytes) {
        let k1 = b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24);
        i += 4;
        k1 = Math.imul(k1, 0xcc9e2d51);
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = Math.imul(k1, 0x1b873593);
        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
    }
    let k2 = 0;
    switch (remainder) {
        case 3:
            k2 ^= (b[i + 2] & 0xff) << 16;
        case 2:
            k2 ^= (b[i + 1] & 0xff) << 8;
        case 1:
            k2 ^= b[i] & 0xff;
            k2 = Math.imul(k2, 0xcc9e2d51);
            k2 = (k2 << 15) | (k2 >>> 17);
            k2 = Math.imul(k2, 0x1b873593);
            h1 ^= k2;
    }
    h1 ^= len;
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;
    return h1;
}
