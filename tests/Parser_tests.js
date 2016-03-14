'use strict';

const expect = require('chai').expect;
const Parser = require('../src/js/libcs/Parser');
const Tokenizer = Parser.Tokenizer;
const parse = Parser.parse;

// Represent AST using a simple JSON which can be inlined below.
// This representation is not well suited to evaluation,
// but easy for comparison.
function simpl(expr) {
    if (expr === null)
        return null;
    let res = {};
    switch (expr.ctype) {
    case 'number':
        return expr.value.real;
    case 'string':
        return expr.value;
    case 'infix':
        res[expr.oper] = expr.args.map(simpl);
        break;
    case 'variable':
        return '$' + expr.name;
    case 'list':
        res.list = expr.args.map(simpl);
        break;
    case 'function':
        let modifs = {};
        for (let key in expr.modifs)
            modifs[key] = simpl(expr.modifs[key]);
        res[expr.oper] = [expr.args.map(simpl), modifs];
        break;
    case 'void':
        return null;
        break;
    case 'error':
        throw expr;
    default:
        return {'ctype': expr.ctype};
    }
    return res;
}

function simplCase(input, expected) {
    let title = JSON.stringify(input);
    title = title.substring(1, title.length - 1);
    it(title, () => {
        expect(simpl(parse(input))).to.deep.equal(expected);
    });
}

function badCase(input, expected) {
    let title = JSON.stringify(input);
    title = title.substring(1, title.length - 1);
    it(title, () => {
        let res = parse(input);
        expect(res.message).to.equal(expected);
        expect(res.ctype).to.equal('error');
    });
}

describe('CindyScript parser normal operation', () => {
    simplCase('1 + 2', {'+': [1, 2]});
    simplCase('1+2', {'+': [1, 2]});
    simplCase('1 + 2 + 3', {'+': [{'+': [1, 2]}, 3]});
    simplCase('1 + 2 * 3', {'+': [1, {'*': [2, 3]}]});
    simplCase('x', '$x');
    simplCase('  x  y  ', '$xy');
    simplCase('|x|', {'abs_infix': [['$x'], {}]});
    simplCase('|x, y|', {'dist_infix': [['$x', '$y'], {}]});
    simplCase('', null);
    simplCase('2^3^4', {'^': [2, {'^': [3, 4]}]});
    simplCase('123.45', 123.45);
    simplCase('.45', 0.45);
    simplCase('123.', 123);
    simplCase('12..34', {'..': [12, 34]});
    simplCase('-3...0', {'..': [{'-': [null, 3]}, 0]});
    simplCase('"foo\nbar"', 'foo\nbar');
    simplCase('(1 + 2)', {'+': [1, 2]});
    simplCase('f(1, 2, 3)', {f$3: [[1, 2, 3], {}]});
    simplCase('f(1, foo->2)', {f$1: [[1], {foo: 2}]});
    simplCase('f(1,m->2,3)', {f$2: [[1, 3], {m: 2}]});
    simplCase('f[1, 2, m->3]', {f$2: [[1, 2], {m: 3}]});
    simplCase('[1]', {genList: [[1],{}]});
    simplCase('{1 + 2}', {'+': [1, 2]});
    simplCase('7° + 9', {'+': [{'°': [7, null]}, 9]});
    simplCase('- 9 + 2', {'+': [{'-': [null, 9]}, 2]});
    simplCase('!b', {'!': [null, '$b']});
    simplCase('f();g();x',
              {';': [{';': [{f$0:[[],{}]}, {g$0:[[],{}]}]}, '$x']});
    simplCase('4 ∈ [1,3]', {'∈': [4, {genList: [[1, 3],{}]}]});
    simplCase('f(a,b):=123', {':=': [{f$2: [['$a','$b'],{}]}, 123]});
    simplCase('x:=123', {':=': ['$x', 123]});
    /* Copy & paste from here:
    simplCase('', );
    */
});

describe('CindyScript parser error reporting', () => {
    badCase('1 * "foo', 'Invalid token at 1:4: ‘"’');
    badCase('test??()', 'Invalid token at 1:4: ‘??’');
    badCase('7+', 'Operator may not be used postfix at 1:1: ‘+’');
    badCase('x ! y', 'Operator may not be used infix at 1:2: ‘!’');
    badCase('(x ° y)', 'Operator may not be used infix at 1:3: ‘°’');
    badCase('*p', 'Operator may not be used prefix at 1:0: ‘*’');
    badCase('(1 + 2', 'Opening ( at 1:0 closed by EOF at 2:0');
    badCase('(1 + 2]', 'Opening ( at 1:0 closed by ] at 1:6');
    badCase('1 + || * 2', "Don't support |…| with 0 arguments at 1:4");
    badCase('|x,y,z|', "Don't support |…| with 3 arguments at 1:0");
    badCase('1 + 2)', 'Closing bracket never opened. at 1:5: ‘)’');
    badCase('{1,2}', '{…} only takes one argument at 1:0');
    badCase('17()', 'Function name must be an identifier at 1:0');
    badCase('f(7->8)', 'Modifier name must be an identifier at 1:3');
    badCase('f(x.y->8)', 'Modifier name must be an identifier at 1:5');
    badCase('f(7):=123', 'Function argument must be an identifier at 1:2');
    badCase('f(a,(b)):=123', 'Function argument must be an identifier at 1:8');
    badCase('17:=123', ':= can only be used to define functions or variables at 1:2');
    /* Copy & paste from here:
    badCase('', ': ‘’');
    */
});

describe('CindyScript tokenizer', () => {
    function lexCase(input, expected) {
        if (typeof expected === 'string') {
            it(input, () => {
                expect(() => {
                    let tokenizer = new Tokenizer(input);
                    while (tokenizer.next().toktype !== 'EOF') {}
                }).to.throw(expected);
            });
        } else {
            it(input, () => {
                let tokenizer = new Tokenizer(input);
                let tokens = [];
                let token;
                while ((token = tokenizer.next()).toktype !== 'EOF') {
                    let obj = {};
                    obj[token.toktype] = token.text;
                    tokens.push(obj);
                }
                expect(tokens).to.deep.equal(expected);
            });
        }
    }

    lexCase('/* foo */', []);
    lexCase('/**/', []);
    lexCase('/*/', 'Unterminated comment');
    lexCase('/* foo */+1', [{OP:'+'}, {NUM:'1'}]);
    lexCase('/* a /* b */ c */', []);
    lexCase('/**/*a*/***/', [{OP:'*'},{ID:'a'},{OP:'*'}]);
});

/* Used for output comparison during Parser rewrite

function supsetTree(actual, expected) {
    if (expected === null || actual === null)
        return (expected === null) === (actual === null);
    if (typeof expected !== typeof actual)
        return false;
    if (typeof expected !== 'object')
        return actual === expected;
    if (Array.isArray(expected) !== Array.isArray(actual))
        return false;
    if (Array.isArray(expected) && expected.length !== actual.length)
        return false;
    for (let key in expected)
        if (!(actual.hasOwnProperty(key) &&
              supsetTree(actual[key], expected[key])))
            expect(actual).to.deep.equal(expected); // nice formatting
    return true;
}

describe('CindyScript parsing example file scripts', () => {
    allScripts.forEach(data => {
        let title = data.code;
        title = title.replace(/\s+/g, ' ').replace(/^\s+/, '');
        if (title.length > 25)
            title = title.substr(0, 20).replace(/\s+$/, '') + ' …';
        title = data.file.replace(/.*[\/\\]/, '').replace(/\.html$/, '') +
            ' - ' + title;
        it(title, () => {
            let tree;
            try {
                tree = parse(data.code);
            } catch (err) {
                console.log(String(err));
                data.code.split("\n").forEach((line, index) => {
                    let lineno = String(index + 1);
                    while (lineno.length < 5) lineno = ' ' + lineno;
                    console.log(lineno + ': ' + line);
                    if (err.location && err.location.row === index + 1) {
                        let mark = '';
                        for (let i = err.location.col + 7; i > 0; --i)
                            mark += ' ';
                        console.log(mark + '^');
                    }
                });
                throw err;
            }
            if (!supsetTree(tree, data.tree))
                expect(tree).to.deep.equal(data.tree);
        });
    });
});
*/
