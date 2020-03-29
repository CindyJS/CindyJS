let conjectures = [];


function guessDuplicate(el) {
    if (guessDuplicate.hasOwnProperty(el.kind))
        guessDuplicate[el.kind](el);
}
guessDuplicate._helper = {};

// check if point-point or line-line p/q are duplicates
guessDuplicate._helper.duplicatePPLL = (p, q) => ({
    getInvolved() {
        return [p, q];
    },

    toString() {
        const nameMap = {
            "P": "point",
            "L": "line"
        };
        return nameMap[p.kind] + " " + p.name + " is duplicate of " + q.name;
    },

    apply: markAsDuplicate(p, q),

    holds() {
        const dist = List.projectiveDistMinScal(p.homog, q.homog);
        return dist < CSNumber.epsbig;
    }
});


// check if point/line sets are duplicates
guessDuplicate._helper.duplicatePsLs = (p, q) => ({
    getInvolved() {
        return [p, q];
    },

    toString() {
        const nameMap = {
            "Ps": "point set",
            "Ls": "line set"
        };
        return nameMap[p.kind] + " " + p.name + " is duplicate of " + q.name;
    },

    apply: markAsDuplicate(p, q),

    holds() {
        const pv = p.results.value;
        const qv = q.results.value;
        const truth = guessDuplicate._helper.isSetEq(pv, qv, List.projectiveDistMinScal);
        return truth;
    }
});


// check if two conics are duplicates
guessDuplicate._helper.duplicateCC = (C0, C1) => ({
    getInvolved() {
        return [C0, C1];
    },

    toString() {
        return "Conic " + C0.name + " is duplicate of " + C1.name;
    },

    apply: markAsDuplicate(C0, C1),

    holds() {
        const dist = List.conicDist(C0.matrix, C1.matrix);
        return dist < CSNumber.epsbig;
    }
});


// check if two sets of conics are duplicates
guessDuplicate._helper.duplicateCs = (Cs0, Cs1) => ({
    getInvolved() {
        return [Cs0, Cs1];
    },

    toString() {
        return "Conic set" + Cs0.name + " is duplicate of " + Cs1.name;
    },

    apply: markAsDuplicate(Cs0, Cs1),

    holds() {
        const res0 = Cs0.results;
        const res1 = Cs1.results;
        return guessDuplicate._helper.isSetEq(res0, res1, List.conicDist);
    }
});


// segments
guessDuplicate._helper.duplicateSS = (p, q) => ({
    getInvolved() {
        return [p, q];
    },

    toString() {
        return "Segment " + p.name + " is duplicate of " + q.name;
    },

    apply: markAsDuplicate(p, q),

    holds() {
        const p0 = p.startpos;
        const p1 = p.endpos;

        const q0 = q.startpos;
        const q1 = q.endpos;

        let dist1 = List.projectiveDistMinScal(p0, q0);
        dist1 = dist1 + List.projectiveDistMinScal(p1, q1);

        let dist2 = List.projectiveDistMinScal(p1, q0);
        dist2 = dist2 + List.projectiveDistMinScal(p0, q1);

        return Math.min(dist1, dist2) < CSNumber.epsbig;
    }
});

guessDuplicate.P = p => {
    csgeo.points.forEach(q => {
        if (p.name === q.name) return;
        const conjecture = guessDuplicate._helper.duplicatePPLL(p, q);
        if (conjecture.holds()) {
            conjectures.push(conjecture);
        }
    });
};

guessDuplicate.Ps = ps => {
    csgeo.sets.points.forEach(qs => {
        if (ps.name === qs.name) return;

        const conjecture = guessDuplicate._helper.duplicatePsLs(ps, qs);
        if (conjecture.holds()) {
            conjectures.push(conjecture);
        }
    });
};

guessDuplicate.Ls = ps => {
    csgeo.sets.lines.forEach(qs => {
        if (ps.name === qs.name) return;

        const conjecture = guessDuplicate._helper.duplicatePsLs(ps, qs);
        if (conjecture.holds()) {
            conjectures.push(conjecture);
        }
    });
};


guessDuplicate.Cs = ps => {
    csgeo.sets.conics.forEach(qs => {
        if (ps.name === qs.name) return;

        const conjecture = guessDuplicate._helper.duplicateCs(ps, qs);
        if (conjecture.holds()) {
            conjectures.push(conjecture);
        }
    });
};

guessDuplicate.L = p => {
    csgeo.lines.forEach(q => {
        if (p.name === q.name) return;
        if (p.kind !== q.kind) return; // Don't compare lines and segments

        const conjecture = guessDuplicate._helper.duplicatePPLL(p, q);
        if (conjecture.holds()) {
            conjectures.push(conjecture);
        }
    });
};

guessDuplicate.S = p => {
    csgeo.lines.forEach(q => {
        if (p.name === q.name) return;
        if (q.kind !== "S") return; // only compare segments

        const conjecture = guessDuplicate._helper.duplicateSS(p, q);
        if (conjecture.holds()) {
            conjectures.push(conjecture);
        }
    });
};


guessDuplicate.C = p => {
    csgeo.conics.forEach(q => {
        if (p.name === q.name) return;
        const conjecture = guessDuplicate._helper.duplicateCC(p, q);
        if (conjecture.holds()) {
            conjectures.push(conjecture);
        }
    });
};

// checks if two arrays are permutations of each other 
// elements are compares using the 'cmp' using JavaScript's native number types
guessDuplicate._helper.isSetEq = (arrA, arrB, cmp) => {
    const A = arrA.slice();
    const B = arrB.slice();

    if (A.length !== B.length) return false;
    if (A.length === 0 && B.length === 0) return true;
    const Afront = A.shift();
    // find best matching index
    const idx = B.reduce((iMax, x, i, arr) => cmp(x, Afront) < cmp(arr[iMax], Afront) ? i : iMax, 0); // initial value

    if (cmp(B[idx], Afront) < CSNumber.epsbig) {
        B.splice(idx, 1);
        return guessDuplicate._helper.isSetEq(A, B, cmp);
    } else return false;
};

function guessIncidences(el) {
    if (guessIncidences.hasOwnProperty(el.kind)) {
        // reset incidences
        el.incidences = [];
        guessIncidences[el.kind](el);
    }
}

guessIncidences.P = p => {
    csgeo.lines.forEach(l => {
        const conjecture = incidentPL(p, l);
        if (conjecture.holds())
            conjectures.push(conjecture);
    });
    csgeo.conics.forEach(c => {
        const conjecture = incidentPC(p, c);
        if (conjecture.holds())
            conjectures.push(conjecture);
    });
};

guessIncidences.L = l => {
    csgeo.points.forEach(p => {
        const conjecture = incidentPL(p, l);
        if (conjecture.holds())
            conjectures.push(conjecture);
    });
};

guessIncidences.S = guessIncidences.L;

guessIncidences.C = c => {
    csgeo.points.forEach(p => {
        const conjecture = incidentPC(p, c);
        if (conjecture.holds())
            conjectures.push(conjecture);
    });
};

function applyIncidence(a, b) {
    return () => {
        a.incidences.push(b.name);
        b.incidences.push(a.name);
    };
}

// mark p as duplicate of q
function markAsDuplicate(p, q) {
    return () => {
        p.Duplicate = q;
    };
}

function incidentPL(p, l) {
    return {
        getInvolved() {
            return [p, l];
        },
        toString() {
            return "point " + p.name + " incident line " + l.name;
        },
        apply: applyIncidence(p, l),
        holds() {
            const pn = List.scaldiv(List.abs(p.homog), p.homog);
            const ln = List.scaldiv(List.abs(l.homog), l.homog);
            const prod = CSNumber.abs(List.scalproduct(pn, ln));
            return (prod.value.real < CSNumber.epsbig);
        }
    };
}

function incidentPC(p, c) {
    return {
        getInvolved() {
            return [p, c];
        },
        toString() {
            return "point " + p.name + " incident conic " + c.name;
        },
        apply: applyIncidence(p, c),
        holds() {
            let erg = General.mult(c.matrix, p.homog);
            erg = General.mult(p.homog, erg);
            erg = CSNumber.abs(erg);
            return (erg.value.real < CSNumber.epsbig);
        }
    };
}

function checkConjectures() {
    const debug = false;
    if (debug) console.log("conjectures", conjectures.length);
    if (conjectures.length === 0) return;
    //backupGeo
    stateArrays.prover.set(stateIn);

    const nummoves = 3;

    // filter free objects which are involved in conjectures
    let involved;

    const recalcInvolved = () => {
        involved = {};
        conjectures.forEach(con => {
            const invs = con.getInvolved();
            let incis;
            invs.forEach(el => {
                if (!involved[el.name]) {
                    involved[el.name] = true;
                    // also add incidences of involved objects
                    incis = findAllIncis(el, {});
                    incis.forEach(name => {
                        involved[name] = true;
                    });
                }
            });
        });
    };

    // recursively find all incidences to an geo object
    var findAllIncis = (el, map) => {
        el.incidences.forEach(iels => {
            if (!map[iels]) {
                map[iels] = true;
                findAllIncis(csgeo.csnames[iels], map);
            }
        });
        return Object.keys(map);
    };

    recalcInvolved();

    // for jshint move the function definition outside loop 
    const checkCon = con => con.holds();

    // add defining elements 
    Object.keys(involved).forEach(inv => {
        const n = csgeo.csnames[inv].args;
        if (typeof(n) === 'undefined') return;
        n.forEach(name => {
            involved[name] = true;
        });
    });

    let emove;
    const nconject = conjectures.length;
    for (let kk = 0; kk < nummoves; kk++) {
        for (const name in involved) {
            const el = csgeo.csnames[name];
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


    for (let i = 0; i < conjectures.length; ++i) {
        conjectures[i].apply();
    }
    conjectures = [];
    if (debug) {
        csgeo.gslp.forEach(el => {
            console.log(el.name, el.incidences);
        });
    }
}
