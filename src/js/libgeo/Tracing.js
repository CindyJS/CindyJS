function assert(condition, message) {
    var msg = "Assertion failed: " + message;
    if (condition) return;
    console.log(msg);
    shutdown();
    if (typeof alert !== "undefined") alert(msg);
    throw new Error(msg);
    throw msg;
}

var stateIn, stateOut, stateLastGood;

/**
 * Current state (i.e. stateIn) is now deemed good, even in case it
 * wasn't considered good before. Make it the stateLastGood. If we
 * were in a good situation, there is nothing to do.
 */
function stateContinueFromHere() {
    stateLastGood.set(stateIn);
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
    inMouseMove = true;
    tracingFailed = false;
    stateIn.set(stateLastGood); // copy stateLastGood and use it as input
    if (move && (move.prev.x !== mouse.x || move.prev.y !== mouse.y)) {
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
}

function movepointscr(mover, pos, type) {
    if (inMouseMove) {
        traceMover(mover, pos, type);
        return;
    }
    stateContinueFromHere();
    tracingFailed = false;
    traceMover(mover, pos, type);
    stateContinueFromHere();
}

/*
 * traceMover moves mover from current param to param for pos along a complex detour.
 */
function traceMover(mover, pos, type) {
    stateOut.set(stateIn); // copy in to out, for elements we don't recalc
    var traceLimit = 100; // keep UI responsive in evil situations
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
        if (traceLog) {
            traceLogRow = [];
            traceLog.push(traceLogRow);
            if ((last === -1 && t > -0.11) || (t === 1 && last < -0.09)) {
                traceLogRow[0] = niceprint(originParam);
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
        noMoreRefinements = (last + 0.5 * step <= last || traceLimit === 0);
        try {
            stateInIdx = stateOutIdx = mover.stateIdx;
            var param =
                parameterPath(mover, t, tc, originParam, targetParam);
            if (traceLog) traceLogRow[4] = niceprint(param);

            var stateTmp = stateOut;
            stateOut = stateIn;
            opMover.putParamToState(el, param);
            stateOut = stateTmp;
            stateOutIdx = mover.stateIdx;

            opMover.updatePosition(mover, true);
            assert(stateInIdx === mover.stateIdx + opMover.stateSize, "State fully consumed");
            assert(stateOutIdx === mover.stateIdx + opMover.stateSize, "State fully updated");
            for (i = 0; i < deps.length; ++i) {
                el = deps[i];
                op = geoOps[el.type];
                stateInIdx = stateOutIdx = el.stateIdx;
                op.updatePosition(el, false);
                assert(stateInIdx === el.stateIdx + op.stateSize, "State fully consumed");
                assert(stateOutIdx === el.stateIdx + op.stateSize, "State fully updated");
            }
            last = t; // successfully traced up to t
            step *= 1.25;
            t += step;
            if (t >= 1) t = 1;

            // stateTmp = stateOut; // we still have this from above
            stateOut = stateIn; // recycle old input, reuse as output
            stateIn = stateTmp; // use last output as next input
        } catch (e) {
            if (e !== RefineException)
                throw e;
            step *= 0.5; // reduce step size
            t = last + step;
            --traceLimit;
        }
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
        'originParam', 'targetParam', 'last', 't', 'param',
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
            stateInIdx += 2 * newVecs[i].value.length
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
