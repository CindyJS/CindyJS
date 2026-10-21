var should = require("chai").should();

var rewire = require("rewire");

global.navigator = {};
var cindyJS = rewire("../build/js/exposed.js");

var LC = cindyJS.__get__("LC");
var CSNumber = cindyJS.__get__("CSNumber");
var List = cindyJS.__get__("List");
var withLeviCivita = cindyJS.__get__("withLeviCivita");

var eps = LC.monomial(1, 1);

function c(re, im) {
    return LC.fromComplex(re, im || 0);
}

// the coefficient of eps^q, 0 if there is no such term
function coeff(s, q) {
    for (var t of s.terms) if (Math.abs(t.q - q) < 1e-9) return t;
    return { q: q, re: 0, im: 0 };
}

function num(s) {
    // a CSNum carrying a series, built through CSNumber so demotion applies
    return CSNumber.add(CSNumber.zero, { ctype: "number", value: { real: NaN, imag: NaN, lc: s } });
}

describe("Levi-Civita series", function () {
    it("multiplies out (1+eps)^2", function () {
        var s = LC.mul(LC.add(c(1), eps), LC.add(c(1), eps));
        s.terms.length.should.equal(3);
        coeff(s, 0).re.should.equal(1);
        coeff(s, 1).re.should.equal(2);
        coeff(s, 2).re.should.equal(1);
    });

    it("cancels the standard part exactly, leaving the infinitesimal", function () {
        // (1/3 + eps) - 1/3 computed with rounding noise in the standard part
        var third = 1 / 3;
        var noisy = c(0.1 + 0.2 - 0.3 + third); // not bit-identical to 1/3
        var s = LC.sub(LC.add(noisy, eps), c(third));
        LC.order(s).should.equal(1);
    });

    it("inverts an infinitesimal to an infinite number", function () {
        var s = LC.inv(LC.add(eps, LC.monomial(2, 3)));
        LC.order(s).should.equal(-1);
        coeff(s, -1).re.should.equal(1);
        coeff(s, 0).re.should.be.closeTo(-3, 1e-12);
        // exact up to the precision the truncated inverse carries
        var one = LC.mul(s, LC.add(eps, LC.monomial(2, 3)));
        one.terms.should.eql([{ q: 0, re: 1, im: 0 }]);
        one.big.should.be.above(10);
        LC.isStandard(LC.inv(eps)).should.equal(false);
        LC.inv(eps).big.should.equal(Infinity);
    });

    it("marks division by zero as invalid", function () {
        LC.isValid(LC.inv(LC.ZERO)).should.equal(false);
        LC.isValid(LC.div(c(1), LC.ZERO)).should.equal(false);
    });

    it("takes square roots with fractional exponents", function () {
        var s = LC.sqrt(LC.scale(eps, 4, 0));
        LC.order(s).should.equal(0.5);
        coeff(s, 0.5).re.should.equal(2);
        LC.mul(s, s).terms.should.eql([{ q: 1, re: 4, im: 0 }]);
    });

    it("evaluates exp, log, sin, cos with full float accuracy", function () {
        [0.3, 1, 3, 10, -7].forEach(function (x) {
            var a = LC.add(c(x), eps);
            var e = LC.exp(a);
            coeff(e, 0).re.should.be.closeTo(Math.exp(x), Math.exp(x) * 1e-14);
            coeff(e, 1).re.should.be.closeTo(Math.exp(x), Math.exp(x) * 1e-14);
            var s = LC.sin(a);
            coeff(s, 0).re.should.be.closeTo(Math.sin(x), 1e-14);
            coeff(s, 1).re.should.be.closeTo(Math.cos(x), 1e-14);
            coeff(s, 2).re.should.be.closeTo(-Math.sin(x) / 2, 1e-14);
            var co = LC.cos(a);
            coeff(co, 0).re.should.be.closeTo(Math.cos(x), 1e-14);
            coeff(co, 1).re.should.be.closeTo(-Math.sin(x), 1e-14);
        });
        var l = LC.log(LC.add(c(2), eps));
        coeff(l, 0).re.should.be.closeTo(Math.log(2), 1e-15);
        coeff(l, 1).re.should.be.closeTo(0.5, 1e-15);
        coeff(l, 2).re.should.be.closeTo(-0.125, 1e-15);
    });

    it("has exp and log as inverse functions", function () {
        var a = LC.add(c(0.7, -0.4), LC.add(eps, LC.monomial(1.5, -2)));
        var d = LC.sub(LC.log(LC.exp(a)), a);
        d.terms.forEach(function (t) {
            Math.hypot(t.re, t.im).should.be.below(1e-12);
        });
        d.big.should.be.above(10);
    });

    it("keeps track of lost precision", function () {
        // (1+eps)^-1 is known to O(eps^12); subtracting its known terms leaves
        // O(eps^12), which is neither zero nor has a leading term
        var i = LC.inv(LC.add(c(1), eps));
        var d = LC.sub(i, { terms: i.terms, big: Infinity });
        LC.isZero(d).should.equal(false);
        LC.isDeterminate(d).should.equal(false);
        LC.isValid(LC.inv(d)).should.equal(false);
        LC.standardPart(d).should.eql({ re: 0, im: 0 });
    });

    it("orders infinitesimals below every positive real", function () {
        LC.compare(eps, c(1e-300)).should.equal(-1);
        LC.compare(LC.neg(eps), c(0)).should.equal(-1);
        LC.compare(LC.sub(c(1), eps), c(1)).should.equal(-1);
        LC.compare(LC.inv(eps), c(1e300)).should.equal(1);
        LC.compareMagnitude(LC.monomial(1, 1000), LC.monomial(2, 1)).should.equal(1);
    });

    it("prints series readably", function () {
        LC.niceprint(LC.add(c(2), LC.sub(eps, LC.monomial(0.5, 3)))).should.equal("2 - 3*eps^0.5 + eps");
        LC.niceprint(LC.inv(eps)).should.equal("eps^(-1)");
        LC.niceprint(LC.inv(LC.add(c(1), eps))).should.match(/^1 - eps \+ eps\^2 .* \+ O\(eps\^12\)$/);
    });
});

describe("Levi-Civita edge cases", function () {
    it("has no infinite coefficients", function () {
        LC.isValid(LC.add(eps, c(Infinity))).should.equal(false);
        LC.isValid(LC.add(LC.add(eps, c(1e308)), c(1e308))).should.equal(false);
        LC.isValid(LC.scale(eps, Infinity, 0)).should.equal(false);
    });

    it("puts the branch cut where the infinitesimal part says", function () {
        // -1 - i*eps is just below the negative real axis
        var below = LC.sub(c(-1), LC.scale(eps, 0, 1));
        var above = LC.add(c(-1), LC.scale(eps, 0, 1));
        coeff(LC.log(below), 0).im.should.be.closeTo(-Math.PI, 1e-15);
        coeff(LC.log(above), 0).im.should.be.closeTo(Math.PI, 1e-15);
        coeff(LC.sqrt(below), 0).im.should.be.closeTo(-1, 1e-15);
        coeff(LC.sqrt(above), 0).im.should.be.closeTo(1, 1e-15);
    });

    it("ignores rounding noise when choosing the side of the branch cut", function () {
        // -1 + (1 - 1e-20 i) * eps: the imaginary part is noise of a real coefficient
        var noisy = LC.add(c(-1), LC.scale(eps, 1, -1e-20));
        coeff(LC.log(noisy), 0).im.should.be.closeTo(Math.PI, 1e-15);
    });
});

// Arithmetic on series is only available inside the Levi-Civita mode.
function lc(fn) {
    return function () {
        return withLeviCivita(fn);
    };
}

describe("Levi-Civita mode", function () {
    var e = CSNumber.infinitesimal(1);
    var stdAdd = CSNumber.add;
    var stdDet3 = List.det3;
    var stdIsZero = CSNumber._helper.isZero;

    it("leaves CSNumber and List untouched outside the mode", function () {
        CSNumber.add.should.equal(stdAdd);
        List.det3.should.equal(stdDet3);
        CSNumber._helper.isZero.should.equal(stdIsZero);
        // a series that leaks out of the mode is computed as NaN, never as a wrong number
        isNaN(CSNumber.add(CSNumber.real(1), e).value.real).should.equal(true);
        isNaN(
            List.det3(
                List.realVector([1, 0, 0]),
                List.realVector([0, 1, 0]),
                List.turnIntoCSList([CSNumber.zero, CSNumber.zero, e])
            ).value.real
        ).should.equal(true);
    });

    it("substitutes for the duration of the call only, and restores after exceptions", function () {
        withLeviCivita(function () {
            CSNumber.add.should.not.equal(stdAdd);
            CSNumber.niceprint(CSNumber.add(CSNumber.real(1), e)).should.equal("1 + eps");
            // nests
            withLeviCivita(function () {
                CSNumber.niceprint(CSNumber.add(CSNumber.real(1), e)).should.equal("1 + eps");
            });
            CSNumber.add.should.not.equal(stdAdd);
        });
        CSNumber.add.should.equal(stdAdd);
        (function () {
            withLeviCivita(function () {
                throw new Error("boom");
            });
        }.should.throw("boom"));
        CSNumber.add.should.equal(stdAdd);
        List.det3.should.equal(stdDet3);
        CSNumber._helper.isZero.should.equal(stdIsZero);
    });

    it("restores every member of CSNumber and List, also after exceptions", function () {
        // a fresh instance, in which the mode has not been used yet
        var fresh = rewire("../build/js/exposed.js");
        var CSNumber = fresh.__get__("CSNumber");
        var List = fresh.__get__("List");
        var withLeviCivita = fresh.__get__("withLeviCivita");
        var e = CSNumber.infinitesimal(1);
        var objects = {
            CSNumber: CSNumber,
            "CSNumber._helper": CSNumber._helper,
            List: List,
            "List._helper": List._helper,
        };
        var snapshot = function () {
            var s = {};
            Object.keys(objects).forEach(function (name) {
                // descriptors: some members are getters (CSNumber.zero)
                s[name] = Object.getOwnPropertyDescriptors(objects[name]);
            });
            return s;
        };
        var check = function (before) {
            Object.keys(objects).forEach(function (name) {
                var now = Object.getOwnPropertyDescriptors(objects[name]);
                Object.keys(now).should.have.members(Object.keys(before[name]), name);
                Object.keys(now).forEach(function (key) {
                    var a = now[key];
                    var b = before[name][key];
                    (a.value === b.value && a.get === b.get && a.set === b.set).should.equal(true, name + "." + key);
                });
            });
        };
        var before = snapshot();
        withLeviCivita(function () {
            CSNumber.add(CSNumber.real(1), e);
        });
        check(before);
        (function () {
            withLeviCivita(function () {
                withLeviCivita(function () {
                    throw new Error("boom");
                });
            });
        }.should.throw("boom"));
        check(before);
    });

    // The substitutes only take effect where CSNumber and List members are
    // looked up at call time. A reference captured at load time (const add =
    // CSNumber.add at the top level of a file) would keep the standard
    // implementation inside the mode and compute NaN on series.
    it("is not bypassed by references captured at load time", function () {
        var fs = require("fs");
        var path = require("path");
        var capture = /^\S.*[=:(,]\s*(CSNumber|List)(\._helper)?\.[A-Za-z_$][\w$]*\s*[,;)]?\s*$/;
        var constants = /\.(zero|one|infinity|eps|epsbig|ii|jj|ex|ey|ez|linfty|_helper)\s*[,;)]?\s*$/;
        var offenders = [];
        var walk = function (dir) {
            fs.readdirSync(dir).forEach(function (f) {
                var p = path.join(dir, f);
                if (fs.statSync(p).isDirectory()) return walk(p);
                if (!/\.(js|ts)$/.test(f)) return;
                fs.readFileSync(p, "utf8")
                    .split("\n")
                    .forEach(function (line, i) {
                        if (capture.test(line) && !constants.test(line))
                            offenders.push(p + ":" + (i + 1) + ": " + line);
                    });
            });
        };
        walk(path.join(__dirname, "../src/js"));
        offenders.should.deep.equal([]);
    });

    // A function of CSNumber or List that computes on real and imaginary parts
    // itself (as List.productMM does for speed) computes NaN on series, unless
    // the mode replaces it with a version that goes through CSNumber.
    it("replaces every function that computes on real and imaginary parts", function () {
        var fs = require("fs");
        var path = require("path");
        // functions that are safe without a replacement, and why
        var harmless = {
            "List._helper.unitvector": "builds real constants",
            "List._helper.flippedidMatrix": "builds real constants",
            "List.column": "index arithmetic",
            "List.row": "index arithmetic",
            "List.nullSpace": "QR based: not available on series",
            "List.RRQRdecomp": "QR based: not available on series",
            "List.QRdecomp": "QR based: not available on series",
            "List._helper.QRIteration": "QR based: not available on series",
            "List.eig": "QR based: not available on series",
            "List._helper.isAlmostDiagonal": "part of eig",
            "List._helper.isNormalMatrix": "part of eig",
            "List.linearsolveCG": "iterative numerics, not used by geometric operations",
            "List.LUdecomp": "pivoting numerics, not used by geometric operations",
            "List.det": "up to 4x4 through det2, det3 and det4m; larger ones are not geometric",
            "List._helper.isAlmostFarpoint": "only in angle accessors, not while evaluating",
        };
        var definition =
            /^(List(?:\._helper)?\.[A-Za-z0-9_$]+)\s*=\s*function|^ {4,8}([A-Za-z0-9_$]+)(?:: function\s*)?\(.*\)\s*(?::\s*[^{]+)?\{$/gm;
        // arithmetic on real or imaginary parts, or a decision on those of a
        // computed value (e.g. comparing magnitudes)
        var arithmetic =
            /(\.(real|imag)\b\s*[-+*/](?!=)|[-+*/]\s*[A-Za-z0-9_$.[\]]*\.(real|imag)\b|(real|imag)\s*[-+*/]=|\)\.value\.(real|imag)\b)/;
        var computing = function (file, prefix) {
            var src = fs.readFileSync(path.join(__dirname, "../src/js/libcs", file), "utf8");
            var starts = [];
            var m;
            while ((m = definition.exec(src))) starts.push({ name: m[1] || prefix + m[2], at: m.index });
            return starts
                .filter(function (d, i) {
                    var end = i + 1 < starts.length ? starts[i + 1].at : src.length;
                    return arithmetic.test(src.slice(d.at, end));
                })
                .map(function (d) {
                    return d.name;
                });
        };
        var lookup = function (name) {
            var parts = name.split(".");
            var obj = { CSNumber: CSNumber, List: List };
            var members = [];
            // CSNumber.ts defines helpers and members alike as name: function
            if (parts[0] === "CSNumber") members = [CSNumber[parts[1]], CSNumber._helper[parts[1]]];
            else members = [parts.reduce((o, k) => o && o[k], obj)];
            return members;
        };
        var names = computing("List.js", "List.").concat(computing("CSNumber.ts", "CSNumber."));
        names.length.should.be.above(10, "the source scan finds the known cases");
        var standard = names.map(lookup);
        var missing = [];
        withLeviCivita(function () {
            names.forEach(function (name, i) {
                var now = lookup(name);
                var replaced = now.some(function (f, k) {
                    return f !== standard[i][k];
                });
                if (!replaced && !harmless[name]) missing.push(name);
            });
        });
        missing.should.deep.equal([], "add these to LeviCivitaMode.ts, or to `harmless` here");
    });
});

describe("CSNumber on Levi-Civita values", function () {
    var e;
    before(
        lc(function () {
            e = num(eps);
        })
    );

    it(
        "keeps real and imag NaN for non-standard values",
        lc(function () {
            isNaN(e.value.real).should.equal(true);
            CSNumber.niceprint(CSNumber.add(CSNumber.real(1), e)).should.equal("1 + eps");
        })
    );

    it(
        "demotes standard results back to plain numbers",
        lc(function () {
            var r = CSNumber.sub(CSNumber.add(CSNumber.real(1), e), e);
            should.not.exist(r.value.lc);
            r.value.should.eql({ real: 1, imag: 0 });
            CSNumber.mult(e, CSNumber.inv(e)).value.should.eql({ real: 1, imag: 0 });
            should.not.exist(CSNumber.sub(e, e).value.lc);
        })
    );

    it(
        "does not treat infinitesimals as zero",
        lc(function () {
            CSNumber._helper.isAlmostZero(e).should.equal(false);
            CSNumber._helper.isAlmostEqual(CSNumber.add(CSNumber.real(1), e), CSNumber.real(1)).should.equal(false);
            CSNumber._helper.isFinite(CSNumber.inv(e)).should.equal(true);
            CSNumber._helper.isNaN(e).should.equal(false);
        })
    );

    it(
        "rounds with the infinitesimal part in mind",
        lc(function () {
            var three = CSNumber.real(3);
            CSNumber.floor(CSNumber.sub(three, e)).value.real.should.equal(2);
            CSNumber.floor(CSNumber.add(three, e)).value.real.should.equal(3);
            CSNumber.ceil(CSNumber.add(three, e)).value.real.should.equal(4);
            CSNumber.round(CSNumber.sub(CSNumber.real(2.5), e)).value.real.should.equal(2);
        })
    );

    it(
        "compares truncated series as far as they are known",
        lc(function () {
            var x = CSNumber.inv(CSNumber.add(CSNumber.real(1), e)); // 1 - eps + ... + O(eps^12)
            CSNumber._helper.isEqual(x, x).should.equal(true);
            CSNumber._helper.compare(x, x).should.equal(0);
            CSNumber._helper.compare(x, CSNumber.real(1)).should.equal(-1);
        })
    );

    it(
        "computes mod consistently with floor",
        lc(function () {
            var m = CSNumber.mod(CSNumber.sub(CSNumber.real(3), e), CSNumber.real(3));
            CSNumber.niceprint(m).should.equal("3 - eps");
            CSNumber.niceprint(CSNumber.mod(CSNumber.add(CSNumber.real(7), e), CSNumber.real(3))).should.equal(
                "1 + eps"
            );
        })
    );

    it(
        "picks the larger magnitude in argmax",
        lc(function () {
            var small = CSNumber.mult(e, e);
            CSNumber.argmax(small, e).should.equal(e);
            CSNumber.argmax(e, CSNumber.zero).should.equal(e);
        })
    );

    it(
        "normalizes a vector of infinitesimals projectively",
        lc(function () {
            // cross product of two points that coincide in the standard part
            var p = List.realVector([1, 2, 1]);
            var q = List.turnIntoCSList([CSNumber.add(CSNumber.real(1), e), CSNumber.real(2), CSNumber.real(1)]);
            var l = List.normalizeMax(List.cross(p, q));
            // the line through (1,2) in direction (1,0) is y = 2: [0, 1, -2] up to scale
            CSNumber.niceprint(l.value[0]).should.equal("0");
            CSNumber.niceprint(CSNumber.div(l.value[2], l.value[1])).should.equal("-2");
        })
    );

    it(
        "computes trigonometry through CSNumber",
        lc(function () {
            var a = CSNumber.add(CSNumber.real(1), e);
            var s = CSNumber.sin(a).value.lc;
            coeff(s, 0).re.should.be.closeTo(Math.sin(1), 1e-15);
            var at = CSNumber.arctan2(CSNumber.real(1), e).value.lc;
            coeff(at, 0).re.should.be.closeTo(0, 1e-15);
            coeff(at, 1).re.should.be.closeTo(1, 1e-12);
        })
    );
});

describe("List operations on Levi-Civita values", function () {
    var e = CSNumber.infinitesimal(1);
    var M = List.add(
        List.realMatrix([
            [2, -1, 3],
            [0.5, 4, -2],
            [1, 1, 7],
        ]),
        List.scalmult(
            CSNumber.complex(0, 1),
            List.realMatrix([
                [1, 0, -1],
                [2, 1, 0],
                [0, 3, 1],
            ])
        )
    );
    // M + eps * N: the fallbacks must agree with the fast paths in the standard part
    var N = List.realMatrix([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 10],
    ]);
    var Me;
    before(
        lc(function () {
            Me = List.add(M, List.scalmult(e, N));
        })
    );

    function close(a, b) {
        List.abs(List.sub(List.standardPart(a), b)).value.real.should.be.below(1e-12);
    }

    it(
        "scalproduct and the matrix products",
        lc(function () {
            var v = M.value[0];
            var ve = Me.value[0];
            should.exist(List.scalproduct(ve, v).value.lc);
            close(List.productMV(Me, v), List.productMV(M, v));
            close(List.productVM(v, Me), List.productVM(v, M));
            close(List.productMM(Me, M), List.productMM(M, M));
            close(List.mult(Me, M), List.mult(M, M));
        })
    );

    it(
        "det3",
        lc(function () {
            var std = List.det3(M.value[0], M.value[1], M.value[2]);
            var lc = List.det3(Me.value[0], Me.value[1], Me.value[2]);
            should.exist(lc.value.lc);
            CSNumber.abs(CSNumber.sub(CSNumber.standardPart(lc), std)).value.real.should.be.below(1e-12);
        })
    );

    it(
        "adjoint3",
        lc(function () {
            close(List.adjoint3(Me), List.adjoint3(M));
        })
    );

    it(
        "det4m",
        lc(function () {
            var M4 = List.realMatrix([
                [38, 48, 52, 85],
                [78, 80, 20, 7],
                [46, 1, 0, 29],
                [69, 5, 50, 61],
            ]);
            var lc = List.det4m(
                List.add(
                    M4,
                    List.scalmult(
                        e,
                        List.realMatrix([
                            [1, 0, 0, 0],
                            [0, 0, 0, 0],
                            [0, 0, 0, 0],
                            [0, 0, 0, 0],
                        ])
                    )
                )
            );
            CSNumber.standardPart(lc).value.real.should.equal(List.det4m(M4).value.real);
        })
    );

    it(
        "sesquilinearproduct and normSquared",
        lc(function () {
            var a = Me.value[0];
            var b = Me.value[1];
            var sp = List.sesquilinearproduct(a, b);
            CSNumber.abs(
                CSNumber.sub(CSNumber.standardPart(sp), List.sesquilinearproduct(M.value[0], M.value[1]))
            ).value.real.should.be.below(1e-12);
            CSNumber.abs(
                CSNumber.sub(CSNumber.standardPart(List.normSquared(a)), List.normSquared(M.value[0]))
            ).value.real.should.be.below(1e-12);
        })
    );
});
