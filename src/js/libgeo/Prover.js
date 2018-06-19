var conjectures = [];


function guessDuplicate(el) {
    if (guessDuplicate.hasOwnProperty(el.kind))
        guessDuplicate[el.kind](el);
    else debugger;
}
guessDuplicate._helper = {};

// check if point-point or line-line p/q are duplicates
guessDuplicate._helper.duplicatePPLL = function(p, q) {
    return {
        getInvolved: function() {
            return [p, q];
        },
        toString: function() {
            var nameMap = {
                "P": "point",
                "L": "line"
            };
            return nameMap[p.kind] + " " + p.name + " is duplicate of " + q.name;
        },
        apply: markAsDuplicate(p, q),
        holds: function() {
            var dist = List.projectiveDistMinScal(p.homog, q.homog);
            return dist < CSNumber.eps;
        }
    };
};


// check if point-point or line-line p/q are duplicates
guessDuplicate._helper.duplicateCC = function(C0, C1) {
    return {
        getInvolved: function() {
            return [C0, C1];
        },
        toString: function() {
            return "Conic " + C0.name + " is duplicate of " + C1.name;
        },
        apply: markAsDuplicate(C0, C1),
        holds: function() {
            var dist = List.conicDist(C0.matrix, C1.matrix);
            return dist < CSNumber.eps;
        }
    };
};


guessDuplicate.P = function(p) {
    csgeo.points.forEach(function(q) {
        if (p === q) return;
        var conjecture = guessDuplicate._helper.duplicatePPLL(p, q);
        if (conjecture.holds()) {
            conjectures.push(conjecture);
        }
    });
};

guessDuplicate.Ps = function(ps) {
    csgeo.sets.points.forEach(function(qs) {
        if (ps === qs) return;

        var pv = ps.results.value;
        var qv = qs.results.value;

        var conjecture = guessDuplicate._helper.isSetEq(pv, qv, List.projectiveDistMinScal);
        if (conjecture.holds()) {
            conjectures.push(conjecture);
        }
    });
};

guessDuplicate.L = function(p) {
    csgeo.lines.forEach(function(q) {
        if (p === q) return;
        var conjecture = guessDuplicate._helper.duplicatePPLL(p, q);
        if (conjecture.holds()) {
            conjectures.push(conjecture);
        }
    });
};


guessDuplicate.C = function(p) {
    csgeo.conics.forEach(function(q) {
        if (p === q) return;
        var conjecture = guessDuplicate._helper.duplicateCC(p, q);
        if (conjecture.holds()) {
            conjectures.push(conjecture);
        }
    });
};

// checks if two arrays are permutations of each other 
// elements are compares using the 'cmp' using JavaScript's native number types
guessDuplicate._helper.isSetEq = function(arrA, arrB, cmp) {
    var A = arrA.slice(),
        B = arrB.slice();

    if (A.length !== B.length) return false;
    if (A.length === 0 && B.length === 0) return true;
    var Afront = A.shift();
    // find best matching index
    var idx = B.reduce(function(iMax, x, i, arr) {
        cmp(x, Afront) <
            cmp(arr[iMax], Afront) ? i : iMax, 0
    }, 0); // initial value
    if (cmp(B[idx], Afront) < CSnumber.eps) {
        B.splice(idx, 1);
        return isEq(A, B, cmp);
    } else return false;
};

function guessIncidences(el) {
    if (guessIncidences.hasOwnProperty(el.kind))
        guessIncidences[el.kind](el);
}

guessIncidences.P = function(p) {
    csgeo.lines.forEach(function(l) {
        var conjecture = incidentPL(p, l);
        if (conjecture.holds())
            conjectures.push(conjecture);
    });
    csgeo.conics.forEach(function(c) {
        var conjecture = incidentPC(p, c);
        if (conjecture.holds())
            conjectures.push(conjecture);
    });
};

guessIncidences.L = function(l) {
    csgeo.points.forEach(function(p) {
        var conjecture = incidentPL(p, l);
        if (conjecture.holds())
            conjectures.push(conjecture);
    });
};

guessIncidences.S = guessIncidences.L;

guessIncidences.C = function(c) {
    csgeo.points.forEach(function(p) {
        var conjecture = incidentPC(p, c);
        if (conjecture.holds())
            conjectures.push(conjecture);
    });
};

function applyIncidence(a, b) {
    return function() {
        a.incidences.push(b.name);
        b.incidences.push(a.name);
    };
}

// mark p as duplicate of q
function markAsDuplicate(p, q) {
    return function() {
        p.Duplicate = q;
    };
}

function incidentPL(p, l) {
    return {
        getInvolved: function() {
            return [p, l];
        },
        toString: function() {
            return "point " + p.name + " incident line " + l.name;
        },
        apply: applyIncidence(p, l),
        holds: function() {
            var pn = List.scaldiv(List.abs(p.homog), p.homog);
            var ln = List.scaldiv(List.abs(l.homog), l.homog);
            var prod = CSNumber.abs(List.scalproduct(pn, ln));
            return (prod.value.real < CSNumber.eps);
        }
    };
}

function incidentPC(p, c) {
    return {
        getInvolved: function() {
            return [p, c];
        },
        toString: function() {
            return "point " + p.name + " incident conic " + c.name;
        },
        apply: applyIncidence(p, c),
        holds: function() {
            var erg = General.mult(c.matrix, p.homog);
            erg = General.mult(p.homog, erg);
            erg = CSNumber.abs(erg);
            return (erg.value.real < CSNumber.eps);
        }
    };
}

function checkConjectures() {
    var debug = false;
    if (debug) console.log("conjectures", conjectures.length);
    if (conjectures.length === 0) return;
    //backupGeo
    stateArrays.prover.set(stateIn);

    var nummoves = 3;

    // filter free objects which are involved in conjectures
    var involved;

    var recalcInvolved = function() {
        involved = {};
        conjectures.forEach(function(con) {
            var invs = con.getInvolved();
            var incis;
            invs.forEach(function(el) {
                if (!involved[el.name]) {
                    involved[el.name] = true;
                    // also add incidences of involved objects
                    incis = findAllIncis(el, {});
                    incis.forEach(function(name) {
                        involved[name] = true;
                    });
                }
            });
        });
    };

    // recursively find all incidences to an geo object
    var findAllIncis = function(el, map) {
        el.incidences.forEach(function(iels) {
            if (!map[iels]) {
                map[iels] = true;
                findAllIncis(csgeo.csnames[iels], map);
            }
        });
        return Object.keys(map);
    };

    recalcInvolved();

    // for jshint move the function definition outside loop 
    var checkCon = function(con) {
        return con.holds();
    };

    // add defining elements 
    Object.keys(involved).forEach(function(inv) {
        var n = csgeo.csnames[inv].args;
        if (typeof(n) === 'undefined') return;
        n.forEach(function(name) {
            involved[name] = true;
        });
    });

    var emove, nconject = conjectures.length;
    for (var kk = 0; kk < nummoves; kk++) {
        for (var name in involved) {
            var el = csgeo.csnames[name];
            if (!el.pinned && geoOps[el.type].isMovable) {
                if (debug) console.log("prover: moving element", el.name);
                // get random move and move free element
                emove = geoOps[el.type].getRandomMove(el);
                movepointscr(el, emove.value, emove.type);
                // check if conjecture still holds
                conjectures = conjectures.filter(checkCon);
            }
        }
        recalcInvolved();
    }

    if (debug) {
        console.log("dropped ", nconject - conjectures.length, " conjectures");
    }


    //restoreGeo
    if (!debug) {
        stateIn.set(stateArrays.prover);
        recalcAll();
    }


    for (var i = 0; i < conjectures.length; ++i) {
        conjectures[i].apply();
    }
    conjectures = [];
    if (debug) {
        csgeo.gslp.forEach(function(el) {
            console.log(el.name, el.incidences);
        });
    }
}
