/**
 * Formulas rendered by the KaTeX canvas comparison suite.
 *
 * Three sets:
 *  - core:    small, focused formulas, one construct each, so a failure
 *             points at the construct at fault;
 *  - cindyjs: formulas as they occur in CindyJS examples and content,
 *             including the Cinderella-specific macros;
 *  - issue829: the formulas reported in CindyJS issue #829;
 *  - katex:   KaTeX's own screenshot test suite (test/screenshotter/ss_data.yaml
 *             of KaTeX v0.18.9, MIT licensed, converted to JSON), which
 *             exercises nearly every supported command. The image of the
 *             Includegraphics case is replaced by one from ref/img.
 */

import { readFileSync } from "node:fs";

const core = {
    // symbols and fonts
    letter: "x",
    word: "abc",
    digits: "0123456789",
    greek: "\\alpha\\beta\\gamma\\delta\\epsilon\\zeta\\eta\\theta\\iota\\kappa\\lambda\\mu\\nu\\xi\\pi\\rho\\sigma\\tau\\upsilon\\phi\\chi\\psi\\omega",
    greekUpper: "\\Gamma\\Delta\\Theta\\Lambda\\Xi\\Pi\\Sigma\\Upsilon\\Phi\\Psi\\Omega",
    varGreek: "\\varepsilon\\vartheta\\varpi\\varrho\\varsigma\\varphi",
    mathrm: "\\mathrm{d}x\\,\\mathrm{sin}",
    mathbf: "\\mathbf{v}+\\mathbf{AB}",
    boldsymbol: "\\boldsymbol{\\alpha x}",
    mathit: "\\mathit{diff}",
    mathbb: "\\mathbb{R}\\mathbb{N}\\mathbb{Z}\\mathbb{Q}\\mathbb{C}",
    mathcal: "\\mathcal{ABCF}",
    mathfrak: "\\mathfrak{gh}",
    mathsf: "\\mathsf{Sans}",
    mathtt: "\\mathtt{mono}",
    mathscr: "\\mathscr{L}",
    text: "\\text{hello world}",
    textInMath: "x\\text{ for all }y",
    textbf: "\\textbf{bold}\\textit{ital}",
    // operators and spacing
    binops: "a+b-c\\cdot d\\times e\\div f\\pm g",
    relations: "a=b<c>d\\le e\\ge f\\ne g\\approx h\\equiv i",
    arrows: "a\\to b\\leftarrow c\\Rightarrow d\\iff e\\mapsto f",
    punct: "f(x,y);\\ g[z]",
    spaces: "a\\,b\\:c\\;d\\quad e\\qquad f\\!g",
    negSpace: "a\\!\\!\\!b",
    unaryMinus: "-x+(-y)",
    functions: "\\sin x+\\cos y+\\log z+\\exp w",
    limits: "\\lim_{x\\to 0} f(x)",
    operatorname: "\\operatorname{arg\\,max}_x f",
    // scripts
    sup: "x^2",
    sub: "x_i",
    supsub: "x_i^2",
    nestedSup: "e^{x^2}",
    subWord: "a_{ij}",
    primes: "f'(x)+g''(x)",
    italicSup: "f^2+V^2+P_1",
    bigSup: "x^{a+b+c}_{n-1}",
    // fractions
    frac: "\\frac{a}{b}",
    fracWide: "\\frac{a+b}{c}",
    fracNested: "\\frac{1}{1+\\frac{1}{x}}",
    dfrac: "\\dfrac{1}{2}",
    tfrac: "\\tfrac{1}{2}",
    cfrac: "\\cfrac{1}{2+\\cfrac{1}{3}}",
    binom: "\\binom{n}{k}",
    over: "{a \\over b}",
    fracPi: "\\frac\\pi2",
    // big operators
    sum: "\\sum_{i=1}^n i",
    sumDisplay: "\\displaystyle\\sum_{i=1}^n i",
    prod: "\\prod_{k} a_k",
    int: "\\int_0^1 x\\,dx",
    intDisplay: "\\displaystyle\\int_0^\\infty e^{-x}dx",
    oint: "\\oint f",
    bigcup: "\\bigcup_{i} A_i",
    sumNoLimits: "\\sum x",
    // delimiters
    parens: "(a)[b]\\{c\\}",
    bigParens: "\\big(\\Big(\\bigg(\\Bigg(",
    leftRight: "\\left(\\frac{a}{b}\\right)",
    leftRightTall: "\\left[\\frac{\\frac{1}{2}}{3}\\right]",
    abs: "|x|+\\lvert y\\rvert+\\|v\\|",
    angle: "\\langle a,b\\rangle",
    // sizes and styles
    sizes: "\\tiny a\\scriptsize a\\small a\\normalsize a\\large a\\Large a\\LARGE a\\huge a\\Huge a",
    scriptstyle: "\\scriptstyle ab\\scriptscriptstyle cd",
    displaystyle: "\\displaystyle\\frac{a}{b}",
    // colors
    color: "\\color{red}{x}+\\textcolor{blue}{y}",
    colorFrac: "\\frac{\\color{green}a}{b}",
    // rules
    rule: "a\\rule{1em}{0.5em}b",
    overline: "\\overline{AB}",
    underline: "\\underline{xy}",
    // misc
    dots: "1,2,\\ldots,n\\cdots m",
    infinity: "\\infty\\partial\\nabla\\forall\\exists",
    degree: "90^\\circ",
    percent: "50\\%",
    // display mode
    displayFrac: { tex: "\\frac{a}{b}", display: true },
    displaySum: { tex: "\\sum_{n=1}^\\infty \\frac{1}{n^2}=\\frac{\\pi^2}{6}", display: true },
};

// Formulas as used in CindyJS examples (drawtext/labels with $...$), plus
// typical classroom material. Cinderella macros apply to this set.
const cindyjs = {
    pointA: "A",
    pointB1: "B_1",
    pointC0: "C_{0}",
    fz: "f(z) =",
    fracPiDeg: "\\frac\\pi2=90°",
    fourier1: "\\mathcal{F} \\{f\\}",
    fourier2: "\\mathcal{F^2} \\{f\\} = \\mathcal{R}\\{f\\} ",
    fourier3: "\\mathcal{F^3} \\{f\\} = \\mathcal{R} \\{\\mathcal{F} \\{ f\\}\\}",
    quadLambda: "\\quad\\lambda",
    sqrt5: "\\sqrt5",
    sumPoly: "\\sum_{i=1}^n a_ix^i",
    vecA: "\\vec a",
    vecB: "\\vec{b}",
    coords: "(x_1,y_1)",
    R2: "\\R^2",
    katex1: "\\displaystyle f(x)=\\sum_1^{\\frac{1}{0}}\\frac{1}{x}\\begin{bmatrix}3 & \\sqrt[5]{7}\\\\ i^2 & -345\\end{bmatrix}\\cdot 1",
    pmatrix: "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}",
    vecMatrix: "A=\\begin{pmatrix}1.2345\\\\-0.5\\end{pmatrix}",
    scalarProduct: "\\vec{a}\\cdot\\vec{b}=|\\vec a|\\,|\\vec b|\\cos\\varphi",
    numberSets: "\\N\\subset\\Z\\subset\\Q\\subset\\R\\subset\\C",
    greekMacros: "\\lamda+\\my+\\ny+\\Alpha+\\Omicron",
    arcFunctions: "\\arccot x+\\arcsec y",
    mbox: "\\mbox{Radius }r",
    angleDeg: "\\alpha=45°",
    quadratic: "x_{1,2}=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}",
    pythagoras: "a^2+b^2=c^2",
    euler: "e^{i\\pi}+1=0",
    derivative: "f'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}",
    integral: "\\int_a^b f(x)\\,\\mathrm{d}x=F(b)-F(a)",
    complex: "z=r\\,e^{i\\varphi}=r(\\cos\\varphi+i\\sin\\varphi)",
    mobius: "f(z)=\\frac{az+b}{cz+d}",
    circle: "(x-m_1)^2+(y-m_2)^2=r^2",
    matrix3: "\\begin{pmatrix}1&0&0\\\\0&\\cos t&-\\sin t\\\\0&\\sin t&\\cos t\\end{pmatrix}",
    cases: "|x|=\\begin{cases}x&x\\ge0\\\\-x&x<0\\end{cases}",
    probability: "P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}",
    series: "\\sum_{k=0}^{\\infty}\\frac{x^k}{k!}=e^x",
    set: "\\{x\\in\\R \\mid x>0\\}",
    dots: "a_1,\\dots,a_n",
    text: "\\text{Fläche} = \\pi r^2",
    colored: "\\color{red}{a}+\\color{blue}{b}",
    overline: "\\overline{AB}=5\\,\\mathrm{cm}",
    angleHat: "\\angle ABC",
    triangle: "\\triangle ABC\\cong\\triangle DEF",
    parallel: "g\\parallel h,\\ g\\perp k",
    implies: "A\\Rightarrow B\\Leftrightarrow C",
};

// CindyJS issue #829 (KeTCindy): \vec at the wrong position, missing
// \overrightarrow, later also \fbox, \mathbm and \color. The first three
// are from the test page attached to the issue (drawtext at size 24).
const issue829 = {
    fracSin: "\\frac{\\sin x}{x}",
    vec: "\\vec{a}",
    overrightarrow: "\\overrightarrow{AB}",
    frac: "\\frac{a}{b}",
    // Not a KaTeX command; a Cinderella macro for \boldsymbol.
    mathbm: "\\mathbm{a}",
    bm: "\\bm{a}",
    fbox: "\\fbox{a}",
    color: "\\color{red}{a}b",
};

function readKatexCorpus() {
    const url = new URL("./katex-screenshotter.json", import.meta.url);
    return JSON.parse(readFileSync(url, "utf8"));
}

function normalize(set, name, entry) {
    const e = typeof entry === "string" ? { tex: entry } : entry;
    return {
        id: `${set}/${name}`,
        set,
        name,
        tex: e.tex,
        display: !!e.display,
        macros: e.macros || null,
        noThrow: !!e.noThrow,
        errorColor: e.errorColor || null,
        cindyMacros: set === "cindyjs" || set === "issue829",
    };
}

export function loadCorpus() {
    const cases = [];
    for (const [name, e] of Object.entries(core)) cases.push(normalize("core", name, e));
    for (const [name, e] of Object.entries(cindyjs)) cases.push(normalize("cindyjs", name, e));
    for (const [name, e] of Object.entries(issue829)) cases.push(normalize("issue829", name, e));
    for (const [name, e] of Object.entries(readKatexCorpus())) cases.push(normalize("katex", name, e));
    return cases;
}

// Host font sizes in CSS pixels (KaTeX renders at 1.21 times that). Rounding
// to device pixels plays out differently at every size, so the small sets
// run at several; KaTeX's large screenshot cases run at the middle one.
const SIZES = { core: [13, 20, 32], cindyjs: [13, 20, 32], issue829: [13, 24, 32], katex: [20] };

/** The corpus expanded into one test case per formula and host font size. */
export function loadVariants() {
    const variants = [];
    for (const c of loadCorpus()) {
        for (const px of SIZES[c.set]) variants.push({ ...c, id: `${c.id}@${px}`, hostPx: px });
    }
    return variants;
}
