# The public interface to CindyJS

Except for some legacy stuff which is now deprecated, CindyJS exports a single object into the global namespace, which is called `createCindy`.
This method expects a single object as an argument, which in turn contains various parameters.

Example:

    J createCindy({ports:[{id:"CindyCanvas"}],
    J              scripts:"cs*",
    J              csconsole:null
    J             });

## Parameters

### ports

A list of display ports associated with the newly created instance.
At the moment, only the first element of this list is actually used.
Each port description is a dictionary which may contain the following items:

* `id` is the element `id` of the drawing canvas.
* `element` is a DOM element for the drawing canvas.
* `width` and `height` specify the desired dimensions for the canvas,
  and override any `width` and `height` attributes that element might have.
* `background` specifies the CSS background color to be used for the canvas.
  If this is omitted, the canvas will be transparent.
* `transform` specifies coordinate system transformations.
  If this is omitted, the global set of transformations applies instead.
  For details see the `transform` setting at the top level.
* `fill: "window"` will adjust the size of the canvas so that it matches the
  `innerWidth` and `innerHeight` of the window.
  This overrides the `width` and `height` attributes of the canvas element.
  At the moment this still doesn't accomodate dynamic changes to window size.

Either `id` or `element` must be given, with the latter taking precedence.
The element identified in this way must be a `HTMLCanvasElement`.
Removing the canvas from the DOM tree will shut down the instance.

### canvasname

Backwards-compatibility setting.
`canvasname:"name"` is equivalent to `ports:[{id:"name"}]`.

### canvas

Backwards-compatibility setting.
`canvas:elt` is equivalent to `ports:[{element:elt}]`.

### scripts

If this is a string, it must contain an asterisk `*`.
The name of a possible event handler will replace that `*` and the resulting string will be used as the `id` attribute of a `<script>` element of the HTML document.
If a script with that `id` does exist, its content is used as CindyScript code for the named event.
In the example above, a `<script id="csdraw">` would contain a script to be invoked every time something needs to be drawn.

The parameter can also be an object.
In that case, its attributes are named by event names, and their values will be the CindyScript code to be executed for the given element.
So for example `scripts:{draw:"draw([0,0])"}` will execute the `draw` command of CindyScript whenever the scene needs redrawing.

Instead of using the single `scripts` parameter, one can use separate parameters to identify the `<script>` tag to be used for each event.
For example `drawscript:"csdraw"` would load the same draw script in the example above, but not the content of any other element whose name might accidentially start with `cs`.

At the moment the following events are defined:

* `init` is invoked immediately after startup
* `move` when some element got moved
* `draw` for drawing the scene
* `mousedown` invoked after a mouse button got pressed
* `mousedrag` invoked when the mouse is moved
* `mouseup` invoked if the mouse button is released
* `keydown` invoked when a key is pressed, see the `keylistener` parameter
* `tick` to perform a timed animation

### keylistener

If this property is `true`, then a key listener will be installed for the
document containing the instance. This will mean that every key pressed while
visiting that page will eventually end up in the CindyJS event handler.
If this property is not set to `true` but there is a `keydown` script
then the canvas will be made focusable, and will receive key events
only when focused. To focus the canvas, click it or use the tab key.

### transform

The transform property is a list of transformations, applied in sequence.
Each transformation is an object, containing a single property.
The name of the property describes the kind of transformation,
while the value will provide any required parameters.

* `{scale:‹number›}`
scales by the given amount.
* `{translate:[‹number›,‹number›]}`
moves by the given offsets in `x` and `y` direction.
* `{scaleAndOrigin:[‹number›,‹number›,‹number›]}`
specifies the transformation without reference to prior state.
This operation makes any previous operations irrelevant.
The first number is the scaling factor, the other two are the position of the origin.
* `{visibleRect:[‹number›,‹number›,‹number›,‹number›]}`
specifies the transformation without reference to prior state,
in a way that interacts nicely with changing the size of the widget.
The given coordinates are left, top, right and bottom coordinates of a
visible rectangle, specified in user coordinates.
The coordinate system is chosen in such a way that this rectangle will be
fully visible and centered within the widget.

### defaultAppearance

An object providing default values for some appearance settings.
The default is defined as follows:

    J defaultAppearance: {
    J   clip: "none",
    J   pointColor: [1,0,0],
    J   lineColor: [0,0,1],
    J   pointSize: 5,
    J   lineSize: 2,
    J   alpha: 1,
    J   overhangLine: 1.1,
    J   overhangSeg: 1,
    J   dimDependent: 1
    J }

Any parameter which stays at this default value doesn't have to be specified at all.

### csconsole

This should be either `null`, set to `true` or a suitable `DOMElement` or its id string.
If it is an element (passed directly or identified via its id),
then messages (in particular those created by the `err` function) will be appended to that element.
If it is `true` a simple console with a command line will be created automatically.
If it is `null`, error output will be suppressed except for output to the web developer console.
If this parameter is absent, then it will be handled like `null`.

In the past, the absence of this parameter would cause a popup window,
but that was more annyoing than useful in most environments.

### grid

To draw a grid behind the scene, set this to an integer specifying the grid size.

### snap

Set this to true to enable snapping to the grid.

### geomety

A list containing geometric primitives.
See the section “Geometry” for details.

### behavior

For physics simulations.
See the section “Lab” for details.

### images

A list of URLs which will be loaded.
Whenever an image is ready, it can be used in the application instance.

### autoplay

Setting this to true indicates that the animation should start immediately after startup of the instance.

### oninit

A JavaScript function to be called when the application instance is ready.
More specifically, the script is executed after all scripts have been compiled,
but before the `init` script gets executed, and before the canvas listeners are installed.

### exclusive

If set to `true`, this will cause all previous instances of the application to be shut down when this instance is ready to start up.

### plugins

An object providing plugins in addition to those registered by `createCindy.registerPlugin`.
The key is the plugin name, the value a plugin initialization callback.

### language

The language of the page, given as a two-letter string.
This is used to provide matching translations from the `translations` dictonary
using the `tr` function.
It is also returned using `currentlanguage`.
This should always match the language of the rest of the containing page.

### translations

A dictionary of dictionaries.
The outer key is the two-letter language abbreviation.
The inner key is the string passed to the `tr` function.
The corresponding value will be returned in response.

### angleUnit

The unit to use when printing angles, given as a string.
Supported values include `rad`, `°`=`deg`=`degree`,
`gra`=`grad`, `turn`=`cyc`=`rev`=`rot`, `π`=`pi` and `quad`.
The given name is also be printed as the unit,
so the settings described as equal will print the same value
but with a different notation for the unit. The default is `°`.
An empty string will cause angles to be printed in radians with no unit.
To enter the special symbols when editing the data in a non-Unicode environment,
you can enter `°` as `\u00b0` and `π` as `\u03c0`.

## Instance Methods

The object returned from a call to `createCindy` has a number of methods which may be of use.

### startup

This method is usually called automatically once the DOM has been fully loaded.
It initializes the instance and registers all required listeners.
This method must not be invoked more than once.

### shutdown

This method should be invoked whenever the instance is no longer active.
Some care has been taken to call this method automatically in appropriate situations.
One such situation is when the canvas element is removed from the document.
Another is the creation of a second instance using the `exclusive` parameter.
But it never hurts to explicitely shut down an instance nown to be no longer in use.
Repeated invocation of this method is without effect.
For example, starting two instances for the *same* canvas will cause both of them to remain active, which may cause problems.
Removing some *parent* of the canvas from the document will not cause an automatic shutdown on some older browsers (those not supporting [mutation observers](http://caniuse.com/#feat=mutationobserver)).

### evokeCS

This function accepts a string containing CindyScript code.
It will execute that code immediately inside the scope of this instance.

### play

Start animating the content.

### pause

Pause the animation.
The next call to `start` will resume the animation from the current position.

### stop

Stop the animation.
The configuration will be reset to the situation where `play` was invoked.

## Static Functions

The `createCindy` function has a number of additional functions defined as its members.

### newInstance

The `createCindy.newInstance` function behaves mostly like `createCindy` itself, but it will not automatically invoke the `startup` method of the newly created instance.
Use this in special cases where custom control over startup and shutdown is required.

### waitFor

The `createCindy.waitFor` function will return a function which can be used as a callback.
Created instances will only be started automatically after all callbacks created in this way have been executed.
This method must be called in the header of the HTML document, before the `DOMContentLoaded` event has been triggered.
That is because internally there is one such wait for that event, and once all events have been waited for it is an error to specify additional waiting conditions.

### registerPlugin

This function takes three arguments.
The first is the version number of the API to be used.
Currently only version `1` is supported.
The second parameter is the name of the plugin.
The third is a callback function.
It will be called when the `init` script of some content requests that plugin using the `use` operation of CindyScript.
The details of the Plugin API will one day be described in some other document.

# Specifying non-script construction elements

## Geometry

*This section remains to be written.
It should specify the structure of a geometric straight line program.*

## Lab

*This section remains to be written.*
