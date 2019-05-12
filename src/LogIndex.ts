import {existsSync, openSync, readSync, writeSync, watchFile, watch} from 'fs';
import {createGrowableInt32Array, GrowableInt32Array} from './GrowableTypedArray';
import {parseJSONValues} from './JsonParser';
import {murmurHash3} from './Murmur';

type LogId = {type: 'LogId'} & number;
type LogPos = {type: 'Pos'} & number;
type LogFilePos = {type: 'LogFilePos'} & number;
const typeMap = new Map<number, string>(
    ['trace', 'info', 'external', 'clientError', 'warn', 'error'].map(s => [murmurHash3(Buffer.from(s), 0, 1), s]),
);
function getIndexHashFromNumber(num: number) {
    return num & 1023;
}
function readInt32(data: Uint8Array, from: number) {
    return (data[from] << 24) | (data[from + 1] << 16) | (data[from + 2] << 8) | data[from + 3];
}
function writeInt32(data: Uint8Array, from: number, val: number) {
    data[from] = val << 24;
    data[from + 1] = val << 16;
    data[from + 2] = val << 8;
    data[from + 3] = val;
}

export function createIndex(fileName: string, isActive: boolean) {
    const indexName = fileName.replace(/\.log$/, '.index.dat');

    const indexExists = existsSync(indexName);
    let messagesMap: Map<number, string>;
    let chapters: GrowableInt32Array[];
    let logs: GrowableInt32Array;
    let date: Date;
    type LogJSON = {
        pos: LogPos;
        logFilePos: number;
        logFileEnd: number;
        type: string;
        message: string;
        datetime: Date;
        children: LogJSON[];
    };
    if (!indexExists) {
        chapters = [...Array(1024)].map(() => createGrowableInt32Array(8));
        messagesMap = new Map();
        logs = createGrowableInt32Array(10_000_000);
        date = new Date();
        const fd = openSync(fileName, 'r');
        const buffer = new Uint8Array(50_000_000);
        const arr = [...Array(5)] as Parameters<typeof writeLog>[0];
        let fileOffset = 0;
        parse(fileOffset);
        if (isActive) {
            watch(fileName, {}, () => {
                fileOffset = parse(fileOffset);
            });
        } else {
            serialize(indexName, date, messagesMap, logs, chapters);
        }
        function parse(from: number) {
            let offset = from;
            let logPos = 0 as LogPos;
            let p = 0;
            while (true) {
                const readBytes = readSync(fd, buffer, 0, buffer.length, offset);
                if (readBytes === 0) return offset;
                parseJSONValues(
                    buffer,
                    readBytes,
                    (_type, level, valueHash, start, _end) => {
                        if (level === 1) {
                            arr[p] = p === 4 ? ISODateToDayMS(buffer, start) : valueHash;
                            p++;
                            if (p === 7) {
                                logPos = writeLog(arr);
                            }
                        }
                        if (p > 4) {
                            const chapterHash = getIndexHashFromNumber(valueHash);
                            const chapter = chapters[chapterHash];
                            // todo: find same value in last 10 elements
                            chapter.write(valueHash);
                            chapter.write(logPos);
                        }
                    },
                    pos => {
                        p = 0;
                        offset += pos;
                    },
                );
            }
        }
    } else {
        const res = deserialize(indexName);
        messagesMap = res.messagesMap;
        chapters = res.chapters;
        logs = res.logs;
        date = res.date;
    }

    // const messagesReverseMap = new Map([...messagesMap].map(([k, v]) => [v, k]));
    return {
        messagesMap,
        findValue,
    };

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
        const datetime = new Date(date.getTime() + logs.read(pos + LogStruct.Time));
        const message = messagesMap.get(logs.read(pos + LogStruct.Message))!;
        const type = typeMap.get(logs.read(pos + LogStruct.Type))!;
        const logJSON: LogJSON = {
            pos,
            message,
            logFilePos,
            logFileEnd,
            type,
            datetime,
            children: findChildrenPos(logId, pos).map(logToJSON),
        };
        return logJSON;
    }

    const enum LogStruct {
        Id = 0,
        ParentId = 4,
        LogFilePos = 8,
        LogFileEnd = 12,
        Time = 16,
        Message = 20,
        Type = 24,
        Size = 25,
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

    function writeLog(arr: [LogId, LogId, LogFilePos, LogFilePos, number, number, number]) {
        const logPos = logs.getLength() as LogPos;
        logs.write(arr[0] + logPos + LogStruct.Id);
        logs.write(arr[1] + logPos + LogStruct.ParentId);
        logs.write(arr[2] + logPos + LogStruct.LogFilePos);
        logs.write(arr[3] + logPos + LogStruct.LogFileEnd);
        logs.write(arr[4] + logPos + LogStruct.Time);
        logs.write(arr[5] + logPos + LogStruct.Message);
        logs.write(arr[6] + logPos + LogStruct.Type);
        return logPos;
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
        if (logJson.pos !== pos) throw new Error('LogPath is not found');
        return [];
    }

    function findValue(valueHash: number) {
        const indexHash = getIndexHashFromNumber(valueHash);
        const chapter = chapters[indexHash];
        if (chapter === undefined) return;
        const end = chapter.getLength();
        const arr = chapter.getArray();
        for (let i = 0; i < end; i += 2) {
            if (arr[i] === valueHash) {
                const pos = arr[i + 1] as LogPos;
                const rootPos = findRootParentPos(pos);
                const rootJson = logToJSON(rootPos);
                return {root: rootJson, path: findPath(rootJson, pos, [])};
            }
        }
        return;
    }

    function deserialize(file: string) {
        const fd = openSync(file, 'r');
        const sizeBuffer = new Uint8Array(4);
        let offset = 0;

        const version = readSize();
        if (version !== 1) throw new Error('no supported index version: ' + version);
        const messages = JSON.parse(read(readSize()).toString());
        const date = dateNumberToDate(readSize());
        const logs = createGrowableInt32Array(new Int32Array(read(readSize()).buffer));
        const chapters = [];
        const chaptersCount = readSize();
        for (let i = 0; i < chaptersCount; i++) {
            chapters.push(createGrowableInt32Array(new Int32Array(read(readSize()).buffer)));
        }
        return {
            messagesMap: new Map<number, string>(messages),
            date,
            logs,
            chapters,
        };
        function readSize() {
            readSync(fd, sizeBuffer, 0, 4, offset);
            offset += 4;
            return readInt32(sizeBuffer, 0);
        }
        function read(size: number) {
            const buffer = new Uint8Array(size);
            readSync(fd, buffer, 0, buffer.length, offset);
            offset += size;
            return buffer;
        }
    }

    function serialize(
        file: string,
        date: Date,
        messages: Map<number, string>,
        logs: GrowableInt32Array,
        chapters: GrowableInt32Array[],
    ) {
        const fd = openSync(file, 'w+');
        const sizeBuffer = new Uint8Array(4);
        let offset = 0;
        writeSize(1);
        const messagesBuffer = Buffer.from(JSON.stringify([...messages]));
        writeSize(messagesBuffer.length);
        write(messagesBuffer);
        writeSize(dateToDateNumber(date));
        writeSize(logs.getLength());
        write(new Uint8Array(logs.getArray().subarray(0, logs.getLength()).buffer));
        const chaptersCount = chapters.length;
        writeSize(chaptersCount);
        for (let i = 0; i < chaptersCount; i++) {
            const chapter = chapters[i];
            writeSize(chapter.getLength());
            write(new Uint8Array(chapter.getArray().subarray(0, chapter.getLength()).buffer));
        }
        function writeSize(size: number) {
            writeInt32(sizeBuffer, 0, size);
            writeSync(fd, sizeBuffer, 0, 4, offset);
            offset += 4;
        }
        function write(buffer: Uint8Array) {
            readSync(fd, buffer, 0, buffer.length, offset);
            offset += buffer.length;
        }
    }

    function ISODateToDateNumber(buffer: Uint8Array, from: number) {
        return (
            20_00_00_00 +
            buffer[from + 2] * 100000 +
            buffer[from + 3] * 10000 +
            buffer[from + 5] * 1000 +
            buffer[from + 6] * 100 +
            buffer[from + 8] * 10 +
            buffer[from + 9] * 1
        );
    }
    function dateToDateNumber(date: Date) {
        return date.getUTCFullYear() * 100_00 + date.getUTCMonth() * 100 + date.getUTCDate();
    }
    function ISODateToDayMS(buffer: Uint8Array, from: number) {
        return (
            buffer[from + 11] * 36000_000 +
            buffer[from + 12] * 3600_000 +
            buffer[from + 14] * 600_000 +
            buffer[from + 15] * 60_000 +
            buffer[from + 17] * 10000 +
            buffer[from + 18] * 1000 +
            buffer[from + 20] * 100 +
            buffer[from + 21] * 10 +
            buffer[from + 22] * 1
        );
    }
    function dateNumberToDate(num: number) {
        return new Date((num / 10000) | 0, ((num / 100) | 0) % 100, num % 100);
    }
    function timeToNumber(date: Date) {
        return date.getTime() - Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    }
}
