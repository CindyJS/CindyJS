var conjectures = [];

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

function incidentPL(p, l) {
    return {
        toString: function() {
            return "point " + p.name + " incident line " + l.name;
        },
        apply: applyIncidence(p, l),
        holds: function() {
            var pn = List.scaldiv(List.abs(p.homog), p.homog);
            var ln = List.scaldiv(List.abs(l.homog), l.homog);
            var prod = CSNumber.abs(List.scalproduct(pn, ln));
            return (prod.value.real < 0.0000000000001);
        }
    };
}

function incidentPC(p, c) {
    return {
        toString: function() {
            return "point " + p.name + " incident conic " + c.name;
        },
        apply: applyIncidence(p, c),
        holds: function() {
            var erg = General.mult(c.matrix, p.homog);
            erg = General.mult(p.homog, erg);
            erg = CSNumber.abs(erg);
            return (erg.value.real < 0.0000000000001);
        }
    };
}

function checkConjectures() {
    var debug = true;
    if (debug) console.log("conjectures", conjectures.length);
    if (!debug)
        if (conjectures.length === 0) return;
        //    debugger;
    backupGeo();
    // TODO: we need some randomized proving here:
    // move free elements and check conjectures a number of times.
    // For now assume that all conjectures could be verified.

    var ii, jj, kk;
    var free = csgeo.free;
    var moves, el;
    var nummoves = 3;

    // debug code remove later
    var nconject = conjectures.length;
    csgeo.free.forEach(function(el) {
        jj = nummoves;
        while (jj--) {
            //if (el.kind === "C") debugger; // no conic movement currently
            if (el.pinned) {
                break;
            }
            if (debug) console.log("prover: moving element", el.name);
            moves = geoOps[el.type].getRandomMove(el);
            // moves are arrays which can have different type: homog, radius etc ...
            moves.forEach(function(newpos) {
                movepointscr(el, newpos.value, newpos.type);
            });
            // check if conjecture still holds
            conjectures = conjectures.filter(function(con) {
                return con.holds();
            });
        }
    });

    if (debug) {
        console.log("dropped ", nconject - conjectures.length, " conjectures");
    }


    restoreGeo();


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
