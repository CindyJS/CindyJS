## Arithmetic Operators

The following section summarizes all functions and operators that can be applied to numbers.
There are also many other mathematical operations, and these can be found in the sections [Vectors and Matrices](Vectors_and_Matrices.md), [Geometric Operators](Geometric_Operators.md), and [Function Plotting](Function_Plotting.md).

### Infix Operators

The elementary mathematical operators **+**, **-**, *****, **/**, **^** are accessible in a straightforward manner.
They can be applied to numbers and lists.
Their particular meaning depends on the type of objects to which they are applied.
For example, `5+7` evaluates to `12`, while `[2,3,4]+[3,-1,5]` evaluates to `[5,2,9]`.
Usually all these operators apply to real numbers as well as to complex numbers.

------

#### The addition operator: `‹expr›+‹expr›`

**Description:**
Numbers (integers, real, complex) can be added with the **+** operator.
Lists having the same structure can also be added; then the addition is carried out component wise.

    > 7 + 8
    < 15
    > 2.3 + 5.9
    < 8.2
    > [2,3,4] + [3,4,6]
    < [5, 7, 10]
    > [2,3,[1,2]] + [3,4,[1,3]]
    < [5, 7, [2, 5]]

**See also:**
[String Operators](String_Operators.md)

------

#### The subtraction operator: `‹expr›-‹expr›` or `‹expr›−‹expr›`

**Description:**
Numbers (integers, real, complex) can be subtracted with the `-` operator,
or the Unicode minus sign `−`.
Lists of the same shape can also be subtracted.
The subtraction is then performed componentwise.
Furthermore, the `-` operator can be used as a unary minus.

    > 7 - 8
    < -1
    > 8.3125 - 5.875
    < 2.4375
    > [2,6,4] - [3,4,6]
    < [-1, 2, -2]
    > [5,3,[1,2]] - [3,4,[1,3]]
    < [2, -1, [0, -1]]

**See also:**
[String Operators](String_Operators.md)

------

#### The multiplication operator: `‹expr›*‹expr›`, `‹expr›⋅‹expr›`, `‹expr›·‹expr›` or `‹expr›⁢‹expr›`

**Description:**
Numbers (integers, real, complex) can be multiplied with the `*` operator,
or one of its Unicode variants.
Lists that represent numerical vectors or numerical matrices can also be multiplied if the dimensions admit a reasonable mathematical operation.
See the examples for further description.

    > 7 * 8             // integer multiplication
    < 56
    > (1+i) * (2+i)     // multiplication of complex numbers
    < 1 + i*3
    > 2 * [5,3,2]       // scalar multiplication of number and vector
    < [10, 6, 4]
    > [5,3,2] * 2       // scalar multiplication of number and vector
    < [10, 6, 4]
    > [2,2,3] * [3,4,6] // scalar product (dot product) of two vectors
    < 32
    > [[1,2],[3,4]] * [1,2]         // matrix times vector
    < [5, 11]
    > [1,2] * [[1,2],[3,4]]         // vector times matrix
    < [7, 10]
    > [[1,2],[3,4]] * [[1,2],[3,4]] // product of two matrices
    < [[7, 10], [15, 22]]

One may also use the dot operator or middle dot symbol as multiplication signs.

    - CindyScript >=2016
    > [5,3,2] ⋅ 2
    < [10, 6, 4]
    > [1,2] · [[1,2],[3,4]]
    < [7, 10]

Using the unicode symbol U+2062 ‘invisible times’ it is possible to write
polynomials that *appear* as though the coefficients were directly
preceding the variable.  Input can't simply be typed this way, though.

    - CindyScript >=2016
    > x = 5;
    > 7⁢x^3 - 5⁢x^2 + 2⁢x - 1
    < 759

**See also:**
[Vectors and Matrices](Vectors_and_Matrices.md)

------

#### The division operator: `‹expr›/‹number›`, `‹expr›÷‹number›`, `‹expr›∕‹number›` or `‹expr›∶‹number›`

**Description:**
Numbers (integers, real, complex) can be divided with the `/` operator,
or one of its Unicode variants.
Note that `∶` is not a simple colon, but the Unicode ratio sign.
The [colon `:` operator](Variables_and_Functions.md#user-defined-data)
has a different meaning.

It is also possible to divide a vector or matrix by a number.

    > 56 / 8
    < 7
    > [6, 8, 4] / 2
    < [3, 4, 2]
    > [[2,4],[4,8]] / (-2*i)
    < [[0 + i*1, 0 + i*2], [0 + i*2, 0 + i*4]]
    ~ \[\[-?0 \+ i\*1, -?0 \+ i\*2\], \[-?0 \+ i\*2, -?0 \+ i\*4\]\]

------

#### The power operator: `‹expr›^‹expr›`

**Description:**
A number (integer, real, complex) can be taken to the power of another number (integer, real, complex).
Note that not only integer powers are allowed.
In `a^b` the exponent `b` can
be an arbitrary real or complex number.
Formally, the expression `exp(b*ln(a))` is calculated.
Since `ln(…)` is defined only up to a period of `2*pi`, the expression `a^b` is in general multivalued.
For noninteger values of `b` only one principal value of `a^b` will be returned.

    > 5^2
    < 25
    > 5^(-1)
    < 0.2
    > 2^(1/2)
    < 1.4142
    > 0^(1/4)
    < 0
    > 0^0
    < 1
    > i^(2^30)
    < 1

------

#### The degree operator: `‹number›°`

This operator multiplies any number by the constant `pi/180` .
This makes possible angle conversion from degrees to radians.
Note that angles will be printed in degrees by default.

    > 180°
    < 180°
    > 180° + 0
    < 3.1416
    > 180° / 3
    < 60°
    > 0.5 * 180°
    < 90°
    > 20° + 30°
    < 50°
    > cos(180°)
    < -1

------

#### The absolute value operator: `|‹number›|`

**Description:**
This operator calculates the absolute value of an object.
The object may be a simple number, a complex number, or a vector.

It is not allowed to use the `|...|` operator in a nested way, since such expressions can be syntactically ambiguous.

    > |-5|
    < 5
    > |(3,4)|
    < 5
    > |1+i|
    < 1.4142

------

#### The distance operator: `|‹number›,‹number›|`

**Description:**
One can use `|...|` with two arguments, in which case this operator calculates the distance between the two objects.
The objects may be simple numbers, complex numbers, or vectors.
However, they must be of the same type.

It is not allowed to use the `|...,...|` operator in a nested way, since such expressions can be syntactically ambiguous.

    > |-5,8|
    < 13
    > |(1,1),(4,5)|
    < 5

------

###  Functional Operators

The following operators can be applied to numbers (integer, real complex).
Some of them can also be applied to vectors.

------

###  Arithmetic Functions

#### Addition: `add(‹expr1›,‹expr2›)`

#### Subtraction: `sub(‹expr1›,‹expr2›)`

#### Multiplication: `mult(‹expr1›,‹expr2›)`

#### Division: `div(‹expr1›,‹expr2›)`

#### Exponentiation: `pow(‹expr1›,‹expr2›)`

**Description:**
These operators are binary functions equivalent to the operators like `+`, `-`, `*`, `/`, and `^`.

    > add(5,6)
    < 11
    > pow(6,2)
    < 36
    > mod(23,4)
    < 3
    > add([1,2],[3,4])
    < [4, 6]
    > mult(2,[3,4])
    < [6, 8]
    > mult([4,5],[3,4])
    < 32

------

#### Modulo: `mod(‹expr1›,‹expr2›)`

**Description:**
The `mod` function calculates the remainder of `‹expr1›` if divided by `‹expr2›`.

------

###  Standard Functions

**Description:**
These functions map numbers to numbers.
Complex numbers are fully supported.

#### Square root: `sqrt(‹expr›)`

    > sqrt(4)
    < 2
    > sqrt(2*i)
    < 1 + i*1

    - CindyScript >=2016
    > √121
    < 11

#### Exponential function: `exp(‹expr›)`

#### Natural logarithm: `log(‹expr›)`

------

###  Trigonometric Functions

The standard trigonometric functions are available through the following operators:

#### Trigonometric sine function: `sin(‹expr›)`

The argument is an angle, given in radians.
For angles in degrees, use the [degree sign](#_$b0u).

    > sin(0)
    < 0
    > sin(pi)
    < 0
    > sin(90°)
    < 1
    > sin(90) // Don't forget the degree sign if your angle is in degree!
    < 0.894
    > sin(2 + 3*i)
    < 9.1545 - i*4.1689

    - only CindyJS
    > sin(pi) == 0 // there likely is some slight numeric error
    < false

#### Trigonometric cosine function: `cos(‹expr›)`

The argument is an angle, given in radians.
For angles in degrees, use the [degree sign](#_$b0u).

    > cos(0)
    < 1
    > cos(pi)
    < -1
    > cos(90°)
    < 0
    > cos(90) // Don't forget the degree sign if your angle is in degree!
    < -0.4481
    > cos(2 + 3*i)
    < -4.1896 - i*9.1092

    - only CindyJS
    > cos(pi) == 1 // there likely is some slight numeric error
    < false

#### Trigonometric tangent function: `tan(‹expr›)`

The argument is an angle, given in radians.
For angles in degrees, use the [degree sign](#_$b0u).

    > tan(0)
    < 0
    > tan(pi)
    < 0

    - only CindyJS: Cinderella returns ___ here
    > |tan(90°)| > 10^15 // almost infinity, except for rounding issues
    < true

    > tan(90) // Don't forget the degree sign if your angle is in degree!
    < -1.9952
    > tan(2 + 3*i)
    < -0.0038 + i*1.0032

    - only CindyJS
    > tan(pi) == 0 // there likely is some slight numeric error
    < false

#### Inverse trigonometric sine function: `arcsin(‹expr›)`

The `arcsin` operator is in principle multivalued.
However, the operator returns only one principal value,
for which the real part is between −90° = −π/2 and +90° = +π/2.

    > arcsin(0)
    < 0°
    > arcsin(1)
    < 90°
    > arcsin(-1)
    < -90°
    > arcsin(2) // the sign of the imaginary part is undefined here
    < (90 - i*75.5)°
    ~ \(90 [+\-] i\*75\.5\)°
    > arcsin(2 + 3*i)
    < (32.7 + i*113.6)°
    > arcsin(sqrt(3)/2)
    < 60°

Even though the resulting angle is printed in degrees for convenience,
it is actually represented in radians internally.
The [`angleUnit` setting](createCindy.md#angleunit) controls the unit.

    > arcsin(1) + 0 // actually π/2
    < 1.5708

#### Inverse trigonometric cosine function: `arccos(‹expr›)`

The `arccos` operator is in principle multivalued.
However, the operator returns only one principal value,
for which the real part is between 0° = 0 and +180° = +π.

    > arccos(0)
    < 90°
    > arccos(1)
    < 0°
    > arccos(-1)
    < 180°
    > arccos(2) // the sign of the imaginary part is undefined here
    < (0 + i*75.5)°
    ~ \(0 [+\-] i\*75\.5\)°
    > arccos(2 + 3*i)
    < (57.3 - i*113.6)°
    > arccos(sqrt(3)/2)
    < 30°

Even though the resulting angle is printed in degrees for convenience,
it is actually represented in radians internally.
The [`angleUnit` setting](createCindy.md#angleunit) controls the unit.

    > arccos(-1) + 0 // actually π
    < 3.1416

#### Inverse trigonometric tangent function: `arctan(‹expr›)`

The `arctan` operator is in principle multivalued.
However, the operator returns only one principal value,
for which the real part is between −90° = −π/2 and +90° = +π/2.

    > arctan(0)
    < 0°
    > arctan(1)
    < 45°
    > arctan(-1)
    < -45°
    > arctan(2)
    < 63.4°
    > arctan(2 + 3*i)
    < (80.8 + i*13.1)°
    > arctan(sqrt(3))
    < 60°

#### Angle of a vector: `arctan2(‹expr1›,‹expr2›)`

The value of `arctan2(x,y)` is the angle the vector `[x,y]` makes with the *x* axis.
Its real part is between −180° = −π and +180° = +π.

When adapting code written in other languages,
note that some swap the arguments,
i.e. write `arctan2(y,x)` (or `atan2(y,x)`)
similar to the order used in `atan(y/x)`.
CindyScript does not follow that convention,
but uses the order “first `x` then `y`” as used in vectors.

    > arctan2(1, 0)
    < 0°
    > arctan2(1, 1)
    < 45°
    > arctan2(-1, -1)
    < -135°

It is possible to see `arctan2` as the inverse of the `sin` and `cos` functions.
This holds even if the arguments are complex numbers, and even if the results
of the `sin` and `cos` functions are scaled by the same constant.

    > a = 0.123 + i*4.567; r = 1.23 + i*4.56;
    > arctan2(r*cos(a), r*sin(a)) + 0
    < 0.123 + i*4.567

Note however that this is only true if the real part of the scale factor remains positive.
Swapping its sign rotates the angle by 180°, as can be seen here:

    > r = -1.23 + i*4.56;
    > arctan2(r*cos(a), r*sin(a)) + 0
    < -3.0186 + i*4.567
    > arctan2(r*cos(a), r*sin(a)) + pi
    < 0.123 + i*4.567

Since real arguments and complex arguments follow different code paths,
it is important to verify that a small complex perturbation doesn't lead
to different branch choices.

    > jitter = i * 1.234 * 10^(-7);
    > select(directproduct([-3, 3], [-4, 4]), // try all quadrants
    >   |arctan2(#_1, #_2) - arctan2(#_1 + jitter, #_2 + jitter)| > 10^(-6))
    < []

#### Angle of a vector: `arctan2(‹vec›)`

The value of `arctan2(v)` is the angle the two-dimensional vector `[x,y]`
makes with the *x* axis.
Its real part is between −180° = −π and +180° = +π.
`arctan2(x,y)` is equiavlent to `arctan2([x,y])`.

    > arctan2([1, 0])
    < 0°
    > arctan2([1, 1])
    < 45°
    > arctan2([-1, -1])
    < -135°

#### Argument of a complex number: `arctan2(‹number›)`

Passing a single complex number to `arctan2` will treat that number as
a vector in the complex number plane, effectively returning
`arctan2(real(‹number›), imag(‹number›))`.
This avoids a call to the [`gauss`](Geometric_Operators.md#gauss$1) function.

    > arctan2(1+i)
    < 45°
    > arctan2(-1-i)
    < -135°

------

###  Numeric Functions

#### Absolute value: `abs(‹expr›)`

#### Rounded value: `round(‹expr›)`

#### Largest integer less than or equal: `floor(‹expr›)`

#### Smallest integer greater than or equal: `ceil(‹expr›)`

#### Real part of a complex number: `re(‹expr›)`

#### Imaginary part of a complex number: `im(‹expr›)`

#### Conjugate of a complex number: `conjugate(‹expr›)`

**Description:**
For complex numbers the operators `round`, `floor`, and `ceil` are applied to the real and imaginary parts separately.

The function `abs` calculates the norms of numbers, complex numbers, vectors, etc.
All other functions can also be applied to lists, in which case they are applied component wise.

    > round(4.3)
    < 4
    > round([3.2,7.8,3.1+i*6.9])
    < [3, 8, 3 + i*7]
    > abs([1,3,1,2,1])
    < 4
    > floor(4.8)
    < 4

------

###  Random Number Operators

The following operators generate pseudo random numbers.

#### Uniformly distributed random real number between 0 and 1: `random()`

    > random()
    < 0.468
    ~ 0(\.\d+)?
    > 1000*random()
    < 278.4083
    ~ \d+(\.\d+)?

#### (0,1)-normally distributed random number: `randomnormal()`

    > randomnormal()
    < 0.1325
    ~ -?\d+(\.\d+)?
    > 1000*randomnormal()
    < -1199.8909
    ~ -?\d+(\.\d+)?

#### Random boolean value `true` or `false`: `randombool()`

    > randombool()
    < true
    ~ (true|false)

#### Uniformly distributed random real number between 0 and `‹number›`: `random(‹number›)`

    > random(10)
    < 7.089
    ~ \d(\.\d+)?
    > random(1000)
    < 882.4784
    ~ \d+(\.\d+)?
    > sum(1..1000, random(5))
    < 2464.8004
    ~ 2\d\d\d(\.\d+)?

#### Uniformly distributed random integer number between 0 and `‹number›`: `randomint(‹number›)`

**Description:**
The random generators also accept negative and complex numbers as arguments.
For example, `random(-5)` generates a random number between `-5` and `0`; `randomint(6+i*10)` generates a random complex number for which the real part is an integer between 0 and 6 and the imaginary part is an integer between 0 and 10.

    > randomint(10)
    < 0
    ~ \d
    > sum(1..1000, randomint(6))
    < 2540
    ~ 2\d\d\d

#### Initialize the random generator: `seedrandom(‹number›)`

**Description:**
The pseudo random generator will always produce unforeseeable new random numbers.
If for some reason one wants the same random numbers to be generated for different runs of a script, one can use the `seedrandom(‹number›)` operator.
After this function is invoked with a certain integer, the same sequence of random numbers will be deterministically generated.
Each seeding integer produces a different sequence of random numbers.
