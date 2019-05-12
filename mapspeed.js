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
const res3 = perf3Read();
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