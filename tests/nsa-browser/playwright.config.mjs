import { defineConfig, devices } from "@playwright/test";

/**
 * nsa in the browser (`npm run test:nsa-browser`, after `node make Cindy.js`):
 * the nsa examples driven with the mouse, and the bounded cost per move
 * while dragging. See nsa.spec.mjs.
 */
export default defineConfig({
    testDir: ".",
    testMatch: /.*\.spec\.mjs/,
    globalSetup: "./global-setup.mjs",
    timeout: 60_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
    use: {
        ...devices["Desktop Chrome"],
        headless: true,
        viewport: { width: 1200, height: 900 },
        launchOptions: { args: ["--no-sandbox"] },
    },
});
