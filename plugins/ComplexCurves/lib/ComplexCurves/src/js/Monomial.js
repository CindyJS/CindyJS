/**
 * @param {!Object<string,number>} monomial
 * @constructor
 */
function Monomial(monomial) {
    this.value = monomial;
}

/**
 * @param {Monomial} m
 * @return {Monomial}
 */
Monomial.clone = function(m) {
    var monomial = {};
    var ms = m.value;
    for (var key in ms)
        monomial[key] = ms[key];
    return new Monomial(monomial);
};

/**
 * @param {Monomial} a
 * @param {Monomial} b
 * @return {boolean}
 */
Monomial.is = function(a, b) {
    var key;
    for (key in a.value)
        if (!b.value.hasOwnProperty(key) || a.value[key] !== b.value[key])
            return false;
    for (key in b.value)
        if (!a.value.hasOwnProperty(key) || a.value[key] !== b.value[key])
            return false;
    return true;
};
