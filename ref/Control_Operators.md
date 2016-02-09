#  Programming

## Control Operators

### Program Flow

We first describe those operators that allow to generate conditional branching and various kinds of loops.
The user should be aware that there are also other kinds of loop-like structures that arise from the different ways of traversing lists.
They are described in the section [Elementary List Operations](Elementary_List_Operations.md).

#### The conditional operator: `if(‹bool›,‹expr›)`

**Description:**
If the Boolean condition `‹bool›` evaluates to `true`,
then the expression `‹expr›` is evaluated.
A typical use of the `if`-operator is the conditional evaluation of side effects.

**Example:**
This code fragment prints a message on the console, if `x` has a negative value.

    > x = 5;
    > if(x<0,println("x is now negative"));
    > x = -3;
    > if(x<0,println("x is now negative"));
    * x is now negative

**Return value:**
In this case the return value of the `if`-function is &lt;expr&gt;.
Otherwise, `___` is returned.

    > x = 5; if(x<0, -1);
    < ___
    > x = -3; if(x<0, -1);
    < -1

------

#### The conditional branch operator: `if(‹bool›,‹expr1›,‹expr2›)`

**Description:**
If the Boolean condition `‹bool›` evaluates to `true`,
then the expression `‹expr1›` is evaluated.
If `‹bool›` evaluates to `false`, then `‹expr2›` is evaluated.
In either case, the value of the evaluated expression is returned.
Thus this ternary version of the `if`-operator encodes an if/then/else functionality.
There are two typical uses of this version of the `if`-operator: Firstly, the `if`-operator is used to force the conditional evaluation of program parts (which usually causes side effects).

**Example:**
This code fragment prints a message on the console that shows whether `x` is positive, negative, or zero.

    > describe(x) :=
    >   if(x<0,
    >      println("x is now negative"),
    >      if (x>0,
    >         println("x is now positive"),
    >         println("x is zero")
    >      )
    >    );
    > describe(5);
    * x is now positive
    > describe(0);
    * x is zero
    > describe(-7);
    * x is now negative

A second use of the `if`-operator is to return a certain value depending on the condition encoded by `‹bool›`.
This is particularly useful in the definition of functions.

**Example:**
This code fragment defines the function `f(x)` to be the absolute value function (for real values of `x`).

    > f(x):=if(x>0,x,-x);
    > f(5)
    < 5
    > f(-7)
    < 7

**Example:**
This code fragment takes a geometric element *A* (most probably a point) and sets its color to red or blue depending on the value of its *x*-coordinate.

    - skip test: we can't have geometric elements in tests yet.
    > A.color=if(A.x>0,(1,0,0),(0,0,1))

------

#### The trigger operator: `trigger(‹bool›,‹expr›)`

**Description:**
The `trigger` operator is very similar to the `if` operator.
In contrast to `if`, the `trigger` operator has a dynamic flavor.
The expression `‹expr›` is evaluated whenever `‹bool›` changes from `false` to `true`.
This means that during the dragging of a construction, &lt;expr&gt; is evaluated, if &lt;bool&gt; was `false` in the previous instance and is now `true`.
The purpose of this operator is to trigger side effects whenever some event occurs while the construction is being dragged.
The following code fragment demonstrates this behavior.

**Example:**
This code fragment will print a message whenever point `A` crosses the *y*-axis.

    - skip test: operator "trigger" not implemented yet.
    > trigger(A.x<0,println("A now entered the x-negative half-plane"))
    > trigger(A.x>0,println("A now entered the x-positive half-plane"))

------

#### The while loop: `while(‹bool›,‹expr›)`

**Description:**
The `while` operator evaluates the expression `‹expr›` as long as the condition `‹bool›` is true.
The result of the very last evaluation is returned as the function's value.

**Example:**

    > x=0;
    > sum=0;
    > erg=while(x<4,
    >          x=x+1;
    >          sum=sum+x;
    >          println(x+"  -->  "+sum);
    >          sum
    >       );

This code fragment produces the output

    * 1  -->  1
    * 2  -->  3
    * 3  -->  6
    * 4  -->  10

The result of the evaluation is

    > erg
    < 10

After its evaluation, the value of variable `erg` is `10`.
A word of caution: one should be aware of the fact that `while` operations may easily create infinite loops, if the conditional is never satisfied.

------

#### The repeat loop: `repeat(‹number›,‹expr›)`

**Description:**
This operator provides the simplest kind of loop in CindyScript: `‹expr›` is evaluated `‹number›` times.
The result of the last evaluation is returned.
During the evaluation of `‹expr›` the special variable `#` contains the run variable of the loop.

**Example:**
This code produces a list of the first 5 integers together with their squares.

    > repeat(5, println(#+" squared is "+#^2))
    * 1 squared is 1
    * 2 squared is 4
    * 3 squared is 9
    * 4 squared is 16
    * 5 squared is 25

**Modifiers:**
The `repeat` loop supports a variety of modifiers.
These modifiers can be used to control the start value, stop value, and step size of the loop.
The modifier `start` sets the start value of the loop.
The modifier `stop` sets the end value of the loop.
The modifier `step` sets the step size.
Arbitrary combinations of modifiers are possible.
As long as not all three modifiers are set, the loop will always be executed `‹number›` times.
Only real values are allowed for the modifiers.
The table below demonstrates different uses of the modifiers.

    > a = []; repeat(6, a = a ++ [#]); a
    < [1, 2, 3, 4, 5, 6]
    > a = []; repeat(6, start->4, a = a ++ [#]); a
    < [4, 5, 6, 7, 8, 9]
    > a = []; repeat(6, stop->2, a = a ++ [#]); a
    < [-3, -2, -1, 0, 1, 2]
    > a = []; repeat(6, step->3, a = a ++ [#]); a
    < [1, 4, 7, 10, 13, 16]
    > a = []; repeat(6, stop->12, step->4, a = a ++ [#]); a
    < [-8, -4, 0, 4, 8, 12]
    > a = []; repeat(6, start->3, step->2, a = a ++ [#]); a
    < [3, 5, 7, 9, 11, 13]
    > a = []; repeat(5, start->3, stop->4, a = a ++ [#]); a
    < [3, 3.25, 3.5, 3.75, 4]
    > a = []; repeat(5, start->0, stop->-3, a = a ++ [#]); a
    < [0, -0.75, -1.5, -2.25, -3]
    > a = []; repeat(6, start->3, stop->4, step->0.4,a = a ++ [#]); a
    < [3, 3.4, 3.8]

------

#### The repeat loop: `repeat(‹number›,‹var›,‹expr›)`

**Description:**
This operator is identical to the operator `repeat(‹number›,‹expr›)`, except for one difference: the run variable is now assigned to `‹var›`.
This allows for the use of nested loops with different run variables.

**Example:**
This code fragment will draw a 3 × 3 array of points.

    > repeat(3,i,
    >    repeat(3,j,
    >       draw((i,j))
    >    )
    > );
    D lineWidth = 1.2
    D beginPath()
    D arc(275.5, 204.5, 4, 0, 6.283185307179586)
    D fillStyle = "rgb(255,200,0)"
    D fill()
    D beginPath()
    D arc(275.5, 204.5, 4.6, 0, 6.283185307179586)
    D fillStyle = "rgb(0,0,0)"
    D strokeStyle = "rgb(0,0,0)"
    D stroke()
    D beginPath()
    D arc(275.5, 179.5, 4, 0, 6.283185307179586)
    D fillStyle = "rgb(255,200,0)"
    D fill()
    D beginPath()
    D arc(275.5, 179.5, 4.6, 0, 6.283185307179586)
    D fillStyle = "rgb(0,0,0)"
    D stroke()
    D beginPath()
    D arc(275.5, 154.5, 4, 0, 6.283185307179586)
    D fillStyle = "rgb(255,200,0)"
    D fill()
    D beginPath()
    D arc(275.5, 154.5, 4.6, 0, 6.283185307179586)
    D fillStyle = "rgb(0,0,0)"
    D stroke()
    D beginPath()
    D arc(300.5, 204.5, 4, 0, 6.283185307179586)
    D fillStyle = "rgb(255,200,0)"
    D fill()
    D beginPath()
    D arc(300.5, 204.5, 4.6, 0, 6.283185307179586)
    D fillStyle = "rgb(0,0,0)"
    D stroke()
    D beginPath()
    D arc(300.5, 179.5, 4, 0, 6.283185307179586)
    D fillStyle = "rgb(255,200,0)"
    D fill()
    D beginPath()
    D arc(300.5, 179.5, 4.6, 0, 6.283185307179586)
    D fillStyle = "rgb(0,0,0)"
    D stroke()
    D beginPath()
    D arc(300.5, 154.5, 4, 0, 6.283185307179586)
    D fillStyle = "rgb(255,200,0)"
    D fill()
    D beginPath()
    D arc(300.5, 154.5, 4.6, 0, 6.283185307179586)
    D fillStyle = "rgb(0,0,0)"
    D stroke()
    D beginPath()
    D arc(325.5, 204.5, 4, 0, 6.283185307179586)
    D fillStyle = "rgb(255,200,0)"
    D fill()
    D beginPath()
    D arc(325.5, 204.5, 4.6, 0, 6.283185307179586)
    D fillStyle = "rgb(0,0,0)"
    D stroke()
    D beginPath()
    D arc(325.5, 179.5, 4, 0, 6.283185307179586)
    D fillStyle = "rgb(255,200,0)"
    D fill()
    D beginPath()
    D arc(325.5, 179.5, 4.6, 0, 6.283185307179586)
    D fillStyle = "rgb(0,0,0)"
    D stroke()
    D beginPath()
    D arc(325.5, 154.5, 4, 0, 6.283185307179586)
    D fillStyle = "rgb(255,200,0)"
    D fill()
    D beginPath()
    D arc(325.5, 154.5, 4.6, 0, 6.283185307179586)
    D fillStyle = "rgb(0,0,0)"
    D stroke()

The variable is restricted to the local scope:

    > v = 992; a = [];
    > repeat(6, v, a = a ++ [v]);
    > a
    < [1, 2, 3, 4, 5, 6]
    > v
    < 992

------

#### The forall loop: `forall(‹list›,‹expr›)`

**Description:**
This operator takes a `‹list›` as its first argument.
It produces a loop in which `‹expr›` is evaluated for each entry of the list.
In every iteration, the run variable `#` takes the value of the corresponding list entry.

**Example:**

    > a=["this","is","a","list"];
    > forall(a,println(#))

This code fragment produces the output

    * this
    * is
    * a
    * list

------

#### The forall loop: `forall(‹list›,‹var›,‹expr›)`

**Description:**
Similar to `forall(‹list›,‹expr›)`, but the run variable is now named `‹var›`.
Again the variable is local to the expression.

    > v=993; forall([1,2,3],v,println(v))
    * 1
    * 2
    * 3
    > v
    < 993

------

#### Forcing evaluation: `eval(‹expr›,‹modif1›,‹modif2›,…)`

**Description:**
This operator forces the evaluation of the expression &lt;expr&gt;.
Free variables of the expression can be substituted using a list of modifiers.
The variables for the substitution are assigned only locally.
Afterwards, the variables are set to the values they had before the evaluation.

**Example:**
This code fragment evaluates to `7`.

    - skip test: "eval" not implemented yet.
    > eval(x+y,x->2,y->5)
    < 7

------

###  Variable Management

The following descriptions explain how to intentionally create or destroy local variables.
The user should be aware of the fact that for most purposes it is completely sufficient to create variables on the fly by simply assigning values to them.
Such variables will by default be global.
The use of local variables may become necessary or recommended if recursive functions are generated or if one wants to create a library of functions.

#### Creating variables: `createvar(‹varname›)`

and

#### Destroying variables: `removevar(‹varname›)`

**Description:**
These operators help in the manual administration of the creation of local variables.
`createvar(x)` creates a new variable named `x`, while the old value is put on a stack.
`removevar(x)` removes the local variable and restores the value from the stack.
Notice that usually, variables do not have to be created explicitly.
They are automatically generated when they are first used.
The `createvar` and `removevar` operators should only be used if one wants to reserve a variable name for a certain local region of the code.

**Example:**

    > x=10;
    > println("x is now "+x);
    > createvar(x);
    > x=5;
    > println("x is now "+x);
    > removevar(x);
    > println("x is now "+x);

This code fragment produces the output

    * x is now 10
    * x is now 5
    * x is now 10

------

#### Creating many local variables for a function: `regional(name1,name2,...)`

**Description:**
This statement can be used at the beginning of a function.
It has almost the same effect as the `local` statement and creates several local variables.
However, unlike with the `local` statement, the variables are removed automatically, when the function terminates.
Therefore, an explicit call of `release` is not necessary.
Most often it is much more convenient to use `regional` than to use `local`.

------

Variables have some kind of persistence within CindyScript.
If the value of a variable is set in a statement, it remains set, until it is changed.
One can explicitly clear variables using the following operators.
Often it is useful to put a `clear()` statement under the `init` event of the program.

#### Clear all variables: `clear()`

**Description:**
This operator clears all variables.

------

#### Clear a specific variable: `clear(‹var›)`

**Description:**
This operator clears variable `‹var›`.

------

#### Handles to key variables of objects: `keys(‹var›)`

**Description:**
Gives a list of all keys associated to an object via a ` ‹object›:‹key›=‹something›` declaration.

**Example:**
It is possible to associate a value under a freely chosen key to an object.
This can be done by code similar to the following one:

    - skip test: keys not supported yet.
    > A:"age"=34;
    > A:"haircolor"="brown";

These assignments may be accessed also by a similar syntax like:

    - skip test: keys not supported yet.
    > println(A:"age");
    > println(A:"haircolor");

The operator `keys` returns a list of all associated keys of an object.
So in this example

    - skip test: keys not supported yet.
    > println(keys(A));

will return the list `["age","haircolor"]`.
