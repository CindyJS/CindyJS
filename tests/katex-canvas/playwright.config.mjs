import { defineConfig, devices } from "@playwright/test";

/**
 * KaTeX canvas backend comparison (`npm run test:katex-canvas`).
 *
 * Every formula of the corpus is rendered by KaTeX as HTML (the reference),
 * by the new canvas backend and by the old KaTeX 0.7 canvas fork, all in the
 * same headless chromium, and the canvas images are diffed against the
 * reference. See katex-canvas.spec.mjs for the pass criteria and
 * build/katex-canvas/index.html for the resulting gallery.
 */
export default defineConfig({
    testDir: ".",
    testMatch: /.*\.spec\.mjs/,
    globalSetup: "./global-setup.mjs",
    timeout: 30_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI ? [["github"], ["dot"]] : [["dot"]],
    use: {
        ...devices["Desktop Chrome"],
        headless: true,
        viewport: { width: 4000, height: 2400 },
        deviceScaleFactor: 1,
        // Canvas text is always anti-aliased in grayscale, HTML text uses
        // subpixel anti-aliasing where the system is set up for it (as on
        // CI runners); keep it grayscale everywhere, so they can be compared.
        launchOptions: { args: ["--no-sandbox", "--disable-lcd-text"] },
    },
    projects: [
        { name: "formulas", testMatch: /(katex-canvas|plugin)\.spec\.mjs/ },
        {
            // The example pages include one CindyGL example, which needs
            // software WebGL. Those flags change how
            // chromium rasterizes, so the pixel comparison of the formulas
            // runs without them.
            name: "examples",
            testMatch: /examples\.spec\.mjs/,
            use: {
                launchOptions: {
                    args: [
                        "--use-angle=swiftshader",
                        "--enable-unsafe-swiftshader",
                        "--no-sandbox",
                        "--disable-lcd-text",
                    ],
                },
            },
        },
    ],
});
