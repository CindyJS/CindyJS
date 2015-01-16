## Variables and Functions

In CindyScript, variables and functions are not declared explicitly.
They are created on demand and are not explicitly typed.
This is in sharp contrast to many other programming languages.
In this section you will learn under what circumstances one can create functions and variables.
You will also learn how to destroy or clear variables and about their scope.

### Defining Functions

Defining a function in CindyScript is very easy.
One simply has to specify the name of a function, provide a parameter list, and write down the body of the function.
No explicit typing of arguments or function values is required.
In what follows, we provide some examples of simple functions.
For example, function `f` defined by

    > f(n):=sum(1..n,i,i^2)
    >

calculates the sum of the first `n` squares.
For instance, after this definition, `f(4)` evaluates to `30`.

Functions with more than one argument can be defined similarly.
The following function assumes that `a` and `b` are two-dimensional vectors and draws a square whose edge is defined by these two vectors:

    > sq(a,b):=(
    >   n=(b-a);
    >   n2=(-n_2,n_1);
    >   draw(a,b);
    >   draw(a,a-n2);
    >   draw(b,b-n2);
    >   draw(a-n2,b-n2);
    > )
    >

In this code a few interesting things happen.
First of all, the code is in principle procedural.
The body of the function has the form `(statement_1;…;statement_k)`.
Furthermore, the function uses the variables `n` and `n1`.
These variables are created when the function is first called.
However, they are (by default) not local.
Their values are visible also after the function has been called.

The return value of a function is the value of the last evaluated statement in the function.
Thus the following function calculates the arithmetic mean of three entries.

    > mean(a,b,c):=(
    >   sum=a+b+c;
    >   sum/3;
    > )
    >

Since functions are not explicitly typed, it is also possible to pass more complex objects as a function's arguments.
The function is automatically as polymorphic as possible, restricted only by the generality of the operations used in the function.
For instance, `mean([3,4],[2,7],[4,7])` evaluates to `[3,6]`.

### Recursive Functions

Functions may also be defined recursively.
Then a new instance of every function parameter is created for each level of recursion.
The following code calculates the factorial of a number:

    > fac(n):=if(n==0,1,n*fac(n-1));
    >

The following more complicated code calculates the greatest common divisor of two positive numbers:

    > gcd(a,b):=if(b==0,                //End of recursion reached
    >                a,                 //Then return the number a
    >                if(b>a,            //Perhaps switch parameters
    >                  gcd(b,a),        //switched version
    >                  gcd(b,mod(a,b))  //Recursion
    >                  )
    >              );
    >

### Defining Variables

Variables in CindyScript are defined on their first occurence in code.
Once defined, variables remain accessible throughout the rest of the program.
A variable may contain any type of object (numbers, strings, booleans, lists, geometric points, or even programs, …).
The program

    > x=3;
    > b=[x^2,x^3];
    > c=2*b;
    >

assigns to `x` the value `4`, to `b` the value `[9,27]`, and to `c` the value `[18,54]`.
A variable defined in a function remains visible also outside the scope of the function.
Exceptions to this rule are the parameters of the function and variables explicitly defined local.
The following program exemplifies the scope of variables:

    > f(x):= (
    >   x=x+x;
    >   println(x);
    >   y="User"
    > );
    > x="Hello ";
    > y="World";
    > println(x+y);
    > f(x);
    > println(x+y);
    >

It produces the output

    > Hello World
    > Hello Hello
    > Hello User
    >

Local variables in a function may be defined explicitly using the `regional(…)` operator.
They are automatically removed when the function terminates.
In the following code snippet, as a slight variation of the above program, `y` is defined to be a local variable within the function:

    > f(x):= (
    >   regional(y);
    >   x=x+x;
    >   println(x);
    >   y="User";
    > );
    > x="Hello ";
    > y="World";
    > println(x+y);
    > f(x);
    > println(x+y);
    >

The program produces the output

    > Hello World
    > Hello Hello
    > Hello World
    >

Run variables in loops are also treated as local variables.

### Binding Variables to Functions

Variables in a function (unless defined as local variables) remain visible
after the execution of the function.
Besides, variables used in functions
may have initial values that influence the evaluation of the function.

For instance, the following piece of code

    > a=3;
    > timesa(x):= x*a;
    > println(timesa(2));
    > a=5;
    > println(timesa(2));
    >

produces the output

    > 6
    > 10
    >

The return value of `timesa(2)` depends on the actual value of the (global) variable `a` at the moment the function is evaluated.
So after redefining `a` the behavior of the function `timesa` changes.
Sometimes this effect is intended, sometimes it is not.
It may happen that one wants to freeze the behavior of a function to depend on the values of the variables at the moment when the function was defined.
This can be achieved by using the operator `::=` to define the function.
This operator copies the entire variable assignments and binds them to the function.
Therefore, the program

    > a=3;
    > timesa(x)::= x*a;
    > println(timesa(2));
    > a=5;
    > println(timesa(2));
    >

produces the output

    > 6
    > 6
    >

Every time the function is called, the original value of `a` is restored.
This binding process does not only extend to all variables used in the function itself.
It extends to all variables that may be relevant to the execution of the function.

There is one way to intentionally circumvent this binding: The value of `a` can be set explicitly using a modifier.
An example thereof can be seen in the following piece of code:

    > a=3;
    > timesa(x)::= x*a;
    > println(timesa(2));
    > println(timesa(2,a->10));
    >

This program fragment produces the following output

    > 6
    > 20
    >

### Predefined Constants

In mathematics it is often necessary to use mathematical constants like `pi` or the imaginary unit `i`.
These constants are predefined as variables in CindyScript.
This allows to write a complex number for instance as `3+i*5`.
However, different values can be assigned to those variables.
For example, it is still possible to use these variables as run variables in loops.
The following program illustrates this feature:

    > println(i);
    > repeat(4,i,println(i));
    > println(i);
    >

It produces the following output:

    > 0 + i*1
    > 1
    > 2
    > 3
    > 4
    > 0 + i*1
    >

If, for instance, the complex unit is needed but the variable `i` is overwritten, then it is still possible to access the complex unit using the function `complex([0,1])`.
Other predefined variables are `true` and `false` for the logical constants, as well as the empty list, `nil`.

There is another important type of predefined variable.
Any geometric element in a construction may be referred to as a predefined variable of the corresponding name.
Thus, for instance, a point *A* can be accessed using variable `A`.
More detailed information on this topic may be found in the section on [Accessing Geometric Elements](Accessing_Geometric_Elements).

###  User Defined Data

There is also a possibility to associate user defined data to geometric elements.
This can be done by the `:` operator.
This is a simple but very powerful feature.
After the colon an arbitrary string value can be added as a key to access the data.
This key serves as a variable to which arbitrary values may be attached.

The usage of this operator is best explained by a examples.
Assume that *A* ad *B* are geometric objects.
The following code associates some data to them:

    > A:"age"=17;
    > B:"age"=34;
    > A:"haircolor"="brown";
    > B:"haircolor"="blonde";
    >

The data may be accessed by the same key.
So the following code

    >   forall(allpoints(),p,
    >     println(p:"age");
    >     println(p:"haircolor");
    > )
    >

will produce the output

    > 17
    > brown
    > 34
    > blonde
    >

A list of all keys of a geometric object may be accessed via the `keys(...)` operator.
So in the above example the code

    > print(keys(A));
    >

will produce the following output:

    > ["age","haircolor"];
    >

It is also possible to attach key information to lists.
By this one can also create custom data that is passed by variables.
The following code exemplifies this behavior.

    >   a=[];
    >   a:"data"=18
    >   print(a:"data")
    >

**Caution:**
The functionality of attaching key data is still subject to change.
It is planned to support object like data structures.
So the currently implemented feature may not be compatible with future releases.
