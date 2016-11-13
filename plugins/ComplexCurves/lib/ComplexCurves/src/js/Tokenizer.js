/**
 * @param {Array<Array<string>>} rules
 * @constructor
 */
function Tokenizer(rules) {
    this.rules = rules;
}

/**
 * @param {string} str
 * @return {!Array<{type : string, value : string}>}
 */
Tokenizer.prototype.tokenize = function(str) {
    var rules = this.rules;
    var rule = "(?:";
    for (var i = 0, l = rules.length; i < l; i++)
        rule += (i > 0 ? "|(" : "(") + rules[i][0] + ")";
    rule += ")";
    var regexp = new RegExp(rule, "g");
    var tokens = [];
    var result;
    while ((result = regexp.exec(str)) !== null) {
        var value = result[0];
        var type = rules[result.slice(1).indexOf(value)][1];
        var token = {
            "type": type,
            "value": value
        };
        tokens.push(token);
    }
    return tokens;
};
