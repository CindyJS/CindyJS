// Non-standard analysis for degenerate constructions (instance option `nsa`).
//
// Some constructions are undefined in special positions although the
// geometry has a well-defined answer there: the join of two coinciding points
// is the zero vector, and so is everything built on it. Following
// M. Strobel, "Non-standard Analysis in Projective Geometry" (dissertation,
// TU Munich), such removable singularities are resolved by evaluating the
// construction infinitely close to the degenerate configuration, with
// Levi-Civita numbers (libcs/LeviCivita.ts), and taking the projective shadow
// of the result: normalize by the largest component, take the standard part.
//
// A value is only accepted if it does not depend on how the configuration is
// approached - otherwise the singularity is not removable and the element
// stays undefined:
//
//   C0-continuation along the path (thesis, Algorithm "C0-Continuation"):
//     right after a move, the mover's parameter is set infinitesimally before
//     and after the end of its path, t = 1 -+ eps; both projective shadows
//     must agree.
//   Extended C0-continuation (Algorithm "Extended C0-Continuation"):
//     for everything the path does not decide (the construction vanishes
//     identically along it, zero moves, loading, full recalculation), all free
//     elements are perturbed infinitesimally in a few random directions, each
//     staying within its constraints (a point on a line stays on the line);
//     all projective shadows must agree.
//
// The implementation sits inside a function because the sources are
// concatenated into one scope: its many short helper names (evaluate, match,
// apply, ...) must not clash with those of other files.
//
// This runs after tracing is complete and is detached from it: tracing calls
// the hooks in Tracing.js's nsaHooks and nothing else changes there. For its
// own evaluations this module substitutes the state and tracing functions the
// operations use (opState, opTracers) with implementations on its own copy of
// the state. It writes the fields of degenerate elements and, for those that
// get a limit, their own slots of the tracing state, so that tracing continues
// from the limit (see apply); nothing else.
//
// The evaluations run inside withLeviCivita (libcs/LeviCivitaMode.ts), the
// only place where CSNumber and List compute on infinitesimals. Nothing that
// carries a series leaves an evaluation: only shadows are returned.

// @ts-expect-error: Not yet typed
import { csgeo } from "Setup";
import { instanceInvocationArguments } from "expose";
import { CSNumber } from "libcs/CSNumber";
import { withLeviCivita } from "libcs/LeviCivitaMode";
// @ts-expect-error: Not yet typed
import { List } from "libcs/List";
// @ts-expect-error: Not yet typed
import { General } from "libcs/General";
// @ts-expect-error: Not yet typed
import { minCostMatching } from "libcs/Operators";
// @ts-expect-error: Not yet typed
import { geoOps } from "libgeo/GeoOps";
// @ts-expect-error: Not yet typed
import { isShowing } from "libgeo/GeoBasics";
// @ts-expect-error: Not yet typed
import { stateIn, stateLastGood, opState, opTracers, nsaHooks, defaultParameterPath } from "libgeo/Tracing";
// @ts-expect-error: Not yet typed
import { tracingFailed } from "libgeo/Tracing";
import { CSNum, CSList, CSType } from "types";

// A CindyScript value as the (untyped) geometry code produces it.
type Value = CSType & { usage?: string };

// A geometric element (see GeoBasics.js). Its other fields depend on the
// operation, so they are only known as values.
interface GeoElement {
    name: string;
    type: string;
    args?: string[];
    stateIdx: number;
    pinned?: boolean;
    [field: string]: unknown;
}

// Shadows of the fields an evaluation wrote, by field name.
type Fields = Record<string, unknown>;

// Tracing state an element would have with its limit; null where the
// operation did not write.
type StateSlice = Array<number | null>;

interface Evaluation {
    fields: Map<GeoElement, Fields>;
    states: Map<GeoElement, StateSlice>;
}

interface Result {
    key: string;
    fields: Fields | null; // null: undefined
    state: StateSlice | null;
}

// The perturbed parameter of a movable element, or null to leave it.
type Perturb = (el: GeoElement, param: Value) => Value | null;

(function () {
    // Number of random directions for the extended continuation. The shadow is
    // an algebraic function of the direction, so two random directions agree by
    // accident only on a set of measure zero.
    const SAMPLES = 2;

    // Two projective shadows agree if their projective distance is below this.
    const AGREE = 1e-8;

    // Keys of element fields holding projective quantities.
    const projectiveFields: Record<string, boolean> = {
        homog: true,
        matrix: true,
        dualMatrix: true,
        results: true,
        startPoint: true,
        endPoint: true,
        viaPoint: true,
        farpoint: true,
        antipodalPoint: true,
        vertices: true,
    };

    function enabled(): boolean {
        return !!(instanceInvocationArguments as { nsa?: boolean }).nsa && !nsaHooks.suspended;
    }

    function isCSValue(v: unknown): v is Value {
        return !!v && typeof v === "object" && "ctype" in v;
    }

    function isList(v: unknown): v is CSList {
        return isCSValue(v) && v.ctype === "list";
    }

    // ---------------------------------------------------------------------------
    // Degeneracy

    // NaN, infinite or all zero: not a valid projective quantity
    function isUndefinedValue(v: CSList): boolean {
        return scanValue(v) !== ScanResult.Valid;
    }

    const enum ScanResult {
        Zero,
        Valid,
        Bad,
    }

    // Zero if all entries are (almost) zero, Bad as soon as one is NaN or infinite
    function scanValue(x: CSList): ScanResult {
        let res = ScanResult.Zero;
        for (const e of x.value) {
            if (e.ctype === "number") {
                const n = e as CSNum;
                if (!CSNumber._helper.isFinite(n)) return ScanResult.Bad;
                if (!CSNumber._helper.isAlmostZero(n)) res = ScanResult.Valid;
            } else if (e.ctype === "list") {
                const r = scanValue(e as CSList);
                if (r === ScanResult.Bad) return r;
                if (r === ScanResult.Valid) res = r;
            } else {
                res = ScanResult.Valid;
            }
        }
        return res;
    }

    function isDegenerate(el: GeoElement): boolean {
        // Some operations know when their result is rounding noise, e.g. the join
        // of two points that coincide up to the last few bits: normalized, that
        // noise is a valid looking but arbitrary line.
        const op = geoOps[el.type];
        if (op.isDegenerate && op.isDegenerate(el)) return true;
        if (isList(el.homog) && isUndefinedValue(el.homog)) return true;
        if (isList(el.matrix) && isUndefinedValue(el.matrix)) return true;
        // Results kept as a JavaScript array (conic sets) are not scanned: a set
        // may have an undefined member while those selected from it are fine.
        const r = el.results;
        if (isList(r)) {
            for (const v of r.value) if (isList(v) && isUndefinedValue(v)) return true;
        }
        return false;
    }

    function isMatrix(v: unknown): boolean {
        return isList(v) && v.value.length > 0 && v.value[0].ctype === "list";
    }

    // The degenerate elements among `scope` (in construction order, as
    // getGeoDependants and csgeo.gslp are), including everything computed from
    // a degenerate element: those values are garbage too. Runs after every move,
    // so it stays cheap while nothing is degenerate.
    function degenerateElements(scope: GeoElement[]): GeoElement[] {
        const bad = new Set<string>();
        const res: GeoElement[] = [];
        for (const el of scope) {
            if (bad.size > 0 && bad.has(el.name)) continue; // getGeoDependants may list an element twice
            if (isDegenerate(el) || (bad.size > 0 && hasArgIn(el, bad))) {
                bad.add(el.name);
                res.push(el);
            }
        }
        return res;
    }

    function hasArgIn(el: GeoElement, names: Set<string>): boolean {
        if (el.args) for (const a of el.args) if (names.has(a)) return true;
        return false;
    }

    // `els` and everything they depend on, in construction order - except what
    // lies behind elements in `frozen`, which count as given inputs
    function ancestorClosure(els: GeoElement[], frozen: Set<GeoElement>): GeoElement[] {
        const gslp = csgeo.gslp as GeoElement[];
        const needed = new Set(els.map((el) => el.name));
        for (let i = gslp.length - 1; i >= 0; --i) {
            const el = gslp[i];
            if (needed.has(el.name) && el.args && !frozen.has(el)) for (const a of el.args) needed.add(a);
        }
        return gslp.filter((el) => needed.has(el.name));
    }

    // ---------------------------------------------------------------------------
    // Projective shadows

    // The projective shadow of a field value computed with Levi-Civita numbers,
    // or null if it is not defined.
    function shadowOfField(key: string, v: unknown): unknown {
        // results kept as a JavaScript array (e.g. conic sets): each entry a
        // projective quantity of its own
        if (Array.isArray(v) && projectiveFields[key]) {
            const parts = v.map((w) => shadowOfField(isMatrix(w) ? "matrix" : "homog", w));
            return parts.some((w) => w === null) ? null : parts;
        }
        if (!isCSValue(v)) return v;
        if (v.ctype === "number") {
            const s = CSNumber.standardPart(v as CSNum);
            return CSNumber._helper.isNaN(s) ? null : s;
        }
        if (v.ctype !== "list") return v;
        const list = v as CSList & { usage?: string };
        if (!projectiveFields[key]) {
            if (!List._helper.hasLC(list)) return list;
            const s = List.standardPart(list);
            return List._helper.isNaN(s) ? null : s;
        }
        let res: Value;
        if (key !== "matrix" && key !== "dualMatrix" && list.value.length > 0 && list.value[0].ctype === "list") {
            // a list of projective vectors, each normalized on its own
            const parts = list.value.map((w) => shadowOfField(key, w));
            if (parts.some((w) => w === null)) return null;
            res = List.turnIntoCSList(parts);
        } else {
            res = List._helper.hasLC(list) ? List.normalizeMax(List.standardPartProjective(list)) : list;
            if (isUndefinedValue(res as CSList)) return null;
        }
        if (list.usage) res.usage = list.usage;
        return res;
    }

    // The shadows of the fields the evaluation wrote (compared with the element
    // as it was before, `saved`), or null if one of them is undefined. Other
    // fields - appearance set by scripts, trace bookkeeping - are none of our
    // business.
    function shadowFields(el: GeoElement, saved: GeoElement): Fields | null {
        const fields: Fields = {};
        for (const key of Object.keys(el)) {
            if (el[key] === saved[key]) continue;
            const v = shadowOfField(key, el[key]);
            if (v === null) return null;
            fields[key] = v;
        }
        return fields;
    }

    function flat(v: CSList): CSList {
        if (v.value.length === 0 || v.value[0].ctype !== "list") return v;
        return List.turnIntoCSList(([] as CSType[]).concat(...v.value.map((r) => flat(r as CSList).value)));
    }

    function projectivelyClose(a: CSList, b: CSList): boolean {
        const d: number = List.projectiveDistMinScal(List.normalizeMax(flat(a)), List.normalizeMax(flat(b)));
        return d < AGREE;
    }

    // Whether two sets of shadow fields of the same element agree.
    function agree(fa: Fields, fb: Fields): boolean {
        for (const key of Object.keys(fa)) {
            const a = fa[key];
            const b = fb[key];
            if (Array.isArray(a)) {
                if (!Array.isArray(b) || a.length !== b.length) return false;
                for (let i = 0; i < a.length; i++) {
                    if (isList(a[i]) && !(isList(b[i]) && projectivelyClose(a[i], b[i]))) return false;
                }
                continue;
            }
            if (!isCSValue(a) || (a.ctype !== "number" && a.ctype !== "list")) continue;
            if (!isCSValue(b) || b.ctype !== a.ctype) return false;
            if (a.ctype === "number") {
                const d = CSNumber.abs(CSNumber.sub(a as CSNum, b as CSNum)).value.real;
                if (!(d <= AGREE * Math.max(1, CSNumber.abs(a as CSNum).value.real))) return false;
                continue;
            }
            const la = a as CSList;
            const lb = b as CSList;
            if (projectiveFields[key] && key !== "matrix" && key !== "dualMatrix" && la.value[0].ctype === "list") {
                if (la.value.length !== lb.value.length) return false;
                for (let i = 0; i < la.value.length; i++) {
                    if (!projectivelyClose(la.value[i] as CSList, lb.value[i] as CSList)) return false;
                }
            } else if (projectiveFields[key]) {
                if (!projectivelyClose(la, lb)) return false;
            } else if (!(List.abs(List.sub(la, lb)).value.real <= AGREE * Math.max(1, List.abs(la).value.real))) {
                return false;
            }
        }
        return true;
    }

    function nanLike(v: unknown): unknown {
        if (Array.isArray(v)) return v.map(nanLike);
        if (!isCSValue(v)) return v;
        if (v.ctype === "number") return CSNumber.nan;
        if (v.ctype !== "list") return v;
        const res: Value = List.turnIntoCSList((v as CSList).value.map(nanLike));
        if (v.usage) res.usage = v.usage;
        return res;
    }

    // Marks an element undefined: its projective fields become NaN. Values that
    // are undefined already (NaN or zero) stay as they are; this only removes
    // rounding noise that looks like a valid value (see isDegenerate). Results
    // of sets are always marked: a set may carry an undefined homog besides.
    function makeUndefined(el: GeoElement): void {
        const v = el.homog || el.matrix;
        const undefinedAlready = isList(v) && isUndefinedValue(v);
        for (const key of Object.keys(projectiveFields)) {
            if (undefinedAlready && key !== "results") continue;
            if (isList(el[key]) || Array.isArray(el[key])) el[key] = nanLike(el[key]);
        }
    }

    // ---------------------------------------------------------------------------
    // Evaluation with Levi-Civita numbers on a private copy of the state

    const Abort = {
        toString: function () {
            return "nsa: refinement requested";
        },
    };

    let inArr: number[] = []; // private state: plain numbers, copied from the tracing state
    let outArr: Array<number | undefined> = []; // what the operations write, as standard numbers
    let inIdx = 0;
    let outIdx = 0;
    // the perturbed parameter of the element being evaluated, read instead of its state
    let override: { idx: number; value: Value } | null = null;

    function takeOverride(o: { idx: number; value: Value }, size: number): Value {
        override = null;
        inIdx += size;
        return o.value;
    }

    const privateState = {
        getNumber: function (): Value {
            if (override !== null && inIdx === override.idx && override.value.ctype === "number")
                return takeOverride(override, 2);
            const i = inIdx;
            inIdx += 2;
            return CSNumber.complex(inArr[i], inArr[i + 1]);
        },
        getVector: function (n: number): Value {
            if (override !== null && inIdx === override.idx && override.value.ctype === "list")
                return takeOverride(override, 2 * n);
            const lst = new Array(n);
            for (let i = 0; i < n; ++i) lst[i] = privateState.getNumber();
            return List.turnIntoCSList(lst);
        },
        // Outputs are kept as their shadows: when a limit is accepted they become
        // the element's tracing state, so that tracing continues from there.
        putNumber: function (c: CSNum): void {
            const s = CSNumber.standardPart(c);
            outArr[outIdx] = s.value.real;
            outArr[outIdx + 1] = s.value.imag;
            outIdx += 2;
        },
        putVector: function (v: CSList): void {
            const s: CSList = List._helper.hasLC(v) ? List.normalizeMax(List.standardPartProjective(v)) : v;
            for (const c of s.value as CSNum[]) {
                outArr[outIdx] = c.value.real;
                outArr[outIdx + 1] = c.value.imag;
                outIdx += 2;
            }
        },
        setInIdx: function (idx: number): void {
            inIdx = idx;
        },
        // (lastGoodVector stays the tracing one: the last good state is read only)
    };

    // the vector compared when matching solutions: Levi-Civita vectors by their limit
    function comparable(v: CSList): CSList {
        return List._helper.hasLC(v) ? List.standardPartProjective(v) : v;
    }

    // Orders `news` to match `olds` (the values tracing found) by distance.
    function match(news: CSList[], olds: CSList[]): CSList[] {
        const cost = olds.map((o) =>
            news.map((n) => {
                const d: number = List.projectiveDistMinScal(comparable(o), comparable(n));
                return Number.isNaN(d) ? 1e9 : d;
            })
        );
        const m: number[] = minCostMatching(cost);
        return olds.map((_, i) => news[m[i]]);
    }

    const privateTracers = {
        tracing2core: function (n1: CSList, n2: CSList, o1: CSList, o2: CSList): CSList[] {
            return match([n1, n2], [o1, o2]);
        },
        tracing2: function (n1: CSList, n2: CSList): Value {
            const olds = [privateState.getVector(3), privateState.getVector(3)] as CSList[];
            const res = match([n1, n2], olds);
            res.forEach(privateState.putVector);
            return List.turnIntoCSList(res);
        },
        tracing4: function (n1: CSList, n2: CSList, n3: CSList, n4: CSList): Value {
            const olds = [0, 1, 2, 3].map(() => privateState.getVector(3)) as CSList[];
            const res = match([n1, n2, n3, n4], olds);
            res.forEach(privateState.putVector);
            return List.turnIntoCSList(res);
        },
        tracingSesq: function (newVecs: CSList[]): CSList[] {
            const olds = newVecs.map((v) => privateState.getVector(v.value.length)) as CSList[];
            const res = match(newVecs, olds);
            res.forEach(privateState.putVector);
            return res;
        },
        tracing2Conics: function (c1: CSList, c2: CSList): Value {
            const n1: CSList = geoOps._helper.flattenConicMatrix(c1);
            const n2: CSList = geoOps._helper.flattenConicMatrix(c2);
            const olds = [privateState.getVector(6), privateState.getVector(6)] as CSList[];
            const res = match([n1, n2], olds);
            res.forEach(privateState.putVector);
            return List.turnIntoCSList(res.map((r) => geoOps._helper.buildConicMatrix(r.value)));
        },
        // there is no refining here: give up on the element
        requestRefinement: function (): never {
            throw Abort;
        },
    };

    type Replacement = Record<string, unknown>;

    // Sets the non-null entries of `replacement` on `target`, returns the old ones.
    function substitute(target: Replacement, replacement: Replacement): Replacement {
        const saved: Replacement = {};
        for (const key of Object.keys(replacement)) {
            if (replacement[key] === null) continue;
            saved[key] = target[key];
            target[key] = replacement[key];
        }
        return saved;
    }

    let warned = false;

    // Evaluates the elements of `order` once, with parameters perturbed by
    // `perturb`, and returns, for the `targets` that depend on a perturbed
    // element and came out defined, their shadow fields and the tracing state they
    // would have. Elements in `frozen` keep their values; `lastGoodFor` start from
    // their last good state. Elements and tracing state are left exactly as they
    // were.
    function evaluate(
        order: GeoElement[],
        targets: GeoElement[],
        perturb: Perturb,
        lastGoodFor: GeoElement[],
        frozen: Set<GeoElement>
    ): Evaluation {
        return withLeviCivita(() => evaluateLC(order, targets, perturb, lastGoodFor, frozen));
    }

    // evaluate, with CSNumber and List computing on Levi-Civita numbers. Nothing
    // that carries a series leaves this function: the fields and states it
    // returns are shadows, and the elements are restored (see finally).
    function evaluateLC(
        order: GeoElement[],
        targets: GeoElement[],
        perturb: Perturb,
        lastGoodFor: GeoElement[],
        frozen: Set<GeoElement>
    ): Evaluation {
        const savedEls = order.map((el) => Object.assign({}, el));
        const savedState = substitute(opState, privateState);
        const savedTracers = substitute(opTracers, privateTracers);
        const fields = new Map<GeoElement, Fields>();
        const states = new Map<GeoElement, StateSlice>();
        // elements depending on a perturbed one: only these compute a limit here,
        // the others merely repeat the standard computation
        const touched = new Set<string>();
        try {
            // the traced values; elements that were degenerate start from their
            // last good state, as tracing would
            inArr = Array.from(stateIn as Float64Array);
            outArr = new Array(inArr.length);
            for (const el of lastGoodFor) {
                const size: number = geoOps[el.type].stateSize;
                for (let i = 0; i < size; i++) inArr[el.stateIdx + i] = stateLastGood[el.stateIdx + i];
            }
            for (const el of order) {
                if (frozen.has(el)) continue;
                const op = geoOps[el.type];
                inIdx = outIdx = el.stateIdx;
                let perturbed = false;
                if (op.isMovable && op.getParamFromState) {
                    const value = perturb(el, op.getParamFromState(el));
                    inIdx = el.stateIdx;
                    if (value) {
                        override = { idx: el.stateIdx, value };
                        perturbed = true;
                    }
                }
                // a perturbed element takes its parameter as given, like a mover
                op.updatePosition(el, perturbed);
                override = null;
                // From standard inputs that coincide up to rounding (see
                // isDegenerate, which only compares standard values), the
                // result is rounding noise here as well, not a limit:
                // undefined, and so is everything computed from it.
                if (op.isDegenerate && op.isDegenerate(el)) makeUndefined(el);
                if (perturbed || (el.args && el.args.some((a) => touched.has(a)))) touched.add(el.name);
            }
            order.forEach((el, i) => {
                if (!targets.includes(el) || !touched.has(el.name)) return;
                const f = shadowFields(el, savedEls[i]);
                if (!f) return;
                fields.set(el, f);
                const size: number = geoOps[el.type].stateSize;
                const st: StateSlice = [];
                for (let k = 0; k < size; k++) {
                    const v = outArr[el.stateIdx + k];
                    if (Number.isNaN(v)) return; // an output without a limit
                    st.push(v === undefined ? null : v);
                }
                states.set(el, st);
            });
        } catch (e) {
            if (e !== Abort && !warned) {
                warned = true;
                console.warn("CindyJS nsa: evaluation failed", e);
            }
            fields.clear();
            states.clear();
        } finally {
            substitute(opState, savedState);
            substitute(opTracers, savedTracers);
            override = null;
            inArr = [];
            outArr = [];
            order.forEach((el, i) => {
                for (const key of Object.keys(el)) if (!(key in savedEls[i])) delete el[key];
                Object.assign(el, savedEls[i]);
            });
        }
        return { fields, states };
    }

    // ---------------------------------------------------------------------------
    // Perturbations

    type Random = () => number;

    // Deterministic pseudo-random numbers in [-1, 1] for element `name` and
    // sample k, so the result is the same every time.
    function randomSource(name: string, k: number): Random {
        let h = 2166136261 ^ Math.imul(k + 1, 2654435761);
        for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
        return function () {
            h = Math.imul(h ^ (h >>> 15), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            h ^= h >>> 16;
            return ((h >>> 0) / 4294967296) * 2 - 1;
        };
    }

    function vec(values: number[]): CSList {
        return List.turnIntoCSList(values.map((x) => CSNumber.real(x)));
    }

    type Perturbation = (el: GeoElement, param: Value, eps: CSNum, rnd: Random) => Value;

    // move the point in the plane; points at infinity along the line at infinity
    const perturbFree: Perturbation = function (el, p, eps, rnd) {
        const z = (p as CSList).value[2] as CSNum;
        const d = CSNumber._helper.isAlmostZero(z) ? vec([rnd(), rnd(), 0]) : List.scalmult(z, vec([rnd(), rnd(), 0]));
        return List.add(p, List.scalmult(eps, d));
    };

    // Infinitesimal perturbations of free and semi-free elements that respect
    // their constraints, by operation (others have no parameters to perturb);
    // eps is an infinitesimal, rnd a random source.
    const perturbations: Partial<Record<string, Perturbation>> = {
        Free: perturbFree,
        PointOnLine: function (el, p, eps, rnd) {
            const moved = perturbFree(el, p, eps, rnd);
            const [line] = el.args || [];
            return geoOps._helper.projectPointToLine(moved, csgeo.csnames[line].homog);
        },
        PointOnCircle: function (el, p, eps, rnd) {
            return List.add(p, List.scalmult(eps, vec([rnd(), rnd(), 0])));
        },
        PointOnSegment: function (el, p, eps, rnd) {
            return CSNumber.add(p as CSNum, CSNumber.realmult(rnd(), eps));
        },
        PointOnArc: function (el, p, eps, rnd) {
            return List.add(p, List.scalmult(eps, vec([rnd(), rnd()])));
        },
        FreeLine: function (el, p, eps, rnd) {
            return List.add(p, List.scalmult(eps, vec([rnd(), rnd(), rnd()])));
        },
        HorizontalLine: function (el, p, eps, rnd) {
            return List.add(p, List.scalmult(eps, vec([0, 0, rnd()])));
        },
        VerticalLine: function (el, p, eps, rnd) {
            return List.add(p, List.scalmult(eps, vec([0, 0, rnd()])));
        },
        Through: function (el, p, eps, rnd) {
            return List.add(p, List.scalmult(eps, vec([rnd(), rnd(), 0])));
        },
        CircleMr: function (el, p, eps, rnd) {
            return CSNumber.add(p as CSNum, CSNumber.realmult(rnd(), eps));
        },
    };

    // ---------------------------------------------------------------------------
    // Resolution

    // Results per element name. An element keeps its result while its inputs do
    // not change (a point moved by zero, a full recalculation, other parts of the
    // construction moving), and loses it as soon as it is computed regular again:
    // returning to the same position later is a new approach, which may continue
    // differently.
    const results = new Map<string, Result>();

    // The inputs of a degenerate element: the tracing state of everything it
    // depends on, except other degenerate elements (whose state are outputs).
    // (`frozen` only limits the closure.)
    function inputKey(el: GeoElement, bad: Set<GeoElement>, frozen: Set<GeoElement>): string {
        const parts: Array<string | number> = [el.name];
        for (const a of ancestorClosure([el], frozen)) {
            if (a === el || bad.has(a)) continue;
            const size: number = geoOps[a.type].stateSize;
            for (let i = 0; i < size; i++) parts.push(stateIn[a.stateIdx + i]);
            if (frozen.has(a)) parts.push("frozen");
        }
        return parts.join(",");
    }

    // Elements with a result that count as given inputs: resolved elements
    // outside the scope, and (if keys are given) degenerate ones in it whose
    // inputs did not change.
    function frozenFor(
        inScope: Set<GeoElement>,
        badSet: Set<GeoElement>,
        keys: Map<GeoElement, string> | null
    ): Set<GeoElement> {
        const frozen = new Set<GeoElement>();
        for (const el of csgeo.gslp as GeoElement[]) {
            const r = results.get(el.name);
            if (!r || !r.fields) continue;
            if (!inScope.has(el) || (keys && badSet.has(el) && r.key === keys.get(el))) frozen.add(el);
        }
        return frozen;
    }

    // Shows a result: its limit, or undefined.
    function apply(el: GeoElement, r: Result): void {
        if (r.fields && r.state) {
            Object.assign(el, r.fields);
            // the one write into the tracing state: an element that tracing
            // left undefined gets the state belonging to its limit, so that
            // tracing continues from the limit in the following moves. Not
            // into the last good state if tracing failed: the next step of
            // the move starts over from there, the mover at its position
            // before, and the limit belongs to the position it failed at.
            r.state.forEach((v, i) => {
                if (v === null) return;
                stateIn[el.stateIdx + i] = v;
                if (!tracingFailed) stateLastGood[el.stateIdx + i] = v;
            });
        } else {
            makeUndefined(el);
        }
    }

    function isAlmostZeroValue(v: Value): boolean {
        if (v.ctype === "number") return CSNumber._helper.isAlmostZero(v as CSNum);
        if (v.ctype === "list") return (v as CSList).value.every(isAlmostZeroValue);
        return false;
    }

    function resolve(
        scope: GeoElement[],
        mover: GeoElement | null,
        originParam: Value | null,
        targetParam: Value | null
    ) {
        const bad = degenerateElements(scope);
        if (bad.length === 0) {
            if (results.size > 0) for (const el of scope) results.delete(el.name);
            return;
        }
        const badSet = new Set(bad);
        for (const el of scope) if (!badSet.has(el)) results.delete(el.name);

        const inScope = new Set(scope);
        const keys = new Map(bad.map((el) => [el, inputKey(el, badSet, frozenFor(inScope, badSet, null))]));
        const hit = (el: GeoElement) => {
            const r = results.get(el.name);
            return !!r && r.key === keys.get(el);
        };
        // elements whose inputs did not change keep their result
        for (const el of bad) {
            const r = results.get(el.name);
            if (r && hit(el)) apply(el, r);
        }
        const todo = bad.filter((el) => !hit(el));

        if (todo.length > 0) {
            // Elements with a result, shown already, count as given inputs, so
            // the new results are consistent with them.
            const frozen = frozenFor(inScope, badSet, keys);
            const order = ancestorClosure(todo, frozen);
            const found = new Map<GeoElement, { fields: Fields; state: StateSlice } | null>();
            const eps = CSNumber.infinitesimal(1);

            // C0-continuation along the mover's path, at t = 1 -+ eps
            if (
                mover &&
                order.includes(mover) &&
                originParam &&
                targetParam &&
                !isAlmostZeroValue(General.sub(originParam, targetParam))
            ) {
                const path = geoOps[mover.type].parameterPath || defaultParameterPath;
                // the path as a function of its (real) curve parameter, at
                // 1 + side * eps (computed inside the evaluation, where
                // arithmetic on infinitesimals is available)
                const at =
                    (side: number): Perturb =>
                    (el) => {
                        if (el !== mover) return null;
                        const tc = CSNumber.add(CSNumber.real(1), CSNumber.realmult(side, eps));
                        return path(mover, undefined, tc, originParam, targetParam);
                    };
                const before = evaluate(order, todo, at(-1), bad, frozen);
                const after = evaluate(order, todo, at(+1), bad, frozen);
                for (const el of todo) {
                    const a = before.fields.get(el);
                    const b = after.fields.get(el);
                    // defined on both sides: continuous or not; otherwise the path
                    // does not decide and the extended continuation below may
                    if (a && b) {
                        const state = before.states.get(el);
                        found.set(el, agree(a, b) && state ? { fields: a, state } : null);
                    }
                }
            }

            // Extended C0-continuation for the rest: first with the given inputs
            // fixed, then, for what that leaves open, perturbing everything. A
            // fixed input is a limit for its ancestors' current configuration, so
            // those are not perturbed either - otherwise the evaluation would mix
            // two configurations, and could agree on a wrong value.
            for (const fixed of [frozen, new Set<GeoElement>()]) {
                const held = new Set(ancestorClosure([...fixed], new Set()));
                // decided: both sides of the path defined (continuous or not), or
                // an extended continuation found
                const rest = todo.filter((el) => !found.has(el));
                if (rest.length === 0) break;
                const restOrder = ancestorClosure(rest, fixed);
                const samples: Evaluation[] = [];
                for (let k = 0; k < SAMPLES; k++) {
                    const perturb: Perturb = function (el, param) {
                        const p = perturbations[el.type];
                        return p && !el.pinned && !held.has(el) ? p(el, param, eps, randomSource(el.name, k)) : null;
                    };
                    samples.push(evaluate(restOrder, rest, perturb, bad, fixed));
                }
                for (const el of rest) {
                    const fs = samples.map((s) => s.fields.get(el));
                    const state = samples[0].states.get(el);
                    const first = fs[0];
                    if (state && first && fs.every((f) => f && agree(first, f)))
                        found.set(el, { fields: first, state });
                }
            }
            for (const el of todo) {
                const r = found.get(el);
                const res: Result = { key: keys.get(el) || "", fields: r ? r.fields : null, state: r ? r.state : null };
                results.set(el.name, res);
                apply(el, res);
            }
        }
        for (const el of csgeo.gslp as GeoElement[]) if (inScope.has(el)) isShowing(el, geoOps[el.type]);
    }

    function run(scope: GeoElement[], mover: GeoElement | null, originParam: Value | null, targetParam: Value | null) {
        if (!enabled()) return;
        try {
            resolve(scope, mover, originParam, targetParam);
        } catch (e) {
            if (!warned) {
                warned = true;
                console.warn("CindyJS nsa: resolution failed", e);
            }
        }
    }

    nsaHooks.afterMove = function (mover: GeoElement, originParam: Value, targetParam: Value, deps: GeoElement[]) {
        run(deps, mover, originParam, targetParam);
    };
    nsaHooks.afterRecalc = function () {
        run(csgeo.gslp, null, null, null);
    };
    nsaHooks.afterLoad = function () {
        run(csgeo.gslp, null, null, null);
    };
})();
