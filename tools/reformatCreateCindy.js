"use strict";

require("./processFiles")(processFileData);

var reScript = /(<script[^>]*>)([^]*?)(<\/script>)/gim;
var reCreateCindy = /(CindyJS|createCindy)\(/m;

function CindyJSDummy(constr, data) {
    constr.data = data;
}

function jsQueryDummy(constr, arg) {
    return {
        ready: function (cb) {
            cb();
        },
        attr: function (name, val) {
            constr.attrs[name] = val;
        },
        css: function (name, val) {
            constr.attrs[name] = val;
        },
    };
}

function processFileData(path, str) {
    var script,
        scripts = [];
    while ((script = reScript.exec(str))) {
        scripts.push(script);
    }
    var n = scripts.length;
    var modified = false;
    while (n > 0) {
        var script = scripts[--n];
        if (!reCreateCindy.test(script[2])) continue;
        var constr = { attrs: {} };
        var defaultAppearance = {};
        var dummy = CindyJSDummy.bind(null, constr);
        var f = new Function("CindyJS", "createCindy", "document", "$", "defaultAppearance", script[2]);
        f(dummy, dummy, "document", jsQueryDummy.bind(null, constr), defaultAppearance);
        var data = constr.data;
        if (data.defaultAppearance === undefined && Object.keys(defaultAppearance).length !== 0)
            data.defaultAppearance = defaultAppearance;
        if (constr.attrs.width !== undefined) {
            var port = {
                width: constr.attrs.width,
                height: constr.attrs.height,
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
        if (
            data.ports &&
            data.ports.length === 1 &&
            data.ports[0].width &&
            data.ports[0].height &&
            data.ports[0].transform &&
            data.ports[0].transform.length === 1 &&
            data.ports[0].transform[0].scaleAndOrigin
        ) {
            var port = data.ports[0];
            var transform = port.transform;
            var sao = transform[0].scaleAndOrigin;
            var scale = sao[0];
            var tx = sao[1];
            var ty = sao[2] - port.height;
            var left = -tx / scale;
            var top = -ty / scale;
            var right = (port.width - tx) / scale;
            var bottom = -(port.height + ty) / scale;
            transform[0] = { visibleRect: [left, top, right, bottom] };
        }
        if (data.geometry) {
            data.geometry.forEach(function (el) {
                if (el.sx !== undefined && el.sy !== undefined) {
                    if (!el.pos) {
                        if (el.sz !== undefined) el.pos = [el.sx, el.sy, el.sz];
                        else el.pos = [el.sx, el.sy];
                    }
                    delete el.sx;
                    delete el.sy;
                    delete el.sz;
                }
            });
        }
        var res = myStringify(data, "top");
        res = "\nvar cdy = CindyJS(" + res + ");\n";
        if (res === script[2]) continue;
        str = str.substr(0, script.index) + script[1] + res + script[3] + str.substr(script.index + script[0].length);
        modified = true;
    }
    if (modified) return str;
}

function orderCmp(order, a, b) {
    var ia = order.indexOf(a),
        ib = order.indexOf(b);
    if (ia === -1) ia = order.indexOf("*");
    if (ib === -1) ib = order.indexOf("*");
    if (ia !== ib) return ia - ib;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

var orderMap = {
    top: orderCmp.bind(null, ["*", "scripts", "defaultAppearance", "images", "ports", "geometry", "behavior"]),
    ports: orderCmp.bind(null, ["id", "fill", "width", "height", "background", "transform", "*"]),
    geometry: orderCmp.bind(null, [
        "name",
        "kind",
        "type",
        "args",
        "pos",
        "sx",
        "sy",
        "sz",
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
    behavior: orderCmp.bind(null, ["name", "behavior", "*"]),
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
        var elts = data.map(function (elt) {
            return myStringify(elt, mode);
        });
        if (mode === "geometry" || mode === "behavior") indent = "  ";
        return "[" + myJoin(elts, indent) + "]";
    }
    if (typeof data === "object") {
        var cmp = orderMap[mode] || orderDefault;
        var elts = Object.keys(data)
            .sort(cmp)
            .map(function (key) {
                var eltMode = mode + "/" + key;
                if (mode === "top") eltMode = key;
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
    if (indent !== false) return "\n  " + indent + elts.join(",\n  " + indent) + "\n" + indent;
    return elts.join(", ");
}
