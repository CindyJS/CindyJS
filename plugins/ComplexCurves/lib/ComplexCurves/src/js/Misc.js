var Misc = {};

/**
 * @param {number} x
 * @param {number} y
 * @param {number} mu
 * @return {number}
 */
Misc.lerp = function(x, y, mu) {
    return x + mu * (y - x);
};

/**
 * @param {Array<string>} files
 * @param {function(Array<string>)} onload
 */
Misc.loadTextFiles = function(files, onload) {
    var sources = [],
        count = 0;
    files.forEach(function(file, i, files) {
        var req = new XMLHttpRequest();
        req.open("GET", file, true);
        req.responseType = "text";
        req.onload = function() {
            sources[i] = req.responseText;
            if (++count == files.length)
                onload(sources);
        };
        req.send();
    });
};
