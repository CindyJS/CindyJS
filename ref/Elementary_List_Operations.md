##  Elementary List Operations

###  Creating and Accessing Lists

#### Creating an integer sequence: `‹int1›..‹int2›`

**Description:**
The expression `‹int1›..‹int2›` creates a list of consecutive integers starting with `‹int1›` and ending with `‹int2›`.
If `‹int1›` is larger than `‹int2›`, then the empty list is returned.

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
     4..9
    </code>
   </td>
   <td class="wikicell">
    <code>
     [4, 5, 6, 7, 8, 9]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     2..2
    </code>
   </td>
   <td class="wikicell">
    <code>
     [-2, -1, 0, 1, 2]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     4..1
    </code>
   </td>
   <td class="wikicell">
    <code>
     []
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### The length of a list: `length(‹list›)`

**Description:**
This operator returns an integer that is equal to the number of elements in the `‹list›`.

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
     length([2 ,5 ,7 ,3])
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
     length([2 ,[5, 4, 5] ,7 ,3]_2)
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
     length(1..1000)
    </code>
   </td>
   <td class="wikicell">
    <code>
     1000
    </code>
   </td>
  </tr>
</tbody>
</table>

Combining the `length` and the `repeat` operator allows one to list all elements of a list easily.

    > repeat(length(list),
    >    println(list_#);
    > )
    >

One word of caution here: CindyScript is designed in such a way that it is seldom useful to traverse all the elements of a list using the `repeat` operator.
There are more elegant ways.

------

#### Testing for containment: `contains(‹list›,‹expr›)`

**Description:**
This operator returns either `true` or `false` depending on whether `‹list›` contains the element &lt;expr&gt;.

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
     contains([1,3,4,5],4)
    </code>
   </td>
   <td class="wikicell">
    <code>
     true
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     contains([1,3,4,5],7)
    </code>
   </td>
   <td class="wikicell">
    <code>
     false
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     contains([1,3,4,5],2*2)
    </code>
   </td>
   <td class="wikicell">
    <code>
     true
    </code>
   </td>
  </tr>
</tbody>
</table>

------

------

###  List Manipulation

#### Concatenation of lists: `concat(‹list1›,‹list2›)`

**Description:**
This operator creates a list by concatenation of two other lists.
This operator can equivalently be written as `‹list1›++‹list2›`.

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
     concat(["a", "b"], ["c", "d"])
    </code>
   </td>
   <td class="wikicell">
    <code>
     ["a", "b", "c", "d"]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Removing elements from lists: `remove(‹list1›,‹list2›)`

**Description:**
This operator creates a list by removing all elements that occur in `‹list2›` from `‹list1›`.
This operator can equivalently be written as `‹list1› -- ‹list2›`.

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
     remove([1,3,4,5,1,5,6], [1,3,7])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [4,5,5,6]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     [1,3,4,5,1,5,6]--[1,3,7]
    </code>
   </td>
   <td class="wikicell">
    <code>
     [4,5,5,6]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Intersection of lists: `common(‹list1›,‹list2›)`

**Description:**
This operator creates a list collecting all elements that are in both `‹list1›` and `‹list1›`.
In the returned list the elements are sorted and each element occurs at most once.
This operator can equivalently be written as `‹list1›~~‹list2›`.

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
     common([1,3,4,5,1,5,6], [1,3,7])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [1,3]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     [1,3,4,5,1,5,6]~~[1,3,7]
    </code>
   </td>
   <td class="wikicell">
    <code>
     [1,3]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Appending an element: `append(‹list›,‹expr›)`

**Description:**
This operator returns a list that is created by appending `‹expr›` to the list `‹list›` as its last element.
` This operator can equivalently be written as `‹list›:›‹expr›`.`

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
     append(["a", "b", "c"], "d")
    </code>
   </td>
   <td class="wikicell">
    <code>
     ["a", "b", "c","d"]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     ["a", "b", "c"]:&gt;"d"
    </code>
   </td>
   <td class="wikicell">
    <code>
     ["a", "b", "c","d"]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Prepending an element: `prepend(‹expr›,‹list›)`

**Description:**
This operator returns a list that is created by prepending `‹expr›` to the list `‹list›` as its first element.
` This operator can equivalently be written as `‹expr›‹:‹list›`.`

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
     prepend("d",["a", "b", "c"])
    </code>
   </td>
   <td class="wikicell">
    <code>
     ["d","a", "b", "c"]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     "d"&lt;:["a", "b", "c"~34
    </code>
   </td>
   <td class="wikicell">
    <code>
     ["d","a", "b", "c"]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

###  Traversing Lists

#### The forall loop: `forall(‹list›,‹expr›)`

**Description:**
This operator is useful for applying an operation to all elements of a list.
It takes a `‹list›` as first argument.
It produces a loop in which `‹expr›` is evaluated for each entry of the list.
For each run, the run variable `#` takes the value of the corresponding list entry.

**Example:**

    > a=["this","is","a","list"];
    > forall(a,println(#))
    >

This code fragment produces the output

    > this
    > is
    > a
    > list
    >

------

#### The forall loop: `forall(‹list›,‹var›,‹expr›)`

**Description:**
Similar to `forall(‹list›,‹expr›)`, but the run variable is now named `‹var›`.

------

#### Applying an expression: `apply(‹list›,‹expr›)`

**Description:**
This operator generates a new list by applying the operation `‹expr›` to all elements of a list and collecting the results.
As usual, `#` is the run variable, which successively takes the value of each element in the list.

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
     apply([1, 2, 3, 4, 5],#^2)
    </code>
   </td>
   <td class="wikicell">
    <code>
     [1, 4, 9, 16, 25]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     apply([1, 2, 3, 4, 5],#+5)
    </code>
   </td>
   <td class="wikicell">
    <code>
     [6, 7, 8, 9, 10]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     apply(1..5, [#,#ˆ2])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [[1, 1], [2, 4], [3, 9], [4, 16], [5, 25]]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Applying an expression: `apply(‹list›,‹var›,‹expr›)`

**Description:**
Similar to `apply(‹list›,‹expr›)`, but the run variable is now named `‹var›`.

------

#### Selecting elements of a list: `select(‹list›,‹boolexpr›)`

**Description:**
This operator selects all elements of a list for which a certain condition is satisfied.
The condition is supposed to be encoded by `‹boolexpr›`.
This expression is assumed to return a `‹bool›` value.
As usual, `#` is the run variable, which successively take the value of all elements in the list.

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
     select(1..10, isodd(#))
    </code>
   </td>
   <td class="wikicell">
    <code>
     [1, 3, 5, 7, 9]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     select(0..10, #+# == #ˆ2)
    </code>
   </td>
   <td class="wikicell">
    <code>
     [0,2]
    </code>
   </td>
  </tr>
</tbody>
</table>

A high-level application of the `select` operator is given by the following example:

    > divisors(x):=select(1..x,mod(x,#)==0);
    > primes(n):=select(1..n,length(divisors(#))==2);
    > println(primes(100))
    >

It produces the output

    > [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97]
    >

In this example, first a function `divisors(x)` is defined by selecting those numbers that divide `x` without any remainder.
Then a function `primes(n)` is defined that selects all numbers between `1` and `n` that have exactly two divisors.
These numbers are the primes.

------

#### Selecting elements of a list: `select(‹list›,‹var›,‹boolexpr›)`

**Description:**
Similar to `select(‹list›,‹boolexpr›)`, but the run variable is now named &lt;var&gt;.
