"use strict";

var fs = require("fs");

var reScript = /(<script[^>]*>)([^]*?)(<\/script>)/img;
var reCreateCindy = /createCindy\(/m;
// var reData = /var data = (\{[^]*?^\});\s*$/m;

process.argv.slice(2).forEach(handleFileName);

function handleFileName(path) {
    fs.readFile(path, {encoding: "utf-8"}, handleFileData.bind(null, path));
}

function createCindyDummy(constr, data) {
    constr.data = data;
}

function jsQueryDummy(constr, arg) {
    return {
        ready: function(cb) { cb(); },
        attr: function(name, val) { constr.attrs[name] = val; },
        css: function(name, val) { constr.attrs[name] = val; },
    };
}

function handleFileData(path, err, str) {
    if (err) throw err;
    var script, scripts = [];
    while ((script = reScript.exec(str))) {
        scripts.push(script);
    }
    var n = scripts.length;
    var modified = false;
    while (n > 0) {
        var script = scripts[--n];
        if (!reCreateCindy.test(script[2]))
            continue;
        var constr = {attrs: {}};
        var f = new Function("createCindy", "document", "$", script[2]);
        f(createCindyDummy.bind(null, constr),
          "document", jsQueryDummy.bind(null, constr));
        var data = constr.data;
        if (constr.attrs.width !== undefined) {
            var port = {
                width: constr.attrs.width,
                height: constr.attrs.height
            };
            if (constr.attrs["background-color"]) {
                port.background = constr.attrs["background-color"];
            }
            if (data.canvasname !== undefined) {
                port.id = data.canvasname;
                delete data.canvasname;
            }
            if (data.transform !== undefined) {
                port.transform = data.transform;
                delete data.transform;
            }
            data.ports = [port];
        }
        if (data.ports &&
            data.ports.length === 1 &&
            data.ports[0].width &&
            data.ports[0].height &&
            data.ports[0].transform &&
            data.ports[0].transform.length === 1 &&
            data.ports[0].transform[0].scaleAndOrigin) {
            var port = data.ports[0];
            var transform = port.transform;
            var sao = transform[0].scaleAndOrigin;
            var scale = sao[0];
            var tx = sao[1];
            var ty = sao[2] - port.height;
            var left = -tx/scale;
            var top = -ty/scale;
            var right = (port.width - tx)/scale;
            var bottom = -(port.height + ty)/scale;
            transform[0] = { visibleRect: [left, top, right, bottom] };
        }
        var res = myStringify(data, "top");
        res = "\nvar cdy = createCindy(" + res + ");\n";
        if (res === script[2])
            continue;
        str = str.substr(0, script.index) + script[1] + res + script[3] +
            str.substr(script.index + script[0].length);
        modified = true;
    }
    if (modified) {
        fs.writeFile(path, str, function(err) { if (err) throw err; });
    }
}

function orderCmp(order, a, b) {
    var ia = order.indexOf(a), ib = order.indexOf(b);
    if (ia === -1) ia = order.indexOf("*");
    if (ib === -1) ib = order.indexOf("*");
    if (ia !== ib) return ia - ib;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

var orderMap = {
    "top": orderCmp.bind(null, [
        "*",
        "scripts",
        "defaultAppearance",
        "images",
        "ports",
        "geometry",
        "behavior",
    ]),
    "ports": orderCmp.bind(null, [
        "id",
        "width",
        "height",
        "background",
        "transform",
        "*",
    ]),
    "geometry": orderCmp.bind(null, [
        "name",
        "kind",
        "type",
        "args",
        "pos",
        "sx", "sy", "sz",
        "dir",
        "radius",
        "pinned",
        "*",
        "plane",
        "size",
        "textsize",
        "color",
        "alpha",
        "labeled",
        "printname",
        "pointborder",
        "visible",
    ]),
    "behavior": orderCmp.bind(null, [
        "name",
        "behavior",
        "*",
    ]),
    "behavior/behavior": orderCmp.bind(null, [
        "type",
        "mass",
        "friction",
        "stype",
        "strength",
        "gravity",
        "deltat",
        "accuracy",
        "*",
    ]),
};

var orderDefault = orderCmp.bind(null, ["*"]);

function myStringify(data, mode) {
    var indent = false;
    if (data instanceof Array) {
        var elts = data.map(function(elt) {
            return myStringify(elt, mode);
        });
        if (mode === "geometry" || mode === "behavior")
            indent = "  ";
        return "[" + myJoin(elts, indent) + "]";
    }
    if (typeof data === "object") {
        var cmp = orderMap[mode] || orderDefault;
        var elts = Object.keys(data).sort(cmp).map(function(key) {
            var eltMode = mode + "/" + key;
            if (mode === "top")
                eltMode = key;
            var val = myStringify(data[key], eltMode);
            return key + ": " + val;
        });
        if (mode === "top") indent = "";
        if (mode === "ports" || mode === "images") indent = "  ";
        return "{" + myJoin(elts, indent) + "}";
    }
    return JSON.stringify(data);
}

function myJoin(elts, indent) {
    if (elts.length === 0) return "";
    if (indent !== false)
        return "\n  " + indent + elts.join(",\n  " + indent) + "\n" + indent;
    return elts.join(", ");
}
