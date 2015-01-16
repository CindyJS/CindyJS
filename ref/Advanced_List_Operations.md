##  Advanced List Operations

There are several operators that take a list as argument and return another list derived from it.
This section deals with such operators.
These operators form very powerful tools for performing a high-level computation.
For examples of how to use and apply these operators in a realistic context, we strongly recommend to read the example section for CindyScript.

###  Pairs and Triples

#### Building pairs: `pairs(‹list›)`

**Description:**
This operator produces a list that contains all two-element sublists of a list.
These are all pairs of elements of `‹list›`.
This operator is particularly useful for creating all segments determined a set of points.

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
     pairs([1, 2, 3, 4])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Creating a chain: `consecutive(‹list›)`

**Description:**
This operator produces a list that contains all pairs of elements of consecutive elements of the argument `‹list›`.

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
     consecutive([1, 2, 3, 4, 5])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [[1, 2], [2, 3], [3, 4], [4, 5]]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Creating a cycle: `cycle(‹list›)`

**Description:**
This operator produces a list that contains all pairs of consecutive elements of the argument `‹list›`.
Furthermore, the pair consisting of the last and the first elements is added.

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
     cycle([1, 2, 3, 4, 5])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [[1, 2], [2, 3], [3, 4], [4, 5], [5, 1]]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Building triples: `triples(‹list›)`

**Description:**
This operator produces a list that contains all three-element sublists of a list.
These are all the triples of elements of `‹list›`.

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
     triples([1, 2, 3, 4])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [[1,2,3], [1,2,4], [1,3,4], [2,3,4]]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Creating the direct product of two lists: `directproduct(‹list1›,‹list2›)`

**Description:**
This operator produces a list that resembles the direct product of two given lists.
The direct products consists of all pairs whose first element is taken from `‹list1›` and whose second element is taken from `‹list2›`.

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
     directproduct([1,2,3], ["A", "B"])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [[1,"A"], [1,"B"], [2,"A"], [2,"B"], [3,"A"], [3,"B"]]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

------

#### Flattening a nested list lists: `flatten(‹list›)`

**Description:**
This operator takes a list that may itself again consist of lists.
It returns a single list of elements that results from appending all the second order lists.
Using a modifier flattening can be applied recursively.
Also the levels of flattening can be controlled.

This operator produces a list that resembles the direct product of two given lists.
The direct products consists of all pairs whose first element is taken from `‹list1›` and whose second element is taken from `‹list2›`.

**Modifiers:**
The modifier `levels` can be set either to "all", which results in a complete recursive flattening, or it can be set to an integer, that specifies the maximal recursion level of flattening.
The statement `flatten(...,levels->1)` is equivalent to `flatten(...)`.

**Example:**
Let us assume that we set

`list=[[1,2],[3,[4,5],[6,[7,8]]],6];`

then we get the following responses to various calls of flattening:

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
     flatten(list)
    </code>
   </td>
   <td class="wikicell">
    <code>
     [1,2,3,[4,5],[6,[7,8]],6]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     flatten(list,levels-&gt;0)
    </code>
   </td>
   <td class="wikicell">
    <code>
     [[1,2],[3,[4,5],[6,[7,8]]],6]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     flatten(list,levels-&gt;1)
    </code>
   </td>
   <td class="wikicell">
    <code>
     [1,2,3,[4,5],[6,[7,8]],6]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     flatten(list,levels-&gt;2)
    </code>
   </td>
   <td class="wikicell">
    <code>
     [1,2,3,4,5,6,[7,8],6]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     flatten(list,levels-&gt;3)
    </code>
   </td>
   <td class="wikicell">
    <code>
     [1,2,3,4,5,6,7,8,6]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     flatten(list,levels-&gt;"all")
    </code>
   </td>
   <td class="wikicell">
    <code>
     [1,2,3,4,5,6,7,8,6]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

###  Order of Elements

The following operators change the order of the elements within a list.

#### Reversing a list: `reverse(‹list›)`

**Description:**
This operator reverses the order of the elements in `‹list›`.

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
     reverse([1, 2, 3, 4])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [4, 3, 2, 1]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Sorting a list: `sort(‹list›)`

**Description:**
Within CindyScript, all elements are in a natural complete order that makes it possible to compare any two elements.
Two elements are equal, or one of them is greater than the other.
Within the real numbers, the order is the usual numeric order.
Within strings, the order is the lexicographic order.
Complex numbers are ordered by their real parts first.
If two complex numbers have the same real part, then they are compared with respect to their imaginary parts.
Two lists are compared by the first entry in which they differ.
Furthermore, by convention Cinderella uses the order

booleans &lt; numbers &lt; strings &lt; lists

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
     sort([4.5, 1.3, 6.7, 0.2])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [0.2, 1.3, 4.5, 6.7]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     sort(["one", "two", "three", "four", "five"])
    </code>
   </td>
   <td class="wikicell">
    <code>
     ["five","four","one","three","two"]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Sorting a list: `sort(‹list›, ‹expr›)`

**Description:**
This operator takes each element of the list and evaluates a function expressed by `‹expr›` applied to it.
All elements of the list are sorted with respect to the result of these evaluations.

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
     sort([-4.5, 1.3, -6.7, 0.2], abs(#))
    </code>
   </td>
   <td class="wikicell">
    <code>
     [0.2, 1.3, -4.5, -6.7]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     sort(["one", "two", "three", "four", "five"],length(#))
    </code>
   </td>
   <td class="wikicell">
    <code>
     ["one","two","four","five","three"]
    </code>
   </td>
  </tr>
</tbody>
</table>

------

#### Sorting a list: `sort(‹list›, ‹var›, ‹expr›)`

**Description:**
Similar to `sort(‹list›, ‹expr›)` but with `‹var›` as the run variable.

------

#### Sets from lists: `set(‹list›)`

**Description:**
This operator sorts all elements of a list and removes occurrences of identical elements.
Thus a unique representation of the list is computed if the list is considered as a *set* of objects.
Together with the operators `concat`, `remove`, and `common`, this can be used as an implementation of set functionality.

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
     set([3, 5, 2, 4, 3, 5, 7])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [2, 3, 4, 5, 7]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     set([3, 5, 2]++[4, 5, 2])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [2, 3, 4, 5]
    </code>
   </td>
  </tr>
  <tr>
   <td class="wikicell">
    <code>
     set([3, 5, 2]~~[4, 5, 2])
    </code>
   </td>
   <td class="wikicell">
    <code>
     [2, 5]
    </code>
   </td>
  </tr>
</tbody>
</table>
