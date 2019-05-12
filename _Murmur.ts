// import {parseString, getHash} from './JsonParser';

// // var murmurHash = require('murmurhash-native').murmurHash;
// function murmur1() {
//     const buffer = Buffer.from('Hello everybody!');
//     const buffer2 = Buffer.from('"Hello everybody!"');
//     console.time('murmurhash3_32_gc');
//     let res;
//     for (let i = 0; i < 1e6; i++) {
//         // murmurhash3_32_gc(buffer, 1);
//         // res = murmurhash3_32_gc(buffer, 0, 1);
//         // res = murmurHash(buffer, 0, 1);
//         // res = murmurhash3(buffer, 0, 1);
//         res = parseString(buffer2, 1);
//     }
//     console.timeEnd('murmurhash3_32_gc');
//     return res;
// }
// murmur1();

// const buffer = Buffer.from('"Hello everybody!"');


// const end = parseString(buffer, 1);
// console.log(Buffer.from(buffer.subarray(1, end)).toString());
// console.log(getHash());
// console.log(murmurhash3(Buffer.from('Hello everybody!'), 0, 1));

// /**
//  * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
//  *
//  * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
//  * @see http://github.com/garycourt/murmurhash-js
//  * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
//  * @see http://sites.google.com/site/murmurhash/
//  *
//  * @param {string} b ASCII only
//  * @param {number} seed Positive integer only
//  * @return {number} 32-bit positive integer hash
//  */

// function murmurhash3_32_gc(b: Uint8Array, from: number, seed: number) {
//     const len = b.length;
//     const remainder = len & 3;
//     const bytes = len - remainder;
//     let i = from;
//     let h1 = seed;

//     while (i < bytes) {
//         let k1 = (b[i] & 0xff) | ((b[i + 1] & 0xff) << 8) | ((b[i + 2] & 0xff) << 16) | ((b[i + 3] & 0xff) << 24);
//         i += 4;

//         k1 = ((k1 & 0xffff) * 0xcc9e2d51 + ((((k1 >>> 16) * 0xcc9e2d51) & 0xffff) << 16)) & 0xffffffff;
//         k1 = (k1 << 15) | (k1 >>> 17);
//         k1 = ((k1 & 0xffff) * 0x1b873593 + ((((k1 >>> 16) * 0x1b873593) & 0xffff) << 16)) & 0xffffffff;

//         h1 ^= k1;
//         //h1 = ROTL32(h1,13);
//         h1 = (h1 << 13) | (h1 >>> 19);

//         let h1b = ((h1 & 0xffff) * 5 + ((((h1 >>> 16) * 5) & 0xffff) << 16)) & 0xffffffff;
//         h1 = (h1b & 0xffff) + 0x6b64 + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16);
//     }

//     let k2 = 0;
//     switch (remainder) {
//         case 3:
//             k2 ^= (b[i + 2] & 0xff) << 16;
//         case 2:
//             k2 ^= (b[i + 1] & 0xff) << 8;
//         case 1:
//             k2 ^= b[i] & 0xff;
//             k2 = ((k2 & 0xffff) * 0xcc9e2d51 + ((((k2 >>> 16) * 0xcc9e2d51) & 0xffff) << 16)) & 0xffffffff;
//             k2 = (k2 << 15) | (k2 >>> 17);
//             k2 = ((k2 & 0xffff) * 0x1b873593 + ((((k2 >>> 16) * 0x1b873593) & 0xffff) << 16)) & 0xffffffff;
//             h1 ^= k2;
//     }

//     h1 ^= len;

//     h1 ^= h1 >>> 16;
//     h1 = ((h1 & 0xffff) * 0x85ebca6b + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
//     h1 ^= h1 >>> 13;
//     h1 = ((h1 & 0xffff) * 0xc2b2ae35 + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) & 0xffffffff;
//     h1 ^= h1 >>> 16;

//     return h1;
// }

// function murmurhash3(b: Uint8Array, from: number, seed: number) {
//     const len = b.length;
//     const remainder = len & 3;
//     const bytes = len - remainder;
//     let i = from;
//     let h1 = seed;
//     while (i < bytes) {
//         let k1 = b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24);
//         // console.log('murmurhash3', {k1, h1});
//         i += 4;
//         k1 = Math.imul(k1, 0xcc9e2d51);
//         k1 = (k1 << 15) | (k1 >>> 17);
//         k1 = Math.imul(k1, 0x1b873593);
//         h1 ^= k1;
//         h1 = (h1 << 13) | (h1 >>> 19);
//         h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
//     }
//     let k2 = 0;
//     switch (remainder) {
//         case 3:
//             k2 ^= (b[i + 2] & 0xff) << 16;
//         case 2:
//             k2 ^= (b[i + 1] & 0xff) << 8;
//         case 1:
//             k2 ^= b[i] & 0xff;
//             k2 = Math.imul(k2, 0xcc9e2d51);
//             k2 = (k2 << 15) | (k2 >>> 17);
//             k2 = Math.imul(k2, 0x1b873593);
//             h1 ^= k2;
//     }
//     // console.log({h1, len});
//     h1 ^= len;
//     h1 ^= h1 >>> 16;
//     h1 = Math.imul(h1, 0x85ebca6b);
//     h1 ^= h1 >>> 13;
//     h1 = Math.imul(h1, 0xc2b2ae35);
//     h1 ^= h1 >>> 16;
//     return h1;
// }

// /**
//  * JS Implementation of MurmurHash3 (r152) (as of May 10, 2013)
//  *
//  * @author <a href="mailto:roland@simplify.ee">Roland Pihlakas</a>
//  * @see http://github.com/levitation/murmurhash-js
//  * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
//  * @see https://code.google.com/p/smhasher/
//  *
//  * @param {string} key ASCII only
//  * @param {number} seed positive integer only
//  * @return {number} 32-bit positive integer hash
//  */

// function murmurhash3_32_rp(key: Uint8Array, seed: number) {
//     var keyLength, tailLength, bodyLength, h1, k1, i, c1_low, c1_high, c2_low, c2_high;

//     keyLength = key.length;
//     tailLength = keyLength & 3;
//     bodyLength = keyLength - tailLength;
//     h1 = seed;

//     //c1 = 0xcc9e2d51;
//     // c1_low = 0x2d51;
//     // c1_high = 0xcc9e0000;

//     //c2 = 0x1b873593;
//     // c2_low = 0x3593;
//     // c2_high = 0x1b870000;

//     //----------
//     // body

//     i = 0;

//     while (i < bodyLength) {
//         k1 = (key[i] & 0xff) | ((key[++i] & 0xff) << 8) | ((key[++i] & 0xff) << 16) | ((key[++i] & 0xff) << 24);

//         ++i;

//         //k1 *= c1;
//         k1 = (((0xcc9e0000 * k1) | 0) + 0x2d51 * k1) | 0;
//         //k1 = ROTL32(k1,15);
//         k1 = (k1 << 15) | (k1 >>> 17);
//         //k1 *= c2;
//         k1 = (((0x1b870000 * k1) | 0) + 0x3593 * k1) | 0;

//         //h1 ^= k1;
//         h1 ^= k1;
//         //h1 = ROTL32(h1,13);
//         h1 = (h1 << 13) | (h1 >>> 19);
//         //h1 = h1*5+0xe6546b64;
//         h1 = (h1 * 5 + 0xe6546b64) | 0;
//     } //while (i < bodyLength) {

//     //----------
//     // tail

//     k1 = 0;

//     switch (tailLength) {
//         case 3:
//             k1 ^= (key[i + 2] & 0xff) << 16;
//         case 2:
//             k1 ^= (key[i + 1] & 0xff) << 8;
//         case 1:
//             k1 ^= key[i] & 0xff;

//             //k1 *= c1;
//             k1 = (((0xcc9e0000 * k1) | 0) + 0x2d51 * k1) | 0;
//             //k1 = ROTL32(k1,15);
//             k1 = (k1 << 15) | (k1 >>> 17);
//             //k1 *= c2;
//             k1 = (((0x1b870000 * k1) | 0) + 0x3593 * k1) | 0;
//             //h1 ^= k1;
//             h1 ^= k1;
//     } //switch (tailLength) {

//     //----------
//     // finalization

//     h1 ^= keyLength;

//     //h1 = fmix32(h1);
//     //h ^= h >> 16;
//     h1 ^= h1 >>> 16;
//     //h1 *= 0x85ebca6b;
//     h1 = (((0x85eb0000 * h1) | 0) + 0xca6b * h1) | 0;
//     //h ^= h >> 13;
//     h1 ^= h1 >>> 13;
//     //h1 *= 0xc2b2ae35;
//     h1 = (((0xc2b20000 * h1) | 0) + 0xae35 * h1) | 0;
//     //h ^= h >> 16;
//     h1 ^= h1 >>> 16;

//     return h1; //convert to unsigned int
// }

// function murmurhash3_32_rpB(key: Uint8Array, seed: number) {
//     var keyLength,
//         tailLength,
//         tailLength4,
//         bodyLength,
//         bodyLength8,
//         h1,
//         k1,
//         i,
//         c1,
//         c1_low,
//         c1_high,
//         c2,
//         c2_low,
//         c2_high,
//         k1B,
//         c3;

//     keyLength = key.length;
//     tailLength = keyLength & 3;
//     bodyLength = keyLength - tailLength;
//     tailLength4 = bodyLength & 7;
//     bodyLength8 = bodyLength - tailLength4;
//     h1 = seed;

//     //c1 = 0xcc9e2d51;
//     c1_low = 0x2d51;
//     c1_high = 0xcc9e0000;

//     //c2 = 0x1b873593;
//     c2_low = 0x3593;
//     c2_high = 0x1b870000;

//     c3 = 0xe6546b64;

//     //----------
//     // body

//     i = 0;

//     while (i < bodyLength8) {
//         k1 = (key[i] & 0xff) | ((key[++i] & 0xff) << 8) | ((key[++i] & 0xff) << 16) | ((key[++i] & 0xff) << 24);

//         k1B = (key[++i] & 0xff) | ((key[++i] & 0xff) << 8) | ((key[++i] & 0xff) << 16) | ((key[++i] & 0xff) << 24);

//         ++i;

//         //k1 *= c1;
//         k1 = ((c1_high * k1) | 0) + c1_low * k1;
//         //k1 = ROTL32(k1,15);
//         k1 = (k1 << 15) | (k1 >>> 17);
//         //k1 *= c2;
//         k1 = ((c2_high * k1) | 0) + c2_low * k1;

//         //h1 ^= k1;
//         h1 ^= k1;
//         //h1 = ROTL32(h1,13);
//         h1 = (h1 << 13) | (h1 >>> 19);
//         //h1 = h1*5+0xe6546b64;
//         h1 = h1 * 5 + c3;

//         //k1 *= c1;
//         k1B = ((c1_high * k1B) | 0) + c1_low * k1B;
//         //k1 = ROTL32(k1,15);
//         k1B = (k1B << 15) | (k1B >>> 17);
//         //k1 *= c2;
//         k1B = ((c2_high * k1B) | 0) + c2_low * k1B;

//         //h1 ^= k1;
//         h1 ^= k1B;
//         //h1 = ROTL32(h1,13);
//         h1 = (h1 << 13) | (h1 >>> 19);
//         //h1 = h1*5+0xe6546b64;
//         h1 = h1 * 5 + c3;
//     } //while (i < bodyLength8) {

//     if (tailLength4) {
//         k1 = (key[i] & 0xff) | ((key[++i] & 0xff) << 8) | ((key[++i] & 0xff) << 16) | ((key[++i] & 0xff) << 24);

//         ++i;

//         //k1 *= c1;
//         k1 = ((c1_high * k1) | 0) + c1_low * k1;
//         //k1 = ROTL32(k1,15);
//         k1 = (k1 << 15) | (k1 >>> 17);
//         //k1 *= c2;
//         k1 = ((c2_high * k1) | 0) + c2_low * k1;

//         //h1 ^= k1;
//         h1 ^= k1;
//         //h1 = ROTL32(h1,13);
//         h1 = (h1 << 13) | (h1 >>> 19);
//         //h1 = h1*5+0xe6546b64;
//         h1 = h1 * 5 + c3;
//     } //if (tailLength4) {

//     //----------
//     // tail

//     k1 = 0;

//     switch (tailLength) {
//         case 3:
//             k1 ^= (key[i + 2] & 0xff) << 16;
//         case 2:
//             k1 ^= (key[i + 1] & 0xff) << 8;
//         case 1:
//             k1 ^= key[i] & 0xff;

//             //k1 *= c1;
//             k1 = ((c1_high * k1) >>> 0) + c1_low * k1;
//             //k1 = ROTL32(k1,15);
//             k1 = (k1 << 15) | (k1 >>> 17);
//             //k1 *= c2;
//             k1 = ((c2_high * k1) >>> 0) + c2_low * k1;
//             //h1 ^= k1;
//             h1 ^= k1;
//     } //switch (tailLength) {

//     //----------
//     // finalization

//     h1 ^= keyLength;

//     //h1 = fmix32(h1);
//     {
//         //h ^= h >> 16;
//         h1 ^= h1 >>> 16;
//         //h1 *= 0x85ebca6b;
//         h1 = ((0x85eb0000 * h1) >>> 0) + 0xca6b * h1;
//         //h ^= h >> 13;
//         h1 ^= h1 >>> 13;
//         //h1 *= 0xc2b2ae35;
//         h1 = ((0xc2b20000 * h1) >>> 0) + 0xae35 * h1;
//         //h ^= h >> 16;
//         h1 ^= h1 >>> 16;
//     }

//     return h1 >>> 0; //convert to unsigned int
// } //function murmurhash3_32_rpB(key, seed) {
