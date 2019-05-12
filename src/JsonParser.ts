const enum Symbols {
    CURLY_OPEN = 123,
    CURLY_CLOSE = 125,
    BRACKET_OPEN = 91,
    BRACKET_CLOSE = 93,
    COMMA = 44,
    COLON = 58,
    QUOTE = 34,
    BACKSLASH = 92,
    SPACE = 32,
    TAB = 9,
    NEWLINE = 10,
    R = 13,
    MINUS = 45,
    PLUS = 43,
    DOT = 46,
    E = 69,
    e = 101,
}

const enum StackContext {
    NOWHERE = 0,
    IN_ARRAY = 1,
    OBJECT_KEY = 2,
    OBJECT_VALUE = 3,
}

function updateHashFinal(h: number, len: number, v: number) {
    v = Math.imul(v, 0xcc9e2d51);
    v = (v << 15) | (v >>> 17);
    v = Math.imul(v, 0x1b873593);
    h ^= v;

    h ^= len;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h;
}
function updateFullInt32Hash(h: number, v: number) {
    v = Math.imul(v, 0xcc9e2d51);
    v = (v << 15) | (v >>> 17);
    v = Math.imul(v, 0x1b873593);
    h ^= v;
    h = (h << 13) | (h >>> 19);
    h = (Math.imul(h, 5) + 0xe6546b64) | 0;
    return h;
}

function updateVal(val: number, byte: number, pos: number) {
    return (byte << (pos << 3)) | val;
}

let hash = 0;
export function getHash() {
    return hash;
}

export function parseString(b: Uint8Array, from: number, end: number) {
    let val = 0;
    hash = 1;
    let prevBackslash = false;

    for (let i = from; i < end; i++) {
        const s = b[i];
        const j = i - from;
        if (s === Symbols.QUOTE && !prevBackslash) {
            hash = updateHashFinal(hash, j, val);
            return i;
        }
        const p = j & 3;
        val = updateVal(val, s, p);
        if (p === 3) {
            hash = updateFullInt32Hash(hash, val);
            val = 0;
        }
        prevBackslash = false;
        if (s === Symbols.BACKSLASH) {
            prevBackslash = true;
        }
    }
    return -1;
}

function parseNumber(buffer: Uint8Array, from: number, end: number) {
    let val = 0;
    hash = 1;
    for (let i = from; i < end; i++) {
        const s = buffer[i];
        const j = i - from;
        const isNum =
            (s >= 48 && s < 58) ||
            s === Symbols.MINUS ||
            s === Symbols.PLUS ||
            s === Symbols.E ||
            s === Symbols.e ||
            s === Symbols.DOT;
        if (!isNum) {
            hash = updateHashFinal(hash, j, val);
            return i;
        }
        const p = j & 3;
        val = updateVal(val, s, p);
        if (p === 3) {
            hash = updateFullInt32Hash(hash, val);
            val = 0;
        }
    }
    return -1;
}

function parseKeyword(buffer: Uint8Array, from: number, end: number) {
    for (let i = from; i < end; i++) {
        const s = buffer[i];
        if (!(s >= 97 && s < 123)) {
            return i;
        }
    }
    return -1;
}

// function printStr(prefix: string, buffer: Uint8Array, from: number, to: number) {
//     // console.log(prefix, Buffer.from(buffer.subarray(from, to)).toString());
// }
export function parseJSONValues(
    buffer: Uint8Array,
    bufferEnd: number,
    onValue: (type: 'number' | 'string', level: number, hash: number, pos: number, end: number) => void,
    onNewJson: (pos: number) => void,
) {
    const stack = new Uint8Array(1000) as {[key: number]: StackContext};
    let stackPos = 0;
    let startJsonPos = 0;
    let currentContext = StackContext.NOWHERE;
    for (let i = 0; i < bufferEnd; i++) {
        const s = buffer[i];
        switch (s) {
            case Symbols.SPACE:
            case Symbols.TAB:
            case Symbols.R:
                break;
            case Symbols.CURLY_OPEN:
                stackPos++;
                currentContext = StackContext.OBJECT_KEY;
                stack[stackPos] = currentContext;
                break;
            case Symbols.BRACKET_OPEN:
                stackPos++;
                currentContext = StackContext.IN_ARRAY;
                stack[stackPos] = currentContext;
                break;
            case Symbols.CURLY_CLOSE:
            case Symbols.BRACKET_CLOSE:
                stackPos--;
                currentContext = stack[stackPos];
                break;
            case Symbols.COLON:
                currentContext = StackContext.OBJECT_VALUE;
                stack[stackPos] = currentContext;
                break;
            case Symbols.NEWLINE:
                startJsonPos = i + 1;
                onNewJson(startJsonPos);
                break;

            case Symbols.QUOTE: {
                const end = parseString(buffer, i + 1, bufferEnd);
                if (end === -1) return;
                if (currentContext === StackContext.OBJECT_KEY) {
                    // printStr('key', buffer, i + 1, end);
                } else if (currentContext === StackContext.OBJECT_VALUE) {
                    // printStr('value', buffer, i + 1, end);
                    onValue('string', stackPos, getHash(), i + 1, end);
                } else {
                    // printStr('str', buffer, i + 1, end);
                }
                i = end;
                break;
            }
            case Symbols.COMMA: {
                if (currentContext === StackContext.OBJECT_VALUE) {
                    currentContext = StackContext.OBJECT_KEY;
                    stack[stackPos] = currentContext;
                }
                break;
            }
            default: {
                if (s === Symbols.MINUS || (s >= 48 && s < 58)) {
                    const end = parseNumber(buffer, i, bufferEnd);
                    if (end === -1) return;
                    // printStr('num', buffer, i, end);
                    onValue('number', stackPos, getHash(), i, end);
                    i = end - 1;
                }
                if (s >= 97 && s < 123) {
                    const end = parseKeyword(buffer, i, bufferEnd);
                    if (end === -1) return;
                    // onValue('keyword', stackPos, getHash(), i, end);
                    // printStr('keyword', buffer, i, end);
                    i = end - 1;
                }
            }
        }
    }
}

// parseJSONValues(Buffer.from('"hello"'));
// parseJSONValues(Buffer.from('"hello\\"guys"'));
// parseJSONValues(Buffer.from('"hello\\n\\r\\tguys"'));
// parseJSONValues(Buffer.from('123'));
// parseJSONValues(Buffer.from('0.123'));
// parseJSONValues(Buffer.from('-134'));
// parseJSONValues(Buffer.from('1e6'));
// parseJSONValues(Buffer.from('1E6'));
// parseJSONValues(Buffer.from('1E+6'));
// parseJSONValues(Buffer.from('1E-6'));
// parseJSONValues(Buffer.from('true'));
// parseJSONValues(Buffer.from(' \n true \r   \t'));

// parseJSONValues(Buffer.from('{"foo": "val"}'));
// parseJSONValues(Buffer.from('{"foo": 123, "bar": "bal","baz":"BAZ"}'));
// parseJSONValues(Buffer.from('{"foo": 123, "bar": {"x":"0","y" : "2"}, "baz": "hey"}'));
// parseJSONValues(
//     Buffer.from(
//         '{"foo": -123, "bar": [{"x":"0","y":["1","2",null, "3"]}, {"u":[0,1,true],"v":"2"},false], "baz": "hey"}',
//     ),
// );

// const json = JSON.stringify([
//     '2342iysd',
//     'adfjakfh',
//     'info',
//     new Date(),
//     'request',
//     {
//         userId: 124537324543,
//         ip: '123.123.123.123',
//         sessionId: '24274983dg984753983984dsjlf058sldkj9433',
//         url: '/api/foo/bar?hello=bar',
//     },
// ]);
// const jsonBuff = Buffer.from(json);
// const buff = Buffer.alloc(1e9);
// for (let i = 0; i < 5e6; i++) {
//     // buff.set(jsonBuff, i * jsonBuff.length);
// }
// for (let i = 0; i < 10; i++) {
//     parseJSONValues(Buffer.from('["foo", "1", {"a": [1]}]\n["bar", "2", {"x": 1}]'));
// }
// function perf() {
//     console.time('perf');
//     parseJSONValues(buff, (starPos: number, hash: number) => {});
//     console.timeEnd('perf');
// }

// perf();
