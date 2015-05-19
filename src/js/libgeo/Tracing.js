/* Thoughts about state handling.
 * - trace has to start from stateLastGood
 * - each trace step reads from stateIn and writes to stateOut
 * - if refinement is requested, we have to keep stateIn
 * - if a step is concluded (succeeded or failed, no refinement),
 *   then we want to use stateOut as the next stateIn
 *   and the intermediate parameter as the next start parameter
 * - after a whole trace run, if no step failed, stateOut
 *   becomes stateLastGood since everything is good
 * - on mouseup or after recalc, our stateOut becomes stateLastGood
 * - stateIn and stateLastGood sometimes refer to the same object
 * - we need at least three states and four variables for all of this
 * - we try to avoid copying data between arrays, and swap arrays instead
 */

/* Details on state handling:
 * Between traces, we have two possible situations.
 *
 * A) The current state is good.
 *    In this case, stateIn and stateLastGood point to the same array,
 *    representing the current state. stateOut and stateSpare point to
 *    two distinct arrays, the content of which is irrelevant.
 *
 * B) The current state is bad.
 *    In this case, stateIn points to the current state, and stateLastGood
 *    points to the last state which has been considered good. stateOut
 *    points to a third array with irrelevant content. stateSpare is null.
 *
 * There are a number of transition functions to switch between these
 * situations. These are called AFTER a tracing or recalc run, so that
 * things are already prepared for the next run in the way described
 * above.
 */

var stateIn, stateOut, stateLastGood, stateSpare;

/**
 * stateOut is a good state, make it the last good state as well as
 * the next stateIn. Ensure we don't loose any buffers.
 */
function stateSwapGood() {
    var resultState = stateOut;
    stateOut = stateIn;
    stateSpare = stateSpare || stateLastGood;
    stateLastGood = stateIn = resultState;
}

/**
 * stateOut is a bad (failed or incomplete) state, make it the next stateIn but
 * keep the current stateLastGood. Ensure we don't loose any buffers.
 */
function stateSwapBad() {
    var resultState = stateOut;
    stateOut = stateSpare || stateIn;
    stateSpare = null;
    stateIn = resultState;
}

/**
 * Current state (i.e. stateIn) is now deemed good, even in case it
 * wasn't considered good before. Make it the stateLastGood. If we
 * were in a good situation, there is nothing to do.
 */
function stateContinueFromHere() {
    if (!stateSpare) {
        stateSpare = stateLastGood;
        stateLastGood = stateIn;
        tracingStateReport(false);
    }

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

/**
 * Current state is now deemed good, and copied to all the state
 * buffers.  This is important in case the mover changes, since
 * otherwise the result from the current move might get lost again.
 */
function stateSync() {
    stateContinueFromHere();
    stateOut.set(stateLastGood);
    stateSpare.set(stateLastGood);
}

/**
 * Make stateIn point to the last good state.
 * If it already does, there is nothing to do.
 */
function stateRevertToGood() {
    if (!stateSpare) {
        stateSpare = stateIn;
        stateIn = stateLastGood;
    }
}

var stateInIdx, stateOutIdx;

var tracingInitial, tracingFailed, noMoreRefinements;

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


function trace() {
    var traceLimit = 100;
    var traceSteps = 0;
    var mover = move.mover;
    var deps = getGeoDependants(mover);
    var last = -1;
    var step = 0.9; // two steps with the *1.25 scaling used below
    var i, el, op;
    var opMover = geoOps[mover.type];
    var parameterPath = opMover.parameterPath || defaultParameterPath;
    stateRevertToGood();
    var lastGoodParam = move.lastGoodParam;
    var targetParam = opMover.computeParametersOnInput(mover, lastGoodParam);
    var t = last + step;
    tracingFailed = false;
    while (last !== t) {
        traceSteps++;
        if (traceLog) {
            traceLogRow = [];
            traceLog.push(traceLogRow);
            if ((last === -1 && t > -0.11) || (t === 1 && last < -0.09)) {
                traceLogRow[0] = niceprint(lastGoodParam);
                traceLogRow[1] = niceprint(targetParam);
            } else {
                traceLogRow[0] = "";
                traceLogRow[1] = "";
            }
            traceLogRow[2] = last;
            traceLogRow[3] = t;
        }
        // Rational parametrization of semicircle,
        // see http://jsperf.com/half-circle-parametrization
        var t2 = t * t;
        var dt = 0.5 / (1 + t2);
        var tc = CSNumber.complex((2 * t) * dt + 0.5, (1 - t2) * dt);
        if(traceLimit < traceSteps) console.log("tracelimit reached");
        noMoreRefinements = (traceSteps > traceLimit || last + 0.5 * step <= last);
        try {
            stateInIdx = stateOutIdx = mover.stateIdx;
            mover.param =
                parameterPath(mover, t, tc, lastGoodParam, targetParam);
            if (traceLog) traceLogRow[4] = niceprint(mover.param);
            opMover.updatePosition(mover);
            for (i = 0; i < deps.length; ++i) {
                el = deps[i];
                op = geoOps[el.type];
                stateInIdx = stateOutIdx = el.stateIdx;
                if (op.computeParameters)
                    el.param = op.computeParameters(el);
                op.updatePosition(el);
            }
            last = t; // successfully traced up to t
            step *= 1.25;
            t += step;
            if (t >= 1) t = 1;
            stateSwapBad(); // may become good if we complete without failing
        } catch (e) {
            if (e !== RefineException)
                throw e;
            if(traceLimit*0.75 > traceSteps)
            step *= 0.5; // reduce step size
            else{
                console.log("incresing stepsize due trace limit");
                step*=2;
            }
            t = last + step;
            /*
            if (traceLimit === 0) {
                tracingFailed = true;
                break;
            }
            --traceLimit;
            */
        }
    }
    if (!tracingFailed) {
        move.lastGoodParam = targetParam;
        stateContinueFromHere();
    }
    tracingStateReport(tracingFailed);
    for (i = 0; i < deps.length; ++i) {
        el = deps[i];
        op = geoOps[el.type];
        isShowing(el, op);
    }
}

function tracingStateReport(failed) {
    var arg = instanceInvocationArguments.tracingStateReport;
    if (typeof arg === "string") {
        document.getElementById(arg).textContent =
            failed ? "BAD" : "GOOD";
    }
}

var traceLog = null;
var traceLogRow = [];

if (instanceInvocationArguments.enableTraceLog) {
    traceLog = [traceLogRow];
    globalInstance.formatTraceLog = formatTraceLog;
}

function formatTraceLog(save) {
    var tbody = '<tbody>' + traceLog.map(function(row) {
        var action = row[row.length - 1];
        var cls;
        if (/^Normal/.test(action))
            cls = "normal";
        else if (/refine.?$/.test(action))
            cls = "refine";
        else
            cls = "other";
        if (row[0] !== "")
            cls = "initial " + cls;
        else
            cls = "refined " + cls;
        return '<tr class="' + cls + '">' + row.map(function(cell) {
            return '<td>' + cell + '</td>';
        }).join('') + '</tr>\n';
    }).join('') + '</tbody>';
    var cols = [
        'lastGoodParam', 'targetParam', 'last', 't', 'param',
        'do1n1', 'do1n2', 'do2n1', 'do2n2', 'do1o2', 'dn1n2', 'cost',
        'n1', 'n2', 'o1', 'o2', 'case'
    ];
    var thead = '<thead>' + cols.map(function(cell) {
        return '<th>' + cell + '</th>';
    }).join('') + '</thead>';
    var table1 = '<table id="t1">' + thead + tbody + '</table>';
    var css = [
        'html, body { margin: 0px; padding: 0px; }',
        'td { white-space: nowrap; border: 1px solid black; }',
        'table { border-collapse: collapse; margin: 0px; }',
        'thead th { background: #fff; }',
        'tr.initial.normal td { background: #0ff; }',
        'tr.refined.normal td { background: #0f0; }',
        'tr.initial.refine td { background: #f0f; }',
        'tr.refined.refine td { background: #ff0; }',
        'tr.other td { background: #f00; }',
    ].join('\n');
    var html = '<html><head><title>Tracing report</title>' +
        '<style type="text/css">' + css + '</style></head><body>' +
        table1 + '</body></html>';
    var type = save ? 'application/octet-stream' : 'text/html';
    var blob = new Blob([html], {
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
    var tlc = 5;
    if (traceLog) {
        traceLogRow[tlc++] = do1n1;
        traceLogRow[tlc++] = do1n2;
        traceLogRow[tlc++] = do2n1;
        traceLogRow[tlc++] = do2n2;
        traceLogRow[tlc++] = do1o2;
        traceLogRow[tlc++] = dn1n2;
        traceLogRow[tlc++] = cost;
        traceLogRow[tlc++] = niceprint(res[0]);
        traceLogRow[tlc++] = niceprint(res[1]);
        traceLogRow[tlc++] = niceprint(o1);
        traceLogRow[tlc++] = niceprint(o2);
        debug = function(msg) {
            traceLogRow[tlc++] = msg;
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
    //var debug = function() {};
    var debug = console.log.bind(console);
    var safety = 2;

    var old_el = [o1, o2, o3, o4];
    var new_el = [n1, n2, n3, n4];

    // first we leave everything to input
    var res = [n1, n2, n3, n4];

    if (tracingInitial)
        return res;

    var dist_old_new = new Array(4); // this will hold old to new points matching distance o1n1, o2n3 ... after matching

    // reorder elements -- could be easily generelized
    var dist, min_dist = Infinity,
        idx, tmp;
    var dsum = 0; // record total costs
    for (var ii = 0; ii < 4; ii++) {
            idx = ii;
        for (var kk = ii; kk < 4; kk++) {
            dist = List.projectiveDistMinScal(old_el[ii], res[kk]);
            if (dist < min_dist) {
                idx = kk;
                min_dist = dist;
            }

        }
        // swap elements if necessary
        if (idx !== ii) {
            tmp = res[ii];
            res[ii] = res[idx];
            res[idx] = tmp;
        }
        dsum += min_dist;
        dist_old_new[ii] = min_dist;
        min_dist = Infinity;
    }

    //console.log("res", res, old_el);
    //debugger;

    // assume now we have machting between res and old_el
    var odist, ndist, diff, match_cost;
    var need_refine = false;
    for (var ii = 0; ii < 4; ii++) {
        if (List._helper.isNaN(new_el[ii])) {
            // Something went very wrong, numerically speaking. We have no
            // clue whether refining will make things any better, so we
            // assume it won't and give up.
            debug("Tracing failed due to NaNs.");
            tracingFailed = true;
            break;
        }
        for (var jj = ii+1; jj < 4; jj++) {
            if(tracingFailed) break;
            match_cost = dist_old_new[ii];
            if((List.projectiveDistMinScal(old_el[ii], res[ii])- dist_old_new[ii])!== 0)
            console.log("projectiveDistMinScal", List.projectiveDistMinScal(old_el[ii], res[ii])- dist_old_new[ii]);
            //match_cost = dsum;
            match_cost *= safety;

            odist = List.projectiveDistMinScal(old_el[ii], old_el[jj]); // this is do1o2...
            ndist = List.projectiveDistMinScal(res[ii], res[jj]); // this is dn1n2...

            if (odist > match_cost && ndist > match_cost) {
                // Distance within matching considerably smaller than distance
                // across matching, so we could probably match correctly.
            } else if (ndist < 1e-5) {
                // New points too close: we presumably are inside a singularity.
                if (odist < 1e-5) { // Cinderella uses the constant 1e-6 here
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
            } else if (odist < 1e-5) { // Cinderella uses the constant 1e-6 here
                // We just moved out of a singularity. Things can only get
                // better. If the singular situation was "good", we stay
                // "good", and keep track of things from now on.
                debug("Moved out of singularity.");
            } else {
                    //console.log(odist, ndist, match_cost);
                //console.log(odist, ndist, match_cost);
                // Neither old nor new position looks singular, so there was
                // an avoidable singularity along the way. Refine to avoid it.
                if (noMoreRefinements){
                    debug("Reached refinement limit, giving up.");
                }
                else {
                    debug("Need to refine.");
                    need_refine = true;
                }
            }
        }
    }

    if (need_refine && !noMoreRefinements)
        { 
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
        for (i = 0; i < n; ++i)
            putStateComplexVector(newVecs[i]);
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
