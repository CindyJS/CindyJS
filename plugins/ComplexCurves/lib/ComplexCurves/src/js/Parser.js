var Parser = {};

/** @typedef {{type : string, value : string}} */
Parser.Token = null;

/** @typedef {!Array<Parser.Token>} */
Parser.Tokens = null;

/** @typedef {{type : string, value : string, first: Parser.AST}} */
Parser.PrefixLeaf = null;

/** @typedef {{type : string, value : string, first: Parser.AST, second: Parser.AST}} */
Parser.InfixLeaf = null;

/** @typedef {Parser.Token|Parser.PrefixLeaf|Parser.InfixLeaf} */
Parser.Leaf = null;

/** @typedef {Parser.Leaf|Array<Parser.Leaf>|boolean|null} */
Parser.AST = null;

/** @typedef {function(Parser.Tokens) : Parser.AST} */
Parser.Combinator = null;

/**
 * @param {...Parser.Combinator} var_args
 * @return {Parser.Combinator}
 */
function and(var_args) {
    var args = arguments;
    /**
     * @param {Parser.Tokens} input
     * @return {Array<Parser.Leaf>|null}
     */
    function f(input) {
        var result, results = [];
        for (var i = 0, l = args.length; i < l; i++) {
            var /** Parser.Combinator */ parser = args[i];
            result = parser(input);
            if (result) {
                results.push(result);
            } else {
                Array.prototype.unshift.apply(input, results);
                return null;
            }
        }
        return results;
    }
    return f;
}

/**
 * @param {Parser.Combinator} left
 * @param {Parser.Combinator} middle
 * @param {Parser.Combinator} right
 * @return {Parser.Combinator}
 */
function between(left, middle, right) {
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.AST}
     */
    function f(input) {
        var /** Parser.Combinator */ parser = and(left, middle, right);
        var result = /** @type {Array<Parser.Leaf>|null} */ (parser(input));
        return result ? result[1] : null;
    }
    return f;
}

/**
 * @param {Parser.Tokens} input
 * @return {boolean|null}
 */
function eoi(input) {
    return input.length === 0 ? true : null;
}

/**
 * @param {Parser.Combinator} op1
 * @param {Parser.Combinator} op
 * @param {Parser.Combinator} op2
 * @return {Parser.Combinator}
 */
function infix(op1, op, op2) {
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.AST}
     */
    function f(input) {
        var /** Parser.Combinator */ parser = and(op1, op, op2);
        var result = parser(input);
        if (result === null)
            return null;
        return {
            type: "infix",
            value: /** @type {Parser.Leaf} */ (result[1]).value,
            first: result[0],
            second: result[2]
        };
    }
    return f;
}

/**
 * @param {string} type
 * @return {Parser.Combinator}
 */
function literal(type) {
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.Token|null}
     */
    function f(input) {
        return (input[0] || {}).type === type ? input.shift() : null;
    }
    return f;
}

/**
 * @param {Parser.Combinator} parser
 * @return {Parser.Combinator}
 */
function many(parser) {
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.AST}
     */
    function f(input) {
        var result = parser(input),
            results = [];
        while (result !== null) {
            results.push(result);
            result = parser(input);
        }
        return results;
    }
    return f;
}

/**
 * @param {...Parser.Combinator} var_args
 * @return {Parser.Combinator}
 */
function or(var_args) {
    var args = arguments;
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.AST}
     */
    function f(input) {
        var result;
        for (var i = 0, l = args.length; i < l; i++) {
            var /** Parser.Combinator */ parser = args[i];
            result = parser(input);
            if (result)
                return result;
        }
        return null;
    }
    return f;
}

/**
 * @param {Parser.Combinator} op
 * @return {Parser.Combinator}
 */
function parenthesized(op) {
    return between(symb("("), op, symb(")"));
}

/**
 * @param {Parser.Combinator} op
 * @param {Parser.Combinator} op1
 * @return {Parser.Combinator}
 */
function prefix(op, op1) {
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.AST}
     */
    function f(input) {
        var result = and(op, op1)(input);
        if (result === null)
            return null;
        return {
            type: "prefix",
            value: /** @type {Parser.Leaf} */ (result[0]).value,
            first: result[1]
        };
    }
    return f;
}

/**
 * @param {string} value
 * @return {Parser.Combinator}
 */
function symb(value) {
    /**
     * @param {Parser.Tokens} input
     * @return {Parser.Token|null}
     */
    function f(input) {
        return (input[0] || {}).value === value ? input.shift() : null;
    }
    return f;
}
