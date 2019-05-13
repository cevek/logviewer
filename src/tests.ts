import {createIndex} from './LogIndex';

// import {renameSync, openSync, readSync, writeSync, closeSync} from 'fs';

const index = createIndex('./test.log', false);
console.log(index.messagesMap);
console.log(index.findValue('Not found'));

// const b = Buffer.from('Hello, everybody, how are you?');
// addToIndex(b, 1, 0, 5);
// addToIndex(b, 2, 7, 16);
// addToIndex(b, 3, 18, 21);
// addToIndex(b, 4, 22, 25);
// addToIndex(b, 5, 26, 29);

// serialize('test.dat');
// arr = deserialize('test.dat');
// console.log('------------------');
// // console.log(arr.filter(Boolean));
// console.log(findInIndex(Buffer.from('Hello')));
// console.log(findInIndex(Buffer.from('everybody')));
// console.log(findInIndex(Buffer.from('how')));
// console.log(findInIndex(Buffer.from('are')));
// console.log(findInIndex(Buffer.from('you')));

// function addPerf() {
//     const buf = Buffer.from('everybody');
//     console.time('addPerf');
//     for (let i = 0; i < 1e6; i++) {
//         // const b = Buffer.from(
//         //     Math.random()
//         //         .toString(33)
//         //         .substr(2, Math.ceil(Math.random() * 10)),
//         // );
//         addToIndex(buf, 1, 0, buf.length);
//     }
//     console.timeEnd('addPerf');
// }

// // addPerf();

// console.log('index done');

// function perf() {
//     const buff = Buffer.from('you');
//     console.time('perf');
//     for (let i = 0; i < 10; i++) {
//         findInIndex(buff);
//     }
//     console.timeEnd('perf');
// }

// perf();
