export type GrowableUint8Array = {
    ensureFreeSpace(requestedEnd: number): void;
    getArray(): Uint8Array;
    getLength(): number;
    read(pos: number): number;
    readInt32(pos: number): number;
    write(val: number, pos?: number): void;
    writeInt32(val: number, pos?: number): void;
};
export type GrowableInt32Array = {
    ensureFreeSpace: (requestedEnd: number) => void;
    getArray(): Int32Array;
    getUint8Array(): Uint8Array;
    getLength(): number;
    read(pos: number): number;
    write(val: number, pos?: number): void;
};
export function createGrowableUint8Array(initialSize: number | Uint8Array, growFactor = 1.5): GrowableUint8Array {
    let array = typeof initialSize === 'number' ? new Uint8Array(initialSize) : initialSize;
    let arrayRealLength = array.length;
    let length = 0;
    return {
        ensureFreeSpace(requestedEnd: number) {
            if (requestedEnd >= arrayRealLength) {
                const newArray = new Uint8Array(requestedEnd * growFactor);
                newArray.set(array);
                array = newArray;
                arrayRealLength = array.length;
            }
        },
        getArray() {
            return array;
        },
        getLength() {
            return length;
        },
        read(pos: number) {
            return array[pos];
        },
        readInt32(pos: number) {
            return array[pos] | (array[pos + 1] << 8) | (array[pos + 2] << 16) | (array[pos + 3] << 24);
        },
        write(val: number, pos = length) {
            this.ensureFreeSpace(pos + 1);
            array[pos] = val;
            length = Math.max(length, pos + 1);
        },
        writeInt32(val: number, pos = length) {
            this.ensureFreeSpace(pos + 4);
            array[pos] = val >> 24;
            array[pos + 1] = (val >> 16) & 0xff;
            array[pos + 2] = (val >> 8) & 0xff;
            array[pos + 3] = val & 0xff;
            length = Math.max(length, pos + 4);
        },
    };
}

export function createGrowableInt32Array(initialSize: number | Int32Array, growFactor = 1.5): GrowableInt32Array {
    let array = typeof initialSize === 'number' ? new Int32Array(initialSize) : initialSize;
    let arrayRealLength = array.length;
    let length = 0;
    function ensureFreeSpace(requestedEnd: number) {
        if (requestedEnd >= arrayRealLength) {
            const newArray = new Int32Array(requestedEnd * growFactor);
            newArray.set(array);
            array = newArray;
            arrayRealLength = array.length;
        }
    }
    return {
        ensureFreeSpace,
        getArray() {
            return array;
        },
        getUint8Array() {
            return new Uint8Array(array.buffer).subarray(0, length * 4);
        },
        getLength() {
            return length;
        },
        read(pos: number) {
            return array[pos];
        },
        write(val: number, pos = length) {
            ensureFreeSpace(pos + 1);
            array[pos] = val;
            length = Math.max(length, pos + 1);
        },
    };
}
