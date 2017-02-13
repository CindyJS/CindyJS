# Dictionaries

Dictrionaries are maps from keys to values.
Like all other data structures in CindyJS, dictionaries are immutable.
Modifying a dictionary does in fact create a new dictionary.
Since dictionary keys have to be compared in full for dictionary lookups,
users are advised against using large data structures as dictionary keys.
The order of key-value pairs in a dictionary is implementation-defined.

**This is an experimental feature in its early stages of development.**

All of the features described here are subject to changes without notice,
i.e. may change even without a major version bump.
If you want to avoid accidents, please inform the CindyJS development team
of how you are using dictionaries, so that we can try to maintain compatibility
for your use cases or inform you if things are likely to break soon.

At this early stage, a lot of the functionality is only available through
named functions but should become available through operator symbols, too.
The named functions will probably remain as an alternative
for the sake of compatibility and clarity.

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
