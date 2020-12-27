/*
 * This file creates the code for the unicodeLetters regexp fragment
 * used in the tokenizer in Parser.js.  It's not run during normal
 * builds, but instead its output was copied manually.  This script
 * might be re-run if something about that representation or the
 * unicode version in use changes.
 *
 * The general approach is as follows:
 * 1. The unicode 8.0.0 category L (Letter) codepoint list is
 *    downloaded from GitHub and evaluated.  Other categories or
 *    unicode versions might be added if the need arises.
 * 2. The list is destructed into ranges of consecutive codepoints.
 * 3. Now the UTF-16 representation is taken into account. Ranges
 *    spanning multiple high surrogates are split according to the
 *    high surrogate. Resulting ranges for which *any* low surrogate
 *    are permissible are treated specially, since they are combined
 *    into a single […] for high surrogates, followed by
 *    [\uDC00-\uDFFF] to match any low surrogate.
 * 4. The absolute code points are turned into deltas, both between
 *    the first and the last codepoint of a range and between the last
 *    codepoint of one range and the first codepoint of the next
 *    range.  A new high surrogate resets the the reference counter to
 *    the first codepoint associated with that high surrogate.
 * 5. A histogram identifies often-used delta values. These will be
 *    encoded using single characters of a string literal. Less often
 *    used values will use hexadecimal or even unicode escape
 *    sequences.  The escape sequences for \\ and \" fall somewhere
 *    between single characters and hexadecimal escapes.
 * 6. The output consists of three parts.  The first is an array of
 *    numbers.  It represents the dictionary used to turn characters
 *    back into deltas.  Next comes the string literal representing
 *    all the deltas, and finally the high surrogate ranges for which
 *    arbitrary low surrogates are permissible.
 *
 * The code to decompress this is in Parser.js, and in Parser_test.js
 * there is a verbatim version of the resulting uncompressed regexp.
 */

"use strict";

const request = require("request");

create(
    "unicodeLetters",
    "https://raw.githubusercontent.com/mathiasbynens/unicode-8.0.0/" +
        "6c90bf689389b448032cda7ff935f36e8872eebf/categories/L/code-points.js"
);

function create(name, url, filter) {
    request(url, (err, resp, body) => {
        if (err) throw err;
        var f = Function("module", body.toString());
        var m = {};
        f(m);
        var cps = m.exports;
        if (filter) cps = cps.filter(filter);
        compress(name, cps);
    });
}

function compress(name, cps) {
    var lo, hi;
    var ranges = [];
    var surrogateRanges = []; // ranges of the form […][\uDC00-\uDFFF]
    while (cps.length) {
        lo = hi = cps.shift();
        while (cps[0] === hi + 1) hi = cps.shift();
        if (lo <= 0xffff && hi > 0xffff) {
            ranges.push({ lo: lo, hi: 0xffff });
            lo = 0x10000;
        }
        if (lo > 0xffff) {
            // astral plane
            while ((lo & ~0x3ff) !== (hi & ~0x3ff)) {
                // different high surrogate
                if ((lo & 0x3ff) !== 0) {
                    ranges.push({ lo: lo, hi: lo | 0x3ff });
                    lo = (lo | 0x3ff) + 1;
                    continue;
                }
                if ((hi & 0x3ff) === 0x3ff) {
                    break;
                }
                ranges.push({ lo: hi & ~0x3ff, hi: hi });
                hi = (hi & ~0x3ff) - 1;
            }
            if ((lo & 0x3ff) === 0 && (hi & 0x3ff) === 0x3ff) {
                surrogateRanges.push({ lo: lo, hi: hi });
                continue;
            }
        }
        ranges.push({ lo: lo, hi: hi });
    }

    surrogateRanges = surrogateRanges
        .sort((a, b) => a.lo - b.lo)
        .map((r) => {
            return { lo: (r.lo - 0x10000) >> 10, hi: (r.hi - 0x10000) >> 10 };
        });
    var surrogateHi = "";
    var i, j;
    for (i = 0; i < surrogateRanges.length; ++i) {
        if (i + 1 < surrogateRanges.length && surrogateRanges[i].hi + 1 === surrogateRanges[i + 1].lo)
            surrogateRanges[i + 1].lo = surrogateRanges[i].lo;
        else {
            lo = surrogateRanges[i].lo | 0xd800;
            hi = surrogateRanges[i].hi | 0xd800;
            surrogateHi += "\\u" + lo.toString(16);
            if (lo !== hi) {
                if (lo !== hi + 1) surrogateHi += "-";
                surrogateHi += "\\u" + hi.toString(16);
            }
        }
    }

    var deltas = [];
    var prevHi = "";
    i = 0;
    while (ranges.length) {
        var range = ranges.shift();
        var curHi = range.lo <= 0xffff ? "" : String.fromCharCode(((range.lo - 0x10000) >> 10) | 0xd800);
        if (curHi !== prevHi) {
            deltas.push(curHi);
            prevHi = curHi;
            i = range.lo & ~0x3ff;
        }
        deltas.push(range.lo - i);
        deltas.push(range.hi - range.lo);
        i = range.hi;
    }
    var hist = {};
    for (i of deltas) if (typeof i !== "string") hist[i] = (hist[i] || 0) + 1;
    var dict = Object.keys(hist).map(Number);
    dict.sort((a, b) => (hist[a] !== hist[b] ? hist[b] - hist[a] : a - b));
    dict.splice(0x02, 0, dict[0x5e]); // "
    dict.splice(0x3c, 0, dict[0x5e]); // \
    dict.splice(0x5f, 2);
    var d = dict.join(", ");
    d = d.replace(/.{70,76},/g, "$&\n   ");
    var s = deltas
        .map((d) => {
            if (typeof d === "string") return "\\u" + d.charCodeAt(0).toString(16);
            d = dict.indexOf(d) + 0x20;
            if (d === 0x22) return '\\"';
            if (d === 0x5c) return "\\\\";
            if (d < 0x7f) return String.fromCharCode(d);
            return "\\x" + d.toString(16);
        })
        .join("");
    s = s.replace(/.{65,68}[^\\]{3}/g, '$&" +\n    "');
    s = '"' + s.replace(/^ +/, "") + '"';

    console.log(name + " = decompressRanges([\n    " + d + "\n], (" + s + '\n), "' + surrogateHi + '");');
}
