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
            if (erg.value.real < 0.0000000000001) {
                p.incidences.push(c.name);
                c.incidences.push(p.name);
            }
        }
    };
}

function checkConjectures() {
    if (conjectures.length === 0) return;
    // TODO: we need some randomized proving here:
    // move free elements and check conjectures a number of times.
    // For now assume that all conjectures could be verified.
    for (var i = 0; i < conjectures.length; ++i) {
        conjectures[i].apply();
    }
    conjectures = [];
}
