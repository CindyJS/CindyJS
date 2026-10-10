/**
 * TeX macros defined specifically for Cinderella / CindyJS, for use with
 * current KaTeX versions.
 *
 * This is the table of the old plugin (tests/katex-canvas/old/katex-plugin.js,
 * written against KaTeX 0.7) minus
 * the workarounds that KaTeX has since made obsolete: `\operatorname` is
 * supported natively now, so it must no longer be mapped to `\text`.
 * `\mathbm` (bold math, used by KeTCindy, see CindyJS issue #829) is new.
 */
export const macros = {
    "\\mbox": "\\text",
    "\\lamda": "\\lambda",
    "\\my": "\\mu",
    "\\ny": "\\nu",
    "\\ypsilon": "\\upsilon",
    "\\Alpha": "\\mathrm{A}",
    "\\Beta": "\\mathrm{B}",
    "\\Epsilon": "\\mathrm{E}",
    "\\Zeta": "\\mathrm{Z}",
    "\\Eta": "\\mathrm{H}",
    "\\Iota": "\\mathrm{I}",
    "\\Kappa": "\\mathrm{K}",
    "\\Lamda": "\\Lambda",
    "\\Mu": "\\mathrm{M}",
    "\\My": "\\Mu",
    "\\Nu": "\\mathrm{N}",
    "\\Ny": "\\Nu",
    "\\Omicron": "\\mathrm{O}",
    "\\Rho": "\\mathrm{P}",
    "\\Tau": "\\mathrm{T}",
    "\\Ypsilon": "\\Upsilon",
    "\\Chi": "\\mathrm{X}",
    "\\dots": "\\ldots",
    "\\C": "\\mathbb{C}",
    "\\H": "\\mathbb{H}",
    "\\N": "\\mathbb{N}",
    "\\P": "\\mathbb{P}",
    "\\Q": "\\mathbb{Q}",
    "\\R": "\\mathbb{R}",
    "\\Z": "\\mathbb{Z}",
    "\\slash": "/",
    "\\arccot": "\\operatorname{arccot}",
    "\\arcsec": "\\operatorname{arcsec}",
    "\\arccsc": "\\operatorname{arccsc}",
    "\\mathbm": "\\boldsymbol",
};

/**
 * The KaTeX options the plugin renders with. `colorIsTextColor` keeps the
 * meaning \color had in KaTeX 0.7 - `\color{red}{a}b` colours only the a,
 * like \textcolor - so that existing content looks as before. Non-LaTeX
 * input is accepted silently, as it was then.
 */
export const katexOptions = {
    macros,
    colorIsTextColor: true,
    strict: "ignore",
    throwOnError: true,
};

/** Source rewriting applied before parsing, as done by the old plugin. */
export function preprocess(tex) {
    return tex.replace(/°/g, "\\degree");
}
