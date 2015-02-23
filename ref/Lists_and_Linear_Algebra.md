# Lists and Linear Algebra

##  Using Lists in CindyScript

List are among the most fundamental and elementary concepts of CindyScript.
In CindyScript lists serve several purposes.
They serve as

*  enumerative arrays of objects

*  structured data arrangements

*  vectors

*  matrices

This section covers the very general aspects of creating lists and accessing their elements as well as all elementary aspects of array functionality.
For information on all other aspects of lists, consult the sections

*  [Elementary List Operations](Elementary_List_Operations)

*  [Advanced List Operations](Advanced_List_Operations)

*  [Lists of Geometric Elements](Lists_of_Geometric_Elements)

*  [Vectors and Matrices](Vectors_and_Matrices)

------

------

###  Creating Lists

Lists can be created very easily by placing the elements in square brackets, separated by commas.
For example,

`[45,12.5,123,2,5.5,5]`

is a list of numbers.

`["this", "is", "a", "list", "of", "strings"]`

is a list of strings.
Objects of different kinds can be mixed in a list:

`["this", 3,"is",5 , "a",654, "mixed",234 , "list"]`

Lists can also have lists as elements, and these can be nested arbitrarily.

`[[4,6], ["a", "b"], 1, [4, "b", [23, "b"]], [ ]]`

The last element `[ ]` of this list does not contain any elements.
It is the empty list.

Alternatively lists consisting of at least two elements can also be enclosed by round brackets `(...)`.
This is sometimes convenient to have a more mathematical appealing notation in the the code.
A three-dimensional vector may then be written as follows:

`(7.3,9.3,-14.3)`

------

#### Accessing Elements of Lists: `take(‹list›,‹int›)`

**Description:**
One can access the individual elements of a list either with the infix operator `‹list›_‹int›` or the functional operator `take(‹list›,‹int›)`.
The indices start with number 1.
If the index that should be accessed is less than 1 or greater than the number of elements in the list, then the value`___`is returned.
Also, a warning message is issued on the console.

| Code                   | Result |
| ---------------------- | ------ |
| `[2 ,5 ,7 ,3]_3`       | `7`    |
| `take([2 ,5 ,7 ,3],2)` | `5`    |
| `[2 ,5 ,7 ,3]_5`       | `___`  |

The index can also be an arbitrary calculation.
Furthermore, indices can access the nested parts of a nested list.

| Code                      | Result      |
| ------------------------- | ----------- |
| `[ [2, [4,5]],1]_1`       | `[2,[4,5]]` |
| `[ [2, [4,5]],1]_(7-5)`   | `1`         |
| `[ [2, [4,5]],1]_1_2`     | `[4,5]`     |
| `[ [2, [4,5]],1]_1_2_2`   | `5`         |
| `[ [2, [4,5]],1]_1_2_2_2` | `___`       |

If a list is stored in a variable, the individual entries can be set after they are accessed by the `_` operator.
So for example, after the code fragment

    > a=[[2,[4,5]],1];
    > a_2="A";
    > a_1_2_1="B";
    >

is evaluated, the value of `a` is `[[2,["B",5]],"A"]`.

#####  Advanced usage

The list element accessor has some other powerful options.
By using negative numbers as indices one can access the list entries from the end to the beginning.
The following examples exemplify this possibility:

| Code                          | Result |
| ----------------------------- | ------ |
| `[2 ,5 ,7 ,3]_(-1)`           | `7`    |
| `take([2 ,5 ,7 ,3],(-3))`     | `5`    |
| `[ [2,6] ,5 ,7 ,3]_(-4)_(-1)` | `6`    |

It is also possible to use lists of integers as indices.
Then a list corresponding to the specified list entries is returned.

| Code                    | Result    |
| ----------------------- | --------- |
| `[2 ,5 ,7 ,3]_[2,3]`    | `[5,7]`   |
| `[2 ,5 ,7 ,3]_[-1,1,1]` | `[3,2,2]` |
