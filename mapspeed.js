const map = new Map();
const map2 = {};
let x = 0;
for (let i = 0; i < 1e6; i++) {
    x += 7;
    map.set(x, x);
}
let y = 0;
for (let i = 0; i < 1e6; i++) {
    y += 7;
    map[y] = y;
}


function isoDateToInt32(buffer, from) {
    const year = (buffer[from + 2] - 48) * 10 + (buffer[from + 3] - 48);
    const month = (buffer[from + 5] - 48) * 10 + (buffer[from + 6] - 48);
    const day = (buffer[from + 8] - 48) * 10 + (buffer[from + 9] - 48);
    const hour = (buffer[from + 11] - 48) * 10 + (buffer[from + 12] - 48);
    const min = (buffer[from + 14] - 48) * 10 + (buffer[from + 15] - 48);
    const sec = (buffer[from + 17] - 48) * 10 + (buffer[from + 18] - 48);
    return (
        year * 12 * 31 * 24 * 60 * 60 + month * 31 * 24 * 60 * 60 + day * 24 * 60 * 60 + hour * 60 * 60 + min * 60 + sec
    );
}

function perfDate() {
    let res;
    const buffer = ([..."2019-05-13T08:20:58.828Z"].map(ch => ch.charCodeAt(0)))
    console.time('perfDate');
    for (let i = 0; i < 1e6; i++) {
        // res = new Date(1557735818000);
        // res = i === -1 ? 1: isoDateToInt32(buffer, 0);
        // res = Date.UTC(2019, 4, 12, 16, 1, 2) / 1000 | 0;
        res = Date.parse("2019-05-13T08:20:58.828Z");
    }
    console.timeEnd('perfDate');
    return res;
}

perfDate();

function perf1() {
    let x = 0;
    let res;
    console.time('perf1');
    for (let i = 0; i < 1e6; i++) {
        x += 7;
        res = i === -1 ? -1 : map.get(x);
    }
    console.timeEnd('perf1');
    return res;
}
function perf2Write() {
    let x = 0;
    const map = {};
    console.time('perf2Write');
    for (let i = 0; i < 1e6; i++) {
        x += 217;
        map[x] = x;
    }
    console.timeEnd('perf2Write');
    return map;
}
function perf2Read() {
    let x = 0;
    let res;
    console.time('perf2Read');
    for (let i = 0; i < 1e6; i++) {
        x += 7;
        res = i === -1 ? -1 : map[x];
    }
    console.timeEnd('perf2Read');
    return res;
}


function perf3Write() {
    let x = 0;
    const map = new Uint32Array(1e5);
    const len = map.length;
    console.time('perf3Write');
    for (let i = 0; i < len; i++) {
        x += 7;
        if (len > i) {
            map[i] = (x);
        }
    }
    console.timeEnd('perf3Write');
    return map;
}
function perf3Read() {
    const map = perf3Write();
    const len = map.length;
    let x = 0;
    let res;
    console.time('perf3Read');
    for (let i = 0; i < 1e6; i++) {
        x += 7;
        res = binarySearch(map, len, x);
    }
    console.timeEnd('perf3Read');
    return res;
}

// const map3 = perf3Write();
// const res3 = perf3Read();
// const res = perf2Read();
// console.log(res);
// console.log(map3);


function binarySearch(list, end, value) {
    let start = 0;
    let stop = end - 1;
    let middle = (start + stop) >> 1;

    while (start < stop) {
        const middleVal = list[middle];
        if (middleVal === value) return middle;
        if (value < middleVal) {
            stop = middle - 1
        } else {
            start = middle + 1
        }
        middle = ((start + stop) >> 1);
    }
    return -1;
}