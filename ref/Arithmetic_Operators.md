## Arithmetic Operators

The following section summarizes all functions and operators that can be applied to numbers.
There are also many other mathematical operations, and these can be found in the sections [Vectors and Matrices](Vectors_and_Matrices), [Geometric Operators](Geometric_Operators), and [Function Plotting](Function_Plotting).

### Infix Operators

The elementary mathematical operators **+**, **-**, *****, **/**, **ˆ** are accessible in a straightforward manner.
They can be applied to numbers and lists.
Their particular meaning depends on the type of objects to which they are applied.
For example, `5+7` evaluates to `12`, while `[2,3,4]+[3,-1,5]` evaluates to `[5,2,9]`.
Usually all these operators apply to real numbers as well as to complex numbers.

------

#### The addition operator: `‹expr›+‹expr›`

**Description:**
Numbers (integers, real, complex) can be added with the **+** operator.
Lists having the same structure can also be added; then the addition is carried out component wise.

<table class="wikitable">
<tbody>
  <tr>
   <td class="wikicell">
    <b>
     Code
    </b>
   </td>
   <td class="wikicell">
    <b>
     Result
    </b>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     7 + 8
    </code>
   </td>
   <td class="wikicell">
    <code>
     15
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     2.3 + 5.9
    </code>
   </td>
   <td class="wikicell">
    <code>
     8.2
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     [2,3,4] + [3,4,6]
    </code>
   </td>
   <td class="wikicell">
    <code>
     [5,7,10]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     [2,3,[1,2]] + [3,4,[1,3]]
    </code>
   </td>
   <td class="wikicell">
    <code>
     [5,7,[2,4]]
    </code>
   </td>
  </tr>
</tbody>
</table>

**See also:**
[String Operators](String_Operators)

------

#### The subtraction operator: `‹expr›-‹expr›`

**Description:**
Numbers (integers, real, complex) can be subtracted with the `-` operator.
Lists of the same shape can also be subtracted.
The subtraction is then performed componentwise.
Furthermore, the `-` operator can be used as a unary minus.

<table class="wikitable">
<tbody>
  <tr>
   <td class="wikicell">
    <b>
     Code
    </b>
   </td>
   <td class="wikicell">
    <b>
     Result
    </b>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     7 - 8
    </code>
   </td>
   <td class="wikicell">
    <code>
     -1
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     8.3 - 5.9
    </code>
   </td>
   <td class="wikicell">
    <code>
     2.4
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     [2,6,4] - [3,4,6]
    </code>
   </td>
   <td class="wikicell">
    <code>
     [-1,2,-2]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     [5,3,[1,2]] - [3,4,[1,3]]
    </code>
   </td>
   <td class="wikicell">
    <code>
     [2,-1,[0,-1]]
    </code>
   </td>
  </tr>
</tbody>
</table>

**See also:**
[String Operators](String_Operators)

------

#### The multiplication operator: `‹expr›*‹expr›`

**Description:**
Numbers (integers, real, complex) can be multiplied with the `*` operator.
Lists that represent numerical vectors or numerical matrices can also be multiplied if the dimensions admit a reasonable mathematical operation.
See the examples for further description.

<table class="wikitable">
<tbody>
  <tr>
   <td class="wikicell">
    <b>
     Code
    </b>
   </td>
   <td class="wikicell">
    <b>
     Result
    </b>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     7 * 8
    </code>
   </td>
   <td class="wikicell">
    <code>
     56
    </code>
    (integer multiplication)
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     (1+i) * (2+i)
    </code>
   </td>
   <td class="wikicell">
    <code>
     1+3*i
    </code>
    (multiplication of complex numbers)
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     2 * [5,3,2]
    </code>
   </td>
   <td class="wikicell">
    <code>
     [10,2,4]
    </code>
    (scalar multiplication of number and vector)
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     [5,3,2] * 2
    </code>
   </td>
   <td class="wikicell">
    <code>
     [10,2,4]
    </code>
    (scalar multiplication of number and vector)
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     [2,2,3] * [3,4,6]
    </code>
   </td>
   <td class="wikicell">
    <code>
     32
    </code>
    (scalar product of two vectors)
    <!-- latexreplace $(x_1,x_2,\dots,x_n)\cdot(y_1,y_2,\dots,y_n)=(x_1y_1,x_2y_2,\dots,x_ny_n)$ -->
    (x_1,x_2,…,x_n)*(y_1,y_2, …,y_n)=(x_1*y_1+…+x_n*y_n))
    <!-- /latexreplace -->
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     [[1,2],[3,4]] * [1,2]
    </code>
   </td>
   <td class="wikicell">
    <code>
     [5,11]
    </code>
    (matrix times vector)
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     [1,2] * [[1,2],[3,4]]
    </code>
   </td>
   <td class="wikicell">
    <code>
     [7,10]
    </code>
    (vector times matrix)
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     [[1,2],[3,4]] * [[1,2],[3,4]]
    </code>
   </td>
   <td class="wikicell">
    <code>
     [[7,10],[15,22]]
    </code>
    (product of two matrices)
   </td>
  </tr>
</tbody>
</table>

**See also:**
[Vectors and Matrices](Vectors_and_Matrices)

------

#### The division operator: `‹expr›/‹number›`

**Description:**
Numbers (integers, real, complex) can be divided with the `/` operator.
Also, a vector can be divided by a number.

<table class="wikitable">
<tbody>
  <tr>
   <td class="wikicell">
    <b>
     Code
    </b>
   </td>
   <td class="wikicell">
    <b>
     Result
    </b>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     56 / 8
    </code>
   </td>
   <td class="wikicell">
    <code>
     7
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     [6,8,4] / 2
    </code>
   </td>
   <td class="wikicell">
    <code>
     [3,4,2]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### The power operator: `‹expr›ˆ‹expr›`

**Description:**
A number (integer, real, complex) can be taken to the power of another number (integer, real, complex).
Note that not only integer powers are allowed.
In `aˆb` the exponent `b` can
be an arbitrary real or complex number.
Formally, the expression `exp(b*ln(a))` is calculated.
Since `ln(…)` is defined only up to a period of `2*pi`, the expression `aˆb` is in general multivalued.
For noninteger values of `b` only one principal value of `aˆb` will be returned.

<table class="wikitable">
<tbody>
  <tr>
   <td class="wikicell">
    <b>
     Code
    </b>
   </td>
   <td class="wikicell">
    <b>
     Result
    </b>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     5ˆ2
    </code>
   </td>
   <td class="wikicell">
    <code>
     25
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     5ˆ(-1)
    </code>
   </td>
   <td class="wikicell">
    <code>
     0.2
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     2ˆ(1/2)
    </code>
   </td>
   <td class="wikicell">
    <code>
     1.4142…
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### The degree operator: `‹number›°`

This operator multiplies any number by the constant `pi/180` .
This makes possible angle conversion from degrees to radians.

<table class="wikitable">
<tbody>
  <tr>
   <td class="wikicell">
    <b>
     Code
    </b>
   </td>
   <td class="wikicell">
    <b>
     Result
    </b>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     180°
    </code>
   </td>
   <td class="wikicell">
    <code>
     3.1415…
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     cos(180°)
    </code>
   </td>
   <td class="wikicell">
    <code>
     -1
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### The absolute value operator: `|‹number›|`

**Description:**
This operator calculates the absolute value of an object.
The object may be a simple number, a complex number, or a vector.

It is not allowed to use the `|...|` operator in a nested way, since such expressions can be syntactically ambiguous.

<table class="wikitable">
<tbody>
  <tr>
   <td class="wikicell">
    <b>
     Code
    </b>
   </td>
   <td class="wikicell">
    <b>
     Result
    </b>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     |-5|
    </code>
   </td>
   <td class="wikicell">
    <code>
     5
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     |(3,4)|
    </code>
   </td>
   <td class="wikicell">
    <code>
     5
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     |1+i|
    </code>
   </td>
   <td class="wikicell">
    <code>
     1.4142
    </code>
    …
   </td>
  </tr>
</tbody>
</table>

------

#### The distance operator: `|‹number›,‹number›|`

**Description:**
One can use `|...|` with two arguments, in which case this operator calculates the distance between the two objects.
The objects may be simple numbers, complex numbers, or vectors.
However, they must be of the same type.

It is not allowed to use the `|...,...|` operator in a nested way, since such expressions can be syntactically ambiguous.

<table class="wikitable">
<tbody>
  <tr>
   <td class="wikicell">
    <b>
     Code
    </b>
   </td>
   <td class="wikicell">
    <b>
     Result
    </b>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     |-5,8|
    </code>
   </td>
   <td class="wikicell">
    <code>
     3
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     |(1,1),(4,5)|
    </code>
   </td>
   <td class="wikicell">
    <code>
     5
    </code>
   </td>
  </tr>
</tbody>
</table>

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
These operators are binary functions equivalent to the operators like `+`, `-`, `*`, `/`, and `ˆ`.

<table class="wikitable">
<tbody>
  <tr>
   <td class="wikicell">
    <b>
     Code
    </b>
   </td>
   <td class="wikicell">
    <b>
     Result
    </b>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     add(5,6)
    </code>
   </td>
   <td class="wikicell">
    <code>
     11
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     pow(6,2)
    </code>
   </td>
   <td class="wikicell">
    <code>
     36
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     mod(23,4)
    </code>
   </td>
   <td class="wikicell">
    <code>
     3
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     add([1,2],[3,4])
    </code>
   </td>
   <td class="wikicell">
    <code>
     (4,6)
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     mult(2,[3,4])
    </code>
   </td>
   <td class="wikicell">
    <code>
     (6,8)
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     mult([4,5],[3,4])
    </code>
   </td>
   <td class="wikicell">
    <code>
     32
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Modulo: `mod(‹expr1›,‹expr2›)`

**Description:**
The `mod` function calculates the remainder of `‹expr1›` if divided by `‹expr2›`.

------

###  Standard Functions

#### Square root: `sqrt(‹expr›)`

#### Exponential function: `exp(‹expr›)`

#### Natural logarithm: `log(‹expr›)`

**Description:**
These functions map numbers to numbers.
Complex numbers are fully supported.

------

###  Trigonometric Functions

The standard trigonometric functions are available through the following operators:

#### Trigonometric sine function: `sin(‹expr1›)`

#### Trigonometric cosine function: `cos(‹expr1›)`

#### Trigonometric tangent function: `tan(‹expr1›)`

#### Inverse trigonometric sine function: `arcsin(‹expr1›)`

#### Inverse trigonometric cosine function: `arccos(‹expr1›)`

#### Inverse rigonometric tangent function: `arctan(‹expr1›)`

#### Angle of a vector: `arctan2(‹real1,real2›)`

#### Angle of a vector: `arctan2(‹vec›)`

The `arc` operators are in principle multivalued.
However, the operator returns only one principal value, for which the real value is between `+pi` and `-pi`.

<table class="wikitable">
<tbody>
  <tr>
   <td class="wikicell">
    <b>
     Code
    </b>
   </td>
   <td class="wikicell">
    <b>
     Result
    </b>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     sin(pi)
    </code>
   </td>
   <td class="wikicell">
    <code>
     0
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     arccos(-1)
    </code>
   </td>
   <td class="wikicell">
    <code>
     3.1415
    </code>
    …
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     arctan2(1,1)
    </code>
   </td>
   <td class="wikicell">
    <code>
     45°
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     arctan2(-1,-1)
    </code>
   </td>
   <td class="wikicell">
    <code>
     -135°
    </code>
   </td>
  </tr>
</tbody>
</table>

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

<table class="wikitable">
<tbody>
  <tr>
   <td class="wikicell">
    <b>
     Code
    </b>
   </td>
   <td class="wikicell">
    <b>
     Result
    </b>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     round(4.3)
    </code>
   </td>
   <td class="wikicell">
    <code>
     4
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     round([3.2,7.8,3.1+i*6.9])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [3,8,3+i*7]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     abs([1,3,1,2,1])
    </code>
   </td>
   <td class="wikicell">
    <code>
     4
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     floor(4.8)
    </code>
   </td>
   <td class="wikicell">
    <code>
     4
    </code>
   </td>
  </tr>
</tbody>
</table>

------

###  Random Number Operators

The following operators generate pseudo random numbers.

#### Uniformly distributed random real number between 0 and 1: `random()`

#### (0,1)-normally distributed random number: `randomnormal()`

#### Random boolean value `true` or `false`: `randombool()`

#### Uniformly distributed random real number between 0 and `‹number›`: `random(‹number›)`

#### Uniformly distributed random integer number between 0 and `‹number›`: `randomint(‹number›)`

**Description:**
The random generators also accept negative and complex numbers as arguments.
For example, `random(-5)` generates a random number between `-5` and `0`; `randomint(6+i*10)` generates a random complex number for which the real part is an integer between 0 and 6 and the imaginary part is an integer between 0 and 10.

#### Initialize the random generator: `seedrandom(‹number›)`

**Description:**
The pseudo random generator will always produce unforeseeable new random numbers.
If for some reason one wants the same random numbers to be generated for different runs of a script, one can use the `seedrandom(‹number›)` operator.
After this function is invoked with a certain integer, the same sequence of random numbers will be deterministically generated.
Each seeding integer produces a different sequence of random numbers.
