#  CindyScript Fundamentals

Cinderella comes with an easy to learn yet still very powerful functional language.
It is designed primarily with the intention to allow for high-level interaction with geometric constructions or physical simulations created in **Cinderella.2**.
Nevertheless, it can also be used as a standalone language for performing mathematical calculations.

There are three ways to use the CindyScript language within **Cinderella.2**.
First of all, one can write CindyScript expressions as parts of [functions](Function_Plotting.md) in a **Cinderella** construction.
Besides, one can enter CindyScript commands in a command shell to, e.g., immediately set properties such as color or size of geometric elements.

However, CindyScript is most commonly used to write programs in [the script editor](The_CindyScript_Editor.md).
Here, one can specify the occasion on which the program will be executed.
For instance, it can be executed whenever the user moves the construction or after any mouse click.
Thus one can easily add functional behavior and graphical enhancements to an existing construction.

The following sections will give you an overview of the global design of the programming language CindyScript.
The language design follows some guiding principles:

*  The language should be easy to learn, write and read
*  The language should have only minimal syntactic overhead
*  The language should be fast in execution
*  The language should interact seemlessly with Cinderella and CindyLab

The following topics will give you an overview over the main language features:

*  **[General Concepts](General_Concepts.md):**
Main functionality of the language

*  **[Entering Program Code](Entering_Program_Code.md):**
How to write and edit a program

*  **[Variables and Functions](Variables_and_Functions.md):**
Declearing, destroying and scope of variables and functions

*  **[Accessing Geometric Elements](Accessing_Geometric_Elements.md):**
How to interact with Cinderella and CindyLab

*  **[Control Operators](Control_Operators.md):**
How to create control structures with `if`, `repeat`, `while`, …

*  **[Arithmetic Operators](Arithmetic_Operators.md):**
Dealing with numbers (+, -, *, /, sin(), cos(), …)

*  **[Boolean Operators](Boolean_Operators.md):**
Logic statements

*  **[String Operators](String_Operators.md):**
Dealing with strings of characters

For a detailed description of the language it is necessary to consult the documentation on specific parameters.
We recommend to browse over the CindyScript manual at least once to get an impression of various possibilities of the language.
