var GLSL = {};

/**
 * @param {Polynomial} p
 * @return {Array<string>}
 */
GLSL.glslCoefficients = function(p) {
    var cs = [],
        cs_, i, l;
    if (p.isConstant())
        return [GLSL.glslComplex(p.constant())];
    else if (p.isUnivariate()) {
        cs_ = p.coefficientList_();
        for (i = 0, l = cs_.length; i < l; i++)
            cs[i] = GLSL.glslComplex(cs_[i]);
    } else if (p.isBivariate()) {
        var vars = p.variableList();
        var vx = vars[0],
            vy = vars[1];
        cs_ = p.coefficientList(vy);
        for (i = 0, l = cs_.length; i < l; i++)
            cs[i] = GLSL.glslHorner(vx, GLSL.glslCoefficients(cs_[i]));
    }
    return cs;
};

/**
 * @param {Complex} z
 * @return {string}
 */
GLSL.glslComplex = function(z) {
    return "vec2 (" + z.re.toPrecision(8) + ", " + z.im.toPrecision(8) +
        ")";
};

/**
 * @param {Polynomial} p
 * @param {string} vx
 * @param {string} vy
 * @return {string}
 */
GLSL.glslF = function(p, vx, vy) {
    var cs = GLSL.pad(GLSL.glslCoefficients(p).reverse());
    var lines = ["void f (in vec2 " + vx + ", out vec2 cs[N+1])", "{"];
    for (var i = 0; i <= GLSL.N; i++)
        lines.push("cs[" + i + "] = " + cs[i] + ";");
    lines.push("}");
    return lines.join("\n");
};

/**
 * @param {Polynomial} p
 * @param {string} vx
 * @param {string} vy
 * @return {string}
 */
GLSL.glslFx = function(p, vx, vy) {
    var cs = p.diff(vx).coefficientList(vy);
    var cs_ = [];
    for (var i = 0, l = cs.length; i < l; i++)
        cs_[i] = GLSL.glslHorner(vx, GLSL.glslCoefficients(cs[i]));
    var lines = ["vec2 fx (in vec2 " + vx + ", in vec2 " + vy + ")", "{",
        "    return " + GLSL.glslHorner(vy, cs_) + ";", "}"
    ];
    return lines.join("\n");
};

/**
 * @param {Polynomial} p
 * @param {string} vx
 * @param {string} vy
 * @return {string}
 */
GLSL.glslFy = function(p, vx, vy) {
    var cs = p.diff(vy).coefficientList(vx);
    var cs_ = [];
    for (var i = 0, l = cs.length; i < l; i++)
        cs_[i] = GLSL.glslHorner(vy, GLSL.glslCoefficients(cs[i]));
    var lines = ["vec2 fy (in vec2 " + vx + ", in vec2 " + vy + ")", "{",
        "    return " + GLSL.glslHorner(vx, cs_) + ";", "}"
    ];
    return lines.join("\n");
};

/**
 * @param {Polynomial} p
 * @param {string} vy
 * @return {string}
 */
GLSL.glslHeader = function(p, vx, vy) {
    var lines = ["#ifdef GL_FRAGMENT_PRECISION_HIGH",
        "precision highp float;",
        "#else", "precision mediump float;", "#endif",
        "const int N = " + GLSL.N + ";",
        "const int sheets = " + p.degree(vy) + ";", "",
        "/* complex multiplication */",
        "vec2 cm (in vec2 a, in vec2 b)", "{",
        "    return vec2 (a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);",
        "}"
    ];
    return lines.join("\n");
};

/**
 * @param {string} v
 * @param {Array<string>} cs
 * @return {string}
 */
GLSL.glslHorner = function(v, cs) {
    var str = cs[0];
    for (var i = 1, l = cs.length; i < l; i++) {
        if (str === "vec2 (1.0000000, 0.0000000)")
            str = v;
        else if (str === "vec2 (-1.0000000, 0.0000000)")
            str = "-" + v;
        else
            str = "cm (" + v + "," + str + ")";
        if (cs[i] !== "vec2 (0.0000000, 0.0000000)")
            str += "+" + cs[i];
    }
    return str;
};

/**
 * @param {Polynomial} p
 * @param {string} vx
 * @param {string} vy
 * @return {string}
 */
GLSL.glslM = function(p, vx, vy) {
    var i, j, l, k;
    var cs = p.coefficientList(vy);
    for (i = 0, l = cs.length; i < l; i++) {
        var terms = cs[i].terms;
        for (j = 0, k = terms.length; j < k; j++) {
            var term = terms[j];
            terms[j] = new Term(Complex.real(term.coefficient.abs()),
                term.monomial);
        }
        cs[i] = new Polynomial(terms);
    }
    var a0a0 = cs[0].leading(vx);
    var an = p.leading(vy);
    var leadRoots = Polynomial.roots(an.coefficientList_());
    var lines = ["float M (in vec2 " + vx + ", in float rho)", "{",
        "    vec2 r = vec2 (length (" + vx + ") + rho, 0.0);",
        "    float a[" + cs.length + "];",
        "    a[0] = length (" + GLSL.glslComplex(a0a0.constant()) +
        ");"
    ];
    for (i = 0, l = leadRoots.length; i < l; i++)
        lines.push("    a[0] *= distance (" + vx + ", " +
            GLSL.glslComplex(leadRoots[i]) + ") - rho;");
    for (i = 1, l = cs.length; i < l; i++)
    // FIXME: 'r' must not conflict with variables of polynomial p
        lines.push("    a[" + i + "] = length (" + GLSL.glslHorner('r',
        GLSL.glslCoefficients(cs[i])) + ");");
    lines = lines.concat(["    float m = a[1] / a[0];",
        "    for (int j = 2; j < " + cs.length + "; j++) {",
        "        m = max (m, pow (a[j] / a[0], 1.0 / float (j)));",
        "    }",
        "    return 2.0 * m;", "}"
    ]);
    return lines.join("\n");
};

/**
 * @param {Polynomial} p
 * @param {string} vx
 * @param {string} vy
 * @return {string}
 */
GLSL.glslRho = function(p, vx, vy) {
    var an = p.leading(vy),
        disc = p.discriminant(vy),
        leadRoots = Polynomial.roots(an.coefficientList_()),
        discRoots = Polynomial.roots(disc.coefficientList_()),
        i, l, critical = [];
    for (i = 0, l = leadRoots.length; i < l; i++)
        if (isFinite(leadRoots[i].abs()))
            critical.push(leadRoots[i]);
    for (i = 0, l = discRoots.length; i < l; i++)
        if (isFinite(discRoots[i].abs()))
            critical.push(discRoots[i]);
    var lines = ["float rho (in vec2 " + vx + ") {",
        "    float d = 100.0;"
    ];
    for (i = 0, l = critical.length; i < l; i++)
        lines.push("    d = min (d, distance (" + vx + ", " +
            GLSL.glslComplex(critical[i]) + "));");
    lines = lines.concat(["    return 0.999 * d;", "}"]);
    return lines.join("\n");
};

/** @type {number} */
GLSL.N = 8;

/**
 * @param {Array<string>} cs
 * @return {Array<string>}
 */
GLSL.pad = function(cs) {
    var n = GLSL.N - cs.length + 1;
    var zero = GLSL.glslComplex(Complex.zero());
    for (var i = 0; i < n; i++)
        cs.push(zero);
    return cs;
};

/**
 * @param {Polynomial} p
 * @return {string}
 */
GLSL.polynomialShaderSource = function(p) {
    var vars = p.variableList();
    var vx = vars.length < 2 ? "x" : vars[0];
    var vy = vars.length === 0 ? "y" : vars[vars.length - 1];
    var sources = [
        GLSL.glslHeader(p, vx, vy),
        GLSL.glslF(p, vx, vy),
        GLSL.glslFx(p, vx, vy),
        GLSL.glslFy(p, vx, vy),
        GLSL.glslRho(p, vx, vy),
        GLSL.glslM(p, vx, vy)
    ].join("\n\n");
    return sources;
};
