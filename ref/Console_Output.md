## Console Output

In the CindyScript input window you find a console for text output.
For most practical purposes this will not be used for the final construction.
However, it is extremely useful for debugging.

#### Printing text: `print(‹expr›)`

**Description:**
This operator prints the result of evaluating `‹expr›` to the console.

------

#### Printing text: `err(‹expr›)`

**Description:**
Prints the result of evaluating `‹expr›` to the console.
If `‹expr›` is a variable, the variable name is printed as well.
Very useful for debugging.

------

#### Printing text: `println(‹expr›)`

**Description:**
This operator prints the result of evaluating `‹expr›` to the console and adds a newline character to the end of the text.

------

#### Printing a newline: `println()`

**Not available in CindyJS yet!**

**Description:**
This operator prints a newline character to the console.

------

#### Clearing the console: `clearconsole()`

**Description:**
Removes all text from the console.

------

#### Conditional print: `assert(‹bool›,‹expr›)`

**Description:**
This operator is mainly meant for convenience purpose when generating own error mesages.
it is equivalent to `if(!‹bool›,println(‹expr›))`.
It can be used to test wheter a condition is met and otherwise generate an error message.

**Example:**
A typical usage of this operator is the following:

    > assert(isinteger(k),"k is not an integer");

------

#### Output a status message: `message(‹expr›)`

**Not available in CindyJS yet!**

**Description:**
This operator shows the result of evaluating `‹expr›` in the status line of the application, or in the status line of the browser for Cinderella applets.
