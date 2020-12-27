//==========================================
//      Namespace and Vars
//==========================================

var namespace = {};

// Initialize preset variables
namespace.vars = (function () {
    var preset = {
        pi: CSNumber.real(Math.PI),
        π: CSNumber.real(Math.PI),
        i: CSNumber.complex(0, 1),
        true: General.bool(true),
        false: General.bool(false),
        "#": nada,
        nil: List.turnIntoCSList([]),
        newline: General.string("\n"),
        tab: General.string("\t"),
    };
    var vars = [];
    for (var name in preset) vars[name] = [preset[name]];
    return vars;
})();

namespace.isVariable = function (name) {
    return this.vars.hasOwnProperty(name);
};

namespace.create = function (name) {
    if (this.vars.hasOwnProperty(name)) return this.vars[name];
    var v = [null];
    this.vars[name] = v;
    return v;
};

namespace.newvar = function (name) {
    var v = this.vars[name];
    v.push(nada); // nada not null for deeper levels
    return v;
};

namespace.removevar = function (name) {
    var stack = this.vars[name];
    if (stack.length === 0) console.error("Removing non-existing " + name);
    stack.pop();
    if (stack.length === 0) console.warn("Removing last " + name);
};

namespace.setvar = function (name, val) {
    var stack = this.vars[name];
    if (stack.length === 0) console.error("Setting non-existing variable " + name);
    if (val === undefined) {
        console.error("Setting variable " + name + " to undefined value");
        val = nada;
    }
    if (val.ctype === "undefined") {
        stack[stack.length - 1] = val;
        return;
    }
    var erg = val;
    if (erg === null) erg = nada; // explicit setting does lift unset state
    stack[stack.length - 1] = erg;
};

namespace.undefinedWarning = {};

namespace.getvar = function (name) {
    var stack = this.vars[name] || [];
    if (stack.length === 0) console.error("Getting non-existing variable " + name);
    var erg = stack[stack.length - 1];
    if (erg === null) {
        if (csgeo.csnames.hasOwnProperty(name)) {
            return {
                ctype: "geo",
                value: csgeo.csnames[name],
            };
        } else {
            if (console && console.log && this.undefinedWarning[name] === undefined) {
                this.undefinedWarning[name] = true;
                console.log("Warning: Accessing undefined variable: " + name);
            }
        }
        return nada;
    }
    return erg;
};

namespace.dump = function (name) {
    var stack = this.vars[name];
    console.log("*** Dump " + name);

    for (var i = 0; i < stack.length; i++) {
        console.log(i + ":> " + niceprint(stack[i]));
    }
};

namespace.vstack = [];

namespace.pushVstack = function (v) {
    this.vstack.push(v);
};
namespace.popVstack = function () {
    this.vstack.pop();
};

namespace.cleanVstack = function () {
    var st = this.vstack;
    while (st.length > 0 && st[st.length - 1] !== "*") {
        this.removevar(st[st.length - 1]);
        st.pop();
    }
    if (st.length > 0) {
        st.pop();
    }
};
