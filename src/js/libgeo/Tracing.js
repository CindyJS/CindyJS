function assert(condition, message) {
    var msg = "Assertion failed: " + message;
    if (condition) return;
    console.log(msg);
    shutdown();
    if (typeof alert !== "undefined") alert(msg); // jshint ignore:line
    throw new Error(msg);
}

var totalStateSize = 0;
// prover: prover is the backup for the state before we start proving, proverTmp will hold states which have been sucessfully traced
var stateArrayNames = ["in", "out", "good", "backup", "prover"];
// Initialize all state to zero-length arrays, can be reallocated later on
var stateMasterArray = new Float64Array(0);
var stateArrays = {};
stateArrayNames.forEach(function(name) {
    stateArrays[name] = stateMasterArray;
});
var stateIn = stateMasterArray;
var stateOut = stateMasterArray;
var stateLastGood = stateMasterArray;

function stateAlloc(newSize) {
    if (newSize === stateLastGood.length) return;
    var offset, i;
    var states = stateArrayNames.length;
    if (stateMasterArray.length < newSize * states) {
        // We really need to reallocate memory
        offset = newSize * 2; // include some reserve
        stateMasterArray = new Float64Array(states * offset);
    } else {
        // Master array still has room, we just need to lengthen the subarrays
        offset = (stateMasterArray.length / states) | 0;
    }
    for (i = 0; i < states; ++i) {
        stateArrays[stateArrayNames[i]] = stateMasterArray.subarray(
            i * offset, i * offset + newSize);
    }
    // No array content is deliberately preserved by the above.
    // Now we do preserve the stateLastGood.
    var oldStateLastGood = stateLastGood;
    stateIn = stateArrays.in;
    stateOut = stateArrays.out;
    stateLastGood = stateArrays.good;
    stateLastGood.set(oldStateLastGood);
}

/**
 * Current state (i.e. stateIn) is now deemed good, even in case it
 * wasn't considered good before. Make it the stateLastGood. If we
 * were in a good situation, there is nothing to do.
 */
function stateContinueFromHere() {
    stateLastGood.set(stateIn);
    tracingFailed = false;
    tracingStateReport(false);

    // Make numbers which are almost real totally real. This avoids
    // accumulating errors in the imaginary part.
    var n = stateLastGood.length;
    var abs = Math.abs;
    var epsInverse = 1e12;
    for (var i = 0; i < n; i += 2) {
        if (abs(stateLastGood[i]) > abs(stateLastGood[i + 1]) * epsInverse) {
            stateLastGood[i + 1] = 0;
        }
    }
}

var stateInIdx, stateOutIdx;

var tracingInitial, tracingFailed, noMoreRefinements;

var inMouseMove = false;

var RefineException = {
    toString: function() {
        return "RefineException";
    }
};

function requestRefinement() {
    // Call this whenever you would need exra refinement.
    // Possible outcomes: either an exception will be thrown to
    // request more refinements, or the tracingFailed flag will be set
    // and the function returns normally.
    if (noMoreRefinements) tracingFailed = true;
    else throw RefineException;
}

function defaultParameterPath(el, tr, tc, src, dst) {
    // src + t * (dst - src)
    return General.add(src, General.mult(tc, General.sub(dst, src)));
}

function traceMouseAndScripts() {
    if (traceLog) {
        traceLog.currentMouseAndScripts = [];
    }
    inMouseMove = true;
    if (move) {
        var mover = move.mover;
        var sx = mouse.x + move.offset.x;
        var sy = mouse.y + move.offset.y;
        var pos = List.realVector([sx, sy, 1]);
        traceMover(mover, pos, "mouse");
        move.prev.x = mouse.x;
        move.prev.y = mouse.y;
    }
    evaluate(cscompiled.move);
    evaluate(cscompiled.draw);
    if (!tracingFailed) {
        stateContinueFromHere();
    }
    inMouseMove = false;
    if (traceLog) {
        traceLog.fullLog.push(List.turnIntoCSList([
            List.turnIntoCSList(traceLog.currentMouseAndScripts)
        ]));
        if (traceLog.length > traceLog.logLength)
            traceLog.splice(0, traceLog.length - traceLog.logLength);
        traceLog.currentMouseAndScripts = null;
        traceLog.postMouseHooks.forEach(function(cb) {
            cb();
        });
    }
}

function movepointscr(mover, pos, type) {
    traceMover(mover, pos, type);
    if (!inMouseMove && !tracingFailed)
        stateContinueFromHere();
}

// Remember the last point which got moved.
// @todo: be careful with this variable when doing automatic proving.
var previousMover = null;

/*
 * traceMover moves mover from current param to param for pos along a complex detour.
 */
function traceMover(mover, pos, type) {
    if (traceLog && traceLog.currentMouseAndScripts) {
        traceLog.currentMover = [];
    }
    if (mover === previousMover) {
        stateIn.set(stateLastGood); // copy stateLastGood and use it as input
        tracingFailed = false;
    } else {
        previousMover = mover;
        stateContinueFromHere(); // make changes up to now permanent
    }
    stateOut.set(stateIn); // copy in to out, for elements we don't recalc
    var traceLimit = 10000; // keep UI responsive in evil situations
    var deps = getGeoDependants(mover);
    var last = -1;
    var step = 0.9; // two steps with the *1.25 scaling used below
    var i, el, op;
    var opMover = geoOps[mover.type];
    var parameterPath = opMover.parameterPath || defaultParameterPath;
    stateInIdx = mover.stateIdx;
    var originParam = opMover.getParamFromState(mover);
    stateInIdx = stateOutIdx = mover.stateIdx;
    var targetParam = opMover.getParamForInput(mover, pos, type);
    //console.log("Tracing from " + niceprint(originParam) + " to " + niceprint(targetParam));
    var t = last + step;
    while (last !== t) {
        // Rational parametrization of semicircle,
        // see http://jsperf.com/half-circle-parametrization
        var t2 = t * t;
        var dt = 0.5 / (1 + t2);
        var tc = CSNumber.complex((2 * t) * dt + 0.5, (1 - t2) * dt);
        noMoreRefinements = (last + 0.5 * step <= last || traceLimit === 0);
        if (traceLimit === 0) console.log("tracing limit Reached");
        var refining = false;

        if (traceLog && traceLog.currentMouseAndScripts) {
            traceLog.currentStep = [];
        }
        try {
            traceOneStep();
        } catch (e) {
            if (e !== RefineException)
                throw e;
            step *= 0.5; // reduce step size
            t = last + step;
            --traceLimit;
            refining = true;
        }
        if (traceLog && traceLog.currentMouseAndScripts) {
            traceLog.currentMover.push(List.turnIntoCSList([
                List.turnIntoCSList(traceLog.currentStep), // 1
                General.wrap(refining), //                    2
                General.wrap(last), //                        3
                General.wrap(t), //                           4
                General.wrap(traceLog.currentParam), //       5
            ]));
            traceLog.currentStep = null;
            traceLog.currentParam = null;
        }
    }
    tracingStateReport(tracingFailed);
    for (i = 0; i < deps.length; ++i) {
        el = deps[i];
        op = geoOps[el.type];
        isShowing(el, op);
    }
    if (traceLog && traceLog.currentMouseAndScripts) {
        traceLog.currentMouseAndScripts.push(List.turnIntoCSList([
            List.turnIntoCSList(traceLog.currentMover), //    1
            General.wrap(tracingFailed), //                   2
            General.wrap(mover.name), //                      3
            pos, //                                           4
            General.wrap(type), //                            5
            originParam, //                                   6
            targetParam, //                                   7
        ]));
        traceLog.currentMover = null;
    }

    // use own function to enable compiler optimization
    function traceOneStep() {
        stateInIdx = stateOutIdx = mover.stateIdx;
        var param =
            parameterPath(mover, t, tc, originParam, targetParam);
        if (traceLog) traceLog.currentParam = param;

        var stateTmp = stateOut;
        stateOut = stateIn;
        opMover.putParamToState(mover, param);
        stateOut = stateTmp;
        stateOutIdx = mover.stateIdx;

        if (traceLog) traceLog.currentElement = mover;
        opMover.updatePosition(mover, true);
        assert(stateInIdx === mover.stateIdx + opMover.stateSize, "State fully consumed");
        assert(stateOutIdx === mover.stateIdx + opMover.stateSize, "State fully updated");
        for (i = 0; i < deps.length; ++i) {
            el = deps[i];
            op = geoOps[el.type];
            stateInIdx = stateOutIdx = el.stateIdx;
            if (traceLog) traceLog.currentElement = el;
            op.updatePosition(el, false);
            assert(stateInIdx === el.stateIdx + op.stateSize, "State fully consumed");
            assert(stateOutIdx === el.stateIdx + op.stateSize, "State fully updated");
        }
        if (traceLog) traceLog.currentElement = null;
        last = t; // successfully traced up to t
        step *= 1.25;
        t += step;
        if (t >= 1) t = 1;

        // stateTmp = stateOut; // we still have this from above
        stateOut = stateIn; // recycle old input, reuse as output
        stateIn = stateTmp; // use last output as next input
    }
}

function recalcAll() {
    stateContinueFromHere();
    noMoreRefinements = true; // avoid exceptions requesting refinements
    var gslp = csgeo.gslp;
    for (var k = 0; k < gslp.length; k++) {
        var el = gslp[k];
        var op = geoOps[el.type];
        stateInIdx = stateOutIdx = el.stateIdx;
        op.updatePosition(el, false);
        isShowing(el, op);
    }
    var stateTmp = stateOut;
    stateOut = stateIn;
    stateIn = stateTmp;
    stateContinueFromHere();
}

function tracingStateReport(failed) {
    var arg = instanceInvocationArguments.tracingStateReport;
    if (typeof arg === "string") {
        document.getElementById(arg).textContent =
            failed ? "BAD" : "GOOD";
    }
}

var traceLog = null;

if (instanceInvocationArguments.enableTraceLog) {
    // most properties are JavaScript lists of CindyScript lists
    traceLog = {
        logLength: Infinity,
        fullLog: [],
        currentMouseAndScripts: null,
        currentMover: null,
        currentStep: null,
        currentElement: null,
        currentParam: null,
        labelTracing2: General.wrap("tracing2"),
        labelTracing4: General.wrap("tracing4"),
        labelTracingSesq: General.wrap("tracingSesq"),
        postMouseHooks: []
    };
    if (typeof instanceInvocationArguments.enableTraceLog === "number")
        traceLog.logLength = instanceInvocationArguments.enableTraceLog;
    globalInstance.getTraceLog = getTraceLog;
    globalInstance.formatTraceLog = formatTraceLog;
    globalInstance.addTraceHook =
        traceLog.postMouseHooks.push.bind(traceLog.postMouseHooks);
}

function getTraceLog() {
    return List.turnIntoCSList(traceLog.fullLog.slice());
}

function formatTraceLog(save) {
    var str = JSON.stringify(traceLog.fullLog);
    var type = save ? 'application/octet-stream' : 'application/json';
    var blob = new Blob([str], {
        'type': type
    });
    var uri = window.URL.createObjectURL(blob);
    // var uri = 'data:text/html;base64,' + window.btoa(html);
    return uri;
}

function getStateComplexNumber() {
    var i = stateInIdx;
    stateInIdx += 2;
    return CSNumber.complex(stateIn[i], stateIn[i + 1]);
}

function getStateComplexVector(n) {
    var lst = new Array(n);
    for (var i = 0; i < n; ++i)
        lst[i] = getStateComplexNumber();
    return List.turnIntoCSList(lst);
}

function putStateComplexNumber(c) {
    stateOut[stateOutIdx] = c.value.real;
    stateOut[stateOutIdx + 1] = c.value.imag;
    stateOutIdx += 2;
}

function putStateComplexVector(v) {
    for (var i = 0, n = v.value.length; i < n; ++i)
        putStateComplexNumber(v.value[i]);
}

function tracing2(n1, n2) {
    var o1 = getStateComplexVector(3);
    var o2 = getStateComplexVector(3);
    var res = tracing2core(n1, n2, o1, o2);
    putStateComplexVector(res[0]);
    putStateComplexVector(res[1]);
    return List.turnIntoCSList(res);
}

function tracing2core(n1, n2, o1, o2) {
    var safety = 3;

    if (tracingInitial)
        return [n1, n2];

    var do1n1 = List.projectiveDistMinScal(o1, n1);
    var do1n2 = List.projectiveDistMinScal(o1, n2);
    var do2n1 = List.projectiveDistMinScal(o2, n1);
    var do2n2 = List.projectiveDistMinScal(o2, n2);
    var do1o2 = List.projectiveDistMinScal(o1, o2);
    var dn1n2 = List.projectiveDistMinScal(n1, n2);
    var cost1 = do1n1 + do2n2;
    var cost2 = do1n2 + do2n1;
    var cost, res;

    // Always sort output: we don't know yet whether it's correct, but
    // it's our best bet.
    if (cost1 > cost2) {
        res = [n2, n1];
        cost = cost2;
    } else {
        res = [n1, n2];
        cost = cost1;
    }

    var debug = function() {};
    // debug = console.log.bind(console);
    if (traceLog && traceLog.currentStep) {
        var logRow = [
            traceLog.labelTracing2, //                        1
            General.wrap(traceLog.currentElement.name), //    2
            List.turnIntoCSList(res), //                      3
            List.turnIntoCSList([o1, o2]), //                 4
            List.realMatrix([ //                              5
                [do1n1, do1n2],
                [do2n1, do2n2]
            ]),
            General.wrap(cost), //                            6
            General.wrap(do1o2), //                           7
            General.wrap(dn1n2), //                           8
            nada, // will become the outcome message //       9
        ];
        traceLog.currentStep.push(List.turnIntoCSList(logRow));
        debug = function(msg) {
            if (!traceLog.hasOwnProperty(msg))
                traceLog[msg] = General.wrap(msg);
            logRow[logRow.length - 1] = traceLog[msg];
            // Evil: modify can break copy on write! But it's safe here.
        };
    }
    if (List._helper.isNaN(n1) || List._helper.isNaN(n2)) {
        // Something went very wrong, numerically speaking. We have no
        // clue whether refining will make things any better, so we
        // assume it won't and give up.
        debug("Tracing failed due to NaNs.");
        tracingFailed = true;
    } else if (do1o2 > cost * safety && dn1n2 > cost * safety) {
        // Distance within matching considerably smaller than distance
        // across matching, so we could probably match correctly.
        debug("Normal case, everything all right.");
    } else if (dn1n2 < 1e-5) {
        // New points too close: we presumably are inside a singularity.
        if (do1o2 < 1e-5) { // Cinderella uses the constant 1e-6 here
            // The last "good" position was already singular.
            // Nothing we can do about this.
            debug("Staying inside singularity.");
        } else {
            // We newly moved into the singularity. New position is
            // not "good", but refining won't help since the endpoint
            // is singular.
            debug("Moved into singularity.");
            tracingFailed = true;
        }
    } else if (do1o2 < 1e-5) { // Cinderella uses the constant 1e-6 here
        // We just moved out of a singularity. Things can only get
        // better. If the singular situation was "good", we stay
        // "good", and keep track of things from now on.
        debug("Moved out of singularity.");
    } else {
        // Neither old nor new position looks singular, so there was
        // an avoidable singularity along the way. Refine to avoid it.
        if (noMoreRefinements)
            debug("Reached refinement limit, giving up.");
        else
            debug("Need to refine.");
        requestRefinement();
    }
    return res;
}
tracing2.stateSize = 12; // two three-element complex vectors

function tracing4(n1, n2, n3, n4) {
    var o1 = getStateComplexVector(3);
    var o2 = getStateComplexVector(3);
    var o3 = getStateComplexVector(3);
    var o4 = getStateComplexVector(3);

    var res = tracing4core(n1, n2, n3, n4, o1, o2, o3, o4);

    putStateComplexVector(res[0]);
    putStateComplexVector(res[1]);
    putStateComplexVector(res[2]);
    putStateComplexVector(res[3]);
    return List.turnIntoCSList(res);
}
tracing4.stateSize = 24; // four three-element complex vectors


function tracing4core(n1, n2, n3, n4, o1, o2, o3, o4) {
    var debug = function() {};
    // var debug = console.log.bind(console);

    var useGreedy = false; // greedy or permutation?
    var safety;

    var old_el = [o1, o2, o3, o4];
    var new_el = [n1, n2, n3, n4];

    // first we leave everything to input
    if (tracingInitial)
        return new_el;

    var res, dist, i, j, distMatrix;
    var min_cost = 0;

    if (useGreedy) {
        safety = 3;
        res = new_el;
        for (i = 0; i < 4; i++) {
            var idx = i;
            var min_dist = List.projectiveDistMinScal(old_el[i], res[i]);
            for (j = i + 1; j < 4; j++) {
                dist = List.projectiveDistMinScal(old_el[i], res[j]);
                if (dist < min_dist) {
                    idx = j;
                    min_dist = dist;
                }
            }
            // swap elements
            var tmp = res[i];
            res[i] = res[idx];
            res[idx] = tmp;
            min_cost += min_dist;
        }
    } else {
        safety = 1;

        // build dist matrix
        distMatrix = new Array(4);
        for (i = 0; i < 4; i++) {
            distMatrix[i] = new Array(4);
            for (j = 0; j < 4; j++) {
                dist = List.projectiveDistMinScal(old_el[i], new_el[j]);
                distMatrix[i][j] = dist;
            }
        }

        var bestperm = minCostMatching(distMatrix);
        res = new Array(4);
        for (i = 0; i < 4; ++i) {
            res[i] = new_el[bestperm[i]];
            min_cost += distMatrix[i][bestperm[i]];
        }
    } // end use greedy

    // assume now we have machting between res and old_el
    var need_refine = false;
    var match_cost = min_cost * safety;
    var odist = Infinity;
    var ndist = Infinity;

    for (i = 0; i < 4; i++) {
        if (need_refine) break;
        if (List._helper.isNaN(new_el[i])) {
            // Something went very wrong, numerically speaking. We have no
            // clue whether refining will make things any better, so we
            // assume it won't and give up.
            debug("Tracing failed due to NaNs.");
            tracingFailed = true;
            return res;
        }
        for (j = i + 1; j < 4; j++) {
            dist = List.projectiveDistMinScal(old_el[i], old_el[j]); // do1o2...
            if (odist > dist) odist = dist;
            dist = List.projectiveDistMinScal(res[i], res[j]); // dn1n2...
            if (ndist > dist) ndist = dist;
        }
    }

    if (traceLog && traceLog.currentStep) {
        var logRow = [
            traceLog.labelTracing4, //                        1
            General.wrap(traceLog.currentElement.name), //    2
            List.turnIntoCSList(res), //                      3
            List.turnIntoCSList(old_el), //                   4
            List.realMatrix(distMatrix), //                   5
            General.wrap(min_cost), //                        6
            General.wrap(odist), //                           7
            General.wrap(ndist), //                           8
            nada, // will become the outcome message //       9
        ];
        traceLog.currentStep.push(List.turnIntoCSList(logRow));
        debug = function(msg) {
            if (!traceLog.hasOwnProperty(msg))
                traceLog[msg] = General.wrap(msg);
            logRow[logRow.length - 1] = traceLog[msg];
            // Evil: modify can break copy on write! But it's safe here.
        };
    }

    if (odist > match_cost && ndist > match_cost) {
        // Distance within matching considerably smaller than distance
        // across matching, so we could probably match correctly.
        //debug("Normal case, everything all right.");
    } else if (ndist < 1e-5) {
        // New points too close: we presumably are inside a singularity.
        if (odist < 1e-5) {
            // The last "good" position was already singular.
            // Nothing we can do about this.
            debug("Staying inside singularity.");
        } else {
            // We newly moved into the singularity. New position is
            // not "good", but refining won't help since the endpoint
            // is singular.
            debug("Moved into singularity.");
            tracingFailed = true;
        }
    } else if (odist < 1e-5) {
        // We just moved out of a singularity. Things can only get
        // better. If the singular situation was "good", we stay
        // "good", and keep track of things from now on.
        debug("Moved out of singularity.");
    } else {
        if (noMoreRefinements)
            debug("Reached refinement limit, giving up.");
        else
            debug("Need to refine.");
        requestRefinement();

    }
    return res;
}

function tracing2X(n1, n2, c1, c2, el) {
    var OK = 0;
    var DECREASE_STEP = 1;
    var INVALID = 2;
    var tooClose = el.tooClose || OK;
    var safety = 3;

    var do1n1 = List.projectiveDistMinScal(c1, n1);
    var do1n2 = List.projectiveDistMinScal(c1, n2);
    var do2n1 = List.projectiveDistMinScal(c2, n1);
    var do2n2 = List.projectiveDistMinScal(c2, n2);
    var do1o2 = List.projectiveDistMinScal(c1, c2);
    var dn1n2 = List.projectiveDistMinScal(n1, n2);

    //Das Kommt jetzt eins zu eins aus Cindy

    var care = (do1o2 > 0.000001);

    // First we try to assign the points

    if (do1o2 / safety > do1n1 + do2n2 && dn1n2 / safety > do1n1 + do2n2) {
        el.results = List.turnIntoCSList([n1, n2]); //Das ist "sort Output"
        return OK + tooClose;
    }

    if (do1o2 / safety > do1n2 + do2n1 && dn1n2 / safety > do1n2 + do2n1) {
        el.results = List.turnIntoCSList([n2, n1]); //Das ist "sort Output"
        return OK + tooClose;
    }

    //  Maybe they are too close?

    if (dn1n2 < 0.00001) {
        // They are. Do we care?
        if (care) {
            tooClose = el.tooClose = INVALID;
            el.results = List.turnIntoCSList([n1, n2]);
            return OK + tooClose;
        } else {
            el.results = List.turnIntoCSList([n1, n2]);
            return OK + tooClose;
        }
    }

    // They are far apart. We care now.
    if (!care || tooClose === INVALID) {
        el.results = List.turnIntoCSList([n1, n2]); //Das ist "sort Output"
        return OK + tooClose;
    }
    return DECREASE_STEP + tooClose;
}

function tracingSesq(newVecs) {
    /*
     * Trace an arbitrary number of solutions, with an arbitrary
     * dimension for the homogeneous solution vectors.
     *
     * Conceptually the cost function being used is the negated square
     * of the absolute value of the sesquilinearproduct between two
     * vectors normalized to unit norm. In practice, we avoid
     * normalizing the vectors, and instead divide by the squared norm
     * to avoid taking square roots.
     */

    var n = newVecs.length;
    var i, j;

    if (tracingInitial) {
        for (i = 0; i < n; ++i) {
            stateInIdx += 2 * newVecs[i].value.length;
            putStateComplexVector(newVecs[i]);
        }
        return newVecs;
    }

    var oldVecs = new Array(n);
    var oldNorms = new Array(n);
    var newNorms = new Array(n);
    var oldMinCost = 99;
    var newMinCost = 99;
    var cost = new Array(n);
    for (i = 0; i < n; ++i) {
        oldVecs[i] = getStateComplexVector(newVecs[i].value.length);
        oldNorms[i] = List.normSquared(oldVecs[i]).value.real;
        newNorms[i] = List.normSquared(newVecs[i]).value.real;
        cost[i] = new Array(n);
    }
    var p, w;
    for (i = 0; i < n; ++i) {
        for (j = 0; j < n; ++j) {
            p = List.sesquilinearproduct(oldVecs[i], newVecs[j]).value;
            w = (p.real * p.real + p.imag * p.imag) /
                (oldNorms[i] * newNorms[j]);
            cost[i][j] = 1 - w;
        }
        for (j = i + 1; j < n; ++j) {
            p = List.sesquilinearproduct(oldVecs[i], oldVecs[j]).value;
            w = (p.real * p.real + p.imag * p.imag) /
                (oldNorms[i] * oldNorms[j]);
            if (oldMinCost > 1 - w)
                oldMinCost = 1 - w;
            p = List.sesquilinearproduct(newVecs[i], newVecs[j]).value;
            w = (p.real * p.real + p.imag * p.imag) /
                (newNorms[i] * newNorms[j]);
            if (newMinCost > 1 - w)
                newMinCost = 1 - w;
        }
    }
    var m = minCostMatching(cost);
    var res = new Array(n);
    var resCost = 0;
    var anyNaN = false;
    for (i = 0; i < n; ++i) {
        resCost += cost[i][m[i]];
        var v = res[i] = newVecs[m[i]];
        putStateComplexVector(v);
        anyNaN |= List._helper.isNaN(v);
    }
    anyNaN |= isNaN(resCost);
    var safety = 3;
    var debug = function() {};
    if (traceLog && traceLog.currentStep) {
        var logRow = [
            traceLog.labelTracingSesq, //                     1
            General.wrap(traceLog.currentElement.name), //    2
            List.turnIntoCSList(res), //                      3
            List.turnIntoCSList(oldVecs), //                  4
            List.realMatrix(cost), //                         5
            General.wrap(resCost), //                         6
            General.wrap(oldMinCost), //                      7
            General.wrap(newMinCost), //                      8
            nada, // will become the outcome message //       9
        ];
        traceLog.currentStep.push(List.turnIntoCSList(logRow));
        debug = function(msg) {
            if (!traceLog.hasOwnProperty(msg))
                traceLog[msg] = General.wrap(msg);
            logRow[logRow.length - 1] = traceLog[msg];
            // Evil: modify can break copy on write! But it's safe here.
        };
    }
    if (anyNaN) {
        // Something went very wrong, numerically speaking. We have no
        // clue whether refining will make things any better, so we
        // assume it won't and give up.
        debug("Tracing failed due to NaNs.");
        tracingFailed = true;
    } else if (oldMinCost > resCost * safety && newMinCost > resCost * safety) {
        // Distance within matching considerably smaller than distance
        // across matching, so we could probably match correctly.
        debug("Normal case, everything all right.");
    } else if (newMinCost < 1e-5) {
        // New points too close: we presumably are inside a singularity.
        if (oldMinCost < 1e-5) {
            // The last "good" position was already singular.
            // Nothing we can do about this.
            debug("Staying inside singularity.");
        } else {
            // We newly moved into the singularity. New position is
            // not "good", but refining won't help since the endpoint
            // is singular.
            debug("Moved into singularity.");
            tracingFailed = true;
        }
    } else if (oldMinCost < 1e-5) {
        // We just moved out of a singularity. Things can only get
        // better. If the singular situation was "good", we stay
        // "good", and keep track of things from now on.
        debug("Moved out of singularity.");
    } else {
        // Neither old nor new position looks singular, so there was
        // an avoidable singularity along the way. Refine to avoid it.
        if (noMoreRefinements)
            debug("Reached refinement limit, giving up.");
        else
            debug("Need to refine.");
        requestRefinement();
    }
    return res;
}

function tracing2Conics(c1, c2) {
    var n1 = geoOps._helper.flattenConicMatrix(c1);
    var n2 = geoOps._helper.flattenConicMatrix(c2);
    var o1 = getStateComplexVector(6);
    var o2 = getStateComplexVector(6);
    var res = tracing2core(n1, n2, o1, o2);
    putStateComplexVector(res[0]);
    putStateComplexVector(res[1]);
    var r1 = geoOps._helper.buildConicMatrix(res[0].value);
    var r2 = geoOps._helper.buildConicMatrix(res[1].value);
    return List.turnIntoCSList([r1, r2]);
}

tracing2Conics.stateSize = 24;
