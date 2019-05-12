type Int32 = number;
type Int16 = number;
type UInt16 = number;
type Int8 = number;
type UInt8 = number;
type Float64 = number;
type Float32 = number;

type Arr8<T> = T[];
type Arr16<T> = T[];
type Arr32<T> = T[];

type Log = {
    pos: Int32;
    id: Int32;
    parentId: Int32;
    time: Int32;
    message: Int32;
    type: UInt8;
};
type Index = {
    version: Int32;
    names: Arr32<UInt8>;
    logs: Arr32<Log>;
    index: Arr32<{hash: Int32; id: Int32}>;
};
