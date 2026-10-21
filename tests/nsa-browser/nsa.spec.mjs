/**
 * nsa in a real browser, driven with the mouse:
 * - the nsa examples (173-175) work without page errors, console errors or
 *   nsa warnings, and show what their text says;
 * - while dragging, a move resolves degenerate elements only within a
 *   budget, and what exceeds it is resolved when the drag ends (budget.html).
 */

import { expect, test } from "@playwright/test";

// Opens a page and collects everything that indicates a problem.
async function open(page, path) {
    const problems = [];
    page.on("pageerror", (e) => problems.push("page error: " + e.message));
    page.on("console", (msg) => {
        if (msg.type() === "error" || (msg.type() === "warning" && /nsa/.test(msg.text())))
            problems.push(msg.type() + ": " + msg.text());
    });
    await page.goto(`${process.env.CINDY_BASE_URL}/${path}`, { waitUntil: "load" });
    return problems;
}

// The screen position of the point (x, y) of the widget in the global `name`.
async function toScreen(page, name, x, y) {
    return page.evaluate(
        ([name, x, y]) => {
            const cdy = window[name];
            const corners = cdy.evalcs("screenbounds()").value.map((p) => {
                const [u, v, w] = p.value.map((z) => z.value.real);
                return [u / w, v / w];
            });
            const [left, top] = corners[0];
            const [right, bottom] = corners[2];
            const r = cdy.canvas.getBoundingClientRect();
            return {
                x: r.left + ((x - left) / (right - left)) * r.width,
                y: r.top + ((top - y) / (top - bottom)) * r.height,
            };
        },
        [name, x, y]
    );
}

// Presses the mouse at `from`, moves it to `to` in steps and, unless `keep`,
// releases it there (both in user coordinates of the widget `name`).
async function drag(page, name, from, to, keep) {
    const a = await toScreen(page, name, from[0], from[1]);
    const b = await toScreen(page, name, to[0], to[1]);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 20 });
    // let the widget process the last move (it traces on animation frames)
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50))));
    if (!keep) await page.mouse.up();
}

// Whether the expression is undefined (NaN or zero) in the widget `name`.
async function isUndefined(page, name, expression) {
    return page.evaluate(
        ([name, expression]) => {
            const v = window[name].evalcs(expression);
            if (!v || v.ctype !== "list") return true;
            const flat = [];
            const add = (w) => (w.ctype === "list" ? w.value.forEach(add) : flat.push(w.value.real, w.value.imag));
            add(v);
            return flat.some((z) => z !== z) || flat.every((z) => z === 0);
        },
        [name, expression]
    );
}

async function coordinates(page, name, expression) {
    return page.evaluate(
        ([name, expression]) => window[name].evalcs(expression).value.map((z) => z.value.real),
        [name, expression]
    );
}

test("173: von Staudt's sum stays defined with the auxiliary point on the base line", async ({ page }) => {
    const problems = await open(page, "examples/173_NSA.html");
    const before = await coordinates(page, "nsa", "S.xy");
    for (const name of ["plain", "nsa"]) await drag(page, name, [-2, 3], [-2, 0]);
    expect(await isUndefined(page, "plain", "S.homog")).toBe(true);
    expect(await isUndefined(page, "nsa", "S.homog")).toBe(false);
    const after = await coordinates(page, "nsa", "S.xy");
    expect(Math.hypot(after[0] - before[0], after[1] - before[1])).toBeLessThan(1e-9);
    expect(problems).toEqual([]);
});

test("174: the radical axis of coinciding circles with free centers stays undefined", async ({ page }) => {
    const problems = await open(page, "examples/174_NSATangentCircles.html");
    await drag(page, "cdy", [2, 0], [-2, 0]);
    expect(await coordinates(page, "cdy", "B.xy")).toEqual([-2, 0]);
    expect(await isUndefined(page, "cdy", "r.homog")).toBe(true);
    // and on to the tangent position, where everything is defined again
    await drag(page, "cdy", [-2, 0], [4, 0]);
    expect(await isUndefined(page, "cdy", "P.homog")).toBe(false);
    expect(await isUndefined(page, "cdy", "r.homog")).toBe(false);
    expect(problems).toEqual([]);
});

test("175: Pappus at degenerate positions, without errors", async ({ page }) => {
    const problems = await open(page, "examples/175_NSAPappus.html");
    const buttons = page.locator("button");
    for (let i = 0; i < (await buttons.count()); i++) {
        await buttons.nth(i).click();
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
    }
    expect(problems).toEqual([]);
});

test("176: Pascal's theorem holds in its degenerate cases", async ({ page }) => {
    const problems = await open(page, "examples/176_NSAPascal.html");
    // |det(X, Y, Z)| relative to the points: 0 if they are collinear
    const collinearity = (name) =>
        page.evaluate(
            (name) =>
                window[name].evalcs(
                    "abs(det([X.homog, Y.homog, Z.homog])) / (abs(X.homog) * abs(Y.homog) * abs(Z.homog))"
                ).value.real,
            name
        );
    // the tangent at A = (4, 0) to k around (0, -3): 4x + 3y = 16
    const isTangentAtA = async (name) => {
        const [a, b, c] = await coordinates(page, name, "ab.homog");
        return Math.abs(b / a - 3 / 4) < 1e-9 && Math.abs(c / a + 4) < 1e-9;
    };
    const buttons = page.locator("button");
    for (let i = 1; i < 4; i++) {
        await buttons.nth(0).click();
        await buttons.nth(i).click();
        expect(await collinearity("nsa")).toBeLessThan(1e-9);
        expect(await isTangentAtA("nsa")).toBe(true);
    }
    // dropped next to A, B snaps onto it
    await buttons.nth(0).click();
    for (const name of ["plain", "nsa"]) await drag(page, name, [3, 1], [3.9, 0.1]);
    expect(await isUndefined(page, "plain", "ab.homog")).toBe(true);
    expect(await isTangentAtA("nsa")).toBe(true);
    expect(await collinearity("nsa")).toBeLessThan(1e-9);
    expect(problems).toEqual([]);
});

test("while dragging, what exceeds the budget is resolved when the drag ends", async ({ page }) => {
    const problems = await open(page, "tests/nsa-browser/budget.html");
    // X is the line g: y = 0
    const isG = async (name) => {
        const x = await coordinates(page, name, "X.homog");
        return Math.abs(x[0]) + Math.abs(x[2]) < 1e-9 * Math.abs(x[1]);
    };
    for (const name of ["small", "big"]) {
        // E onto F, the mouse still down
        await drag(page, name, [-4, 0], [4, 0], true);
        expect(await coordinates(page, name, "E.xy")).toEqual([4, 0]);
        if (name === "small") expect(await isG(name)).toBe(true);
        else expect(await isUndefined(page, name, "X.homog")).toBe(true);
        await page.mouse.up();
        expect(await isG(name)).toBe(true);
    }
    expect(problems).toEqual([]);
});
