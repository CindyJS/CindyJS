# CindyScript language specification

This document describes the CindyScript language at a low level.

## Lexical structure

The lexical structure describes how the input string is turned
into a sequence of individual units, called tokens, and similar to words.

### Comments

A single line comment is introduced by `//` and spans to the end of the line,
i.e. the next newline character or the end of the input text.

    > 6 * 7 // this is a comment so it will be ignored
    < 42

A block comment is enclosed by `/*` and `*/`.

    - CindyScript >=3.0
    > 1 + /* 7 - */ 2
    < 3

Block comments in CindyJS can be nested.

    - CindyScript >=3.0
    > 1 + /* 2 + /* 3 + */ 4 + */ 5
    < 6

Unclosed block comments are an error.

    - CindyScript >=3.0
    > 1 + /* this does not close
    ! CindyScriptParseError: Unterminated comment at 1:4: ‘/*’
    > 1 + /* this /* still */ not
    ! CindyScriptParseError: Unterminated comment at 1:4: ‘/*’

### Whitespace

CindyScript considers the following characters to be whitespace:
* U+0020 (space)
* U+0009 (horizontal tab)
* U+000A (line feed)
* U+000D (carriage return)

These characters may occur between lexical tokens
without affecting the meaning of the code.
One exception are [string literals](#string-literals),
where such tokens are interpreted literally.
Another exception are line [comments](#comments) (`// …`)
where newline has the effect of terminating the comment.

The space and horizontal tab characters may also occur *within*
certain lexical tokens, namely within
[numeric literals](#numeric-literals) and
[identifiers](#identifier-names).
If such whitespace characters are encountered in one of these tokens,
they are stripped before further processing occurs,
so they are not part of the semantic content of the token.

    > arc sin ( 1 )
    < 90°
    > abc = 1 2 3  .  45; a b c
    < 123.45
    > re ver se ([1,2,3])
    < [3, 2, 1]

Newlines still delimit tokens, so the following is read as
three distinct identifiers with no operators between them:

    - CindyScript >=3.0
    > a
    > 	b
    > 		c
    ! CindyScriptParseError: Missing operator at 2:1: ‘b’

    - CindyScript <3.0
    > a
    > 	b
    > 		c
    < 123.45

### String literals

A string literal starts with a double quotation mark,
and ends at the next quotation mark.
There are no escape sequences;
all the text between the quotation marks is included literally.
Use the [`unicode`](Texts_and_Tables.md#unicode$1) function
to include literal double quotes and other special characters.

    > " Text with
    > newline, // comment and
    > some	tab character "
    < " Text with\nnewline, // comment and\nsome\ttab character "
    > "She said " + unicode("22") + "Hello, world!" + unicode("22")
    < "She said \"Hello, world!\""

Note that string results are printed in JSON format in this documentation,
but that representation would actually not be suitable as input.

### Numeric literals

Numeric literals in general consist of an integer part,
an optional fractional part, and an optional base-10 exponent.
The integer part is a sequence of zero or more ASCII decimal digits.
If there are no digits in the fractional part, then the integer part
mus contain at least one digit.
The fractional part is a dot (U+002E) followed by zero or more digits.
The exponent is the letter `e` or `E`, possibly followed by a sign
(`+` or `-`), followed by one or more digits.

    - CindyScript >=3.0
    > [1, 2., 3.4, .5, 6e7, 2.e-3, 3.2E+1, .5e-3]
    < [1, 2, 3.4, 0.5, 60000000, 0.002, 32, 0.0005]
    > [1 1, 2 2 ., 3 3 . 4 4, . 5 6, 6 e 5, 1 2 . E - 3, 3 . 2 e + 1, . 5 e - 3]
    < [11, 22, 33.44, 0.56, 600000, 0.012, 32, 0.0005]

Contrary to past CindyScript versions, a sole dot is no longer
a valid representation for the number zero.
In particular, this includes a sole dot as a valid representation
for the number zero.

    - CindyScript >=3.0
    > 0 + (.)
    ! CindyScriptParseError: Operator without operands at 1:5: ‘.’

    - CindyScript <3.0
    > 0 + (.)
    < 0

There are no negative literals, but unary sign operators may be combined with
numeric literals to build negative numbers.
The unary negation has the same precedence as binary negation,
so it binds less tight than e.g. the power operator `^`.

    > -1 ^ 4 // actually parsed as -(1^4)
    < -1

There also are no literals for complex numbers,
but the variable `i` is pre-set to the complex unit.

    > 4.5 + 6.7 * i
    < 4.5 + i*6.7

There are no literals representing infinite values or NaN (Not a Number) values.

Numeric literals may contain an arbitrary number of digits,
although adding more digits doesn't add precision once the internal
floating-point precision is exhausted.

    > 3.141592653589793234567890123456789012345 == pi // last digits are WRONG!
    < true

A numeric literal may only end in a dot if it is not immediately followed
by a second dot, since the latter represents a range.

    > 1..3
    < [1, 2, 3]

    - CindyScript >=3.0
    > 1 . . 3
    ! CindyScriptParseError: Field name must be identifier at 1:2: ‘.’

### Identifier names

Identifiers are used both for
[variables](Variables_and_Functions.md#defining-variables) and for
[user-defined functions](Variables_and_Functions.md#defining-functions),
as well as for arguments to such functions and to name
[modifiers](General_Concepts.md#modifiers).

Identifiers may contain one or more of the following symbols:
* ASCII letters `a`-`z` and `A`-`Z`
* ASCII digits `0`-`9`, but not as the first character
* The ASCII apostrophe U+0027 `'`
* Codepoints from
  [the Unicode 8.0.0 standard](http://www.unicode.org/Public/8.0.0/)
  with [General category](http://www.unicode.org/reports/tr44/tr44-16.html#General_Category_Values)
  `L` (i.e. Letters).

In addition to these, [`#`](General_Concepts.md#local-variables-the-variable)
and `#1` through `#9` are also valid variable names.
Multiple digits are not permissible, though.

    > #9 = 12; #9
    < 12
    > #12 = 17; #12
    ! CindyScriptParseError: Missing operator at 1:2: ‘2’
    > foo#1 = 19; foo#1
    ! CindyScriptParseError: Missing operator at 1:3: ‘#1’

The set of letters includes characters from
[planes](http://www.unicode.org/glossary/#plane)
other than the Basic Multilingual Plane (BMP).
These are encoded using surrogare pairs in JavaScript's UTF-16 encoding.

    - CindyScript >=3.0
    > 𝐶𝑖𝑛𝑑𝑦 𝑱𝑺 = 2;
    > 𝐶𝑖𝑛𝑑𝑦𝑱𝑺
    < 2

Note that some letters may have right-to-left as the default text orientation.
Depending on the environment, this may lead to unexpected display order
for input or output.

    > ערשטער = 1;
    > רגע = 2;
    > דריט = 3;
    > [ערשטער, רגע, דריט]
    < [1, 2, 3]

Contrary to many other programming languages,
the [underscore `_` is an operator](Lists_and_Linear_Algebra.md#$5fu)
and may not be used as part of an identifier name.
Spaces may be used instead to separate words, as described [above](#whitespace).

Function names are case insensitive.

    > forAll(1..3, println(#))
    * 1
    * 2
    * 3

### Operators and Brackets

The following section will describe a number of operators and bracket symbols
which too form lexical tokens.

The token parsed at a given position is the one which matches the
longes portion of input at that position, with the
[noted](#numeric-literals) exception of `..` following a numeric
literal, which gets parsed as an operator in its own right instead of
a number ending in a decimal dot and followed by the operator `.`.

    - only CindyJS
    > x = [];
    > x:12.3 = 4.56;
    > x:"12.3"
    * Can't use infix expression as lvalue
    * Operator : is not supported yet.
    < ___

There may be no spaces within operator symbols.

    - CindyScript >=3.0
    > f(x) : = 123
    ! CindyScriptParseError: Operator may not be used postfix at 1:5: ‘:’

### Superscript and subscript

One may use superscript and subscript unicode symbols to denote
exponentials and indices.
They operate mostly like the [`^`](Arithmetic_Operators.md#$5eu)
and [`_`](Lists_and_Linear_Algebra.md#$5fu) operators.
A superscript literal is an optional superscript sign,
followed by one or more superscript digits.
All characters may be separated by in-token [whitespace](#whitespace).
A subscript literal is defined correspondingly.

    - CindyScript >=3.0
    > 5³
    < 125
    > 4⁻¹
    < 0.25
    > 2 ⁺  ¹ ⁰
    < 1024
    > lst = 10 * (1..20);
    > lst₃
    < 30
    > lst ₊ ₁ ₅
    < 150

Subscripts are of the same precedence and left associativity as `_`.
For superscripts, the situation is a bit different.

It is forbidden to follow the superscript by any operator
which would bind as tightly or tighter than the power operator `^`.
This avoids confusion between the fact that `^` is right-associative
and the fact that superscript visually appears more closely coupled.

    - CindyScript >=3.0
    > 2³^4
    ! CindyScriptParseError: Operator not allowed after superscript at 1:2: ‘^’
    > 2³_1
    ! CindyScriptParseError: Operator not allowed after superscript at 1:2: ‘_’
    > (2³)^4
    < 4096
    > [2³]_1
    < 8

## Informal grammar

The grammar describes how lexical tokens are combined to form expressions.

### Expressions

An expression can be one of the following

1. a literal number or string
1. an identifier to be used as the name of a variable
1. a sequence of zero or more expressions,
   separated by commas and enclosed in brackets
1. an expression followed by a binary operator followed by an expression
1. an expression followed by a postfix operator
1. a prefix operator followed by an expression
1. a function invocation

### Operators

#### Operator precedence

CindyJS knows about the following operators, in order of precedence:

1. [`:`](Variables_and_Functions.md#user-defined-data),
   [`.`](Accessing_Geometric_Elements.md#properties-of-geometric-objects),
   [`_`](Lists_and_Linear_Algebra.md#$5fu),
   [`°`](Arithmetic_Operators.md#_$b0u)
1. [`^`](Arithmetic_Operators.md#$5eu),
   `√`
1. [`*`](Arithmetic_Operators.md#$2au),
   `×`,
   [`/`](Arithmetic_Operators.md#$2fu)
1. [`+`](Arithmetic_Operators.md#$2bu),
   [`-`](Arithmetic_Operators.md#$2du),
   [`!`](Boolean_Operators.md#$21u_)
1. [`..`](Elementary_List_Operations.md#$2eu$2eu)
1. [`==`](Boolean_Operators.md#$3du$3du),
   [`!=`](Boolean_Operators.md#$21u$3du),
   [`<`](Boolean_Operators.md#$3cu),
   [`>`](Boolean_Operators.md#$3eu),
   [`<=`](Boolean_Operators.md#$3cu$3du),
   [`>=`](Boolean_Operators.md#$3eu$3du),
   [`~=`](Boolean_Operators.md#$7eu$3du),
   [`~!=`](Boolean_Operators.md#$7eu$21u$3du),
   [`~<`](Boolean_Operators.md#$7eu$3cu),
   [`~>`](Boolean_Operators.md#$7eu$3eu),
   [`~<=`](Boolean_Operators.md#$7eu$3cu$3du),
   [`~>=`](Boolean_Operators.md#$7eu$3eu$3du),
   `∈`,
   `∉`,
   `=:=` *(not documented)*
1. [`&`](Boolean_Operators.md#$26u),
   [`%`](Boolean_Operators.md#$25u)
1. [`<:`](Elementary_List_Operations.md#$3cu$3au)
1. [`++`](Elementary_List_Operations.md#$2bu$2bu),
   [`--`](Elementary_List_Operations.md#$2du$2du),
   [`~~`](Elementary_List_Operations.md#$7eu$7eu),
   [`:>`](Elementary_List_Operations.md#$3au$3eu)
1. [`=`](Variables_and_Functions.md#defining-variables),
   [`:=`](Variables_and_Functions.html#_$28u_$29u$3au$3du_),
   [`::=`](Variables_and_Functions.md#binding-variables-to-functions),
   [`:=_`](Variables_and_Functions.html#_$28u_$29u$3au$3du$5cu$24u5fu)
   [`->`](General_Concepts.md#modifiers)
1. [`;`](General_Concepts.md#control-flow)

Operators of equal precedence are usually left-associative.

One exception from this are the `^` operator and others of equal precedence,
which are right-associative.

    - CindyScript >=3.0
    > 3^2^4
    < 43046721
    > (3^2)^4
    < 6561

    - CindyScript <3.0
    > 3^2^4
    < 6561

Another class of right-associative operators are those for assignment.

    - CindyScript >=3.0
    > x = y = 1
    < 1
    > (x = y) = 2
    * Can't use infix expression as lvalue
    < 2
    > x
    < 1

The prepend operator `<:` is right-associative as well.

    - CindyScript >=3.0
    > 1 <: 2 <: [3, 4, 5] :> 6 :> 7
    < [1, 2, 3, 4, 5, 6, 7]
    > 1 <: 2 <: [3] -- [2]
    < [1, 3]

Sometimes it makes sense to view the comma `,` as another operator,
with even lower precedence than `;`.
But since `,` may only be used inside brackets, and not at the top level,
it is not included in the above list.

    > 1, 2, 3
    ! CindyScriptParseError: comma may only be used to delimit list elements at 1:1

Several of these operators have alternate Unicode forms
which often are more readable but harder to type.

* `*` = U+2062 invisible times = `⋅` U+22C5 dot operator = `·` U+00B7 mittle dot
* `/` = `÷` U+00F7 division sign = `∕` U+2215 division slash = `∶` U+2236 ratio
* `-` = '−' U+2212 minus sign
* `!` = `¬` U+C2AC not sign
* `==` = `≟` U+225F questioned equal to
* `!=` = `<>` = `≠` U+2260 not equal to
* `<=` = `≤` U+2264 less-than or equal to = `≦` U+2266 less-than over equal to
* `>=` = `≥` U+2265 greater-than or equal to = `≧` U+2267 greater-than over equal to
* `~=` = `≈` U+2248 almost equal to
* `~!=` = `≉` U+2249 not almost equal to
* `~<` = `⪉` U+2A89 less-than and not approximate
* `~>` = `⪊` U+2A8A greater-than and not approximate
* `~<=` = `⪅` U+2A85 less-than or approximate
* `~>=` = `⪆` U+2A86 greater-than or approximate
* `&` = `∧` U+2227 logical and
* `%` = `∨` U+2228 logical or
* `++` = `∪` U+222A union
* `--` = `∖` U+2216 set minux
* `~~` = `∩` U+2229 intersection
* `->` = `→` U+2192 rightwards arrow

These alternatives are valid only in operator tokens.
It is illegal to use the Unicode minus sign in the exponent of a numeric literal:

    > 2.34e−5
    ! CindyScriptParseError: Missing operator at 1:4: ‘e’

#### Prefix and postfix operators

The `+` and `-` operators may be used both in infix and in prefix notation.

    > x = 17;
    > -x
    < -17
    > +x
    < 17
    > -[1, 2, 3]
    < [-1, -2, -3]
    > +[1, 2, 3]
    < [1, 2, 3]

The `!` and `√` operators may only be used in prefix notation.

    > !(7 == 7)
    < false

    - CindyScript >=3.0
    > √4
    < 2

The `°` operator may only be used in postfix notation.

    > 90° + 0
    < 1.5708

All other operators are valid only in infix notation.

### Brackets

A bracket expression consists of an opening bracket,
followed by zero or more expressions, delimited by commas,
followed by a matching closing bracket.

It is incorrect to append a comma after the last element,
since thar indicates an empty expression following as a last element.

    > [1, 2, ]
    < [1, 2, ___]

CindyScript knows four types of brackets:

#### Round parentheses `(…)`

As `(‹expr›)` it can be used to control order of evaluation for an expression.
As `(‹expr1›, ‹expr2›, …)` it defines a vector with the given elements.
The form `()` can be used to denote the empty list.

    > 7 * (1 + 2)
    < 21
    > 7 * (1, 2)
    < [7, 14]
    > 7 * ()
    < []

#### Square brackets `[…]`

These always denote a list, even if they contain exactly one expression.

    > 7 * [1 + 2]
    < [21]
    > 7 * [1, 2]
    < [7, 14]
    > 7 * []
    < []

#### Curly braces `{…}`

Curly braces are reserved for future applications.

    - CindyScript >=3.0
    > 7 * {1 + 2}
    ! CindyScriptParseError: {…} reserved for future use at 1:4
    > 7 * {1, 2}
    ! CindyScriptParseError: {…} reserved for future use at 1:4
    > 7 * {}
    ! CindyScriptParseError: {…} reserved for future use at 1:4
    > sin{30°}
    ! CindyScriptParseError: {…} reserved for future use at 1:3

#### Vertical bars `|…|`

With a single argument, [`|‹expr›|`](Arithmetic_Operators.md#$7cu_$7cu)
denotes the absolute value of a complex number,
or the norm of a vector.

    > |3 + 4*i|
    < 5
    > v = [2, 2, 3, 2, 2]; |v|
    < 5

With two arguments, [`|‹vec1›,‹vec2›|`](Arithmetic_Operators.md#$7cu_$2cu_$7cu)
computes the distance between these points or vectors.

    > x = [3, 7];
    > y = [7, 10];
    > |x, y|
    < 5

It is illegal to nest expressions using vertical bars
directly inside one another:

    - CindyScript >=3.0
    > |3 + |4*i| - 2|
    ! CindyScriptParseError: Operator may not be used postfix at 1:3: ‘+’

They may however be nested if there is at least one level of other brackets
(`(…)`, `[…]` or `{…}`) between them.

    - CindyScript >=3.0
    > |[3, |4*i|]|
    < 5

## Formal grammar

This is a description of the CindyScript language using a context-free grammar
in BNF notation as understood by e.g. GNU Bison.

Most non-terminals come in two flavors:
one without and one with a suffix of `NoBars`.
That's because one must not nest `|…|` constructs without
other forms of parentheses in between.
So the `NoBars` versions are the ones used inside `|…|` constructs,
and the others at the top level or inside `(…)` or `[…]`.

Don't expect too much meaning
from the names of the nonterminals used in this grammar.
They were mainly choosen to distinguish different levels of precedence,
and while the names tend to capture the main application
of the operators described at that level, this does not always fit.

```bnf
program
    : expressionOpt
    ;
expressionOpt
    : expression
    | %empty
    ;
expressionOptNoBars
    : expressionNoBars
    | %empty
    ;
expression
    : statement
    | expression OP_SEMI statement
    | expression OP_SEMI
    | OP_SEMI statement
    | OP_SEMI
    ;
expressionNoBars
    : statementNoBars
    | expressionNoBars OP_SEMI statementNoBars
    | expressionNoBars OP_SEMI
    | OP_SEMI statementNoBars
    | OP_SEMI
    ;
statement
    : assignment
    ;
statementNoBars
    : assignmentNoBars
    ;
assignment
    : listOp
    | listOp OP_ASSIGN assignment
    | listOp OP_DEFINE assignment
    | listOp OP_BDEFINE assignment
    | listOp OP_DEFINE OP_TAKE
    ;
assignmentNoBars
    : listOpNoBars
    | listOpNoBars OP_ASSIGN assignmentNoBars
    | listOpNoBars OP_DEFINE assignmentNoBars
    | listOpNoBars OP_BDEFINE assignmentNoBars
    | listOpNoBars OP_DEFINE OP_TAKE
    ;
listOp
    : prepend
    | listOp OP_CONCAT prepend
    | listOp OP_REMOVE prepend
    | listOp OP_COMMON prepend
    | listOp OP_APPEND prepend
    ;
listOpNoBars
    : prependNoBars
    | listOpNoBars OP_CONCAT prependNoBars
    | listOpNoBars OP_REMOVE prependNoBars
    | listOpNoBars OP_COMMON prependNoBars
    | listOpNoBars OP_APPEND prependNoBars
    ;
prepend
    : cond
    | cond OP_PREPEND prepend
    ;
prependNoBars
    : condNoBars
    | condNoBars OP_PREPEND prependNoBars
    ;
cond
    : rel
    | cond OP_AND rel
    | cond OP_OR rel
    ;
condNoBars
    : relNoBars
    | condNoBars OP_AND relNoBars
    | condNoBars OP_OR relNoBars
    ;
rel
    : seq
    | rel OP_EQ seq
    | rel OP_NE seq
    | rel OP_LT seq
    | rel OP_GT seq
    | rel OP_LE seq
    | rel OP_GE seq
    | rel OP_AEQ seq
    | rel OP_ANE seq
    | rel OP_ALT seq
    | rel OP_AGT seq
    | rel OP_ALE seq
    | rel OP_AGE seq
    | rel OP_IN seq
    | rel OP_NIN seq
    ;
relNoBars
    : seqNoBars
    | relNoBars OP_EQ seqNoBars
    | relNoBars OP_NE seqNoBars
    | relNoBars OP_LT seqNoBars
    | relNoBars OP_GT seqNoBars
    | relNoBars OP_LE seqNoBars
    | relNoBars OP_GE seqNoBars
    | relNoBars OP_AEQ seqNoBars
    | relNoBars OP_ANE seqNoBars
    | relNoBars OP_ALT seqNoBars
    | relNoBars OP_AGT seqNoBars
    | relNoBars OP_ALE seqNoBars
    | relNoBars OP_AGE seqNoBars
    | relNoBars OP_IN seqNoBars
    | relNoBars OP_NIN seqNoBars
    ;
seq
    : sum
    | seq OP_SEQ sum
    ;
seqNoBars
    : sumNoBars
    | seqNoBars OP_SEQ sumNoBars
    ;
sum
    : product
    | sum OP_ADD product
    | sum OP_SUB product
    | OP_ADD product
    | OP_SUB product
    | OP_NEG product
    ;
sumNoBars
    : productNoBars
    | sumNoBars OP_ADD productNoBars
    | sumNoBars OP_SUB productNoBars
    | OP_ADD productNoBars
    | OP_SUB productNoBars
    | OP_NEG productNoBars
    ;
product
    : power
    | product OP_MUL power
    | product OP_CROSS power
    | product OP_DIV power
    ;
productNoBars
    : powerNoBars
    | productNoBars OP_MUL powerNoBars
    | productNoBars OP_CROSS powerNoBars
    | productNoBars OP_DIV powerNoBars
    ;
power
    : indexed
    | indexed OP_POW power
    | indexed SUPSCRIPT
    | OP_SQRT indexed
    ;
powerNoBars
    : indexedNoBars
    | indexedNoBars OP_POW powerNoBars
    | indexedNoBars SUPSCRIPT
    | OP_SQRT indexedNoBars
    ;
indexed
    : atom
    | indexed OP_KEY atom
    | indexed OP_FIELD IDENTIFIER
    | indexed OP_TAKE atom
    | indexed SUBSCRIPT
    | indexed OP_DEG
    ;
indexedNoBars
    : atomNoBars
    | indexedNoBars OP_KEY atomNoBars
    | indexedNoBars OP_FIELD IDENTIFIER
    | indexedNoBars OP_TAKE atomNoBars
    | indexedNoBars SUBSCRIPT
    | indexedNoBars OP_DEG
    ;
atom
    : ROUND_OPEN expression ROUND_CLOSE
    | list
    | functionCall
    | absNormDist
    | number
    | string
    | variable
    ;
atomNoBars
    : ROUND_OPEN expression ROUND_CLOSE
    | list
    | functionCall
    | number
    | string
    | variable
    ;
variable
    : IDENTIFIER
    ;
list
    : ROUND_OPEN ROUND_CLOSE
    | ROUND_OPEN expressions2 ROUND_CLOSE
    | SQUARE_OPEN expressions0 SQUARE_CLOSE
    ;
expressions0
    : %empty
    | expression
    | expressions2
    ;
expressions2
    : expressionOpt OP_LIST expressionOpt
    | expressions2 OP_LIST expressionOpt
    ;
absNormDist
    : BAR expressionNoBars BAR
    | BAR expressionOptNoBars OP_LIST expressionOptNoBars BAR
    ;
functionCall
    : functionName ROUND_OPEN args ROUND_CLOSE
    | functionName SQUARE_OPEN args SQUARE_CLOSE
    | functionName CURLY_OPEN args CURLY_CLOSE
    ;
args
    : arg
    | args OP_LIST arg
    ;
arg
    : expressionOpt
    | IDENTIFIER OP_MODIF expression
    ;
functionName
    : IDENTIFIER
    ;
number
    : FLOAT
    ;
string
    : STRING
    ;
```
