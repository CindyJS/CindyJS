//==========================================
//      Lists
//==========================================
var List = {};
List._helper = {};

List.turnIntoCSList = function(l) {
    return {
        'ctype': 'list',
        'value': l
    };
};


List.realVector = function(l) {
    var erg = [];
    for (var i = 0; i < l.length; i++) {
        erg[i] = {
            "ctype": "number",
            "value": {
                'real': l[i],
                'imag': 0
            }
        };
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};

List.realMatrix = function(l) {
    var erg = [];
    for (var i = 0; i < l.length; i++) {
        erg[i] = List.realVector(l[i]);
    }
    return List.turnIntoCSList(erg);
};

List.ex = List.realVector([1, 0, 0]);
List.ey = List.realVector([0, 1, 0]);
List.ez = List.realVector([0, 0, 1]);


List.linfty = List.realVector([0, 0, 1]);

List.ii = List.turnIntoCSList([CSNumber.complex(1, 0),
    CSNumber.complex(0, 1),
    CSNumber.complex(0, 0)
]);

List.jj = List.turnIntoCSList([CSNumber.complex(1, 0),
    CSNumber.complex(0, -1),
    CSNumber.complex(0, 0)
]);


List.fundDual = List.realMatrix([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 0]
]);
List.fund = List.realMatrix([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 1]
]);


List.sequence = function(a, b) {
    var erg = [];
    var ct = 0;
    for (var i = Math.round(a.value.real); i < Math.round(b.value.real) + 1; i++) {
        erg[ct] = {
            "ctype": "number",
            "value": {
                'real': i,
                'imag': 0
            }
        };
        ct++;
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};

List.pairs = function(a) {
    var erg = [];
    for (var i = 0; i < a.value.length - 1; i++) {
        for (var j = i + 1; j < a.value.length; j++) {
            erg.push({
                'ctype': 'list',
                'value': [a.value[i], a.value[j]]
            });
        }
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};

List.triples = function(a) {
    var erg = [];
    for (var i = 0; i < a.value.length - 2; i++) {
        for (var j = i + 1; j < a.value.length - 1; j++) {
            for (var k = j + 1; k < a.value.length; k++) {
                erg.push({
                    'ctype': 'list',
                    'value': [a.value[i], a.value[j], a.value[k]]
                });
            }
        }
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};

List.triples = function(a) {
    var erg = [];
    for (var i = 0; i < a.value.length - 2; i++) {
        for (var j = i + 1; j < a.value.length - 1; j++) {
            for (var k = j + 1; k < a.value.length; k++) {
                erg.push({
                    'ctype': 'list',
                    'value': [a.value[i], a.value[j], a.value[k]]
                });
            }
        }
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};


List.cycle = function(a) {
    var erg = [];
    for (var i = 0; i < a.value.length - 1; i++) {
        erg[i] = {
            'ctype': 'list',
            'value': [a.value[i], a.value[i + 1]]
        };
    }
    erg.push({
        'ctype': 'list',
        'value': [a.value[a.value.length - 1], a.value[0]]
    });

    return {
        'ctype': 'list',
        'value': erg
    };
};

List.consecutive = function(a) {
    var erg = [];
    for (var i = 0; i < a.value.length - 1; i++) {
        erg[i] = {
            'ctype': 'list',
            'value': [a.value[i], a.value[i + 1]]
        };
    }

    return {
        'ctype': 'list',
        'value': erg
    };
};

List.reverse = function(a) {
    var erg = [];
    for (var i = a.value.length - 1; i >= 0; i--) {
        erg.push(a.value[i]);
    }

    return {
        'ctype': 'list',
        'value': erg
    };
};


List.directproduct = function(a, b) {
    var erg = [];
    for (var i = 0; i < a.value.length; i++) {
        for (var j = 0; j < b.value.length; j++) {
            erg.push({
                'ctype': 'list',
                'value': [a.value[i], b.value[j]]
            });
        }
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};


List.concat = function(a, b) {
    var erg = [];
    for (var i = 0; i < a.value.length; i++) {
        erg.push(a.value[i]);
    }
    for (var j = 0; j < b.value.length; j++) {
        erg.push(b.value[j]);
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};


List.prepend = function(b, a) {
    var erg = [];
    erg[0] = b;

    for (var i = 0; i < a.value.length; i++) {
        erg[i + 1] = a.value[i];
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};

List.append = function(a, b) {
    var erg = [];
    for (var i = 0; i < a.value.length; i++) {
        erg[i] = a.value[i];
    }
    erg.push(b);
    return {
        'ctype': 'list',
        'value': erg
    };
};


List.contains = function(a, b) {
    var erg = [];
    var bb = false;
    for (var i = 0; i < a.value.length; i++) {
        var cc = a.value[i];
        if ((eval_helper.equals(cc, b)).value) {
            return {
                'ctype': 'boolean',
                'value': true
            };

        }
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};


List.common = function(a, b) {
    var erg = [];
    var ct = 0;
    for (var i = 0; i < a.value.length; i++) {
        var bb = false;
        var cc = a.value[i];
        for (var j = 0; j < b.value.length; j++) {
            bb = bb || (eval_helper.equals(cc, b.value[j])).value;
        }
        if (bb) {
            erg[ct] = a.value[i];
            ct++;
        }
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};

List.remove = function(a, b) {
    var erg = [];
    var ct = 0;
    for (var i = 0; i < a.value.length; i++) {
        var bb = false;
        var cc = a.value[i];
        for (var j = 0; j < b.value.length; j++) {
            bb = bb || (eval_helper.equals(cc, b.value[j])).value;
        }
        if (!bb) {
            erg[ct] = a.value[i];
            ct++;
        }
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};

List._helper.compare = function(a, b) {
    if (a.ctype === 'number' && b.ctype === 'number') {
        return a.value.real - b.value.real;
    }
    return -1;

};

List.sort1 = function(a) {
    var erg = a.value.sort(General.compare);
    return List.turnIntoCSList(erg);
};

List._helper.isEqual = function(a1, a2) {
    return List.equals(a1, a2).value;
};

List._helper.isLessThan = function(a, b) {

    var s1 = a.value.length;
    var s2 = b.value.length;
    var i = 0;

    while (!(i >= s1 || i >= s2 || !General.isEqual(a.value[i], b.value[i]))) {
        i++;
    }
    if (i === s1 && i < s2) return true;
    if (i === s2 && i < s1) return false;
    if (i === s1 && i === s2) return false;
    return General.isLessThan(a.value[i], b.value[i]);

};


List._helper.compare = function(a, b) {
    if (List._helper.isLessThan(a, b)) return -1;
    if (List._helper.isEqual(a, b)) return 0;
    return 1;
};

List.equals = function(a1, a2) {
    if (a1.value.length !== a2.value.length) {
        return {
            'ctype': 'boolean',
            'value': false
        };
    }
    var erg = true;
    for (var i = 0; i < a1.value.length; i++) {
        var av1 = a1.value[i];
        var av2 = a2.value[i];

        if (av1.ctype === 'list' && av2.ctype === 'list') {
            erg = erg && List.equals(av1, av2).value;
        } else {
            erg = erg && comp_equals([av1, av2], []).value;

        }
    }
    return {
        'ctype': 'boolean',
        'value': erg
    };
};

List.almostequals = function(a1, a2) {

    if (a1.value.length !== a2.value.length) {
        return {
            'ctype': 'boolean',
            'value': false
        };
    }
    var erg = true;
    for (var i = 0; i < a1.value.length; i++) {
        var av1 = a1.value[i];
        var av2 = a2.value[i];

        if (av1.ctype === 'list' && av2.ctype === 'list') {
            erg = erg && List.comp_almostequals(av1, av2).value;
        } else {
            erg = erg && comp_almostequals([av1, av2], []).value;

        }
    }
    return {
        'ctype': 'boolean',
        'value': erg
    };
};

List._helper.isAlmostReal = function(a1) {
    var erg = true;
    for (var i = 0; i < a1.value.length; i++) {
        var av1 = a1.value[i];

        if (av1.ctype === 'list') {
            erg = erg && List._helper.isAlmostReal(av1);
        } else {
            erg = erg && CSNumber._helper.isAlmostReal(av1);
        }
    }
    return erg;
};

List._helper.isNaN = function(a1) {
    var erg = false;
    for (var i = 0; i < a1.value.length; i++) {
        var av1 = a1.value[i];

        if (av1.ctype === 'list') {
            erg = erg || List._helper.isNaN(av1);
        } else {
            erg = erg || CSNumber._helper.isNaN(av1);
        }
    }
    return erg;
};


List.set = function(a1) {
    var erg = [];
    var ct = 0;

    var erg1 = a1.value.sort(General.compare);

    for (var i = 0; i < erg1.length; i++) {
        if (i === 0 || !(comp_equals([erg[erg.length - 1], erg1[i]], [])).value) {
            erg[ct] = erg1[i];
            ct++;

        }

    }

    return {
        'ctype': 'list',
        'value': erg
    };

};


///////////////////////////


List.maxval = function(a) { //Only for Lists or Lists of Lists that contain numbers
    //Used for Normalize max
    var erg = CSNumber.real(0);
    for (var i = 0; i < a.value.length; i++) {
        var v = a.value[i];
        if (v.ctype === "number") {
            erg = CSNumber.argmax(erg, v);
        }
        if (v.ctype === "list") {
            erg = CSNumber.argmax(erg, List.maxval(v));
        }
    }
    return CSNumber.clone(erg);
};

List.normalizeMax = function(a) {
    var s = CSNumber.inv(List.maxval(a));
    return List.scalmult(s, a);
};
List.normalizeZ = function(a) {
    var s = CSNumber.inv(a.value[2]);
    return List.scalmult(s, a);
};

List.max = function(a1, a2) {

    if (a1.value.length !== a2.value.length) {
        return nada;
    }
    var erg = [];
    for (var i = 0; i < a1.value.length; i++) {
        var av1 = a1.value[i];
        var av2 = a2.value[i];
        erg[i] = General.max(av1, av2);
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};


List.min = function(a1, a2) {

    if (a1.value.length !== a2.value.length) {
        return nada;
    }
    var erg = [];
    for (var i = 0; i < a1.value.length; i++) {
        var av1 = a1.value[i];
        var av2 = a2.value[i];
        erg[i] = General.min(av1, av2);
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};


List.scaldiv = function(a1, a2) {
    if (a1.ctype !== 'number') {
        return nada;
    }
    var erg = [];
    for (var i = 0; i < a2.value.length; i++) {
        var av2 = a2.value[i];
        if (av2.ctype === 'number') {
            erg[i] = General.div(av2, a1);
        } else if (av2.ctype === 'list') {
            erg[i] = List.scaldiv(a1, av2);
        } else {
            erg[i] = nada;
        }
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};


List.scalmult = function(a1, a2) {
    if (a1.ctype !== 'number') {
        return nada;
    }
    var erg = [];
    for (var i = 0; i < a2.value.length; i++) {
        var av2 = a2.value[i];
        if (av2.ctype === 'number') {
            erg[i] = General.mult(av2, a1);
        } else if (av2.ctype === 'list') {
            erg[i] = List.scalmult(a1, av2);
        } else {
            erg[i] = nada;
        }
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};


List.add = function(a1, a2) {

    if (a1.value.length !== a2.value.length) {
        return nada;
    }
    var erg = [];
    for (var i = 0; i < a1.value.length; i++) {
        var av1 = a1.value[i];
        var av2 = a2.value[i];
        if (av1.ctype === 'number' && av2.ctype === 'number') {
            erg[i] = General.add(av1, av2);
        } else if (av1.ctype === 'list' && av2.ctype === 'list') {
            erg[i] = List.add(av1, av2);
        } else {
            erg[i] = nada;
        }
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};


List.sub = function(a1, a2) {

    if (a1.value.length !== a2.value.length) {
        return nada;
    }
    var erg = [];
    for (var i = 0; i < a1.value.length; i++) {
        var av1 = a1.value[i];
        var av2 = a2.value[i];
        if (av1.ctype === 'number' && av2.ctype === 'number') {
            erg[i] = CSNumber.sub(av1, av2);
        } else if (av1.ctype === 'list' && av2.ctype === 'list') {
            erg[i] = List.sub(av1, av2);
        } else {
            erg[i] = nada;
        }
    }
    return {
        'ctype': 'list',
        'value': erg
    };
};


List.abs2 = function(a1) {

    var erg = 0;
    for (var i = 0; i < a1.value.length; i++) {
        var av1 = a1.value[i];
        if (av1.ctype === 'number') {
            erg += CSNumber.abs2(av1).value.real;
        } else if (av1.ctype === 'list') {
            erg += List.abs2(av1).value.real;
        } else {
            return nada;
        }
    }

    return {
        "ctype": "number",
        "value": {
            'real': erg,
            'imag': 0
        }
    };
};

List.abs = function(a1) {
    return CSNumber.sqrt(List.abs2(a1));
};


List.normalizeMaxXX = function(a) { //Assumes that list is a number Vector
    var maxv = -10000;
    var nn = CSNumber.real(1);
    for (var i = 0; i < a.value.length; i++) {
        var v = CSNumber.abs(a.value[i]);
        if (v.value.real > maxv) {
            nn = a.value[i];
            maxv = v.value.real;
        }
    }
    return List.scaldiv(nn, a);

};


List.recursive = function(a1, op) {
    var erg = [];
    for (var i = 0; i < a1.value.length; i++) {
        var av1 = evaluateAndVal(a1.value[i]); //Will man hier evaluieren
        if (av1.ctype === 'number') {
            erg[i] = CSNumber[op](av1);
        } else if (av1.ctype === 'list') {
            erg[i] = List[op](av1);
        } else {
            erg[i] = nada;
        }
    }
    return {
        'ctype': 'list',
        'value': erg
    };

};

List.re = function(a) {
    return List.recursive(a, "re");
};


List.neg = function(a) {
    return List.recursive(a, "neg");
};

List.im = function(a) {
    return List.recursive(a, "im");
};

List.conjugate = function(a) {
    return List.recursive(a, "conjugate");
};


List.round = function(a) {
    return List.recursive(a, "round");
};


List.ceil = function(a) {
    return List.recursive(a, "ceil");
};


List.floor = function(a) {
    return List.recursive(a, "floor");
};


List._helper.colNumb = function(a) {
    if (a.ctype !== 'list') {
        return -1;
    }
    var ind = -1;
    for (var i = 0; i < a.value.length; i++) {
        if ((a.value[i]).ctype !== 'list') {
            return -1;
        }
        if (i === 0) {
            ind = (a.value[i]).value.length;
        } else {
            if (ind !== (a.value[i]).value.length)
                return -1;
        }
    }
    return ind;
};

List._helper.isNumberVecN = function(a, n) {

    if (a.ctype !== 'list') {
        return false;
    }
    if (a.value.length !== n) {
        return false;
    }

    for (var i = 0; i < a.value.length; i++) {
        if ((a.value[i]).ctype !== 'number') {
            return false;
        }
    }
    return true;

};


List.isNumberVector = function(a) {
    if (a.ctype !== 'list') {
        return {
            'ctype': 'boolean',
            'value': false
        };
    }
    for (var i = 0; i < a.value.length; i++) {
        if ((a.value[i]).ctype !== 'number') {
            return {
                'ctype': 'boolean',
                'value': false
            };
        }
    }
    return {
        'ctype': 'boolean',
        'value': true
    };

};


List.isNumberVectorN = function(a, n) {
    if (a.ctype !== 'list') {
        return {
            'ctype': 'boolean',
            'value': false
        };
    }
    if (a.value)
        for (var i = 0; i < a.value.length; i++) {
            if ((a.value[i]).ctype !== 'number') {
                return {
                    'ctype': 'boolean',
                    'value': false
                };
            }
        }
    return {
        'ctype': 'boolean',
        'value': true
    };

};


List.isNumberMatrix = function(a) {
    if (List._helper.colNumb(a) === -1) {
        return {
            'ctype': 'boolean',
            'value': false
        };
    }

    for (var i = 0; i < a.value.length; i++) {
        if (!List.isNumberVector((a.value[i])).value) {
            return {
                'ctype': 'boolean',
                'value': false
            };
        }
    }
    return {
        'ctype': 'boolean',
        'value': true
    };

};


List.scalproduct = function(a1, a2) {
    if (a1.value.length !== a2.value.length) {
        return nada;
    }
    var erg = {
        'ctype': 'number',
        'value': {
            'real': 0,
            'imag': 0
        }
    };
    for (var i = 0; i < a2.value.length; i++) {
        var av1 = a1.value[i];
        var av2 = a2.value[i];
        if (av1.ctype === 'number' && av2.ctype === 'number') {
            erg = CSNumber.add(CSNumber.mult(av1, av2), erg);
        } else {
            return nada;
        }
    }

    return erg;
};

List.productMV = function(a, b) {
    if (a.value[0].value.length !== b.value.length) {
        return nada;
    }
    var li = [];
    for (var j = 0; j < a.value.length; j++) {
        var erg = {
            'ctype': 'number',
            'value': {
                'real': 0,
                'imag': 0
            }
        };
        var a1 = a.value[j];
        for (var i = 0; i < b.value.length; i++) {
            var av1 = a1.value[i];
            var av2 = b.value[i];

            if (av1.ctype === 'number' && av2.ctype === 'number') {
                erg = CSNumber.add(CSNumber.mult(av1, av2), erg);
            } else {
                return nada;
            }
        }
        li[j] = erg;
    }
    return List.turnIntoCSList(li);

};


List.productVM = function(a, b) {
    if (a.value.length !== b.value.length) {
        return nada;
    }
    var li = [];
    for (var j = 0; j < b.value[0].value.length; j++) {
        var erg = {
            'ctype': 'number',
            'value': {
                'real': 0,
                'imag': 0
            }
        };
        for (var i = 0; i < a.value.length; i++) {
            var av1 = a.value[i];
            var av2 = b.value[i].value[j];

            if (av1.ctype === 'number' && av2.ctype === 'number') {
                erg = CSNumber.add(CSNumber.mult(av1, av2), erg);
            } else {
                return nada;
            }
        }
        li[j] = erg;
    }
    return List.turnIntoCSList(li);

};

List.productMM = function(a, b) {
    if (a.value[0].value.length !== b.value.length) {
        return nada;
    }
    var li = [];
    for (var j = 0; j < a.value.length; j++) {
        var aa = a.value[j];
        var erg = List.productVM(aa, b);
        li[j] = erg;
    }
    return List.turnIntoCSList(li);
};


List.mult = function(a, b) {

    if (a.value.length === b.value.length && List.isNumberVector(a).value && List.isNumberVector(b).value) {
        return List.scalproduct(a, b);
    }

    if (List.isNumberMatrix(a).value && b.value.length === a.value[0].value.length && List.isNumberVector(b).value) {
        return List.productMV(a, b);
    }

    if (List.isNumberMatrix(b).value && a.value.length === b.value.length && List.isNumberVector(a).value) {
        return List.productVM(a, b);
    }

    if (List.isNumberMatrix(a).value && List.isNumberMatrix(b) && b.value.length === a.value[0].value.length) {
        return List.productMM(a, b);
    }

    return nada;


};

List.projectiveDistMinScal = function(a, b) {
    var sa = List.abs(a);
    var sb = List.abs(b);

    if (sa.value.real === 0 || sb.value.real === 0)
        return 0;
    var cb = List.conjugate(b);
    var p = List.scalproduct(a, cb);

    var np = CSNumber.div(p, CSNumber.abs(p));
    var na = List.scaldiv(sa, a);
    var nb = List.scaldiv(sb, b);
    na = List.scalmult(np, na);

    var d1 = List.abs(List.add(na, nb));
    var d2 = List.abs(List.sub(na, nb));
    return Math.min(d1.value.real, d2.value.real);

};

List.crossOperator = function(a) {

    var x = CSNumber.clone(a.value[0]);
    var y = CSNumber.clone(a.value[1]);
    var z = CSNumber.clone(a.value[2]);
    return List.turnIntoCSList([
        List.turnIntoCSList([CSNumber.real(0), CSNumber.neg(z), y]),
        List.turnIntoCSList([z, CSNumber.real(0), CSNumber.neg(x)]),
        List.turnIntoCSList([CSNumber.neg(y), x, CSNumber.real(0)])
    ]);

};

List.cross = function(a, b) { //Assumes that a is 3-Vector
    var x = CSNumber.sub(CSNumber.mult(a.value[1], b.value[2]), CSNumber.mult(a.value[2], b.value[1]));
    var y = CSNumber.sub(CSNumber.mult(a.value[2], b.value[0]), CSNumber.mult(a.value[0], b.value[2]));
    var z = CSNumber.sub(CSNumber.mult(a.value[0], b.value[1]), CSNumber.mult(a.value[1], b.value[0]));
    return List.turnIntoCSList([x, y, z]);
};

List.veronese = function(a) { //Assumes that a is 3-Vector
    var xx = CSNumber.mult(a.value[0], a.value[0]);
    var yy = CSNumber.mult(a.value[1], a.value[1]);
    var zz = CSNumber.mult(a.value[2], a.value[2]);
    var xy = CSNumber.mult(a.value[0], a.value[1]);
    var xz = CSNumber.mult(a.value[0], a.value[2]);
    var yz = CSNumber.mult(a.value[1], a.value[2]);
    return List.turnIntoSCList([xx, yy, zz, xy, xz, yz]);
};

List.matrixFromVeronese = function(a) { //Assumes that a is 6-Vector
    //Wie Wichtig ist hier das Clonen???
    var xx = CSNumber.clone(a.value[0]);
    var yy = CSNumber.clone(a.value[1]);
    var zz = CSNumber.clone(a.value[2]);
    var xy = CSNumber.div(a.value[3], CSNumber.real(2));
    var xz = CSNumber.div(a.value[4], CSNumber.real(2));
    var yz = CSNumber.div(a.value[5], CSNumber.real(2));
    var yx = CSNumber.clone(xy);
    var zx = CSNumber.clone(xz);
    var zy = CSNumber.clone(yz);
    return List.turnIntoCSList([
        List.turnIntoCSList([xx, xy, xz]),
        List.turnIntoCSList([yx, yy, yz]),
        List.turnIntoCSList([zx, zy, zz])
    ]);

};


List.det3 = function(p, q, r) { //Assumes that a,b,c are 3-Vectors
    //Keine Ahnung ob man das so inlinen will (hab das grad mal so übernommen)

    var re = p.value[0].value.real * q.value[1].value.real * r.value[2].value.real - p.value[0].value.imag * q.value[1].value.imag * r.value[2].value.real - p.value[0].value.imag * q.value[1].value.real * r.value[2].value.imag - p.value[0].value.real * q.value[1].value.imag * r.value[2].value.imag + p.value[2].value.real * q.value[0].value.real * r.value[1].value.real - p.value[2].value.imag * q.value[0].value.imag * r.value[1].value.real - p.value[2].value.imag * q.value[0].value.real * r.value[1].value.imag - p.value[2].value.real * q.value[0].value.imag * r.value[1].value.imag + p.value[1].value.real * q.value[2].value.real * r.value[0].value.real - p.value[1].value.imag * q.value[2].value.imag * r.value[0].value.real - p.value[1].value.imag * q.value[2].value.real * r.value[0].value.imag - p.value[1].value.real * q.value[2].value.imag * r.value[0].value.imag - p.value[0].value.real * q.value[2].value.real * r.value[1].value.real + p.value[0].value.imag * q.value[2].value.imag * r.value[1].value.real + p.value[0].value.imag * q.value[2].value.real * r.value[1].value.imag + p.value[0].value.real * q.value[2].value.imag * r.value[1].value.imag - p.value[2].value.real * q.value[1].value.real * r.value[0].value.real + p.value[2].value.imag * q.value[1].value.imag * r.value[0].value.real + p.value[2].value.imag * q.value[1].value.real * r.value[0].value.imag + p.value[2].value.real * q.value[1].value.imag * r.value[0].value.imag - p.value[1].value.real * q.value[0].value.real * r.value[2].value.real + p.value[1].value.imag * q.value[0].value.imag * r.value[2].value.real + p.value[1].value.imag * q.value[0].value.real * r.value[2].value.imag + p.value[1].value.real * q.value[0].value.imag * r.value[2].value.imag;

    var im = -p.value[0].value.imag * q.value[1].value.imag * r.value[2].value.imag + p.value[0].value.imag * q.value[1].value.real * r.value[2].value.real + p.value[0].value.real * q.value[1].value.real * r.value[2].value.imag + p.value[0].value.real * q.value[1].value.imag * r.value[2].value.real - p.value[2].value.imag * q.value[0].value.imag * r.value[1].value.imag + p.value[2].value.imag * q.value[0].value.real * r.value[1].value.real + p.value[2].value.real * q.value[0].value.real * r.value[1].value.imag + p.value[2].value.real * q.value[0].value.imag * r.value[1].value.real - p.value[1].value.imag * q.value[2].value.imag * r.value[0].value.imag + p.value[1].value.imag * q.value[2].value.real * r.value[0].value.real + p.value[1].value.real * q.value[2].value.real * r.value[0].value.imag + p.value[1].value.real * q.value[2].value.imag * r.value[0].value.real + p.value[0].value.imag * q.value[2].value.imag * r.value[1].value.imag - p.value[0].value.imag * q.value[2].value.real * r.value[1].value.real - p.value[0].value.real * q.value[2].value.real * r.value[1].value.imag - p.value[0].value.real * q.value[2].value.imag * r.value[1].value.real + p.value[2].value.imag * q.value[1].value.imag * r.value[0].value.imag - p.value[2].value.imag * q.value[1].value.real * r.value[0].value.real - p.value[2].value.real * q.value[1].value.real * r.value[0].value.imag - p.value[2].value.real * q.value[1].value.imag * r.value[0].value.real + p.value[1].value.imag * q.value[0].value.imag * r.value[2].value.imag - p.value[1].value.imag * q.value[0].value.real * r.value[2].value.real - p.value[1].value.real * q.value[0].value.real * r.value[2].value.imag - p.value[1].value.real * q.value[0].value.imag * r.value[2].value.real;


    return CSNumber.complex(re, im);
};

List.eucangle = function(a, b) {
    var tmp1 = List.cross(a, List.linfty);
    var tmp2 = List.cross(b, List.linfty);
    var ca = List.det3(List.ez, tmp1, List.ii);
    var cb = List.det3(List.ez, tmp1, List.jj);
    var cc = List.det3(List.ez, tmp2, List.ii);
    var cd = List.det3(List.ez, tmp2, List.jj);
    var dv = CSNumber.div(CSNumber.mult(ca, cd), CSNumber.mult(cc, cb));
    var ang = CSNumber.log(dv);
    ang = CSNumber.mult(ang, CSNumber.complex(0, 0.5));
    return ang;
};


List.clone = function(a) {
    var erg = [];
    for (var i = 0; i < a.value.length; i++) {
        erg[i] = eval_helper.clone(a.value[i]);
    }
    return {
        "ctype": "list",
        "value": erg,
        "usage": a.usage
    };
};


List.zerovector = function(a) {
    var erg = [];
    for (var i = 0; i < Math.floor(a.value.real); i++) {
        erg[i] = 0;
    }
    return List.realVector(erg);
};


List.zeromatrix = function(a, b) {
    var erg = [];
    for (var i = 0; i < Math.floor(a.value.real); i++) {
        erg[i] = List.zerovector(b);
    }
    return List.turnIntoCSList(erg);
};


List.transpose = function(a) {
    var erg = [];
    var n = a.value[0].value.length;
    var m = a.value.length;
    for (var i = 0; i < n; i++) {
        var li = [];
        for (var j = 0; j < m; j++) {
            li[j] = a.value[j].value[i];
        }
        erg[i] = List.turnIntoCSList(li);
    }
    return List.turnIntoCSList(erg);
};


List.column = function(a, b) {
    var erg = [];
    var n = a.value.length;
    var i = Math.floor(b.value.real - 1);
    for (var j = 0; j < n; j++) {
        erg[j] = a.value[j].value[i];
    }

    return List.turnIntoCSList(erg);
};


List.row = function(a, b) {
    var erg = [];
    var n = a.value[0].value.length;
    var i = Math.floor(b.value.real - 1);
    for (var j = 0; j < n; j++) {
        erg[j] = a.value[i].value[j];
    }

    return List.turnIntoCSList(erg);
};

List.adjoint3 = function(a) {
    var row, elt,
        r11, i11, r12, i12, r13, i13,
        r21, i21, r22, i22, r23, i23,
        r31, i31, r32, i32, r33, i33;
    row = a.value[0].value;
    elt = row[0].value;
    r11 = elt.real;
    i11 = elt.imag;
    elt = row[1].value;
    r12 = elt.real;
    i12 = elt.imag;
    elt = row[2].value;
    r13 = elt.real;
    i13 = elt.imag;
    row = a.value[1].value;
    elt = row[0].value;
    r21 = elt.real;
    i21 = elt.imag;
    elt = row[1].value;
    r22 = elt.real;
    i22 = elt.imag;
    elt = row[2].value;
    r23 = elt.real;
    i23 = elt.imag;
    row = a.value[2].value;
    elt = row[0].value;
    r31 = elt.real;
    i31 = elt.imag;
    elt = row[1].value;
    r32 = elt.real;
    i32 = elt.imag;
    elt = row[2].value;
    r33 = elt.real;
    i33 = elt.imag;
    return {
        'ctype': 'list',
        'value': [{
            'ctype': 'list',
            'value': [{
                'ctype': 'number',
                'value': {
                    'real': r22 * r33 - r23 * r32 - i22 * i33 + i23 * i32,
                    'imag': r22 * i33 - r23 * i32 - r32 * i23 + r33 * i22
                }
            }, {
                'ctype': 'number',
                'value': {
                    'real': -r12 * r33 + r13 * r32 + i12 * i33 - i13 * i32,
                    'imag': -r12 * i33 + r13 * i32 + r32 * i13 - r33 * i12
                }
            }, {
                'ctype': 'number',
                'value': {
                    'real': r12 * r23 - r13 * r22 - i12 * i23 + i13 * i22,
                    'imag': r12 * i23 - r13 * i22 - r22 * i13 + r23 * i12
                }
            }]
        }, {
            'ctype': 'list',
            'value': [{
                'ctype': 'number',
                'value': {
                    'real': -r21 * r33 + r23 * r31 + i21 * i33 - i23 * i31,
                    'imag': -r21 * i33 + r23 * i31 + r31 * i23 - r33 * i21
                }
            }, {
                'ctype': 'number',
                'value': {
                    'real': r11 * r33 - r13 * r31 - i11 * i33 + i13 * i31,
                    'imag': r11 * i33 - r13 * i31 - r31 * i13 + r33 * i11
                }
            }, {
                'ctype': 'number',
                'value': {
                    'real': -r11 * r23 + r13 * r21 + i11 * i23 - i13 * i21,
                    'imag': -r11 * i23 + r13 * i21 + r21 * i13 - r23 * i11
                }
            }]
        }, {
            'ctype': 'list',
            'value': [{
                'ctype': 'number',
                'value': {
                    'real': r21 * r32 - r22 * r31 - i21 * i32 + i22 * i31,
                    'imag': r21 * i32 - r22 * i31 - r31 * i22 + r32 * i21
                }
            }, {
                'ctype': 'number',
                'value': {
                    'real': -r11 * r32 + r12 * r31 + i11 * i32 - i12 * i31,
                    'imag': -r11 * i32 + r12 * i31 + r31 * i12 - r32 * i11
                }
            }, {
                'ctype': 'number',
                'value': {
                    'real': r11 * r22 - r12 * r21 - i11 * i22 + i12 * i21,
                    'imag': r11 * i22 - r12 * i21 - r21 * i12 + r22 * i11
                }
            }]
        }]
    };
};

List.inverse = function(a) { //Das ist nur Reell und greift auf numeric zurück
    var i, j;
    var x = [];
    var y = [];
    var n = a.value.length;
    for (i = 0; i < n; i++) {
        var lix = [];
        var liy = [];
        for (j = 0; j < n; j++) {
            lix[j] = a.value[i].value[j].value.real;
            liy[j] = a.value[i].value[j].value.imag;
        }
        x[i] = lix;
        y[i] = liy;
    }
    var z = new numeric.T(x, y);
    var res = z.inv(z);
    var erg = [];
    for (i = 0; i < n; i++) {
        var li = [];
        for (j = 0; j < n; j++) {
            li[j] = CSNumber.complex(res.x[i][j], res.y[i][j]);
        }
        erg[i] = List.turnIntoCSList(li);
    }
    return List.turnIntoCSList(erg);
};


List.linearsolve = function(a, bb) { //Das ist nur Reell und greift auf numeric zurück
    var x = [];
    var y = [];
    var b = [];

    var n = a.value.length;
    for (var i = 0; i < n; i++) {
        var lix = [];
        var liy = [];
        for (var j = 0; j < n; j++) {
            lix[j] = a.value[i].value[j].value.real;
            liy[j] = a.value[i].value[j].value.imag;
        }
        x[i] = lix;
        y[i] = liy;
        b[i] = bb.value[i].value.real;
    }
    var res = numeric.solve(x, b);

    return List.realVector(res);
};


List.det = function(a) { //Das ist nur Reell und greift auf numeric zurück
    var x = [];
    var y = [];
    var n = a.value.length;
    for (var i = 0; i < n; i++) {
        var lix = [];
        var liy = [];
        for (var j = 0; j < n; j++) {
            lix[j] = a.value[i].value[j].value.real;
            liy[j] = a.value[i].value[j].value.imag;
        }
        x[i] = lix;
        y[i] = liy;
    }
    var z = new numeric.T(x, y);
    var res = numeric.det(x);

    return CSNumber.real(res);

};


///Feldzugriff
///TODO Will man das in list haben??

List.getField = function(li, key) {
    var n;

    if (key === "homog") {
        if (List._helper.isNumberVecN(li, 3)) {
            return li;
        }
        if (List._helper.isNumberVecN(li, 2)) {
            var li2 = General.clone(li);
            li2.value[2] = CSNumber.real(1);
            return li2;
        }
        return nada;
    }

    if (key === "xy") {
        if (List._helper.isNumberVecN(li, 2)) {
            return li;
        }
        if (List._helper.isNumberVecN(li, 3)) {
            var erg = General.clone(li);
            erg.value.pop();
            return List.scaldiv(li.value[2], erg);
        }
        return nada;

    }

    if (key === "x") {
        if (List.isNumberVector(li)) {
            n = li.value.length;
            if (n > 0 && n !== 3) {
                return CSNumber.clone(li.value[0]);
            }
            if (n === 3) {
                if (li.usage === "Point") {
                    return CSNumber.div(li.value[0], li.value[2]);
                } else {
                    return CSNumber.clone(li.value[0]);
                }
            }

        }
        return nada;

    }

    if (key === "y") {
        if (List.isNumberVector(li)) {
            n = li.value.length;
            if (n > 1 && n !== 3) {
                return CSNumber.clone(li.value[1]);
            }
            if (n === 3) {
                if (li.usage === "Point") {
                    return CSNumber.div(li.value[1], li.value[2]);
                } else {
                    return CSNumber.clone(li.value[1]);
                }
            }

        }
        return nada;
    }

    if (key === "z") {
        if (List.isNumberVector(li)) {
            n = li.value.length;
            if (n > 2) {
                return CSNumber.clone(li.value[2]);
            }
        }

        return nada;
    }


    return nada;


};
