# Dictionaries

Dictrionaries are maps from keys to values. We designed the syntax closely to JSON. **Note that entries are are given by reference** (like geometric objects).

###  Elementary Dictionary Operations

**Description:**
Without arguments, this creates an empty dictionary.

    > {}
    < {}

------

### Creating a simple dictionary: `{"key" : val, ...}`

**Description:**
The expression `{"key1" : val, ...}` created a basic dictionary. 

    > {"a" : 1, "b" : 2};
    < {a:1, b:2}

------

### Printing a dictionary

**Description:**
As usual the function `print` will output the object. This will generally be not a valid JSON object, since CindyJS uses different data types than JavaScript.

    > print({"a" : 1, "b" : false, "c": "mystring"});
    * {a:1, b:false, c:mystring}

**Circular Dictionaries**
Circular objects are allowed, but a printout will be shortened. The default recursion depth is 1000 but can be adjusted with the modifier `maxDepth`:

    > dic={"a" : 1}; dic.b = dic; print(dic, maxDepth->3);
    * Warning: We visited a key-value pair very often or encountered a very deeply nested dictionary. Dictionary is probably cyclic. Output will be probably incomplete.
    * {a:1, b:{a:1, b:{a:1, b:{a:..., b:...}}}}


------

### Accessing Elements of Lists: `‹dict›.name`

**Description:**
Basic (static) access is possible via the dot operator. The variable after the dot is **not** evaluated.

    > json = {"a" : 1, "b" : 2};
    > json.a
    < 1

------
### Retrieving all keys and values of a dictionary: `keys(‹dict›)` and `values(‹dict›)`

**Description:**
To retrieve all keys or values of a dictionary as a list one can use `keys(‹dict›)` and `values(‹dict›)`


    > json = {"a" : 1, "b" : 2};
    > keys(json);
    < ["a", "b"]
    > values(json);
    < [1, 2]

------

### Dynamically accessing Elements of Lists: `‹dict›_‹var›` and `take(‹dict›,‹var›)`

**Description:**
One can dynamically access the individual elements of a dict either with the infix operator `‹list›_‹var›` or the functional operator `take(‹list›,‹var›)`. The keys (`var`) can be of any printable type.


    > json = {"a" : 1, "b" : 2};
    > json_"a"
    < 1
    > take({"a" : 1, "b" : 2}, "b")
    < 2

------

### Applying an expression: `apply(‹dict›,‹expr›)`

**Description:**
This operator generates a new list by applying the operation `‹expr›` to all elements of a dict (but not to the keys) and collecting the results.
As usual, `#` is the run variable, which successively takes the value of each element in the list.

    > apply({"a" : 1, "b" : 2}, #^2);
    < {a:1, b:4}

------

### Applying an expression: `apply(‹dict›,‹var›,‹expr›)`

**Description:**
Similar to `apply(‹list›,‹expr›)`, but the run variable is now named `‹var›`.
The variable is local to the expression.

    > v = 123;
    > apply({"a" : 1, "b" : 2}, v, v^2);
    < {a:1, b:4}
    > v
    < 123

------


### Applying an expression: `apply(‹dict›,‹varVal›, ‹varKey›,‹expr›)`

**Description:**
Similar to `apply(‹list›,‹var›, ‹expr›)`, but with two running variables: `‹varVal›` for the value and `‹varVal›` for the key.
The variables are local to the expression.

    > apply({"a" : 1, "b" : 2}, v, k, k+v);
    < {a:a1, b:b2}

------

### Selecting elements of a list: `select(‹list›,‹boolexpr›)`

**Description:**
This operator selects all elements of a dict for which a certain condition is satisfied.
The condition is supposed to be encoded by `‹boolexpr›`.
This expression is assumed to return a `‹bool›` value.
As usual, `#` is the run variable, which successively take the value of all elements in the list.

    > select({"a" : 5, "b" : 2}, isodd(#));
    < {a:5}

------

### Selecting elements of a list: `select(‹list›,‹var›,‹boolexpr›)`

**Description:**
Similar to `select(‹dict›,‹boolexpr›)`, but the run variable is now named ‹var›.
The variable is local to the expression.

    > v = 123;
    > select({"a" : 5, "b" : 2}, v, isodd(v))
    < {a:5}
    > v
    < 123

------

### The forall loop: `forall(‹dict›,‹expr›)`

**Description:**
This operator is useful for applying an operation to all elements of a dict.
It takes a `‹dict›` as first argument.
It produces a loop in which `‹expr›` is evaluated for each **value** of the list.
For each run, the run variable `#` takes the value of the corresponding list value.

**Example:**

    > a={"a" : 5, "b" : 2};
    > forall(a,println(#))

This code fragment produces the output

    * 5
    * 2

**Modifiers** 

forall supports the modifier `iterator` that changes the behavior of the running variable: "value" iterates of the dictionary values (the default), "key" iterates over the dictionary keys and "pair" returns an elementary dictionary element that key and value can be accessed using the ".key" and ".value property".

**Example iterator key:**

    > a={"a" : 5, "b" : 2};
    > forall(a,println(#), iterator->"key")

This code fragment produces the output

    * a
    * b


**Example iterator pair:**

    > a={"a" : 5, "b" : 2};
    > forall(a,println([#.key, #.value]), iterator->"pair")

This code fragment produces the output

    * [a, 5]
    * [b, 2]

------

### The forall loop: `forall(‹dict›,‹var›,‹expr›)`

**Description:**
Similar to `forall(‹dict›,‹expr›)`, but the run variable is now named `‹var›`.
The variable is local to the expression.

    > v=994;
    > k=123;
    > forall({"a" : 5, "b" : 2},v,println(v))
    * 5
    * 2
    > v
    < 994
    > k
    < 123

------

# Deprecated `dict`

This should not be used anymore.

## Creating a new: `dict()`

Without arguments, this creates an empty dictionary.

    > dict()
    < {}

## Constructing a dict using modifiers: `dict(‹modif1›,‹modif2›,…)`

It is however possible to add elements to this dictionary
by using modifiers in the function invocation.
The names of the modifiers will be used as string keys.

    > dict(foo->"bar", baz->123)
    < {"baz":123, "foo":"bar"}

It is not possible to define a dictionary with non-string keys in this way.

## Adding a mapping: `put(‹dict›,‹expr1›,‹expr2›)`

Creates a new dictionary with is equivalent to `‹dict›` but in which
the key ‹expr1› is mapped to the value ‹expr2›.

    > d = dict();
    > d = put(d, 12, 34);
    > d
    < {12:34}

This does *not* modify the dictionary passed in the first argument, so
you have to store the result back to permanently alter an existing dictionary.

    > put(d, 56, 78)
    < {12:34, 56:78}
    > d
    < {12:34}

It is possible to use the undefined value as a dictionary key.

    > put(dict(), (;), "what?")
    < {___:"what?"}

Different complex numbers correspond to different keys,
even if they have the same real part.

    > d = dict();
    > d = put(d, 32 + 1*i, 321);
    > d = put(d, 32 - 1*i, 329);
    > d = put(d, 32, 320);
    > d = put(d, "32", 23);
    < {32 - i*1:329, 32:320, 32 + i*1:321, "32":23}

Note that the use of quotation marks here in this documentation
is specific to the documentation.  The usual stringification of values
in Cinderella and CindyJS does not apply quotation marks, which may lead
to confusing output.  For example, the above dict may *appear* to have
to identical keys `32`:

    > println(d)
    * {32 - i*1:329, 32:320, 32 + i*1:321, 32:23}

## Retrieving a value: `get(‹dict›,‹expr›)`

Retrieves the value associated with the key `‹expr›`,
or `___` if that key is not present in the dictionary.

    > d = dict(k->77);
    > get(d, "k")
    < 77
    > get(d, "d")
    < ___
