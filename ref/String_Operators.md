## String Operators

This section lists operators that take strings as arguments.
Moreover, operators that generate strings from other values are treated as well.

###  Elementary String Operations

#### String concatenation: `‹string1› + ‹string2›`

**Description:**
The `+` operator can also be used to append one string to another.
The result of such an operation is again a string.
If in an addition operation at least one of the arguments is a string, then the other argument will be automatically converted to a string representation of its value.

    > "Cindy"+"Script"
    < "CindyScript"
    > "Four plus three is "+(4+3)
    < "Four plus three is 7"
    > ""+(4+3)
    < "7"

**See also:**
The `+` operator is also used for the addition of usual numerical values.
For this see [Arithmetic Operators](Arithmetic_Operators.md).

------

#### Conversion to string: `text(‹expr›)`

**Description:**
The operator `text(‹expr›)` evaluates the expression `‹expr›` and converts the result to a string representation.

    > text(7.2)
    < "7.2"
    > text([true, "foo", (;)])
    < "[true, foo, ___]"

Undefined input yields undefined output in Cinderella:

    - only Cinderella
    > text(;)
    < ___

In CindyJS the output is still a string, in order to avoid corner cases.

    - only CindyJS
    > text(;)
    < "___"

Geometric objects get auto-coerced to mathematical values

    > createpoint("A", [6, 4, 2]); text(A)
    < "[3, 2]"

------

#### Length of a string: `length(‹string›)`

**Description:**
This operator returns the number of characters in a string.

**Example:**
`length("CindyScript")` evaluates to the integer `11`.

**See Also:**
[Lists and Linear Algebra](Lists_and_Linear_Algebra.md)

------

#### Extracting a substring: `substring(‹string›,‹int1›,‹int2›)`

**Description:**
This operator returns the substring of `‹string›` that begins after the character indexed by the integer `‹int1›` and ends with the character indexed by `‹int2›`.

**Example:**
`substring("abcdefg",3,6)` evaluates to the string `"def"`.

------

#### Searching for occurrence: `indexof(‹string1›,‹string2›)`

**Description:**
This operator searches for the first occurrence of `‹string2›` in `‹string1›`.
The index of this first occurrence is returned.
If `‹string2›` is not a substring of `‹string1›`, then the value `0` is returned.

    > indexof("CindyScript","i")
    < 2
    > indexof("CindyScript","y")
    < 5
    > indexof("CindyScript","z")
    < 0

------

#### Searching for occurrence: `indexof(‹string1›,‹string2›,‹int›)`

**Description:**
This operator searches for the first occurrence of `‹string2›` in `‹string1›` **after the index `i`**.
The index of this first such occurrence is returned.
If `‹string2›` does not occur in `‹string1›` after index `i`., then the value `0` is returned.

    > indexof("CindyScript","i",1)
    < 2
    > indexof("CindyScript","i",3)
    < 9
    > indexof("CindyScript","i",10)
    < 0

------

###  Advanced String Operations

#### Dissecting a string: `tokenize(‹string›,‹expr›)`

**Description:**
This operator is very useful for parsing input.
It creates a list of substrings of `‹string›`.
The second argument `‹expr›` must be either a string or a list of strings.
If `‹expr›` is a string, then the operator searches for occurrences of this string in `‹string›`.
These occurrences serve as markers for breaking up ‹string› into a list of pieces.

If ‹expr› is a list of strings, then a hierarchical list is generated
that represents the subdivision of `‹string›` recursively by the tokens in the list.

    > tokenize("one:two..three:four", ":")
    < ["one", "two..three", "four"]
    > tokenize("one:two..three:four", ".")
    < ["one:two", "", "three:four"]
    > tokenize("one:two..three:four", "..")
    < ["one:two", "three:four"]
    > tokenize("one:two..three:four", [".",":"])
    < [["one", "two"], [""], ["three", "four"]]
    > tokenize("one:two..three:four", ["..",":"])
    < [["one", "two"], ["three", "four"]]
    > tokenize("(1;2)", ";")
    < ["(1", "2)"]

`tokenize` usually converts string representations of numbers to number objects.
This can lead to information loss.
In the Java version, the conversion looks like this:

    - only Cinderella
    > tokenize("77777777777777777",":")
    < [77777777777777776]

In JavaScript, however, the [rounding rules of ECMAScript](http://www.ecma-international.org/ecma-262/5.1/#sec-9.3.1) force trailing zeros instead:

    - only CindyJS
    > tokenize("77777777777777777",":")
    < [77777777777777780]

To turn off this behavior, use the `autoconvert` modifier and set it to `false`.

    > tokenize("77777777777777777",":",autoconvert->false)
    < ["77777777777777777"]

Number conversion without splitting can be achieved using an empty separator list:

    > tokenize("1234", []) + 1
    < 1235
    > tokenize("x1234", []) + 1
    < "x12341"

------

#### Replacing in strings: `replace(‹string1›,‹string2›,‹string3›)`

**Description:**
This operator replaces all (!) occurrences of ‹string2› in ‹string1› by ‹string3›.

This operator is extremely useful for creating text replacement systems of the kind they are used in so called Lindenmeyer Systems.

    > replace( "one:two..three:four", "o", "XXX")
    < "XXXne:twXXX..three:fXXXur"
    > replace("F", "F", "F+F")
    < "F+F"
    > replace("F+F", "F", "F+F")
    < "F+F+F+F"
    > replace("3*$ + 4", "$", "x")
    < "3*x + 4"
    > replace("1\2", "\", "$&")
    < "1$&2"

------

#### Replacing in strings: `replace(‹string›,‹list›)`

**Description:**
This operator is very similar to the previous one.
`‹list›` contains a list of replacement pairs, and all such replacements are applied simultaneously to `‹string›`.

    > replace("XYX", [["X","one"], ["Y","two"]])
    < "onetwoone"

------

#### Parsing a string: `parse(‹string›)`

**Description:**
This operator parses a string to an expression and evaluates this expression.
This operator is particularly useful in processing user input that comes from text fields in a construction.

    > parse("3+7")
    < 10

The code fragment

    > text="sin(x)+cos(x)";
    > f(x):=parse(text);

defines the function `f(x)` to be `sin(x)+cos(x)`.

    > f(90°)
    < 1

------

#### Parsing a CSV string: `parseCSV(‹string›)`

**Description:**
This operator parses a comma-separated values (CSV) string to a list of lists.

    - only CindyJS: parseCSV isn't implemented for Cinderella yet
    > parseCSV("Foo,1.0
    > Bar,2.3
    > true,5.0.7
    > ")
    < [["Foo", 1], ["Bar", 2.3], [true, "5.0.7"]]

All rows in a CSV file should have the same number of columns.
If this is not the case, short rows are padded with `___`.

    - only CindyJS: parseCSV isn't implemented for Cinderella yet
    > parseCSV("11,12
    > 21,22,23,24,
    > 31,32, 33
    > 41")
    < [[11, 12, ___, ___, ___], [21, 22, 23, 24, ""], [31, 32, " 33", ___, ___], [41, ___, ___, ___, ___]]

Numbers and Booleans are converted to their respective CindyScript counterparts.
If this is not the desired behavior the `autoconvert` modifier can be set to `false`.

    - only CindyJS: parseCSV isn't implemented for Cinderella yet
    > parseCSV("Foo,1.0,true,bar", autoconvert->false)
    < [["Foo", "1.0", "true", "bar"]]

Boolean values may have their first letter in upper case, but the rest must be lower case.

    - only CindyJS: parseCSV isn't implemented for Cinderella yet
    > parseCSV("true,True,TRUE,true ,false,False,fAlse, false,fALSE")
    < [[true, true, "TRUE", "true ", false, false, "fAlse", " false", "fALSE"]]

The current implementation does not auto-convert scientific notation.
It does however handle infinite values.
This may however change in a future release, so don't rely on this.

    - only CindyJS: parseCSV isn't implemented for Cinderella yet
    > parseCSV("1e2,1e+2,1e-2
    > Infinity,+Infinity,-Infinity
    > 100,+100,-100")
    < [["1e2", "1e+2", "1e-2"], [Infinity, Infinity, -Infinity], [100, 100, -100]]

Strings may be enclosed in double quotes.
Inside such a quoted string, occurrences of double quotes have to be doubled.
The following example writes `'` to represent `"`, then uses `unicode("22")`
to replace that by an actual `"` character.

    - only CindyJS: parseCSV isn't implemented for Cinderella yet
    > parseCSV(replace("a,'b,c''d'''',e',f
    > g,h'i'j,'k
    > l,m,n'", "'", unicode("22")))
    < [["a", "b,c\"d\"\",e", "f"], ["g", "h\"i\"j", "k\nl,m,n"]]

Lines may be terminated by carriage return, line feed,
or a carriage return followed by a line feed.
The input may use a mixture of end of line conventions.

    - only CindyJS: parseCSV isn't implemented for Cinderella yet
    > parseCSV(replace(replace("1,2\n3,4\r5,6\n\r7,8\r\n9,10",
    >     "\r", unicode("0D")), "\n", unicode("0A")))
    < [[1, 2], [3, 4], [5, 6], ["", ___], [7, 8], [9, 10]]

The line terminator is optional for the last line.
This is even true if the last line ends in an empty field,
which may be tricky for reasons internal to the implementation.

    - only CindyJS: parseCSV isn't implemented for Cinderella yet
    > parseCSV("1,2
    > 11,")
    < [[1, 2], [11, ""]]
    > parseCSV("1,2,3
    > 11,")
    < [[1, 2, 3], [11, "", ___]]
    > parseCSV("1,")
    < [[1, ""]]
    > parseCSV("1
    > 11,")
    < [[1, ___], [11, ""]]

The modifier `delimiter` can be used to set the column-separating character.
The argument to that modifier has to be a single character,
excluding `"`, newline and carriage return.
The default delimiter is the comma (as the name CSV suggests).

    - only CindyJS: parseCSV isn't implemented for Cinderella yet
    > parseCSV("1;2,3;4.5", delimiter->";")
    < [[1, "2,3", 4.5]]

Some delimiters warrant extra checks due to possible special meanings
in the internal implementation, so these are checked here.

    - only CindyJS: parseCSV isn't implemented for Cinderella yet
    > parseCSV("1,2d3", delimiter->"d")
    < [["1,2", 3]]
    > parseCSV("1,2.3", delimiter->".")
    < [["1,2", 3]]
    > parseCSV("1,2$3", delimiter->"$")
    < [["1,2", 3]]

------


#### Guessing a good representation of a number: `guess(‹number›)`

**Not available in CindyJS yet!**

**Description:**
This very powerful operator is described in detail in the section [Calculus](Calculus.md).
It takes a numerical expression in floating-point representation and attempts to convert it to a mathematical expression that generates that floating-point number with high precision.
This expression is then represented as a string.

    - skip test: guess not implemented yet
    > guess(8.125)
    < "65/8"
    > guess(0.774596669241483)
    < "sqrt(3/5)"

**See also:**
[Calculus](Calculus.md)

------

#### Formating a number to a specified precision: `format(‹number›,‹int›)`

**Description:**
This operator takes a number as first arguments and an integer specifying the number of digits after the decimal point.
A string is generated that corresponds to the number up to the specified precision.
Up to 14 digits are possible in Cinderella, 20 in CindyJS.
If the argument of format is a list of objects the format statement is applied to each of the objects recursively.

    > format(sqrt(2),4)
    < "1.4142"
    > format(pi,14)
    < "3.14159265358979"
    > format(1.23456 + 98.765432*i, 2)
    < "1.23 + i*98.77"
    > format([sin(30°),cos(30°)],3)
    < ["0.5", "0.866"]

If the first argument is neither a number nor a list, then the result is `___`.
If, however, it is a list, and somewhere nested inside that list is a value which is neither a number nor a list, then that value will be turned into a string representation of itself.

    > format("foo",4)
    < ___
    > format(1 < 2,4)
    < ___
    > format([2.339, "foo", [5.678, 1 < 2]], 2)
    < ["2.34", "foo", ["5.68", "true"]]

The modifier `locale` can be used specify localisation. The default is `en`, for German use `de`. If instantiation language is set then this will be the default setting. For possible values look up the `Intl` object of the ECMAScript Internationalization API.

    > format(1.23456, 2, locale->"de")
    < "1,23"

The modifier `truncate` can be used to prevent truncation of the output.

    - only CindyJS: the `truncate` modifier is not available in Cinderella.
    > format(1, 2, truncate->false)
    < "1.00"

Requesting more than 20 digits will never have any effect.

    > format(1/3, 20) == format(1/3, 40)
    < true

**Warning:**
The format statement should only produced to create formatted output elements.
The formatted values will always be *strings* and hence usually not valid objects for arithmetic operations.
The following example illsustrates this:

    > format(sqrt(2),4)+ format(sqrt(2),4)
    < "1.41421.4142"

------

------

## String Comparison and Sorting

Like real numbers, strings admit a total ordering.
Thus they can be compared using the operators `>`, `<`, `>=`, `<=`, `==`, and `!=`.
Please refer to [Boolean Operators](Boolean_Operators.md) for the use of these relations.

The order that is used for strings is lexicographic (dictionary) order.
Thus, for example,

`"a" < "abd" < "abe" < "b" < "blue" < "blunt" < "xxx"`

#### Sorting lists of strings

**Description:**

The various versions of
[the `sort` operator](Advanced_List_Operations.md#sort$1)
can be used to sort lists that contain string values.
The sorting order is usually taken to be the lexicographic order of the words.
Alternatively, one can specify a user-defined sorting function such as the lengths of the strings.

    > sort(["one", "two", "three", "four", "five"])
    < ["five", "four", "one", "three", "two"]
    > sort(["one", "two", "three", "four", "five"],length(#))
    < ["one", "two", "four", "five", "three"]

**See also:**
[Lists and Linear Algebra](Lists_and_Linear_Algebra.md),
[Advanced List Operations](Advanced_List_Operations.md)

------

------

###  Accessing and Replacing Characters

#### Index operator: `‹string›_‹int›`

**Description:**
The infix operator `_`, which accesses the fields of a list, can be also used to access a character at a specific position in a string.
Characters can be returned and set with this operator.

    > "CindyScript"_5
    < "y"
    > "CindyScript"_[1, 6]
    < ["C", "S"]
    > "CindyScript"_12
    * WARNING: Index out of range!
    < ___
    > a="CindyScript";
    > a_5="erella";
    > a
    < "CinderellaScript"

In this example, a single letter has been replaced by a longer string.

The infix operator `_` is also used for list subscripting.
These two forms can be combined, both for reading and for writing.

    > b="Cindy";
    > a=[b, "Script"];
    > a_1_5="erella";
    > a
    < ["Cinderella", "Script"]

    - only CindyJS: known Cinderella bug #83
    > b
    < "Cindy"
