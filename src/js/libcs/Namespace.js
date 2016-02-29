//==========================================
//      Namespace and Vars
//==========================================

var namespace = {};

// Initialize preset variables
namespace.vars = (function() {
    var preset = {
        pi: CSNumber.real(Math.PI),
        'π': CSNumber.real(Math.PI),
        i: CSNumber.complex(0, 1),
        'true': General.bool(true),
        'false': General.bool(false),
        '#': nada,
        'nil': List.turnIntoCSList([]),
        'newline': General.string('\n'),
        'tab': General.string('\t'),
    };
    var vars = [];
    for (var name in preset)
        vars[name] = {
            ctype: 'variable',
            name: name,
            stack: [preset[name]]
        };
    return vars;
})();

namespace.isVariable = function(a) {
    return this.vars.hasOwnProperty(a);
};

namespace.create = function(code) {
    var v = {
        'ctype': 'variable',
        'stack': [null],
        'name': code
    };
    this.vars[code] = v;
    return v;
};

namespace.newvar = function(code) {
    var v = this.vars[code];
    v.stack.push(nada); // nada not null for deeper levels
    return v;
};

namespace.removevar = function(code) {
    var stack = this.vars[code].stack;
    if (stack.length === 0) console.error("Removing non-existing " + code);
    stack.pop();
    if (stack.length === 0) console.warn("Removing last " + code);
};


namespace.setvar = function(code, val) {
    var stack = this.vars[code].stack;
    if (stack.length === 0) console.error("Setting non-existing variable " + code);
    if (val === undefined) {
        console.error("Setting variable " + code + " to undefined value");
        val = nada;
    }
    if (val.ctype === 'undefined') {
        stack[stack.length - 1] = val;
        return;
    }
    var erg = val;
    if (erg === null) erg = nada; // explicit setting does lift unset state
    stack[stack.length - 1] = erg;
};

namespace.undefinedWarning = {};

namespace.getvar = function(code) {

    var stack = this.vars[code].stack;
    if (stack.length === 0) console.error("Getting non-existing variable " + code);
    var erg = stack[stack.length - 1];
    if (erg === null) {
        if (csgeo.csnames.hasOwnProperty(code)) {
            return {
                'ctype': 'geo',
                'value': csgeo.csnames[code]
            };
        } else {
            if (console && console.log && this.undefinedWarning[code] === undefined) {
                this.undefinedWarning[code] = true;
                console.log("Warning: Accessing undefined variable: " + code);
            }
        }
        return nada;
    }
    return erg;
};

namespace.dump = function(code) {
    var stack = this.vars[code].stack;
    console.log("*** Dump " + code);

    for (var i = 0; i < stack.length; i++) {
        console.log(i + ":> " + niceprint(stack[i]));
    }
};

namespace.vstack = [];

namespace.pushVstack = function(v) {
    this.vstack.push(v);

};
namespace.popVstack = function() {
    this.vstack.pop();
};

namespace.cleanVstack = function() {
    var st = this.vstack;
    while (st.length > 0 && st[st.length - 1] !== "*") {
        this.removevar(st[st.length - 1]);
        st.pop();
    }
    if (st.length > 0) {
        st.pop();
    }
};
