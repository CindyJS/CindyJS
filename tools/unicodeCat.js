'use strict';

const request = require('request');

create(
    'bmpLetters',
    'https://raw.githubusercontent.com/mathiasbynens/unicode-6.2.0/' +
    'f191533747f716fa02d8bd6fe48cad4f5408b85e/categories/L/code-points.js',
    cp => (cp <= 0xffff)
);

function create(name, url, filter) {
    request(url, (err, resp, body) => {
        if (err) throw err;
        var f = Function("module", body.toString());
        var m = {};
        f(m);
        var cps = m.exports;
        if (filter)
            cps = cps.filter(filter);
        compress(name, cps);
    });
}

function compress(name, cps) {
    var i = 0;
    var deltas = [];
    while (cps.length) {
        var j = cps.shift();
        deltas.push(j - i);
        i = j;
        while (cps[0] === j + 1)
            j = cps.shift();
        deltas.push(j - i);
        i = j;
    }
    var hist = {};
    for (i of deltas)
        hist[i] = (hist[i] || 0) + 1;
    var dict = Object.keys(hist).map(Number);
    dict.sort((a, b) => hist[a] !== hist[b] ? hist[b] - hist[a] : a - b);
    dict.splice(0x02, 0, dict[0x5e]); // "
    dict.splice(0x3c, 0, dict[0x5e]); // \
    dict.splice(0x5f, 2);
    var d = dict.join(', ');
    d = d.replace(/.{70,76},/g, '$&\n   ');
    var bytes = deltas.map(d => dict.indexOf(d) + 0x20);
    var s = bytes.map(
        b => b === 0x22 ? '\\"' : b === 0x5c ? '\\\\' : b < 0x7f ?
            String.fromCharCode(b) : "\\x" + b.toString(16)
    ).join("");
    s = s.replace(/.{65,68}[^\\]{3}/g, '$&" +\n    "');
    s = '"' + s.replace(/^ +/, '') + '"';
    console.log(
        name + ' = decompressRanges([\n    ' + d + '\n], (' + s + '));'
    );
}
