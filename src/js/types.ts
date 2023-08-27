export type ctypes = "number" | "list" | "undefined" | "image" | "function" | "boolean" | "JSON" | "string";

export interface CSType {
    ctype: ctypes;
    value?: Record<string, any>;
}

export interface CSNum extends CSType {
    usage?: "Angle";
    ctype: "number";
    value: {
        real: number;
        imag: number;
    };
}

export interface Nada {
    ctype: "undefined";
}

export interface CSList extends CSType {
    ctype: "list";
    value: Array<CSType>;
}

export interface CSMath {
    _helper: {
        roundingfactor: number;
        angleroundingfactor: number;
        niceround: (a: number, roundingfactor: number) => number;
        niceangle: (a: CSNum) => string;
        input: (a: { r: object; i: object }) => CSNum;
        isReal: (a: CSNum) => boolean;
        isNaN: (a: CSNum) => boolean;
        isFinite: (a: CSNum) => boolean;
        seed: "NO" | number;
        rand: () => number;
        randnormal: () => number;
        isEqual: (a: CSNum, b: CSNum) => boolean;
        isLessThan: (a: CSNum, b: CSNum) => boolean;
        isZero: (arg: CSNum) => boolean;
        isAlmostZero: (arg: CSNum) => boolean;
        isAlmostReal: (arg: CSNum) => boolean;
        isAlmostImag: (arg: CSNum) => boolean;
        solveCubicHelper: (a: CSNum, b: CSNum, c: CSNum, d: CSNum) => CSList;
        z3a: CSNum;
        z3b: CSNum;
        cub1: CSList;
        cub2: CSList;
        cub3: CSList;
        seedrandom: (a: number) => void;
        compare: (a: CSNum, b: CSNum) => number;
        isAlmostEqual: (a: CSNum, b: CSNum, preci?: number) => boolean;
        getRangeRand: (a: number, b: number) => number;
    };
    niceprint: (a: CSNum, roundingfactor?: number) => string;
    realmult: (r: number, a: CSNum) => CSNum;
    complex: (r: number, i: number) => CSNum;
    real: (r: number) => CSNum;
    zero: CSNum;
    one: CSNum;
    infinity: CSNum;
    nan: CSNum;
    argmax: (a: CSNum, b: CSNum) => CSNum;
    max: (a: CSNum, b: CSNum) => CSNum;
    min: (a: CSNum, b: CSNum) => CSNum;
    add: (a: CSNum, b: CSNum) => CSNum;
    sub: (a: CSNum, b: CSNum) => CSNum;
    neg: (a: CSNum) => CSNum;
    re: (a: CSNum) => CSNum;
    im: (a: CSNum) => CSNum;
    conjugate: (a: CSNum) => CSNum;
    ceil: (a: CSNum) => CSNum;
    floor: (a: CSNum) => CSNum;
    round: (a: CSNum) => CSNum;
    mult: (a: CSNum, b: CSNum) => CSNum;
    multiMult: (arr: Array<CSNum>) => Nada | CSNum;
    abs2: (a: CSNum) => CSNum;
    abs: (a: CSNum) => CSNum;
    inv: (a: CSNum) => CSNum;
    div: (a: CSNum, b: CSNum) => CSNum;
    eps: number;
    epsbig: number;
    snap: (a: CSNum) => CSNum;
    exp: (a: CSNum) => CSNum;
    sin: (a: CSNum) => CSNum;
    cos: (a: CSNum) => CSNum;
    tan: (a: CSNum) => CSNum;
    arccos: (a: CSNum) => CSNum;
    arcsin: (a: CSNum) => CSNum;
    arctan: (a: CSNum) => CSNum;
    arctan2: (a: CSNum, b: CSNum) => CSNum;
    sqrt: (a: CSNum) => CSNum;
    log: (a: CSNum) => CSNum;
    pow: (a: CSNum, n: CSNum) => CSNum;
    powRealExponent: (a: CSNum, b: number) => CSNum;
    powIntegerExponent: (a: CSNum, b: number) => CSNum;
    mod: (a: CSNum, b: CSNum) => CSNum;
    solveCubic: (a: CSNum, b: CSNum, c: CSNum, d: CSNum) => Array<CSNum>;
    getRandReal: (a: number, b: number) => CSNum;
    getRandComplex: (a: number, b: number) => CSNum;
}

// JSON

export interface CSJsonValue {
    ctype: string;
    value: Record<string, any>;
}

export interface CSJsonKey {
    ctype: string;
    key: CSJsonKey;
    value: CSJsonValue | Nada;
}

export type JsonNicePrintOptions = {
    printedWarning: boolean;
    visitedMap: {
        [key: string]: any;
        tracker: WeakMap<any, any>;
        level: number;
        maxLevel: number;
        maxElVisit: number;
        newLevel: boolean;
        printedWarning: boolean;
    };
};

interface JSONHelper {
    GenJSONAtom(key: string, val: CSType): CSJsonValue;
    forall(
        li: Record<string, CSType>,
        runVar: string,
        fct: () => CSJsonValue,
        modifs: { iterator?: "key" | "value" | "pair" }
    ): CSJsonValue | undefined;
    niceprint(a: CSJsonValue, modifs: { maxDepth: number }, options: JsonNicePrintOptions): string;
    handlePrintException(e: Error): void;
}

export interface Json {
    _helper: JSONHelper;
    turnIntoCSJson(a: CSType): CSJsonValue;
    getField(obj: CSJsonValue, key: string): CSType;
    setField(where: Record<string, CSType>, field: string, what: CSJsonValue): void;
    GenFromUserDataEl(el: {
        key: CSJsonValue;
        value: CSJsonValue;
    }): Nada | { key: Nada | CSJsonValue; val: Nada | CSType };
    niceprint(el: CSJsonValue, modifs: any, options: JsonNicePrintOptions): string;
}
