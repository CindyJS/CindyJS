/**
 * Collects the per-case results of the KaTeX canvas suite into a gallery
 * (build/katex-canvas/index.html) and a summary, and regenerates
 * expectations.json when KATEX_CANVAS_UPDATE is set.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { REPO_ROOT } from "./paths.mjs";

export const OUT_DIR = join(REPO_ROOT, "build/katex-canvas");
export const EXPECTATIONS_FILE = join(REPO_ROOT, "tests/katex-canvas/expectations.json");

export function fileName(id) {
    return id.replace(/[^A-Za-z0-9_-]/g, "_");
}

function escape(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function fmt(stats) {
    return stats ? (100 * stats.score).toFixed(2) + "%" : "–";
}

function shiftText(stats) {
    if (!stats || !stats.shift) return "";
    const s = stats.shift;
    return `ink edges Δ l${s.left} r${s.right} t${s.top} b${s.bottom}`;
}

const ORDER = { fail: 0, unsupported: 1, error: 2, pass: 3 };

export async function writeReport() {
    const dir = join(OUT_DIR, "results");
    let files;
    try {
        files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    } catch {
        return;
    }
    const results = files.map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
    if (results.length === 0) return;
    results.sort(
        (a, b) =>
            ORDER[a.status] - ORDER[b.status] ||
            (b.new ? b.new.score : 0) - (a.new ? a.new.score : 0) ||
            a.id.localeCompare(b.id)
    );

    const counts = {};
    let betterThanOld = 0;
    let comparedToOld = 0;
    for (const r of results) {
        counts[r.status] = (counts[r.status] || 0) + 1;
        if (r.new && r.old) {
            ++comparedToOld;
            if (r.new.score <= r.old.score) ++betterThanOld;
        }
    }
    const summary = { total: results.length, counts, betterThanOld, comparedToOld };
    writeFileSync(join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

    if (process.env.KATEX_CANVAS_UPDATE) {
        // Notes explaining known deviations are kept across updates.
        const previous = JSON.parse(readFileSync(EXPECTATIONS_FILE, "utf8"));
        const expectations = {};
        for (const r of results) {
            if (r.status === "fail" || r.status === "unsupported") {
                expectations[r.id] = { status: r.status, score: Math.round(r.new.score * 1e4) / 1e4 };
                if (previous[r.id] && previous[r.id].note) expectations[r.id].note = previous[r.id].note;
            }
        }
        const sorted = Object.fromEntries(
            Object.keys(expectations)
                .sort()
                .map((k) => [k, expectations[k]])
        );
        writeFileSync(EXPECTATIONS_FILE, JSON.stringify(sorted, null, 4) + "\n");
    }

    const rows = results
        .map((r) => {
            const img = r.status === "error" ? "" : `<img loading="lazy" src="img/${fileName(r.id)}.png">`;
            const details = [
                r.unsupported && r.unsupported.length ? `unsupported: ${r.unsupported.join(", ")}` : "",
                r.error ? `error: ${r.error}` : "",
                r.oldError ? `old fork: ${r.oldError}` : "",
                ...(r.problems || []),
                r.note ? `note: ${r.note}` : "",
                shiftText(r.new),
            ]
                .filter(Boolean)
                .map(escape)
                .join("<br>");
            return `<tr class="${r.status}" data-set="${r.set}">
<td><b>${escape(r.id)}</b><br><span class="status">${r.status}</span></td>
<td class="num">${fmt(r.new)}</td><td class="num">${fmt(r.old)}</td>
<td><code>${escape(r.tex)}</code><div class="details">${details}</div>${img}</td></tr>`;
        })
        .join("\n");

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>KaTeX canvas comparison</title>
<style>
body { font: 14px system-ui, sans-serif; margin: 16px; color: #222; background: #fafafa; }
table { border-collapse: collapse; width: 100%; }
td { border-top: 1px solid #ddd; padding: 8px; vertical-align: top; }
td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
tr.fail .status { color: #c00; } tr.unsupported .status { color: #b60; }
tr.pass .status { color: #080; } tr.error .status { color: #666; }
code { white-space: pre-wrap; word-break: break-all; font-size: 12px; }
.details { color: #666; font-size: 12px; margin: 4px 0; }
img { display: block; max-width: 100%; margin-top: 6px; border: 1px solid #ccc; image-rendering: pixelated; }
.bar button { margin-right: 6px; }
.legend { color: #555; }
</style></head><body>
<h1>KaTeX canvas backend vs. HTML reference</h1>
<p>${results.length} formulas: ${Object.entries(counts)
        .map(([k, v]) => `${v} ${k}`)
        .join(", ")}. New backend at least as close to the reference as the old fork in
${betterThanOld} of ${comparedToOld} cases the old fork could render.</p>
<p class="legend">Images: reference (KaTeX HTML) | new canvas backend | diff | old KaTeX 0.7 fork | diff.
In the diffs, red marks ink only in the reference and blue ink only in the canvas.
Scores are mismatched pixels per inked reference pixel.</p>
<p class="bar">Show: <button data-f="all">all</button><button data-f="fail">fail</button>
<button data-f="unsupported">unsupported</button><button data-f="pass">pass</button><button data-f="error">error</button>
&nbsp; Set: <button data-s="all">all</button><button data-s="core">core</button>
<button data-s="cindyjs">cindyjs</button><button data-s="issue829">issue829</button><button data-s="katex">katex</button></p>
<table><thead><tr><td>case</td><td>new</td><td>old</td><td>formula</td></tr></thead><tbody>
${rows}
</tbody></table>
<script>
let f = "all", s = "all";
function apply() {
    for (const tr of document.querySelectorAll("tbody tr")) {
        tr.hidden = (f !== "all" && tr.className !== f) || (s !== "all" && tr.dataset.set !== s);
    }
}
document.querySelectorAll("button[data-f]").forEach((b) => b.onclick = () => { f = b.dataset.f; apply(); });
document.querySelectorAll("button[data-s]").forEach((b) => b.onclick = () => { s = b.dataset.s; apply(); });
</script>
</body></html>
`;
    writeFileSync(join(OUT_DIR, "index.html"), html);
}

/** Gallery of the example comparison (examples.spec.mjs). */
export async function writeExamplesReport() {
    const dir = join(OUT_DIR, "examples");
    let files;
    try {
        files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    } catch {
        return;
    }
    if (files.length === 0) return;
    const results = files.map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
    results.sort((a, b) => b.stats.score - a.stats.score || a.path.localeCompare(b.path));
    const list = (xs) => (xs.length ? escape(xs.join("\n")) : "");
    const rows = results
        .map((r) => {
            const notes = [
                r.animated ? "animated: the two runs show different moments" : "",
                `KaTeX glyphs drawn: old ${r.glyphs.old}, new ${r.glyphs.new}`,
                r.new.errors.length ? `new page errors: ${list(r.new.errors)}` : "",
                r.new.consoleErrors.length ? `new console errors: ${list(r.new.consoleErrors)}` : "",
                r.old.consoleErrors.length ? `old console errors: ${list(r.old.consoleErrors)}` : "",
                r.new.failed.length ? `failed requests: ${list(r.new.failed)}` : "",
            ]
                .filter(Boolean)
                .join("<br>");
            return `<tr><td><b>${escape(r.path)}</b><br><a href="../../${escape(r.path)}">open</a></td>
<td class="num">${(100 * r.stats.score).toFixed(2)}%</td>
<td><div class="details">${notes}</div><img loading="lazy" src="examples/${fileName(r.path)}.png"></td></tr>`;
        })
        .join("\n");
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>KaTeX plugin: examples, old vs. new</title>
<style>
body { font: 14px system-ui, sans-serif; margin: 16px; color: #222; background: #fafafa; }
table { border-collapse: collapse; width: 100%; }
td { border-top: 1px solid #ddd; padding: 8px; vertical-align: top; }
td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.details { color: #666; font-size: 12px; margin: 4px 0; white-space: pre-wrap; }
img { display: block; max-width: 100%; margin-top: 6px; border: 1px solid #ccc; }
</style></head><body>
<h1>KaTeX plugin: examples with the old (0.7 fork) and the new plugin</h1>
<p>${results.length} examples. Images: old plugin | new plugin | diff (red: only in the old rendering, blue: only
in the new). Percentages are mismatched pixels per inked pixel of the old rendering.</p>
<table><tbody>
${rows}
</tbody></table>
</body></html>
`;
    writeFileSync(join(OUT_DIR, "examples.html"), html);
}
