import {renameSync, openSync, readSync, writeSync, closeSync} from 'fs';

let arr: (Uint8Array | undefined)[] = [...Array(256 ** 2)];

function getHash(buffer: Uint8Array, from: number) {
    return (buffer[from] << 8) | buffer[from + 1];
}

function isKeyword(value: Uint8Array, f: number, to: number) {
    const size = to - f;
    if (size === 4) {
        const isTrue = value[f] === 116 && value[f + 1] === 114 && value[f + 2] === 117 && value[f + 3] === 101;
        const isNull = value[f] === 110 && value[f + 1] === 117 && value[f + 2] === 108 && value[f + 3] === 108;
        if (isTrue || isNull) return true;
    } else if (size === 5) {
        const isFalse =
            value[f + 0] === 102 &&
            value[f + 1] === 97 &&
            value[f + 2] === 108 &&
            value[f + 3] === 115 &&
            value[f + 4] === 101;
        if (isFalse) return true;
    }
    return false;
}
function readUInt32(data: Uint8Array, from: number) {
    return (data[from] << 24) | (data[from + 1] << 16) | (data[from + 2] << 8) | data[from + 3];
}
function writeUInt32(data: Uint8Array, from: number, val: number) {
    data[from] = val << 24;
    data[from + 1] = val << 16;
    data[from + 2] = val << 8;
    data[from + 3] = val;
}
//new Uint8Array(new Uint8Array([[...'e'].map(r => r.charCodeAt(0)),0,0,0]).buffer)
function addToIndex(value: Uint8Array, pos: number, from: number, to: number) {
    const valueSize = to - from;
    const posSize = 4;
    // const posSize = 4;
    if (isKeyword(value, from, to)) return;
    // const buffer = createBuffer(value, from, to);
    const hash = getHash(value, from);
    let data = arr[hash];
    if (data === undefined) {
        data = new Uint8Array(10);
        writeUInt32(data, 0, 4);
        arr[hash] = data;
    }
    const dataEnd = readUInt32(data, 0);
    const requiredSize = dataEnd + valueSize + 1 + posSize;
    if (requiredSize >= data.length) {
        const newData = new Uint8Array(Math.round(requiredSize * 1.5));
        newData.set(data);
        data = newData;
        arr[hash] = data;
    }
    data[dataEnd] = valueSize;
    for (let i = 0; i < valueSize; i++) {
        data[dataEnd + 1 + i] = value[from + i];
    }
    writeUInt32(data, dataEnd + 1 + valueSize, pos);
    writeUInt32(data, 0, dataEnd + 1 + valueSize + posSize);
}

function findInIndex(value: Uint8Array) {
    const buffSize = value.length;
    const hash = getHash(value, 0);
    const data = arr[hash];
    const res: number[] = [];
    if (data !== undefined) {
        const dataEnd = readUInt32(data, 0);
        for (let i = 4; i < dataEnd; i++) {
            const size = data[i];
            if (size === buffSize) {
                let found = true;
                for (let j = 0; j < value.length; j++) {
                    if (data[i + 1 + j] !== value[j]) {
                        found = false;
                        break;
                    }
                }
                const pos = readUInt32(data, 1 + i + size);
                if (found) {
                    res.push(pos);
                }
            }
            i += 1 + size + 4;
        }
    }
    return res;
}

function serialize(file: string) {
    const fd = openSync(file + '.tmp', 'w+');
    const empty = new Uint8Array([0, 0, 0, 4]);
    let offset = 0;
    for (let i = 0; i < arr.length; i++) {
        const buf = arr[i] || empty;
        const size = readUInt32(buf, 0);
        writeSync(fd, buf, 0, size, offset);
        offset += size;
    }
    closeSync(fd);
    renameSync(file + '.tmp', file);
}

function deserialize(file: string) {
    const fd = openSync(file, 'r');
    const arr: (Uint8Array | undefined)[] = [];
    const sizeBuffer = new Uint8Array(4);
    let offset = 0;
    while (true) {
        const bytesRead = readSync(fd, sizeBuffer, 0, 4, offset);
        if (bytesRead !== 4) {
            break;
        }
        const size = readUInt32(sizeBuffer, 0);
        if (size <= 3) throw new Error('something wrong');
        if (size > 4) {
            const buffer = new Uint8Array(size);
            arr.push(buffer);
            readSync(fd, buffer, 0, size, offset);
        } else {
            arr.push(undefined);
        }
        offset += size;
    }
    closeSync(fd);
    // console.log(arr.filter(Boolean));
    return arr;
}

const b = Buffer.from('Hello, everybody, how are you?');
addToIndex(b, 1, 0, 5);
addToIndex(b, 2, 7, 16);
addToIndex(b, 3, 18, 21);
addToIndex(b, 4, 22, 25);
addToIndex(b, 5, 26, 29);

serialize('test.dat');
arr = deserialize('test.dat');
console.log('------------------');
// console.log(arr.filter(Boolean));
console.log(findInIndex(Buffer.from('Hello')));
console.log(findInIndex(Buffer.from('everybody')));
console.log(findInIndex(Buffer.from('how')));
console.log(findInIndex(Buffer.from('are')));
console.log(findInIndex(Buffer.from('you')));

function addPerf() {
    const buf = Buffer.from('everybody');
    console.time('addPerf');
    for (let i = 0; i < 1e6; i++) {
        // const b = Buffer.from(
        //     Math.random()
        //         .toString(33)
        //         .substr(2, Math.ceil(Math.random() * 10)),
        // );
        addToIndex(buf, 1, 0, buf.length);
    }
    console.timeEnd('addPerf');
}

// addPerf();

console.log('index done');

function perf() {
    const buff = Buffer.from('you');
    console.time('perf');
    for (let i = 0; i < 10; i++) {
        findInIndex(buff);
    }
    console.timeEnd('perf');
}

perf();