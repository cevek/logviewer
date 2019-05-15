import {createIndex} from './LogIndex';
import {testSnapshots} from './tests.snapshot';

// import {renameSync, openSync, readSync, writeSync, closeSync} from 'fs';
function test(name: string, result: object, expected: object) {
    const resultJSON = JSON.stringify(result, null, 2);
    const expectedJSON = JSON.stringify(expected, null, 2);
    if (resultJSON !== expectedJSON) {
        console.error(`${name}: result !== expected\nResult: ${resultJSON}\nExpected: ${expectedJSON}`);
    }
}

const index = createIndex('./test.log', {isActive: false, readBufferSize: 100});

test('messages', [...index.messagesMap], [[1407091907, 'Hello'], [1165811057, 'Not found'], [-274802864, 'yeh']]);

test('find by msg: root', index.findValues({message: [{msg: 'Hello', type: 'info'}]}), testSnapshots.findByMsg.root);
test('find by msg: sub', index.findValues({message: [{msg: 'Not found', type: 'warn'}]}), testSnapshots.findByMsg.sub);
test(
    'find by msg: sub sub',
    index.findValues({message: [{msg: 'yeh', type: 'error'}]}),
    testSnapshots.findByMsg.subSub,
);
test('find by type', index.findValues({type: ['info']}), testSnapshots.findByType.root);
test('find by type: sub', index.findValues({type: ['warn']}), testSnapshots.findByType.sub);
test('find by type: sub sub', index.findValues({type: ['error']}), testSnapshots.findByType.subSub);

test('find by value: root', index.findValues({value: ['app']}), testSnapshots.findByType.root);
test('find by value: sub', index.findValues({value: [1225325]}), testSnapshots.findByType.sub);
test('find by value: sub sub', index.findValues({value: ['boom']}), testSnapshots.findByType.subSub);

// console.log(index.findValues({type: ['info']}));
// console.log(index.findValues({type: ['warn']}));
// console.log(index.findValues({value: ['app']}));

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
