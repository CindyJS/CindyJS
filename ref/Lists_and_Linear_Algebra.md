# Lists and Linear Algebra

## Using Lists in CindyScript

List are among the most fundamental and elementary concepts of CindyScript.
In CindyScript lists serve several purposes.
They serve as

-   enumerative arrays of objects
-   structured data arrangements
-   vectors
-   matrices

This section covers the very general aspects of creating lists and accessing their elements as well as all elementary aspects of array functionality.
For information on all other aspects of lists, consult the sections

-   [Elementary List Operations](Elementary_List_Operations.md)
-   [Advanced List Operations](Advanced_List_Operations.md)
-   [Lists of Geometric Elements](Lists_of_Geometric_Elements.md)
-   [Vectors and Matrices](Vectors_and_Matrices.md)

---

---

## Creating Lists: `[…]`

Lists can be created very easily by placing the elements in square brackets, separated by commas.
For example,

    > [45,25/2,123,2,5.5,5]
    < [45, 12.5, 123, 2, 5.5, 5]

is a list of numbers.

    > ["this", "is", "a", "list", "of", "strings"]
    < ["this", "is", "a", "list", "of", "strings"]

is a list of strings.
Objects of different kinds can be mixed in a list:

    > ["this",3 , "is",5 , "a",654 , "mixed",234 , "list"]
    < ["this", 3, "is", 5, "a", 654, "mixed", 234, "list"]

Lists can also have lists as elements, and these can be nested arbitrarily.

    > [[4,6], ["a", "b"], 1, [4, "b", [23, "b"]], [ ]]
    < [[4, 6], ["a", "b"], 1, [4, "b", [23, "b"]], []]

The last element `[ ]` of this list does not contain any elements.
It is the empty list.

Alternatively lists consisting of at least two elements can also be enclosed by round parentheses `(…)`.
This is sometimes convenient to have a more mathematical appealing notation in the the code.
A three-dimensional vector may then be written as follows:

    > (7.3, 9.3, -14.3)
    < [7.3, 9.3, -14.3]

This also works for the empty list:

    > ()
    < []

It does however not work for a list with a single element,
since parentheses are used to group expressions in a term.

    > (42)
    < 42

Contrary to e.g. Python, it is not permissible to have a trailing comma
at the end of a list, since that would imply an additional undefined element.

    > ([42,],)
    < [[42, ___], ___]

---

## Accessing Elements of Lists: `‹list›_‹int›` and `take(‹list›,‹int›)`

**Description:**
One can access the individual elements of a list either with the infix operator `‹list›_‹int›` or the functional operator `take(‹list›,‹int›)`.
The indices start with number 1.
If the index that should be accessed is less than 1 or greater than the number of elements in the list, then the value `___` is returned.
Also, a warning message is issued on the console.

    > [2, 5, 7, 3]_3
    < 7
    > take([2, 5, 7, 3], 2)
    < 5
    > [2, 5, 7, 3]_5
    * WARNING: Index out of range!
    < ___

The index can also be an arbitrary calculation.
Furthermore, indices can access the nested parts of a nested list.

    > [[2, [4, 5]], 1]_1
    < [2, [4, 5]]
    > [[2, [4, 5]], 1]_(7-5)
    < 1
    > [[2, [4, 5]], 1]_1_2
    < [4, 5]
    > [[2, [4, 5]], 1]_1_2_2
    < 5
    > [[2, [4, 5]], 1]_1_2_2_2
    * WARNING: Index out of range!
    < ___

That warning is because numbers are auto-converted to single-element lists
for the purpose of indexing.

    > 5_1
    < 5
    > 5_2
    * WARNING: Index out of range!
    < ___

## Modifying Lists: `‹list›_‹int› = ‹exp›`

If a list is stored in a variable, the individual entries can be set after they are accessed by the `_` operator.
So for example, after the code fragment

    > a=[[2,[4,5]],1];
    > a_2="A";
    > a_1_2_1="B";

is evaluated, the value of `a` is

    > a
    < [[2, ["B", 5]], "A"]

Note that such modifications only affect a single copy of the list.

    > a=[1,2,3];
    > b=a;
    > a_3=0;
    > [a,b]
    < [[1, 2, 0], [1, 2, 3]]

The same holds for function arguments: these follow call-by-value semantics,
so modification of a list passed as argument will not change the variable
a caller might be using.

    > zeroFirst(lst) := (lst_1 = 0; println(lst));
    > a = [1, 2, 4];
    > zeroFirst(a)
    * [0, 2, 4]
    > a // remains unmodified
    < [1, 2, 4]

It is impossible for a list to contain itself, since the right hand side of an assignment to this effect still refers to the list prior to its modification.

    > a = [0];
    > a_1 = a;
    > a
    < [[0]]

## Comparing lists

Lists can be compared element-wise for equality or almost-equality:

    > [0, 1, 2] == [sin(0), cos(0), 1+1]
    < true
    > [0, 1, 2] != [sin(0), cos(0), 1+1]
    < false
    > [0, 1, 2] == [10^(-12), 1.00000000002, 2]
    < false
    > [0, 1, 2] ~= [10^(-12), 1.00000000002, 2]
    < true

For details please refer to the [Boolean Operators](Boolean_Operators.md) in question.

## Advanced indexing

### Negative indices

The list element accessor has some other powerful options.
By using negative numbers as indices one can access the list entries from the end to the beginning.
The following examples exemplify this possibility:

    > [2, 5, 7, 3]_(-1)
    < 3
    > take([2, 5, 7, 3], (-3))
    < 5
    > [[2, 6], 5, 7, 3]_(-4)_(-1)
    < 6

### Lists as indices

It is also possible to use lists of integers as indices.
Then a list corresponding to the specified list entries is returned.

    > [2, 5, 7, 3]_[2, 3]
    < [5, 7]
    > [2, 5, 7, 3]_[-1, 1, 1]
    < [3, 2, 2]

It is even possible to use nested lists as indices.

    - only CindyJS: Cinderella doesn't support this
    > [10, 20, 30, 40]_[[1, 3], [[2]], [4, 2]]
    < [[10, 30], [[20]], [40, 20]]

If one of the indices is not a number, the corresponding element of the result
will be `___`.

    > [11, 22, 33]_[3, "2", true, -2]
    < [33, ___, ___, 22]
