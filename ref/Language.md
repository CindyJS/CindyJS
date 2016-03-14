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

    > 1 + /* 7 - */ 2
    < 3

Block comments in CindyJS can be nested.

    > 1 + /* 2 + /* 3 + */ 4 + */ 5
    < 6

Unclosed block comments are an error.

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
[identifiers](#identifiers).
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

    > a
    > 	b
    > 		c
    ! CindyScriptParseError: Missing operator at 2:1: ‘b’

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

    > 1
    < 1
    > 2.
    < 2
    > 3.4
    < 3.4
    > .5
    < 0.5
    > 6e7
    < 60000000
    > 2.e-3
    < 0.002
    > 3.2e+1
    < 32
    > .5e-3
    < 0.0005

Contrary to past CindyScript versions, a sole dot is no longer
a valid representation for the number zero.
In particular, this includes a sole dot as a valid representation
for the number zero.

    > 0 + (.)
    ! CindyScriptParseError: Operator without operands at 1:5: ‘.’

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

### Operators and Brackets

The following section will describe a number of operators and bracket symbols
which too form lexical tokens.
They won't overlap with the tokens described above with one exception:
the `.` may be used both for field access and for numeric literals.

Internally, the dot is always parsed as a field access operator at first,
but if its arguments are only digits,
then it is interpreted as a numeric literal instead.
So the precedence of the dot operator controls this distinction.
Since this precedence is pretty low, one can in general assume that
a given piece of code containing a dot is a numeric literal
unless there is an identifier before or after the dot.
One notable exception is the `:` operator which has even lower precedence.
It is not implemented in CindyJS yet, though.

    > x = [];
    > x:12.3 = 4.56;
    > x:"12.3"
    * Can't use infix expression as lvalue
    * Operator : is not supported yet.
    < ___

## Grammar

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

### Operator precedence

CindyJS knows about the following operators, in order of precedence:

1. [`:`](Variables_and_Functions.md#user-defined-data)
1. [`.`](Accessing_Geometric_Elements.md#properties-of-geometric-objects),
   [`°`](Arithmetic_Operators.md#_$b0u)
1. [`_`](Lists_and_Linear_Algebra.md#$5fu),
   [`^`](Arithmetic_Operators.md#$5eu)
1. [`*`](Arithmetic_Operators.md#$2au),
   [`/`](Arithmetic_Operators.md#$2fu)
1. [`+`](Arithmetic_Operators.md#$2bu),
   [`-`](Arithmetic_Operators.md#$2du),
   [`!`](Boolean_Operators.md#$21u_)
1. [`==`](Boolean_Operators.md#$3du$3du),
   [`~=`](Boolean_Operators.md#$7eu$3du),
   [`~<`](Boolean_Operators.md#$7eu$3cu),
   [`~>`](Boolean_Operators.md#$7eu$3eu),
   `=:=` *(unofficial)*,
   [`>=`](Boolean_Operators.md#$3eu$3du),
   [`<=`](Boolean_Operators.md#$3cu$3du),
   [`~>=`](Boolean_Operators.md#$7eu$3eu$3du),
   [`~<=`](Boolean_Operators.md#$7eu$3cu$3du),
   [`>`](Boolean_Operators.md#$3eu),
   [`<`](Boolean_Operators.md#$3cu),
   [`<>`](Boolean_Operators.md#$21u$3du)
1. [`&`](Boolean_Operators.md#$26u),
   [`%`](Boolean_Operators.md#$25u),
   [`!=`](Boolean_Operators.md#$21u$3du),
   [`~!=`](Boolean_Operators.md#$7eu$21u$3du),
   [`..`](Elementary_List_Operations.md#$2eu$2eu)
1. [`++`](Elementary_List_Operations.md#$2bu$2bu),
   [`--`](Elementary_List_Operations.md#$2du$2du),
   [`~~`](Elementary_List_Operations.md#$7eu$7eu),
   [`:>`](Elementary_List_Operations.md#$3au$3eu),
   [`<:`](Elementary_List_Operations.md#$3cu$3au)
1. [`=`](Variables_and_Functions.md#defining-variables),
   [`:=`](Variables_and_Functions.md#defining-functions),
   [`::=`](Variables_and_Functions.md#binding-variables-to-functions),
   `:=_` *(unofficial)*,
   [`->`](General_Concepts.md#modifiers)
1. [`;`](General_Concepts.md#control-flow)

Operators of equal precedence are usually left-associative.

One exception from this are the `^` operator and others of equal precedence,
which are right-associative.

    > 3^2^4
    < 43046721
    > (3^2)^4
    < 6561

Another class of right-associative operators are those for assignment.

    > x = y = 1
    < 1
    > (x = y) = 2
    * Can't use infix expression as lvalue
    < 2
    > x
    < 1

Sometimes it makes sense to view the comma `,` as another operator,
with even lower precedence than `;`.
But since `,` may only be used inside brackets, and not at the top level,
it is not included in the above list.

    > 1, 2, 3
    ! CindyScriptParseError: comma may only be used to delimit list elements at 1:1

### Prefix and postfix operators

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

The `!` operator may only be used in prefix notation.

    > !(7 == 7)
    < false

The `°` operator may only be used in postfix notation.

    > 90° + 0
    < 1.5708

All other operators are valid only in infix notation.

### Brackets

A bracket expression consists of an opening bracket,
followed by zero or more expressions, delimited by commas,
followed by a matching closing bracket.

It is incorrect to append a comma after the last element.

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

The single-expression form `{‹expr›}` is just like `(‹expr›)`.
This form is deprecated, and likely will get removed in the near future.
Use `(…)` instead.
The use with zero elements, or more than one, is reserved for future extensions.

    > 7 * {1 + 2}
    < 21
    > 7 * {1, 2}
    ! CindyScriptParseError: {…} only takes one argument at 1:4

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

    > |3 + |4*i| - 2|
    ! CindyScriptParseError: Operator may not be used postfix at 1:3: ‘+’

They may however be nested if there is at least one level of other brackets
(`(…)`, `[…]` or `{…}`) between them.

    > |[3, |4*i|]|
    < 5
