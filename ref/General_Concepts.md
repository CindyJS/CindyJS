## General Concepts of CindyScript

This section is a brief introduction to the most fundamental concepts of [CindyScript](CindyScript.md).

### CindyScript Is a Functional Language

All calculations in [CindyScript](CindyScript.md) are performed by executing functions.
A function can be considered as a kind of calculation that takes the arguments of the function and produces some kind of output value.
Many calculations can already be expressed using only elementary functions.
Thus the code fragment

    > sum(1..10)
    < 55

calculates the sum of the first 10 integers.
Here `..` is a function that takes two integer numbers, `a` and `b`, and generates as output the list of all integers from `a` to `b`.
Thus `1..10` generates a list of 10 integers: `[1,2,3,4,5,6,7,8,9,10]`.
The function sum(_) is unary (that is, it takes a single argument).
It takes as its argument a list of numbers as input and generates as output a number that corresponds to the sum of the list entries.
Thus if we type `sum(1..10)` into the command shell, the system will respond with the result `55`.

Moreover, seemingly procedural statements, such as an `if`-statement, are realized as functions.
For instance, the expression

    > x = 33; y = 7;
    > if(x < y, print("Mine"), print("Yours"))
    * Yours

demonstrates the function `if`, which takes three arguments.
It checks the condition of its first argument `x < y`
and depending on the result, evaluates the second or the third argument,
that is, either `print("Mine")` or `print("Yours"))`.
The result of this evaluation will be the result of the `if(_,_,_)` function.
Thus the above expression is equivalent to

    > print(if(x < y, "Mine", "Yours"))
    * Yours

Depending on the evaluation of the condition, the `if` function returns the value of the second argument or the third argument.

### Side Effects

If a function is evaluated in [CindyScript](CindyScript.md), it may have "side effects." Side effects are important for all kinds of interactions between a [CindyScript](CindyScript.md) program and a Cinderella construction.
Typical side effects are:

*  **Drawing:**
A [CindyScript](CindyScript.md) statement may cause drawing operations in the construction views.

*  **Assignments:**
A [CindyScript](CindyScript.md) operation may change the position, color, size, etc.
of geometric objects.

*  **Variable assignments:**
A [CindyScript](CindyScript.md) statement can create variables and assign values to them.

*  **Function creation:**
A [CindyScript](CindyScript.md) statement can create and define a function that can be used later.

For instance, the statement

    > draw([0,0]);

produces the side effect of drawing a point at position `(0,0)`.
The statement

    - skip test: no geometry available here
    > A.color=[1,1,1];

sets the color of point *A* to *white*.

###  Control Flow

Most users are probably accustomed to sequential programming languages like C, Java, Pascal, and Basic.
In practice, writing sequential code in [CindyScript](CindyScript.md) is not so different from writing code in these languages.
[CindyScript](CindyScript.md) has a `;` operator `‹statement1›;‹statement2›` that simply first evaluates `statement1` and then `statement2`.
The return value of the `;` operator is the result of the last non-empty statement.

    > 5; 7
    < 7
    > ;2
    < 2
    > 3;
    < 3
    > ;
    < ___
    > 2;;
    < 2
    > 2;(;)
    < ___


Writing a sequential program is relatively simple, and it looks similar to a program written in a sequential language.
For instance, the program

    > repeat(9,i,
    >    j=i*i;
    >    draw([i,j]);
    > );

creates nine points on a parabola.
The function `repeat(‹number›, ‹variable›, ‹program›)` creates a loop that performs `‹number›` runs.
In each run the variable `‹variable›` is incremented (starting with `1`).
The body of the loop is the two lines `j=i*i; draw([i,j]);`.

###  No Explicit Typing

[CindyScript](CindyScript.md) is designed to provide a maximum of functionality with a minimum of syntactic overhead.
Therefore, [CindyScript](CindyScript.md) does not have explicit typing of values.
Like many other languages, [CindyScript](CindyScript.md) uses the concept of variables.
However, in contrast to other languages, the variables do not belong to a specific type.
Any value of any type can be assigned to any variable.
On the one hand, this gives the programmer a great deal of freedom to generate powerful code.
For instance, the following code fragment

    > f(x,y):=x+y;

defines a function `f(x,y)` that could be used to add integers or complex numbers as well as vectors or matrices.
On the other hand, this freedom requires that the programmer take some responsibility while writing a program in order to produce code that is semantically meaningful.
When a function tries to evaluate a meaningless expression, the program will not automatically terminate.
Instead, the function will return the value `___`, which stands for a meaningless expression.
So, in the above example, `f([1,2],[3,4])` will perform a vector addition and evaluate to `[4,5]`, whereas the expression `f(4,[3,4])` is meaningless and evaluates to `___`.

### Local Variables: The `#` Variable

There are several loop-like constructions in [CindyScript](CindyScript.md).
For instance, the operator `select(‹list›,‹condition‹)` traverses all elements of `‹list›` and returns a list of objects that satisfy the condition.
For this to occur, there must be a way to feed elements that are to be tested to the condition.
By default, [CindyScript](CindyScript.md) uses a variable #, which serves as a handle for the run variable.
For instance, the statement

    > select(1..30, isodd(#))
    < [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29]

returns a list of all odd numbers between `1` and `30`.
Moreover, loops use this run variable, and thus

    > repeat(9, println(#))
    * 1
    * 2
    * 3
    * 4
    * 5
    * 6
    * 7
    * 8
    * 9

prints all numbers from `1` to `9`.
It is also possible to use an explicit run variable by providing it as the second argument.
Thus `select(1..30,i,isodd(i))` and `repeat(9,i,print(i))` are equivalent to the above statements.

### The Data Types of CindyScript

As already mentioned, [CindyScript](CindyScript.md) does not have explicit typing.
Nevertheless, any *value* of a variable belongs to an explicit type.
The basic types of [CindyScript](CindyScript.md) are

*  ‹number›: Any numeric value.
Numbers can be integers, real numbers, or complex numbers.
*  ‹list›: A list of arbitrary objects.
Such a list may semantically also have the meaning of a vector or matrix.
*  ‹string›: A text expression.
*  ‹geo›: A geometric object that belongs to a construction.
*  ‹boolean›: A value `true` or `false`.

The number type is particularly powerful, since it can contain integers, floating-point numbers, and complex numbers.

### Variables and Their Scope

Since [CindyScript](CindyScript.md) does not have explicit typing for variables, it allows variables to be created "on the fly" as needed.
A variable is created when it is assigned for the first time.
If `x` is not already being used, the statement

    > x=7;

creates the variable `x` and assigns the value `7` to it.
After a variable has been assigned, its value is accessible for the rest of the execution.
Values may also be partially overloaded by local variables of a function.
Thus in a function defined by

    > f(x,y):=x+y;

the values of `x` and `y` are the local parameters of the function.
After the execution of the function is completed, the original value of `x` is restored.
One can also produce additional local variables with the `regional(...)` operator.

### Access to Geometric Elements and Their Properties

Variables are also used as a kind of handle to geometric objects.
They form a major link of [CindyScript](CindyScript.md) to Cinderella and [CindyLab](CindyLab.md).
If a variable has a name that is identical to the label of a geometric object, it provides a link to that geometric object.
The value of the variable can still be overloaded by an explicit assignment of a value to the variable.
The different properties of a geometric object (position, color, size, etc.) are accessible via the . operator.
Thus if `A` is a point in a geometric construction, the expression `A.size` returns an integer that represents the size of the point.
The expression `A.xy=[3,4]` assigns the point to the coordinate `[3,4]`.
Furthermore, properties relevant to physics simulation (mass, velocity, kinetic energy, etc.) are accessible via the . operator.

### Modifiers

Many operators in [CindyScript](CindyScript.md) provide more functionality than one may notice at first glance.
Usually these features can be accessed using so-called modifiers.
The operators are defined in a way such that their default usage provides a suitable behavior for most situations.
However, it may be necessary to modify the default behavior.
To that end, one lists corresponding modifiers in the call of the operator.
For instance, the statement

    > draw([0,0]);

draws a point at position `(0,0)`.
By default, the point is green and of size 3.
The statement

    > draw([0,0],size->15,color->[1,1,0]);

draws a yellow point of size 15.
Modifiers have to be separated by commas.
They may occur in any order and at any position of the function call.

### Lists/Vectors/Matrices

[CindyScript](CindyScript.md) offers *lists* as elementary data types.
Lists are the fundamental paradigm that is used to define more complex data structures.
In addition to the obvious application as enumeration objects, lists can also be used to represent vectors and matrices.
A vector is a list of numbers.
A list of vectors whose vectors all have the same length will be interpreted as a matrix.
[CindyScript](CindyScript.md) provides the usual operations for combining vectors, matrices, and numbers.
Depending on the content of `a` and `b`, the expression `a*b` may represent a usual multiplication of numbers, a matrix product, or a matrix/vector multiplication.

In [CindyScript](CindyScript.md) there is no distinction between row vectors and column vectors on the level of vectors.
However, by the use of suitable functions one can convert a vector of length `n` to an (*n* × 1) matrix or to a (1 × *n*) matrix.

### Drawing

[CindyScript](CindyScript.md) provides many statements with which one can draw directly on the canvas of the geometric views.
Using this feature it is possible to enrich the behavior of Cinderella constructions significantly.
It is possible to draw points, lines, segments, polygons, tables, functions, etc.
However, it is important not to confuse a script-drawn geometric object with a geometric object that is active in geometry.
It is not possible to use such script-drawn elements as definers in Cinderella modes.

If one wants to modify active elements using a script, then it is necessary to first construct them and then alter their positions using [CindyScript](CindyScript.md) statements.
All free elements can be moved by setting their position parameters.

### Execution Slots

The [script window of Cinderella](The_CindyScript_Editor.md) in which one enters the [CindyScript](CindyScript.md) code contains several slots in which the text can be entered.
The particular slots are called

*  Draw
*  Move
*  Initialization
*  Timer Tick
*  Simulation Start
*  Simulation Stop
*  …

Each of these entries corresponds to the occasion that triggers the execution of the script.
For instance, scripts in the *Draw* slot is executed directly before a screen refresh in the view.
The *Initialization* slot is executed directly after the [CindyScript](CindyScript.md) code is parsed.
*Simulation Start* is executed before starting an animation when the play button is pressed.
Using this mechanism it is possible to write programs that react nicely to user events.

### Runtime Error handling

[CindyScript](CindyScript.md) runs in a runtime environment.
In principle, every tiny move in a construction can cause the evaluation of a script.
For this to happen, a reasonable design decision in the language had to be made concerning the occurrence of runtime errors.
It would be very distractive if the usual user interaction was interrupted by error messages over and over (in particular, if a construction is used as an applet within an HTML page).
For this reason, error handling in [CindyScript](CindyScript.md) at runtime reports only the first ten errors.
However, runtime errors will never interrupt execution.
Runtime errors (such as division by zero, or access to a nonexistent array index) are simply ignored in the program flow.
Erroneous function evaluations simply produce an undefined result, and the calculation proceeds (perhaps causing more undefined results).
This usually guarantees fluent performance of a construction even if errors occur.

This feature may make debugging of programs a little cumbersome, since runtime errors are not reported.
For this purpose a special function, `assert(‹boolean›,‹string›)`, was introduced to check whether a certain assumption about the current data is satisfied.
If the assumption in the first argument is not satisfied, the message in the second argument is printed.
