/*
 * Service worker of katex_examples.html, which runs an example with the old
 * and the new KaTeX plugin side by side.
 *
 * An example page loaded with `?katex=old` gets its references to build/js/
 * rewritten to the virtual directory build/js-old-katex/. CindyJS loads its
 * plugins from the directory it was loaded from, so that page then asks for
 * build/js-old-katex/katex-plugin.js etc., which is answered with the old
 * KaTeX 0.7 fork kept in tests/katex-canvas/old; everything else in that
 * directory is build/js/. As the old plugin's files get URLs of their own,
 * the browser cannot mix them up with the new plugin's. Other requests are
 * left alone.
 */

const OLD_DIR = "/build/js-old-katex/";
const OLD_PLUGIN = /\/build\/js-old-katex\/(katex-plugin\.js|webfont\.js|katex\/.*)$/;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

async function oldPage(request) {
    const response = await fetch(request);
    const html = (await response.text()).replace(/((?:\.\.\/)+)build\/js\//g, "$1build/js-old-katex/");
    return new Response(html, { status: response.status, headers: response.headers });
}

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (event.request.mode === "navigate" && url.searchParams.get("katex") === "old") {
        event.respondWith(oldPage(event.request));
    } else if (url.pathname.includes(OLD_DIR)) {
        url.pathname = OLD_PLUGIN.test(url.pathname)
            ? url.pathname.replace(OLD_PLUGIN, "/tests/katex-canvas/old/$1")
            : url.pathname.replace(OLD_DIR, "/build/js/");
        event.respondWith(fetch(url));
    }
});
