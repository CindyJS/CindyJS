"use strict";

function cplx(r, i) {
    return {r: r, i: i};
}

function prodp(a, b) {
    return cplx(a.r + " * " + b.r + " - " + a.i + " * " + b.i,
                a.r + " * " + b.i + " + " + a.i + " * " + b.r);
}

function prodm(a, b) {
    return cplx(a.r + " * " + b.r + " + " + a.i + " * " + b.i,
                a.r + " * " + b.i + " - " + a.i + " * " + b.r);
}

function sub(a, b) {
    return cplx(a.r + " - " + b.r, a.i + " - " + b.i);
}

function add(a, b) {
    return cplx(a.r + " + " + b.r, a.i + " + " + b.i);
}

function det2e(a, b, c, d) {
    return sub(prodp(a, d), prodm(b, c));
}

function cache(n, z, reuse) {
    var v = reuse ? "" : "var ";
    console.log("    " + v + n + "r = " + z.r + ";");
    console.log("    " + v + n + "i = " + z.i + ";");
    return cplx(n + "r", n + "i");
}

function gen_det4m() {
    console.log("List.det4m = function(m) {");
    console.log("    // auto-generated code, see detgen.js");
    console.log("    var body = m.value;");
    console.log("    var row = body[0].value;");
    console.log("    var elt = row[0].value;");
    var i, j, m = Array(4), celt = cplx("+elt.real", "+elt.imag");
    var a = [], b = [], d;
    for (i = 0; i < 2; ++i) {
        m[i] = Array(4);
        if (i > 0)
            console.log("    row = body[" + i + "].value;");
        for (j = 0; j < 4; ++j) {
            if (i + j > 0)
                console.log("    elt = row[" + j + "].value;");
            m[i][j] = cache("m" + i + j, celt);
        }
    }
    for (i = 0; i < 4; ++i) {
        for (j = i + 1; j < 4; ++j) {
            d = det2e(m[0][i], m[0][j], m[1][i], m[1][j]);
            a.push(cache("a" + i + j, d));
        }
    }
    for (i = 2; i < 4; ++i) {
        m[i] = Array(4);
        console.log("    row = body[" + i + "].value;");
        for (j = 0; j < 4; ++j) {
            console.log("    elt = row[" + j + "].value;");
            m[i][j] = cache("m" + (i - 2) + j, celt, true);
        }
    }
    for (i = 0; i < 4; ++i) {
        for (j = i + 1; j < 4; ++j) {
            var d;
            d = det2e(m[2][i], m[2][j], m[3][i], m[3][j]);
            b.push(cache("b" + i + j, d));
        }
    }
    // 0:01,23+ 1:02,13- 2:03,12+ 3:12,03+ 4:13,02- 5:23,01+
    var c = [];
    for (i = 0; i < 6; ++i) {
        c.push({p:prodp(a[i], b[5 - i]), m:prodm(a[i], b[5 - i])});
    }
    console.log("    return CSNumber.complex(\n" +
                "        " + c[0].p.r + " -\n" +
                "        " + c[1].m.r + " +\n" +
                "        " + c[2].p.r + " +\n" +
                "        " + c[3].p.r + " -\n" +
                "        " + c[4].m.r + " +\n" +
                "        " + c[5].p.r + ",\n" +
                "        " + c[0].p.i + " -\n" +
                "        " + c[1].m.i + " +\n" +
                "        " + c[2].p.i + " +\n" +
                "        " + c[3].p.i + " -\n" +
                "        " + c[4].m.i + " +\n" +
                "        " + c[5].p.i + ");\n};");
}

process.nextTick(gen_det4m);
