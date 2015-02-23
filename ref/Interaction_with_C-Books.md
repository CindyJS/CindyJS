## Interaction with C-Books[?](tiki-editpage.php?page=C-Books)

The c-book infrastructure and software (also called C-Book[?](tiki-editpage.php?page=C-Book) Environment CBE) is being developped in the EU project called MC Squared.
C-books are e-books which may be enhanced by so-called widgets which are small pieces of software running within the c-books.
Typically, readers of the c-books can interact with the widgets; and moreover, the widgets can communicate internally both with the c-book infrastructure and also with other widgets.

There are three major ways for widgets to interact with the c-book infrastructure and other widgets:

*  getting and setting scores to and from the CBE,

*  using randomized values supplied by the CBE,

*  communicating with other widgets, so-called cross-widget communication.

Cinderella has been integrated into the c-book infrastructure, so that it is possible to use Cinderella files as c-book widgets.
In addition, Cinderella now supports the ways of interaction mentioned above (but notice that cross-widget communication is currently still in development).
This page gives a brief documentation of how to use this functionality, mainly via CindyScript.

### C-Book Scores

C-book scores are fully supported by Cinderella via CindyScript.
For using scores in c-books there exists a tutorial in the form of a c-book.
See http://mc2dme.appspot.com/dwo/dwo.jsp?profile=78&amp;language=en&amp;scoViewNr=5686812383117312.

Here, we also give some written explanations of how to do this.
At first, notice that after having added a widget to a c-book which uses scores in edit mode, you will have to click on the widget in order to open up the widget editor window.
There you have to make sure the "include in grading" ("teltMee" in Dutch) check box on top of the window is checked, and that the max score is set to a positive number.
Moreover, you either have to check the "add check button" checkbox or not, depending on how the widget interacts with the CBE.

In order to produce your own widget which supports scores, you may use the following functions which are described in more detail below:

*  setmaxscore(): set an internal version of the CBE maximum score; this can be used to test your widget when not yet included into the CBE.

*  getmaxscore(): get the maximum score given by the c-book-author from the CBE.

*  setscore(): set the score to some non-negative value.

*  getscore(): get the score back which was set earlier using setscore().

*  check(): ask the DME to read the current score.

#### Setting the current max score: `setmaxscore(‹newmaxscore›)`

**Description:**
This function sets the internal version of maxscore to the value newmaxscore.
newmaxscore has to be a non-negative integer.
This internal max score is ignored if the widget is running inside the CBE.
So, this function is just for testing purposes as long as the widget is still running in the stand-alone version of Cinderella and not as part of the CBE.

#### Getting the maximum possible score of the widget from the CBE: `getmaxscore()`

**Description:**
This function returns the maximum possible score of the current widget which was specified in the widget editor.
In the CBE, this is usually a non-negative integer.

#### Getting the current score: `getscore()`

**Description:**
This function returns the current score of the current widget.
This has to be set using setscore() before.
It is usually a non-negative integer.

#### Setting the current score: `setscore(‹newscore›)`

**Description:**
This function set the current score of the current widget to the value newscore.
Newscore has to be a non-negative integer.

#### Tell the CBE to read this widget's current score: `check()`

**Description:**
This function tells the CBE to ask this widget for the current score (which has been set be setscore() earlier).
This is usually a non-negative integer.

### C-Book Randomized Values

C-book randomized values are fully supported by Cinderella via CindyScript.
For using scores in c-books there exists a tutorial in the form of a c-book.
See http://mc2dme.appspot.com/dwo/dwo.jsp?profile=78&amp;language=en&amp;scoViewNr=5723475968786432.

Here are some brief explanations of how to do this.

In order to be able to use random values with a Cinderella widget,
you just have to know which objects you want to change via the random parameters.

As an example we use a construction of the altitude AE of a right triangle with base CB and with A=(0,0), where we want to set the x-coordinates of the points C and B randomly.

To do this, simply type the following two lines into the text field in the bottom right of the CBE when in edit mode of a new page:

B.x=1..6
C.x=-6..-1

This tells the CBE to choose for B.x random integer value between 1 and 6 and for C.x a random integer between -6 and -1.
For most random values, the solution involves the computation of a square root.

How do we have to prepare the Cinderella widget such that this works?

The first thing we need to know is:
What does the DME pass to the Cinderella widget after the choice of a random value?
Actually, this is the most natural thing.
E.g., based on the following code, it might pass to the widget the code:
B.x=3
C.x=-4
The Cinderella widget simply takes these lines of code and executes them, after having executed the Cinderella widget "initialization".

Thus, if B and C are free points, everything is fine.

However, we do not want to allow the user to move B and C.
For this, we may use Cinderella's "pinning" property.
Most Cinderella objects can be "pinned" to a fixed coordinate, i.e.
they are not allowed to be moved using the mouse or anything else.

So, what we have to do to be able to set the x-coordinates of B and C after the "initialization" is to
1.
set the pinning property to "false" for B and C (or even for all points) in the "initialization" event
2.
and to set it later (e.g., in the "draw" event) to "true".

This can be achieved using the following [CindyScript](CindyScript) code.
Paste this into the "initialization" event part of the Cinderella "[CindyScript](CindyScript) Editor":

forall(allpoints(), inspect(,"pinning", false));

In order to pinn the points after having changed the x-coordinates of B and C,
paste this into the "draw" event part of the Cinderella "[CindyScript](CindyScript) Editor":

forall(allpoints(), inspect(,"pinning", true));

This fixes all points.

In the manual of the DME you will find several other ways to specify random values, such as
B.x = 1,2,5,6
to only let the DME choose between the four values 1, 2, 5, and 6.
We will not go into this here.

Moreover, not only coordinates of points can be set via the random parameters feature.

You may change any other numerical property of a Cinderella object which is changeable from [CindyScript](CindyScript) via the syntax

...
= integer number

E.g., points also have a y-coordinate, so if you type the following into the "variables for random parameters"
textarea in the DME at the bottom right of a page
A.x = -5..5
A.y=-3..3
then both coordinates will be set randomly.

### Cross-Widget Communication

Cross-widget communication is still in development.
This documentation will be adapted as soon as cross-widget communication is available.

TO DO...
THE REST OF THIS SECTION IS STILL TO BE WRITTEN...
