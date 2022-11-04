export interface CindyType {
    ctype: string;
    value?: Record<string, any>;
}

export interface CindyNumber extends CindyType {
    usage?: "Angle";
    ctype: "number";
    value: {
        real: number;
        imag: number;
    };
}

export interface CindyNada {
    ctype: "undefined";
}

export interface CindyList extends CindyType {
    ctype: "list";
    value: Array<CindyType>;
}

export interface CindyMath {
    _helper: {
        roundingfactor: number;
        angleroundingfactor: number;
        niceround: (a: number, roundingfactor: number) => number;
        niceangle: (a: CindyNumber) => string;
        input: (a: { r: object; i: object }) => CindyNumber;
        isReal: (a: CindyNumber) => boolean;
        isNaN: (a: CindyNumber) => boolean;
        isFinite: (a: CindyNumber) => boolean;
        seed: "NO" | number;
        rand: () => number;
        randnormal: () => number;
        isEqual: (a: CindyNumber, b: CindyNumber) => boolean;
        isLessThan: (a: CindyNumber, b: CindyNumber) => boolean;
        isZero: (arg: CindyNumber) => boolean;
        isAlmostZero: (arg: CindyNumber) => boolean;
        isAlmostReal: (arg: CindyNumber) => boolean;
        isAlmostImag: (arg: CindyNumber) => boolean;
        solveCubicHelper: (a: CindyNumber, b: CindyNumber, c: CindyNumber, d: CindyNumber) => CindyList;
        z3a: CindyNumber;
        z3b: CindyNumber;
        cub1: CindyList;
        cub2: CindyList;
        cub3: CindyList;
        seedrandom: (a: number) => void;
        compare: (a: CindyNumber, b: CindyNumber) => number;
        isAlmostEqual: (a: CindyNumber, b: CindyNumber, preci?: number) => boolean;
        getRangeRand: (a: number, b: number) => number;
    };
    niceprint: (a: CindyNumber, roundingfactor?: number) => string;
    realmult: (r: number, a: CindyNumber) => CindyNumber;
    complex: (r: number, i: number) => CindyNumber;
    real: (r: number) => CindyNumber;
    zero: CindyNumber;
    one: CindyNumber;
    infinity: CindyNumber;
    nan: CindyNumber;
    argmax: (a: CindyNumber, b: CindyNumber) => CindyNumber;
    max: (a: CindyNumber, b: CindyNumber) => CindyNumber;
    min: (a: CindyNumber, b: CindyNumber) => CindyNumber;
    add: (a: CindyNumber, b: CindyNumber) => CindyNumber;
    sub: (a: CindyNumber, b: CindyNumber) => CindyNumber;
    neg: (a: CindyNumber) => CindyNumber;
    re: (a: CindyNumber) => CindyNumber;
    im: (a: CindyNumber) => CindyNumber;
    conjugate: (a: CindyNumber) => CindyNumber;
    ceil: (a: CindyNumber) => CindyNumber;
    floor: (a: CindyNumber) => CindyNumber;
    round: (a: CindyNumber) => CindyNumber;
    mult: (a: CindyNumber, b: CindyNumber) => CindyNumber;
    multiMult: (arr: Array<CindyNumber>) => CindyNada | CindyNumber;
    abs2: (a: CindyNumber) => CindyNumber;
    abs: (a: CindyNumber) => CindyNumber;
    inv: (a: CindyNumber) => CindyNumber;
    div: (a: CindyNumber, b: CindyNumber) => CindyNumber;
    eps: number;
    epsbig: number;
    snap: (a: CindyNumber) => CindyNumber;
    exp: (a: CindyNumber) => CindyNumber;
    sin: (a: CindyNumber) => CindyNumber;
    cos: (a: CindyNumber) => CindyNumber;
    tan: (a: CindyNumber) => CindyNumber;
    arccos: (a: CindyNumber) => CindyNumber;
    arcsin: (a: CindyNumber) => CindyNumber;
    arctan: (a: CindyNumber) => CindyNumber;
    arctan2: (a: CindyNumber, b: CindyNumber) => CindyNumber;
    sqrt: (a: CindyNumber) => CindyNumber;
    log: (a: CindyNumber) => CindyNumber;
    pow: (a: CindyNumber, n: CindyNumber) => CindyNumber;
    powRealExponent: (a: CindyNumber, b: number) => CindyNumber;
    powIntegerExponent: (a: CindyNumber, b: number) => CindyNumber;
    mod: (a: CindyNumber, b: CindyNumber) => CindyNumber;
    solveCubic: (a: CindyNumber, b: CindyNumber, c: CindyNumber, d: CindyNumber) => Array<CindyNumber>;
    getRandReal: (a: number, b: number) => CindyNumber;
    getRandComplex: (a: number, b: number) => CindyNumber;
}
