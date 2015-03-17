#  Drawing

In addition to its computing facilities, one of the most important features of CindyScript is its powerful possibilities for reading position data from a geometric construction and for direct output of graphics to a construction.
This section is about the output part.
One can easily draw points and lines by invoking a graphics operator within CindyScript.
It is important to mention that these drawings of points or lines are not geometric objects of the Cinderella construction.
These elements serve purely "decorative" purposes, and it is impossible to apply geometric Cinderella construction steps to them.
Nevertheless, they are extremely useful, since often one wants to create complicated-looking output that is not directly constructible by geometric means.
Then it is often very easy to write a few lines of CindyScript code that generate the output.
In particular, CindyScript is very useful if generation of the output requires repetitive application of constructions.
One can also use high-level graphics operations within CindyScript to create a plot of a function directly.

The following topics will be treated:

*  **[Appearance of Objects](Appearance_of_Objects):**
Since the appearance of the elements of a construction is fundamental for all such output operations, we treat the handling of color, size, and transparency first.

*  **[Elementary Drawing Functions](Elementary_Drawing_Functions)**: This section covers the fundamental drawing primitives for points and lines.

*  **[Function Plotting](Function_Plotting):**
Plotting of functions can be very easily done with high-level graphics operations.

*  **[Texts and Tables](Texts_and_Tables):**
Textual output allows for various ways of creating additional information in a geometric view.

*  **[TeX Rendering](TeX_Rendering):**
More details on formula generation inside CindyScript.

*  **[Script Coordinate System](Script_Coordinate_System):**
Finally, it will be explained how the local coordinate system for drawing can be transformed.
In this way one can, for instance, create a perspective drawing of a scene.
