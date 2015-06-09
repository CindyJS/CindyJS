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

// return n'th unitvector in C^d
List._helper.unitvector = function(d,n){
    var res = List.zerovector(d);
    res.value[Math.floor(n.value.real-1)] = CSNumber.real(1);
    return res;
};

List.idMatrix = function(n){
    var erg = List.zeromatrix(n,n);
    var one = CSNumber.real(1);
    for(var i = 0; i < n.value.real; i++) erg.value[i].value[i] = one;
    return erg;
};


List._helper.flippedidMatrix = function(n){
    var erg = List.zeromatrix(n,n);
    var one = CSNumber.real(1);
    for(var i = 0; i < n.value.real; i++) erg.value[i].value[n.value.real - i - 1] = one;

    return erg;
};

List.println = function(l) {
    var erg = [];
    for (var i = 0; i < l.value.length; i++) {
        if (l.value[i].ctype === "number") {
            erg[i] = CSNumber.niceprint(l.value[i]);
        } else if (l.value[i].ctype === "list") {
            List.println(l.value[i]);
        } else return nada;
    }

    if (l.value[0].ctype === "number")
        console.log(erg);
};

List.realMatrix = function(l) {
    var len = l.length;
    var erg = new Array(len);
    for (var i = 0; i < len; i++) {
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
    var erg = CSNumber.zero;
    for (var i = 0; i < a.value.length; i++) {
        var v = a.value[i];
        if (v.ctype === "number") {
            erg = CSNumber.argmax(erg, v);
        }
        if (v.ctype === "list") {
            erg = CSNumber.argmax(erg, List.maxval(v));
        }
    }
    return erg;
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

List.transjugate = function(a){
    return List.transpose(List.conjugate(a));
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

List.sesquilinearproduct = function(a1, a2) {
    if (a1.value.length !== a2.value.length) {
        return nada;
    }
    var real = 0;
    var imag = 0;
    for (var i = 0; i < a2.value.length; i++) {
        var av1 = a1.value[i].value;
        var av2 = a2.value[i].value;
        real += av1.real * av2.real + av1.imag * av2.imag;
        imag += av1.real * av2.imag - av1.imag * av2.real;
    }
    return CSNumber.complex(real, imag);
};

List.normSquared = function(a) {
    var erg = 0;
    for (var i = 0; i < a.value.length; i++) {
        var av = a.value[i].value;
        erg += av.real * av.real + av.imag * av.imag;
    }
    return CSNumber.real(erg);
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

    var x = a.value[0];
    var y = a.value[1];
    var z = a.value[2];
    return List.turnIntoCSList([
        List.turnIntoCSList([CSNumber.zero, CSNumber.neg(z), y]),
        List.turnIntoCSList([z, CSNumber.zero, CSNumber.neg(x)]),
        List.turnIntoCSList([CSNumber.neg(y), x, CSNumber.zero])
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
    var xx = a.value[0];
    var yy = a.value[1];
    var zz = a.value[2];
    var xy = CSNumber.realmult(0.5, a.value[3]);
    var xz = CSNumber.realmult(0.5, a.value[4]);
    var yz = CSNumber.realmult(0.5, a.value[5]);
    return List.turnIntoCSList([
        List.turnIntoCSList([xx, xy, xz]),
        List.turnIntoCSList([xy, yy, yz]),
        List.turnIntoCSList([xz, yz, zz])
    ]);

};

List.det2 = function(R1, R2) {
    var tmp = CSNumber.mult(R1.value[0], R2.value[1]);
    tmp = CSNumber.sub(tmp, CSNumber.mult(R1.value[1], R2.value[0]));
    return tmp;
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


List.zerovector = function(a) {
    var len = Math.floor(a.value.real);
    var erg = new Array(len);
    for (var i = 0; i < len; i++) {
        erg[i] = 0;
    }
    return List.realVector(erg);
};


List.zeromatrix = function(a, b) {
    var len = Math.floor(a.value.real);
    var erg = new Array(len);
    for (var i = 0; i < len; i++) {
        erg[i] = List.zerovector(b);
    }
    return List.turnIntoCSList(erg);
};

List.vandermonde = function(a) {
    var len = a.value.length;
    var erg = List.zeromatrix(len, len);

    for (var i = 0; i < len; i++) {
        for (var j = 0; j < len; j++)
        erg.value[i].value[j] = CSNumber.pow(a.value[i], CSNumber.real(j - 1));
    }
    return erg;
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

List.adjoint2 = function(AA){
    var a = AA.value[0].value[0];
    var b = AA.value[0].value[1];
    var c = AA.value[1].value[0];
    var d = AA.value[1].value[1];

    var erg = new Array(2);
    erg[0] = List.turnIntoCSList([d, CSNumber.neg(b) ]);
    erg[1] = List.turnIntoCSList([CSNumber.neg(c), a]);
    erg = List.turnIntoCSList(erg);
    return erg;
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

List.inverse = function(a) {
    var len = a.value.length;
    if(len !== a.value[0].value.length){console.log("Inverse works only for square matrices"); return nada;}
    if(len === 2) return List.scaldiv(List.det(a), List.adjoint2(a));
    if(len === 3) return List.scaldiv(List.det(a), List.adjoint3(a));
    
    var LUP = List.LUdecomp(a);
    var n = a.value.length;

    var zero = CSNumber.real(0);
    var one = CSNumber.real(1);

    var ei = List.zerovector(CSNumber.real(n));
    ei.value[0] = one;

    var erg = new Array(n);
    for (var i = 0; i < n; i++) {
        erg[i] = List._helper.LUsolve(LUP, ei);
        ei.value[i] = zero;
        ei.value[i + 1] = one;
    }

    erg = List.turnIntoCSList(erg);
    erg = List.transpose(erg);
    return erg;
};


List.linearsolve = function(a, bb) {
    if (a.value.length === 2) return List.linearsolveCramer2(a, bb);
    else if (a.value.length === 3) return List.linearsolveCramer3(a, bb);
    else return List.LUsolve(a, bb);
};

List.getDiag = function(A){
    if(A.value.length !== A.value[0].value.length) return nada;
    var erg = new Array(A.value.length);
    for(var i = 0; i < A.value.length; i++) erg[i] = A.value[i].value[i];

    return List.turnIntoCSList(erg);
};


// get eigenvalues of a 2x2 matrix
List.eig2 = function(AA){ // get eigenvalues of a 2x2 matrix
        var trace = CSNumber.add(AA.value[0].value[0], AA.value[1].value[1]);
        var bdet = List.det2(AA.value[0], AA.value[1]);

        var trace2 = CSNumber.mult(trace, trace);

        var L1 = CSNumber.mult(trace, CSNumber.real(0.5));
        var L2 = L1;

        var mroot = CSNumber.sqrt(CSNumber.sub(CSNumber.div(trace2, CSNumber.real(4)), bdet));
 

        L1 = CSNumber.add(L1, mroot);
        L2 = CSNumber.sub(L2, mroot);

        return List.turnIntoCSList([L1, L2]);
};

List.eig = function(A){
    List._helper.toHessenberg(A);
    var i,j;
    var AA = A;
    var cslen = CSNumber.real(AA.value.length);
    var len = cslen.value.real;
    var zero = CSNumber.real(0);

    var QRRes = List._helper.QRIteration(AA);
    AA = QRRes[0];
    var QQ = QRRes[1];
    var UU = QRRes[2];

    //List.println(AA);

    

   // console.log("q at end");
   // List.println(QR.Q);

    // evtl QQ*
    var ZZ = General.mult(QQ, AA);

    var eigvals = List.getDiag(AA);

    //var zvec = List.zerovector(cslen);
    var ID = List.idMatrix(cslen, cslen);

    var eigenvecs = new Array(len);
        eigenvecs = List.turnIntoCSList(eigenvecs);

    // calc eigenvecs
    //
    // if we have a normal matrix QQ holds already the eigenvecs
    if(List._helper.isNormalMatrix(AA)){
        console.log("is normal matrix return QQ");
        var QQQ = List.transpose(QQ);
        for(i = 0; i < len; i++)
        eigenvecs.value[i] = QQQ.value[i];
    }
    else{
          eigenvecs = List.turnIntoCSList(eigenvecs);
          eigenvecs.value[0] = List.column(UU,CSNumber.real(1));

          console.log("old eigvals");
          List.println(eigvals);
          // sort eigenvalues
          var dist, mindist = Infinity, idx;
          for(i = 1; i < len ; i++){
              for(j = i+1; j < len; j++){

                  dist = CSNumber.abs(CSNumber.sub(eigvals.value[i], CSNumber.conjugate(eigvals.value[j]))).value.real;
                  if(dist < mindist){
                      idx = j;
                      mindist = dist;
                  }


              }
              var tmp = eigvals.value[i];
              eigvals.value[i] = eigvals.value[idx];
              eigvals.value[idx] = tmp;
              mindist = Infinity;
          }

          
          console.log("new eigvals");
          List.println(eigvals);



          // null space below diagonal
 //         for(i = 0; i < len; i++)
 //           for(j = i+1; j < len; j++)
 //               AA.value[j].value[i] = zero;

          
              var useInverseIteration = false; // inverse iteration or nullspace method to obtain eigenvecs

              var MM,xx, nullS,qq;
              if(useInverseIteration){
                  for(qq = 1; qq < len; qq++){
                      xx = List._helper.inverseIteration(AA, eigvals.value[qq]);
                      xx = General.mult(QQ,xx);
                      eigenvecs.value[qq] = xx;
                  }
              }
              else{
                  for(qq = 0; qq < len; qq++){
//                      console.log("AAA");
//                      List.println(AA);
//                      console.log("end AAA");
                      MM =List.sub(AA, List.scalmult(eigvals.value[qq], ID));
                      nullS = List.nullSpace(MM);
                      xx = General.mult(QQ,nullS.value[0]);
                      if(List.abs(xx).value.real < 1e-6){ // couldnt find a vector in nullspace -- should not happen
                          console.log("could not find eigenvec for idx", qq);
                          xx = List._helper.inverseIteration(AA, eigvals.value[qq]);
                          xx = General.mult(QQ, xx);
 //                         List.println(xx);
//                          console.log("===");
                          eigenvecs.value[qq] = xx;
                      }
                      else eigenvecs.value[qq] = List.scaldiv(List.abs(xx), xx);
                  }

              }
    
    }

    //eigenvecs = List.transpose(eigenvecs);

//    List.println(eigvals);
//    console.log("===");
//    for(var k = 0; k < len ; k++){
//    List.println(eigenvecs.value[k]);
//    }

//    List.println(AA);
//    List.println(UU);
//   console.log("test");
   var a=(List.sub(General.mult(A,eigenvecs.value[0]), General.mult(eigvals.value[0],eigenvecs.value[0])));
   var b=(List.sub(General.mult(A,eigenvecs.value[1]), General.mult(eigvals.value[1],eigenvecs.value[1])));
   var c=(List.sub(General.mult(A,eigenvecs.value[2]), General.mult(eigvals.value[2],eigenvecs.value[2])));
 //  var d=(List.sub(General.mult(A,eigenvecs.value[3]), General.mult(eigvals.value[3],eigenvecs.value[3])));

   var aa = List.abs(a).value.real;
   var bb = List.abs(b).value.real;
   var cc = List.abs(c).value.real;
  // var dd = List.abs(d).value.real;

   //var testpassed = (aa + bb + cc + dd)/4 < 1e-6;
   var testpassed = (aa + bb + cc + 0)/3 < 1e-6;

   //console.log(testpassed, aa,bb,cc, dd);
   console.log(testpassed, aa,bb,cc);
   if(!testpassed){
    List.println(eigvals);
    console.log("===");
    for(var k = 0; k < len ; k++){
    List.println(eigenvecs.value[k]);
    }
    
    console.log("===");
    console.log("QQ");
    List.println(QQ);
    console.log("===");
    console.log("AA");
    List.println(AA);
   }
//   console.log("end test");
//   List.println(General.mult(A, List.column(UU, CSNumber.real(1))));
//   List.println(General.mult(AA.value[0].value[0], List.column(UU, CSNumber.real(1))));
//
//   List.println(General.mult(A, List.column(UU, CSNumber.real(2))));
//   List.println(General.mult(AA.value[1].value[1], List.column(UU, CSNumber.real(2))));
//
//   List.println(General.mult(A, List.column(UU, CSNumber.real(3))));
//   List.println(General.mult(AA.value[2].value[2], List.column(UU, CSNumber.real(3))));

};

List._helper.isNormalMatrix = function(A){
    return List.abs(List.sub(A, List.transjugate(A))).value.real < 1e-10;
};

List._helper.QRIteration = function(A, maxIter){
    var AA = A;
    var cslen = CSNumber.real(AA.value.length);
    var len = cslen.value.real;
    var zero = CSNumber.real(0);
    var Id = List.idMatrix(cslen, cslen);
    var UU = List.idMatrix(cslen, cslen);
    var QQ = List.idMatrix(cslen, cslen);
    var mIter = maxIter ? maxIter : 2500;

    var QR, kap, shiftId, block, L1, L2, blockeigs, ann, dist1, dist2;
    for(var i = 0; i < mIter ; i++){
        block = List._helper.getBlock(AA, [len-2, len-1], [len-2, len-1]);
        blockeigs = List.eig2(block);
        L1 = blockeigs.value[0];
        L2 = blockeigs.value[1];

        var l1n = List.abs(L1).value.real;
        var l2n = List.abs(L2).value.real;


        ann = AA.value[len-1].value[len-1];
        dist1 = CSNumber.abs(CSNumber.sub(ann, L1)).value.real;
        dist2 = CSNumber.abs(CSNumber.sub(ann, L2)).value.real;
        kap = dist1 < dist2 ? L1 : L2;


        


//        kap = ann;

        shiftId = List.scalmult(kap, Id);



        QR = List.QRdecomp(List.sub(AA, shiftId)); // shift
        AA = General.mult(QR.R, QR.Q);
        AA = List.add(AA, shiftId);
        if(i % 50 === 0 && List._helper.isAlmostDiagonal(JSON.parse(JSON.stringify(QR.Q)))) break; // break if QR.Q is almost diagonal

      QQ = General.mult(QQ,QR.Q);
      UU = General.mult(UU, QR.Q);
    }
    console.log("iterations:", i);

    return [AA,QQ, UU];

};

List._helper.isLowerTriangular= function(A){
    var leni = A.value.length;
    var lenj = A.value[0].value.length;
    for(var i =0; i < leni; i++)
        for(var j = i+1 ; j < lenj; j++){
            if(!CSNumber._helper.isAlmostZero(A.value[i].value[j])) return false;
        }

    return true;
};


List._helper.isUpperTriangular= function(A){
    return List._helper.isLowerTriangular(List.transpose(A));
};

List._helper.isAlmostId = function(AA){
    var A = AA;
    var len = A.value.length;
    var cslen = CSNumber.real(len);
    if(len !== A.value[0].value.length) return false;

    var erg = List.sub(A, List.idMatrix(cslen), cslen);
    for(var i = 0; i < len ; i++)
        for(var j = 0; j < len; j++){
            if(CSNumber.abs(erg.value[i].value[j]).value.real > 1e-16) return false;
        } 

    return true;
};

List.nullSpace = function(A){
    var len = A.value.length;
    var QR = List.QRdecomp(List.transjugate(A));

    var QQ = List.transpose(QR.Q); // transpose makes it easier to handle the vectors

    var erg = [];
    // test if is in kernel
    var vec, tmp;
    for(var i = 0; i < len; i++){
       vec = QQ.value[i];
       tmp = General.mult(A,vec); 
       if(List.abs(tmp).value.real < 1e-6) erg.push(List.scaldiv(List.abs(vec), vec));
    }

    erg = List.turnIntoCSList(erg);
    if(erg.value.length > 0) return erg;
    else return List.turnIntoCSList([List.zerovector(CSNumber.real(len))]);

};


List._helper.isAlmostDiagonal = function(AA){
    var erg = AA;
    var len = AA.value.length;
    var cslen = CSNumber.real(len);
    var zero = CSNumber.real(0);
    if(len !== AA.value[0].value.length) return false;


    for(var i = 0; i < len ; i++)
        for(var j = 0; j < len; j++){
            if(i === j) continue;
            if(CSNumber.abs(erg.value[i].value[j]).value.real > 1e-16) return false;
        } 

    return true;
};

List._helper.inverseIteration = function(A,shiftinit){
    var len = A.value.length;

    // random vector
    var xx = new Array(len);
    for(var i =0; i< len; i++)
    {xx[i] = 2*Math.random() - 0.5;}
    xx = List.realVector(xx);

    var qk = xx;
    var ID = List.idMatrix(CSNumber.real(len), CSNumber.real(len));

    var shift = shiftinit;
    shift = CSNumber.add(shift,  CSNumber.real(0.1*Math.random()-0.5)); // add rand to make get a full rank matrix
    for(var ii = 0; ii < 100 ; ii++){
        qk = List.scaldiv(List.abs(xx), xx);
        xx = List.LUsolve(List.sub(A, List.scalmult(shift, ID)), JSON.parse(JSON.stringify(qk))); // TODO Use triangular form
    }

    
    return List.scaldiv(List.abs(xx), xx);

};


List._helper.toHessenberg = function(A){
    var AA = A;
    var len = AA.value.length;
    var cslen = CSNumber.real(len-1);
    var one = CSNumber.real(1);

    var xx, uu, vv, alpha, e1, Qk, ww, erg;
    List.println(AA);
    for(var k = 1; k < len - 1; k++){
        debugger;

            //xx = List.tranList._helper.getBlock(AA, [k, len+1], [k,k]);
            xx = List.column(AA, CSNumber.real(k));
            xx.value = xx.value.splice(k);
            console.log("xx", xx);
            List.println(xx);
            alpha = List._helper.QRgetAlpha(xx, 0);
            e1 = List._helper.unitvector(CSNumber.real(len - k ), one);
            console.log("e1", e1);
            List.println(e1);
            uu = List.sub(xx, List.scalmult(alpha, e1));
            vv = List.scaldiv(List.abs(uu), uu);
            ww = CSNumber.div(List.sesquilinearproduct(xx, vv), List.sesquilinearproduct(vv, xx));
        
            Qk = List.idMatrix(cslen, cslen);
            Qk = List.sub(Qk, List.scalmult(CSNumber.add(one, ww), List._helper.transposeMult(vv, List.conjugate(vv))));
    
            // fix dimention
            Qk = List._helper.buildBlockMatrix(List.idMatrix(CSNumber.real(k), CSNumber.real(k)), Qk);

            erg = General.mult(General.mult(Qk, AA), Qk);
            console.log("erg in k", k);
            List.println(erg);


//            cslen = CSNumber.sub(cslen, one);
//            AA = List._helper.getBlock(AA,[k+1,], [k+1,]);

            //console.log("Qk*Qk T");
            //List.println(General.mult(Qk, List.transpose(Qk)));
            //console.log("Qk");
            //List.println(Qk);
            //console.log("===");
            //var tmp = General.mult(AA, Qk);
            //List.println(tmp);
            //tmp = General.mult(List.transpose(Qk),AA);
            //console.log("===");
            //tmp = General.mult(Qk,tmp);
            //List.println(tmp);
            //debugger;

    
//        xx = List._helper.getBlock(AA, [k+1, len], [k,k]);
//        if(List.abs(xx) < 1e-8) continue; // if we are hessenberg in this column continue
//        console.log("xx");
//        List.println(xx);
//        alpha = List._helper.QRgetAlpha(xx, 0);
//
//        e1 = List._helper.unitvector(CSNumber.real(len - k - 1), one);
//        console.log("e1");
//        List.println(e1);
//        console.log("xx, e1, alpha", xx, e1, alpha);
//        vv = List.add(xx, List.scalmult(alpha, e1));
//        vv = List.scaldiv(List.abs(vv), vv);
//
//        debugger;
//        Mat1 = List._helper.getBlock(AA, [k+1, len], [k, len]);
//        console.log("Mat1", Mat1);
//        List.println(Mat1);
//        Mat2 = List._helper.getBlock(AA, [k+1, len], [k, len]);
//        console.log("Mat2", Mat2);
//        List.println(Mat2);
//        Mat2 = List.transposeMult(List.conjugate(vv), Mat2);
//        Mat2 = List._helper.transposeMult(List.scalmult(CSNumber.real(2), vv), Mat2);
//        Mat1 = List.sub(Mat1, Mat2);
//        AA = List._helper.setBlock(AA, Mat1, [k+1, k]);
//        List.println(AA);
//
//        Mat1 = List._helper.getBlock(AA, [1, len], [k+1, len]);
//        Mat2 = List._helper.getBlock(AA, [1, len], [k+1, len]);
//        Mat2 = General.mult(Mat2, vv);
//        Mat2 = List.transposeMult(Mat2, List.conjugate(vv));
//        Mat2 = List.scalmult(CSNumber.real(2), Mat2);
//        Mat1 = List.sub(Mat1, Mat2);
//
//        AA = List._helper.setBlock(AA, Mat1, [1, k+1]);
//        List.println(AA);

    }

    console.log("erg");
    List.println(erg);
    debugger;
};


List.QRdecomp = function(A){
    var AA = A;
    var len = AA.value.length;
    var cslen = CSNumber.real(len);
    var one = CSNumber.real(1);

    // fetch upper triangular
    if(List._helper.isUpperTriangular(A)){
        console.log("is upper traing in QRdecomp");
        return {
            Q: List.idMatrix(cslen, cslen),
            R: A,
        };
    }



    var e1 = List._helper.unitvector(CSNumber.real(AA.value.length), one);

    var xx, alpha, uu, vv, ww, Qk;
    var QQ = List.idMatrix(cslen, cslen);

    var AAA = JSON.parse(JSON.stringify(AA));
    for(var k = 0; k < len - 1; k++){
        // get alpha
        xx = List.column(AA, one);
        alpha = List._helper.QRgetAlpha(xx, 0);
    
        // fetch zero matrix
        if(List.abs2(AA).value.real > 1e-16){
    
            // TODO THIS IS SUB PERHAPS!
            console.log("warnung sub not fixed!");
            uu = List.add(xx, List.scalmult(alpha, e1));
            vv = List.scaldiv(List.abs(uu), uu);
            ww = CSNumber.div(List.sesquilinearproduct(xx, vv), List.sesquilinearproduct(vv, xx));
        
            Qk = List.idMatrix(cslen, cslen);
            Qk = List.sub(Qk, List.scalmult(CSNumber.add(one, ww), List._helper.transposeMult(vv, List.conjugate(vv))));
    
            // fix dimention
            Qk = List._helper.buildBlockMatrix(List.idMatrix(CSNumber.real(k), CSNumber.real(k)), Qk);
    
            // update QQ
            QQ = General.mult(QQ, List.transjugate(Qk));
        }
        else{
            Qk = List.idMatrix(cslen, cslen);
        }
        
        // update AAA
        AAA = General.mult(Qk, AAA);

        // after k+2 steps we are done
        if(k+2 === len) break;

        // book keeping
        cslen = CSNumber.sub(cslen, one);
        AA = List._helper.getBlock(AAA,[k+1,], [k+1,]);
        e1.value = e1.value.splice(0, e1.value.length-1);
    }

    var R = General.mult(List.transjugate(QQ), A);
    

    return {
        Q: QQ,
        R: R,
    };

};

// build matrices of form
//      A 0
//      0 B
List._helper.buildBlockMatrix = function(A, B){
    if(A.value.length === 0) return B;
    if(B.value.length === 0) return A;

    var mA = A.value.length;
    var mB = B.value.length;
    var m = mA + mB;

    var nA = A.value[0].value.length;
    var nB = B.value[0].value.length;
    var n = nA + nB;

    var erg = List.zeromatrix(CSNumber.real(m), CSNumber.real(n));

    for(var i = 0; i < A.value.length; i++)
    for(var j = 0; j < A.value[0].value.length; j++)
        erg.value[i].value[j] = A.value[i].value[j];


    for(var ii = 0; ii < B.value.length; ii++)
    for(var jj = 0; jj < B.value[0].value.length;  jj++)
        erg.value[mA+ii].value[nA+jj] = B.value[ii].value[jj];

    return erg;
};

List._helper.getBlock = function(A, m, n){
    var AA = JSON.parse(JSON.stringify(A));
    var m0 = m[0], m1;
    var n0 = n[0], n1;


    if(m[1] === undefined) m1 = AA.value.length;
    else m1 = m[1];

    if(n[1] === undefined) n1 = AA.value[0].value.length;
    else n1 = n[1];


    //var isVec = (n1 - n0 === 0); // workaround for vectors

    // slice does not include end
    m1++; n1++;

    console.log("m0, m1, n0, n1", m0, m1, n0, n1);
    
    AA.value = AA.value.slice(m0, m1);
    for(var i = 0; i < AA.value.length ; i++) AA.value[i].value = AA.value[i].value.slice(n0, n1);

    console.log("AA", AA);
    //if(isVec) // vector workaround
    //return AA.value[0];

    return AA;
};


// return a copy of A with a Block B placed at position pos = [m, n]
List._helper.setBlock = function(A, B , pos){
    var AA = JSON.parse(JSON.stringify(A));
    var m0 = pos[0];
    var n1 = pos[1];

    var m1 = B.value.length;
    var n1 = B.value[0].value.length;

    for(var i = 0; i < m1; i++)
        for(var j = 0; j < n1; j++){
            AA.value[m0 + i].value[n0 + j] = B.value[i].value[j];
        }
    
    return AA;
};

// return u v^T Matrix
List._helper.transposeMult = function(u, v){
    if(u.value.length !== v.value.length) return nada;
    var len = u.value.length;

    var erg = new Array(len);

    for(var i = 0; i < len; i++){
        erg[i] = List.scalmult(u.value[i], v);
    }

    return List.turnIntoCSList(erg);

};

List._helper.QRgetAlpha = function(x, k) {
//    var xx = List.scaldiv(List.abs(x), x);
//    var atan = CSNumber.real(Math.atan2(xx.value[k].value.real, xx.value[k].value.imag));
//    var alpha = CSNumber.neg(List.abs(xx));
//    var expo = CSNumber.exp(CSNumber.mult(atan, CSNumber.complex(0, 1)));
//    alpha = CSNumber.mult(alpha, expo);
//    return alpha;

    // real version
    if(x.value[k].value.real < 0) return List.abs(x);
    return CSNumber.neg(List.abs(x));
};

List.LUdecomp = function(AA) {
    if(List._helper.isUpperTriangular){
        var len = AA.value.length;

        var PP =  new Array(len);
        for(var ii = 0; ii < len; ii++) PP[ii] =ii;
        return {
            LU: AA,
            P: PP,
            TransPos: 0 
        };
    }
    var A = JSON.parse(JSON.stringify(AA)); // TODO: get rid of this cloning
    var i, j, k, absAjk, Akk, Ak, Pk, Ai;
    var tpos = 0;
    var max;
    var n = A.value.length,
        n1 = n - 1;
    var P = new Array(n);
    for (k = 0; k < n; ++k) {
        Pk = k;
        Ak = A.value[k];
        max = CSNumber.abs(Ak.value[k]).value.real;
        for (j = k + 1; j < n; ++j) {
            absAjk = CSNumber.abs(A.value[j].value[k]);
            if (max < absAjk.value.real) {
                max = absAjk.value.real;
                Pk = j;
            }
        }
        P[k] = Pk;

        if (Pk !== k) {
            A.value[k] = A.value[Pk];
            A.value[Pk] = Ak;
            Ak = A.value[k];
            tpos++;
        }

        Akk = Ak.value[k];

        for (i = k + 1; i < n; ++i) {
            A.value[i].value[k] = CSNumber.div(A.value[i].value[k], Akk);
        }

        for (i = k + 1; i < n; ++i) {
            Ai = A.value[i];
            for (j = k + 1; j < n1; ++j) {
                Ai.value[j] = CSNumber.sub(Ai.value[j], CSNumber.mult(Ai.value[k], Ak.value[j]));
                ++j;
                Ai.value[j] = CSNumber.sub(Ai.value[j], CSNumber.mult(Ai.value[k], Ak.value[j]));
            }
            if (j === n1) Ai.value[j] = CSNumber.sub(Ai.value[j], CSNumber.mult(Ai.value[k], Ak.value[j]));
        }
    }

    return {
        LU: A,
        P: P,
        TransPos: tpos
    };
};

List.LUsolve = function(A, b) {
    var LUP = List.LUdecomp(A);
    return List._helper.LUsolve(LUP, b);
};

List._helper.LUsolve = function(LUP, bb) {
    var b = JSON.parse(JSON.stringify(bb)); // TODO: get rid of this cloning
    var i, j;
    var LU = LUP.LU;
    var n = LU.value.length;
    var x = JSON.parse(JSON.stringify(b));

    var P = LUP.P;
    var Pi, LUi, LUii, tmp;

    for (i = n - 1; i !== -1; --i) x.value[i] = b.value[i];
    for (i = 0; i < n; ++i) {
        Pi = P[i];
        if (P[i] !== i) {
            tmp = x.value[i];
            x.value[i] = x.value[Pi];
            x.value[Pi] = tmp;
        }

        LUi = LU.value[i];
        for (j = 0; j < i; ++j) {
            x.value[i] = CSNumber.sub(x.value[i], CSNumber.mult(x.value[j], LUi.value[j]));
        }
    }

    for (i = n - 1; i >= 0; --i) {
        LUi = LU.value[i];
        for (j = i + 1; j < n; ++j) {
            x.value[i] = CSNumber.sub(x.value[i], CSNumber.mult(x.value[j], LUi.value[j]));
        }

        x.value[i] = CSNumber.div(x.value[i], LUi.value[i]);
    }

    return x;
};

List.linearsolveCramer2 = function(A, b) {
    var A1 = List.column(A, CSNumber.real(1));
    var A2 = List.column(A, CSNumber.real(2));

    var detA = List.det2(A1, A2);
    if (CSNumber._helper.isZero(detA)) console.log("A is not regular!");

    var x1 = List.det2(b, A2);
    x1 = CSNumber.div(x1, detA);
    var x2 = List.det2(A1, b);
    x2 = CSNumber.div(x2, detA);

    var res = List.turnIntoCSList([x1, x2]);
    return res;
};

List.linearsolveCramer3 = function(A, b) {
    var A1 = List.column(A, CSNumber.real(1));
    var A2 = List.column(A, CSNumber.real(2));
    var A3 = List.column(A, CSNumber.real(3));

    var detA = List.det3(A1, A2, A3);
    if (CSNumber._helper.isZero(detA)) console.log("A is not regular!");

    var x1 = List.det3(b, A2, A3);
    var x2 = List.det3(A1, b, A3);
    var x3 = List.det3(A1, A2, b);

    var res = List.turnIntoCSList([x1, x2, x3]);
    res = List.scaldiv(detA, res);

    return res;
};

// solve general linear system A*x=b by transforming A to sym. pos. definite
List.linearsolveCGNR = function(AA, bb) {
    var transA = List.transpose(AA);
    var A = General.mult(transA, AA);
    var b = General.mult(transA, bb);

    return List.linearsolveCG(A, b);
};

// only for sym. pos. definite matrices!
List.linearsolveCG = function(A, b) {
    var r, p, alp, x, bet, Ap, rback;

    x = b;
    r = List.sub(b, General.mult(A, b));
    p = r;

    var maxIter = Math.ceil(1.2 * A.value.length);
    var count = 0;
    while (count < maxIter) {
        count++;
        Ap = General.mult(A, p);

        alp = List.scalproduct(r, r);
        rback = alp;
        alp = CSNumber.div(alp, List.scalproduct(p, Ap));

        x = List.add(x, General.mult(alp, p));
        r = List.sub(r, General.mult(alp, Ap));

        if (List.abs(r).value.real < CSNumber.eps) break;

        bet = List.scalproduct(r, r);
        bet = CSNumber.div(bet, rback);
        p = List.add(r, General.mult(bet, p));
    }
    if (count >= maxIter) console.log("CG did not converge");

    return x;
};


List.det = function(a) {
    if (a.value.length === 2) return List.det2(List.column(a, CSNumber.real(1)), List.column(a, CSNumber.real(2)));
    if (a.value.length === 3) {
        var A1 = List.column(a, CSNumber.real(1));
        var A2 = List.column(a, CSNumber.real(2));
        var A3 = List.column(a, CSNumber.real(3));
        return List.det3(A1, A2, A3);
    }

    var n = a.value.length,
        ret = CSNumber.real(1),
        i, j, k, A = JSON.parse(JSON.stringify(a)),
        Aj, Ai, alpha, temp, k1, k2, k3;
    for (j = 0; j < n - 1; j++) {
        k = j;
        for (i = j + 1; i < n; i++) {
            if (CSNumber.abs(A.value[i].value[j]).value.real > CSNumber.abs(A.value[k].value[j]).value.real) {
                k = i;
            }
        }
        if (k !== j) {
            temp = A.value[k];
            A.value[k] = A.value[j];
            A.value[j] = temp;
            ret = CSNumber.neg(ret);
        }
        Aj = A.value[j];
        for (i = j + 1; i < n; i++) {
            Ai = A.value[i];
            alpha = CSNumber.div(Ai.value[j], Aj.value[j]);
            for (k = j + 1; k < n - 1; k += 2) {
                k1 = k + 1;
                Ai.value[k] = CSNumber.sub(Ai.value[k], CSNumber.mult(Aj.value[k], alpha));
                Ai.value[k1] = CSNumber.sub(Ai.value[k1], CSNumber.mult(Aj.value[k1], alpha));
            }
            if (k !== n) {
                Ai.value[k] = CSNumber.sub(Ai.value[k], CSNumber.mult(Aj.value[k], alpha));
            }
        }
        if (CSNumber._helper.isZero(Aj.value[j])) {
            return CSNumber.real(0);
        }
        ret = CSNumber.mult(ret, Aj.value[j]);
    }
    var result = CSNumber.mult(ret, A.value[j].value[j]);
    return result;
};

List.LUdet = function(a) {
    var LUP = List.LUdecomp(a);
    var LU = LUP.LU;

    var len = LU.value.length;

    var det = LU.value[0].value[0];
    for (var i = 1; i < len; i++) det = CSNumber.mult(det, LU.value[i].value[i]);

    // take care of sign
    if (LUP.TransPos % 2 === 1) det = CSNumber.neg(det);

    return det;
};

List.inversereal = function(a) { //Das ist nur Reell und greift auf numeric zurück
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

List.linearsolvereal = function(a, bb) { //Das ist nur Reell und greift auf numeric zurück
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

List.detreal = function(a) { //Das ist nur Reell und greift auf numeric zurück
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
            return List.turnIntoCSList([
                li.value[0], li.value[1], CSNumber.real(1)
            ]);
        }
    }

    if (key === "xy") {
        if (List._helper.isNumberVecN(li, 2)) {
            return li;
        }
        if (List._helper.isNumberVecN(li, 3)) {
            return List.turnIntoCSList([
                CSNumber.div(li.value[0], li.value[2]),
                CSNumber.div(li.value[1], li.value[2])
            ]);
        }
    }

    if (key === "x") {
        if (List.isNumberVector(li)) {
            n = li.value.length;
            if (n > 0 && n !== 3) {
                return li.value[0];
            }
            if (n === 3) {
                if (li.usage === "Point") {
                    return CSNumber.div(li.value[0], li.value[2]);
                } else {
                    return li.value[0];
                }
            }
        }
    }

    if (key === "y") {
        if (List.isNumberVector(li)) {
            n = li.value.length;
            if (n > 1 && n !== 3) {
                return li.value[1];
            }
            if (n === 3) {
                if (li.usage === "Point") {
                    return CSNumber.div(li.value[1], li.value[2]);
                } else {
                    return li.value[1];
                }
            }
        }
    }

    if (key === "z") {
        if (List.isNumberVector(li)) {
            n = li.value.length;
            if (n > 2) {
                return li.value[2];
            }
        }
    }

    return nada;

};
