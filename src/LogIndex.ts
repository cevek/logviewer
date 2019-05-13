import {existsSync, openSync, readSync, writeSync, watchFile, watch} from 'fs';
import {createGrowableInt32Array, GrowableInt32Array} from './GrowableTypedArray';
import {parseJSONValues} from './JsonParser';
import {murmurHash3} from './Murmur';

type JSONLogRow = {
    /**id*/ 0: number;
    /**parentId*/ 1: number;
    /**iso date*/ 2: string;
    /**type*/ 3: string;
    /**message*/ 4: string;
    /**json*/ 5: object;
};
type LogId = {type: 'LogId'} & number;
type LogPos = {type: 'Pos'} & number;
type LogFilePos = {type: 'LogFilePos'} & number;
type DateInt32 = {type: 'DateInt32'} & number;
type Hash = {type: 'Hash'} & number;

function getChapterHash(num: number) {
    return (num & 1023) as Hash;
}
function readInt32FromBuffer(data: Uint8Array, from: number) {
    return (data[from] << 24) | (data[from + 1] << 16) | (data[from + 2] << 8) | data[from + 3];
}
function writeInt32ToBuffer(data: Uint8Array, from: number, val: number) {
    data[from] = val >> 24;
    data[from + 1] = val >> 16;
    data[from + 2] = val >> 8;
    data[from + 3] = val;
}

const enum LogStruct {
    Id,
    ParentId,
    DateTime,
    LogFilePos,
    LogFileEnd,
    Size,
}

type LogJSON = {
    pos: LogPos;
    type: string;
    message: string;
    date: Date;
    children: LogJSON[];
    json: object;
};

export function createIndex(fileName: string, isActive: boolean) {
    const indexName = fileName.replace(/\.log$/, '.index.dat');

    // const indexExists = existsSync(indexName);
    const indexExists = false;
    let messagesMap: Map<Hash, string>;
    let chapters: GrowableInt32Array[];
    let logs: GrowableInt32Array;
    const logFileFd = openSync(fileName, 'r');
    const readBuffer = new Uint8Array(50_000_000);

    if (!indexExists) {
        chapters = [...Array(1024)].map(() => createGrowableInt32Array(8));
        messagesMap = new Map();
        logs = createGrowableInt32Array(10_000_000);
        let fileOffset = 0;
        parse(fileOffset);
        if (isActive) {
            watch(fileName, {}, () => {
                fileOffset = parse(fileOffset);
            });
        } else {
            serialize(indexName, messagesMap, logs, chapters);
        }
    }

    const res = deserialize(indexName);
    messagesMap = res.messagesMap;
    chapters = res.chapters;
    logs = res.logs;

    // const messagesReverseMap = new Map([...messagesMap].map(([k, v]) => [v, k]));
    return {
        messagesMap,
        findValue,
    };

    function parse(from: number) {
        let offset = from;
        let logPos = 0 as LogPos;
        let p = 0;
        while (true) {
            const readBytes = readSync(logFileFd, readBuffer, 0, readBuffer.length, offset);
            let logId = 0 as LogId;
            let parentLogId = 0 as LogId;
            let date = 0 as DateInt32;
            if (readBytes === 0) return offset;
            parseJSONValues(
                readBuffer,
                readBytes,
                (_type, level, valueHash, start, end) => {
                    if (level === 1) {
                        if (p === 0) logId = valueHash as LogId;
                        if (p === 1) parentLogId = valueHash as LogId;
                        if (p === 2) date = isoDateToInt32(readBuffer, start) as DateInt32;
                        if (p === 3 /** type */) addToIndex(valueHash as Hash, logPos);
                        if (p === 4 /** message */) {
                            if (!messagesMap.has(valueHash as Hash)) {
                                messagesMap.set(
                                    valueHash as Hash,
                                    Buffer.from(readBuffer.subarray(start, end)).toString(),
                                );
                            }
                            addToIndex(valueHash as Hash, logPos);
                        }
                        p++;
                    } else {
                        addToIndex(valueHash as Hash, logPos);
                    }
                },
                size => {
                    // console.log('size', offset, size);
                    logPos = (logPos + LogStruct.Size) as LogPos;
                    writeLog(logId, parentLogId, date, offset as LogFilePos, (offset + size) as LogFilePos);
                    offset += size;
                    p = 0;
                },
            );
        }
    }

    function addToIndex(hash: Hash, logPos: LogPos) {
        const chapterHash = getChapterHash(hash);
        const chapter = chapters[chapterHash];
        // todo: find same value in last 10 elements
        // console.log(hash);
        chapter.write(hash);
        chapter.write(logPos);
    }

    function findRootParentPos(pos: LogPos): LogPos {
        const parentId = logs.read(pos + LogStruct.ParentId) as LogId;
        if (parentId !== 0) {
            const parentPos = findParentPos(parentId);
            if (parentPos !== undefined) {
                return findRootParentPos(parentPos);
            }
        }
        return pos;
    }

    function logToJSON(pos: LogPos) {
        const logId = logs.read(pos) as LogId;
        const logFilePos = logs.read(pos + LogStruct.LogFilePos);
        const logFileEnd = logs.read(pos + LogStruct.LogFileEnd);
        const buffer = Buffer.alloc(logFileEnd - logFilePos);
        readSync(logFileFd, buffer, 0, buffer.length, logFilePos);
        const jsonStr = buffer.toString();
        // console.log(jsonStr);
        const jsonData = JSON.parse(buffer.toString()) as JSONLogRow;
        const logJSON: LogJSON = {
            pos,
            message: jsonData[4],
            type: jsonData[3],
            date: new Date(jsonData[2]),
            json: jsonData[5],
            children: findChildrenPos(logId, pos).map(logToJSON),
        };
        return logJSON;
    }

    function findParentPos(logId: LogId, fromPos = logs.getLength() as LogPos): LogPos | undefined {
        for (let i = 1; i < 1000; i++) {
            const pos = (fromPos - i * LogStruct.Size) as LogPos;
            if (pos < 0) return;
            const id = logs.read(pos);
            if (id < logId) return;
            if (id === logId) {
                return pos;
            }
        }
        return;
    }

    function findChildrenPos(parentLogId: LogId, fromPos: LogPos): LogPos[] {
        const childLogsPos: LogPos[] = [];
        for (let i = 1; i < 1000; i++) {
            const pos = (fromPos + i * LogStruct.Size) as LogPos;
            if (pos > logs.getLength()) break;
            const id = logs.read(pos + LogStruct.ParentId);
            if (id === parentLogId) {
                childLogsPos.push(pos);
            }
        }
        return childLogsPos;
    }

    function writeLog(
        logId: LogId,
        parentLogId: LogId,
        datetime: DateInt32,
        jsonStart: LogFilePos,
        jsonEnd: LogFilePos,
    ) {
        const logPos = logs.getLength() as LogPos;
        logs.write(logId, logPos + LogStruct.Id);
        logs.write(parentLogId, logPos + LogStruct.ParentId);
        logs.write(datetime, logPos + LogStruct.DateTime);
        logs.write(jsonStart, logPos + LogStruct.LogFilePos);
        logs.write(jsonEnd, logPos + LogStruct.LogFileEnd);
    }

    function findPath(logJson: LogJSON, pos: LogPos, path: number[]): number[] {
        for (let i = 0; i < logJson.children.length; i++) {
            const child = logJson.children[i];
            if (child.pos === pos) {
                path.push(i);
                return path;
            }
            const ret = findPath(child, pos, [...path, i]);
            if (ret === undefined) continue;
            else return ret;
        }
        // if (logJson.pos !== pos) throw new Error('LogPath is not found');
        return [];
    }
    function findValue(value: string | number) {
        const json = JSON.stringify(value + '');
        const str = json.substr(1, json.length - 2);
        const hash = murmurHash3(Buffer.from(str), 0, 1) as Hash;
        // console.log(hash);
        return findHash(hash);
    }
    function findHash(hash: Hash) {
        const chapterHash = getChapterHash(hash);
        const chapter = chapters[chapterHash];
        if (chapter === undefined) return;
        const end = chapter.getLength();
        const arr = chapter.getArray();
        for (let i = 0; i < end; i += 2) {
            if (arr[i] === hash) {
                const pos = arr[i + 1] as LogPos;
                const rootPos = findRootParentPos(pos);
                const rootJson = logToJSON(rootPos);
                return {root: rootJson, path: findPath(rootJson, pos, [])};
            }
        }
        return;
    }

    function deserialize(indexFile: string) {
        const indexFd = openSync(indexFile, 'r');
        const sizeBuffer = new Uint8Array(4);
        let offset = 0;

        const version = readSize();
        if (version !== 1) throw new Error('no supported index version: ' + version);

        const messages = JSON.parse(read(readSize()).toString('utf8'));
        const logs = createGrowableInt32Array(new Int32Array(read(readSize()).buffer));
        const chapters = [];
        const chaptersCount = readSize();
        for (let i = 0; i < chaptersCount; i++) {
            chapters.push(createGrowableInt32Array(new Int32Array(read(readSize()).buffer)));
        }
        return {
            messagesMap: new Map<Hash, string>(messages),
            logs,
            chapters,
        };
        function readSize() {
            readSync(indexFd, sizeBuffer, 0, 4, offset);
            offset += 4;
            return readInt32FromBuffer(sizeBuffer, 0);
        }
        function read(size: number) {
            const buffer = Buffer.alloc(size);
            readSync(indexFd, buffer, 0, buffer.length, offset);
            offset += size;
            return buffer;
        }
    }

    function serialize(
        file: string,
        messages: Map<Hash, string>,
        logs: GrowableInt32Array,
        chapters: GrowableInt32Array[],
    ) {
        // console.log({messages});
        const fd = openSync(file, 'w+');
        const sizeBuffer = new Uint8Array(4);
        let offset = 0;
        const version = 1;
        writeSize(version);
        const messagesBuffer = Buffer.from(JSON.stringify([...messages]));
        writeSize(messagesBuffer.length);
        write(messagesBuffer);
        writeSize(logs.getLength() * 4);
        write(logs.getUint8Array());
        const chaptersCount = chapters.length;
        writeSize(chaptersCount);
        for (let i = 0; i < chaptersCount; i++) {
            const chapter = chapters[i];
            writeSize(chapter.getLength() * 4);
            write(chapter.getUint8Array());
        }
        function writeSize(size: number) {
            writeInt32ToBuffer(sizeBuffer, 0, size);
            writeSync(fd, sizeBuffer, 0, 4, offset);
            offset += 4;
        }
        function write(buffer: Uint8Array) {
            writeSync(fd, buffer, 0, buffer.length, offset);
            offset += buffer.length;
        }
    }
}

/**
 * Convert iso date buffer to seconds count(approx) from 2000-01-01
 */
function isoDateToInt32(buffer: Uint8Array, from: number) {
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
function int32ToDate(val: number) {
    return new Date(
        Date.UTC(
            2000 + ((val / 12 / 31 / 24 / 60 / 60) | 0),
            (((val / 31 / 24 / 60 / 60) | 0) % 12) - 1,
            ((val / 24 / 60 / 60) | 0) % 31,
            ((val / 60 / 60) | 0) % 24,
            ((val / 60) | 0) % 60,
            val % 60,
        ),
    );
}
