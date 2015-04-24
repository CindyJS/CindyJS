function tracing2(n1, n2) {
    var security = 3;

    var o1 = getStateComplexVector(3);
    var o2 = getStateComplexVector(3);

    if (tracingInitial) {
        putStateComplexVector(n1);
        putStateComplexVector(n2);
        return List.turnIntoCSList([n1, n2]);
    }

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
    putStateComplexVector(res[0]);
    putStateComplexVector(res[1]);

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
    } else if (do1o2 > cost * security && dn1n2 > cost * security) {
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
    return List.turnIntoCSList(res);
}
tracing2.stateSize = 12; // two three-element complex vectors

function tracing2X(n1, n2, c1, c2, el) {
    var OK = 0;
    var DECREASE_STEP = 1;
    var INVALID = 2;
    var tooClose = el.tooClose || OK;
    var security = 3;

    var do1n1 = List.projectiveDistMinScal(c1, n1);
    var do1n2 = List.projectiveDistMinScal(c1, n2);
    var do2n1 = List.projectiveDistMinScal(c2, n1);
    var do2n2 = List.projectiveDistMinScal(c2, n2);
    var do1o2 = List.projectiveDistMinScal(c1, c2);
    var dn1n2 = List.projectiveDistMinScal(n1, n2);

    //Das Kommt jetzt eins zu eins aus Cindy

    var care = (do1o2 > 0.000001);

    // First we try to assign the points

    if (do1o2 / security > do1n1 + do2n2 && dn1n2 / security > do1n1 + do2n2) {
        el.results = List.turnIntoCSList([n1, n2]); //Das ist "sort Output"
        return OK + tooClose;
    }

    if (do1o2 / security > do1n2 + do2n1 && dn1n2 / security > do1n2 + do2n1) {
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

function tracingSesq(oldVecs, newVecs) {
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
    var oldNorms = new Array(n);
    var newNorms = new Array(n);
    var cost = new Array(n);
    var i, j;
    for (i = 0; i < n; ++i) {
        oldNorms[i] = List.normSquared(oldVecs[i]).value.real;
        newNorms[i] = List.normSquared(newVecs[i]).value.real;
        cost[i] = new Array(n);
    }
    for (i = 0; i < n; ++i) {
        for (j = 0; j < n; ++j) {
            var p = List.sesquilinearproduct(oldVecs[i], newVecs[j]).value;
            var w = (p.real * p.real + p.imag * p.imag) /
                (oldNorms[i] * newNorms[j]);
            cost[i][j] = -w;
        }
    }
    var m = minCostMatching(cost);
    //console.log(m.join(", ") + ": " +
    //            cost.map(function(r){return r.join(", ")}).join("; "));

    // TODO: signal wheter this decision is reliable
    return m;
}
