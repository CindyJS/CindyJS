// CindyScript to JavaScript translator

"use strict";

var Q = require("q");
var qfs = require("q-io/fs");
var parse = require("../src/js/libcs/Parser.js").parse;

if (!String.prototype.startsWith) { // ES6 compatibility
    String.prototype.startsWith = function(searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

var moduleName = "csAssets";

var ops = {
    "+": "General.add",
    "-": "General.sub",
    "*": "General.mult",
    "/": "General.div",
    "_": "evaluator.take$2",
    "%": "evaluator.or$2",
    "!=": "comp_notequals",
    "~!=": "comp_notalmostequals",
    "!": "prefix_not",
};

var jscode = ["var " + moduleName + " = {};"];

function Visitor(head, body) {
    this.name = head.name;
    var args = head.args.map(function(arg) { return arg.name; });
    this.local = {};
    for (var i = 0; i < args.length; ++i)
        this.local[args[i]] = args[i];
    var fqn = moduleName + "." + head.name;
    jscode.push("");
    jscode.push(fqn + " = function (" + args.join(", ") + ") {");
    this.indent = "    ";
    var res = this.visit(body);
    jscode.push(this.indent + "return " + res + ";");
    jscode.push("};");
}

Visitor.prototype.isLocal = function(vname) {
    return this.local[vname] !== undefined;
};

Visitor.prototype.statement = function(expr) {
    var res = this.visit(expr);
    if (res !== null)
        jscode.push(this.indent + res + ";");
};

Visitor.prototype.visit = function(expr) {
    if (typeof expr === "string")
        return expr; // presumably already converted.
    switch (expr.ctype) {
    case "infix":
        switch (expr.oper) {
        case ";":
            if (expr.args[1].ctype === "void") {
                return this.visit(expr.args[0]);
            } else {
                this.statement(expr.args[0]);
                return this.visit(expr.args[1]);
            }
            break;
        case "=":
            if (expr.args[0].ctype === "variable") {
                if (this.isLocal(expr.args[0].name)) {
                    return this.local[expr.args[0].name] + " = " +
                        this.visit(expr.args[1]);
                } else {
                    return this.jscall("namespace.setvar", [
                        JSON.stringify(expr.args[0].name),
                        expr.args[1]]);
                }
            } else {
                throw Error("Only know how to assign to variables");
            }
        case "!=":
        case "!":
        case "~!=":
            return this.cscall(ops[expr.oper], expr.args);
        default:
            if (ops.hasOwnProperty(expr.oper)) {
                if (ops[expr.oper].startsWith("evaluator.")) {
                    return this.cscall(ops[expr.oper], expr.args);
                } else {
                    return this.jscall(ops[expr.oper], expr.args);
                }
            }
            throw Error("Operator unsupported: " + expr.oper);
        }
        break;
    case "function":
        var key1 = "fun_" + expr.oper;
        var key2 = "fun_" + expr.name;
        if (this[key1]) {
            return this[key1](expr.args, expr.modifs);
        } else if (this[key2]) {
            return this[key2](expr.args, expr.modifs);
        } else {
            return this.cscall(
                "evaluator." + expr.oper, expr.args, expr.modifs);
        }                    
        break;
    case "variable":
        if (this.isLocal(expr.name)) {
            return this.local[expr.name];
        } else {
            return this.jscall("namespace.getvar", [
                JSON.stringify(expr.name)]);
        }
    case "number":
        return this.jscall("CSNumber.complex", [
            expr.value.real, expr.value.imag].map(String));
    case "string":
        return this.jscall("General.string", [JSON.stringify(expr.value)]);
    case "void":
        return "{ctype:'void'}";
    default:
        throw Error("Construct unsupported: " + expr.ctype);
    }
};

Visitor.prototype.jscall = function(name, args) {
    return [
        name,
        "(",
        args.map(this.visit, this).join(", "),
        ")"
    ].join("");
};

Visitor.prototype.cscall = function(name, args, modifs) {
    modifs = modifs || {};
    var keys = Object.keys(modifs).slice();
    keys.sort();
    var modifs = keys.map(function(key) {
        return key + ": " + this.visit(modifs[key])
    }, this);
    return [
        name,
        "([",
        args.map(this.visit, this).join(", "),
        "], {",
        modifs.join(", "),
        "})"
    ].join("");
};

Visitor.prototype.fun_regional = function(args, modifs) {
    var vars = args.map(function(arg) { return arg.name; });
    this.local = Object.create(this.local);
    for (var i = 0; i < vars.length; ++i)
        this.local[vars[i]] = vars[i];
    return "var " + vars.join(", ");
};

Visitor.prototype.fun_genList = function(args, modifs) {
    return "List.turnIntoCSList([" +
        args.map(this.visit, this).join(", ") + "])";
};

Visitor.prototype.fun_if$2 = function(args, modifs) {
    var cond = args[0];
    var thenBody = args[1];
    var indent = this.indent;
    jscode.push(
        indent + "if ((" + this.visit(cond) + ").value === true) {");
    this.indent = indent + "    ";
    this.statement(thenBody);
    jscode.push(indent + "}");
    this.indent = indent;
};

Visitor.prototype.fun_repeat$3 = function(args, modifs) {
    var count = args[0];
    var v = args[1];
    var body = args[2];
    var indent = this.indent;
    var local = this.local;
    jscode.push(
        indent + "for (var " + v.name + " = 1; " +
            v.name + " <= " + this.visit(count) + ".value.real; " +
            "++" + v.name + ") {");
    this.indent = indent + "    ";
    this.local = Object.create(this.local);
    this.local[v.name] = "CSNumber.real(" + v.name + ")";
    this.statement(body);
    jscode.push(indent + "}");
    this.indent = indent;
    this.local = local;
    return null;
};

function top(cscode) {
    switch (cscode.ctype) {
    case "infix":
        switch (cscode.oper) {
        case ";":
            cscode.args.forEach(top);
            break;
        case ":=":
            if (cscode.args[0].ctype !== "function")
                throw Error("Only function definitions allowed.");
            new Visitor(cscode.args[0], cscode.args[1]);
            break;
        default:
            throw Error("Operator unsupported at top level: " + cscode.oper);
        }
        break;
    case "void":
        break;
    case "error":
        throw cscode;
    default:
        throw Error("Unsupported top level construct: " + cscode.ctype);
    }
}

function serialize() {
    return jscode.join("\n") + "\n";
}

function loadFile(path) {
    return qfs.read(path).then(parse);
}

function compileFiles(files) {
    return Q.all(files.map(loadFile)).then(function(codes) {
        codes.forEach(top);
        return serialize();
    });
}

module.exports.compileFiles = compileFiles;

if (require.main === module) {
    return compileFiles(process.argv.slice(2)).done(function(res) {
        process.stdout.write(res);
    });
}
