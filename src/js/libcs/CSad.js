import { nada } from "expose";
import { CSNumber } from "libcs/CSNumber";
import { List } from "libcs/List";
import { evaluate } from "libcs/Evaluator";

const CSad = {};

CSad.printArr = function (erg) {
    const n = erg.value.length;
    const ttemp = [];
    const ttempi = [];
    let printimag = false;
    for (let k = 0; k < n; k++) {
        ttemp[k] = erg.value[k].value.real;
        ttempi[k] = erg.value[k].value.imag;
        if (ttempi[k] !== 0) printimag = true;
    }
    console.log(ttemp);
    if (printimag) console.log(ttempi);
};

// array which contains only n zeros
CSad.zero = function (n) {
    const erg = [];
    const zero = CSNumber.real(0);

    for (let i = 0; i < n.value.real; i++) {
        erg[i] = zero;
    }

    return List.turnIntoCSList(erg);
};

// csad number type [x0, 0, 0, ...]
CSad.number = function (x0, n) {
    const erg = CSad.zero(n);
    erg.value[0] = x0;
    return erg;
};

// csad variables [x0, 1, 0, ....]
CSad.variable = function (x0, n) {
    const erg = CSad.zero(n);
    erg.value[0] = x0;
    erg.value[1] = CSNumber.real(1);
    return erg;
};

CSad.add = function (a, b) {
    return List.add(a, b);
};

CSad.sub = function (a, b) {
    return List.sub(a, b);
};

CSad.mult = function (f, g) {
    if (f.value.length !== g.value.length) {
        console.error("dims don't fit return nada");
        return nada;
    }

    const le = f.value.length;
    const erg = CSad.zero(CSNumber.real(le));

    let ges = CSNumber.real(0);
    for (let k = 0; k < le; k++) {
        for (let i = 0; i <= k; i++) {
            ges = CSNumber.add(ges, CSNumber.mult(f.value[i], g.value[k - i]));
        } // end inner
        erg.value[k] = ges;
        ges = CSNumber.real(0);
    } // end outer

    return erg;
};

CSad.pow = function (a, b) {
    if (b.value.real < 0 || b.value.real !== Math.floor(b.value.real)) {
        return CSad.root(a, b);
    } else {
        let temp = a;
        for (let i = 1; i < b.value.real; i++) {
            temp = CSad.mult(temp, a);
        }
        return temp;
    }
};

// (f)^r for float r
CSad.root = function (f, r) {
    const zero = CSNumber.real(0);
    const one = CSNumber.real(1);
    const rOne = CSNumber.add(one, r);

    const le = f.value.length;
    const erg = CSad.zero(CSNumber.real(le));
    erg.value[0] = CSNumber.pow(f.value[0], r);

    let sum = zero;
    let inner;
    let ges, csK;
    for (let k = 1; k < le; k++) {
        csK = CSNumber.real(k);
        ges = f.value[k];
        for (let i = 1; i <= k; i++) {
            inner = CSNumber.mult(rOne, CSNumber.real(i));
            inner = CSNumber.div(inner, csK);
            inner = CSNumber.sub(inner, one);
            inner = CSNumber.mult(inner, f.value[i]);
            inner = CSNumber.mult(inner, erg.value[k - i]);
            sum = CSNumber.add(sum, inner);
        } // end inner

        ges = CSNumber.div(sum, f.value[0]);
        erg.value[k] = ges;
        sum = zero;
    } // end outer

    //    CSad.printArr(erg);
    return erg;
};

// return first nonzero indexes of f and g starting from k
CSad.findFirstNoneZero = function (f, g, k) {
    let idxf = Infinity;
    let idxg = Infinity;
    const myEps = 1e-12;
    for (let i = k; i < f.value.length; i++) {
        if (CSNumber.abs2(f.value[i]).value.real > myEps) {
            idxf = i;
            break;
        }
    }

    for (let j = k; j < g.value.length; j++) {
        if (CSNumber.abs2(g.value[j]).value.real > myEps) {
            idxg = j;
            break;
        }
    }

    return [idxf, idxg];
};

//CSad.trimArr = function(f, g) {};

// f / g
CSad.div = function (f, g) {
    if (f.value.length !== g.value.length) {
        console.log("dims don't fit - return nada");
        return nada;
    }

    let le = f.value.length;
    const myEps = 1e-16;
    const zero = CSNumber.real(0);
    const erg = CSad.zero(CSNumber.real(le));

    let sum = zero;
    let ges = zero;

    // loop over all coefficients
    for (let k = 0; k < le; k++) {
        // L'Hospitals rule
        const indxs = CSad.findFirstNoneZero(f, g, k);
        if (k < indxs[0] && indxs[0] === indxs[1] && indxs[0] !== Infinity) {
            //console.log("apply l Hospital", k);
            f.value.splice(k, indxs[0]);
            g.value.splice(k, indxs[0]);
            erg.value.splice(k, indxs[0]);
            le = le - indxs[0];
        }

        ges = f.value[k];
        for (let i = 0; i < k; i++) {
            sum = CSNumber.add(sum, CSNumber.mult(erg.value[i], g.value[k - i]));
        } // end inner

        ges = CSNumber.sub(ges, sum);
        ges = CSNumber.div(ges, g.value[0]);
        erg.value[k] = ges;
        ges = zero;
        sum = zero;
    } // end outer

    return erg;
};

CSad.exp = function (f) {
    const zero = CSNumber.real(0);
    const le = f.value.length;
    const erg = CSad.zero(CSNumber.real(le));

    let sum = zero;
    let inner;
    erg.value[0] = CSNumber.exp(f.value[0]);
    for (let k = 1; k < le; k++) {
        for (let i = 1; i <= k; i++) {
            inner = CSNumber.mult(CSNumber.real(i), f.value[i]);
            inner = CSNumber.mult(inner, erg.value[k - i]);
            sum = CSNumber.add(sum, inner);
        } // end inner
        erg.value[k] = CSNumber.div(sum, CSNumber.real(k));
        sum = zero;
    } // end outer

    return erg;
};

CSad.log = function (f) {
    const zero = CSNumber.real(0);
    const le = f.value.length;
    const erg = CSad.zero(CSNumber.real(le));
    erg.value[0] = CSNumber.log(f.value[0]);

    let sum = zero;
    let ges;
    let inner;
    for (let k = 1; k < le; k++) {
        ges = f.value[k];
        for (let i = 1; i < k; i++) {
            inner = CSNumber.mult(CSNumber.real(i), erg.value[i]);
            inner = CSNumber.mult(inner, f.value[k - i]);
            sum = CSNumber.add(sum, inner);
        } // end inner

        sum = CSNumber.div(sum, CSNumber.real(k));
        ges = CSNumber.sub(ges, sum);
        ges = CSNumber.div(ges, f.value[0]);
        erg.value[k] = ges;
        sum = zero;
    } // end outer

    return erg;
};

CSad.sincos = function (f) {
    const zero = CSNumber.real(0);
    const le = f.value.length;
    const ergsin = CSad.zero(CSNumber.real(le));
    const ergcos = CSad.zero(CSNumber.real(le));
    ergsin.value[0] = CSNumber.sin(f.value[0]);
    ergcos.value[0] = CSNumber.cos(f.value[0]);

    let sumcos = zero;
    let sumsin = zero;
    let insin, incos, inboth;
    let numk;
    for (let k = 1; k < le; k++) {
        numk = CSNumber.real(k);
        for (let i = 1; i <= k; i++) {
            inboth = CSNumber.mult(CSNumber.real(i), f.value[i]);
            insin = CSNumber.mult(inboth, ergcos.value[k - i]);
            incos = CSNumber.mult(inboth, ergsin.value[k - i]);

            sumsin = CSNumber.add(sumsin, insin);

            sumcos = CSNumber.add(sumcos, incos);
        } // end inner

        sumsin = CSNumber.div(sumsin, numk);
        sumcos = CSNumber.div(sumcos, CSNumber.neg(numk));
        ergsin.value[k] = sumsin;
        ergcos.value[k] = sumcos;
        sumsin = zero;
        sumcos = zero;
    } // end outer

    CSad.sinsave = ergsin;
    CSad.cossave = ergcos;
    return [ergsin, ergcos];
};

CSad.sin = function (f) {
    const erg = CSad.sincos(f);
    return erg[0];
};

CSad.cos = function (f) {
    const erg = CSad.sincos(f);
    return erg[1];
};

CSad.faculty = function (n) {
    let erg = [];
    erg[0] = CSNumber.real(1);
    let val = 1;
    for (let i = 1; i <= n.value.real; i++) {
        val = i * val;
        erg[i] = CSNumber.real(val);
    }
    erg = List.turnIntoCSList(erg);
    return erg;
};

CSad.diff = function (prog, varname, x0, grade) {
    let erg;

    if (prog.ctype === "variable") {
        if (prog.name !== varname) {
            // if we have different variable than run variable substitute with right val
            erg = CSad.number(evaluate(prog), grade);
        } else {
            erg = CSad.variable(x0, grade);
        }
    } else if (prog.ctype === "number") {
        erg = CSad.number(prog, grade);
    } else if (prog.ctype === "infix") {
        if (prog.oper === "*") {
            return CSad.mult(CSad.diff(prog.args[0], varname, x0, grade), CSad.diff(prog.args[1], varname, x0, grade));
        }
        if (prog.oper === "^") {
            return CSad.pow(
                CSad.diff(prog.args[0], varname, x0, grade),
                CSad.diff(prog.args[1], varname, x0, grade).value[0]
            ); // .value[0] since we only want the exponent
        }

        if (prog.oper === "/") {
            return CSad.div(CSad.diff(prog.args[0], varname, x0, grade), CSad.diff(prog.args[1], varname, x0, grade));
        } else if (prog.oper === "+") {
            return CSad.add(CSad.diff(prog.args[0], varname, x0, grade), CSad.diff(prog.args[1], varname, x0, grade));
        } else if (prog.oper === "-") {
            return CSad.sub(CSad.diff(prog.args[0], varname, x0, grade), CSad.diff(prog.args[1], varname, x0, grade));
        } else {
            console.log("infix not found", prog.oper);
            return nada;
        }
    } else if (prog.ctype === "function") {
        if (prog.oper === "exp$1") {
            return CSad.exp(CSad.diff(prog.args[0], varname, x0, grade));
        }
        if (prog.oper === "log$1") {
            return CSad.log(CSad.diff(prog.args[0], varname, x0, grade));
        }
        if (prog.oper === "sin$1") {
            return CSad.sin(CSad.diff(prog.args[0], varname, x0, grade));
        }
        if (prog.oper === "cos$1") {
            return CSad.cos(CSad.diff(prog.args[0], varname, x0, grade));
        }
    } else {
        console.log("ctype not found", prog.ctype);
        return nada;
    }

    return erg;
};

CSad.adevaluate = function (prog, varname, x0, grade) {
    const ergarr = CSad.diff(prog, varname, x0, grade);
    const facs = CSad.faculty(grade);
    for (let i = 2; i < ergarr.value.length; i++) {
        ergarr.value[i] = CSNumber.mult(ergarr.value[i], facs.value[i]);
    }

    //console.log("erg after fac");
    //CSad.printArr(ergarr);

    return ergarr;
};

CSad.autodiff = function (ffunc, varname, xarr, grade) {
    let erg = [];
    const le = xarr.value.length;

    let arr;
    for (let i = 0; i < le; i++) {
        arr = CSad.adevaluate(ffunc, varname, xarr.value[i], grade);
        erg[i] = arr;
    }

    erg = List.turnIntoCSList(erg);
    return erg;
};

export { CSad };
