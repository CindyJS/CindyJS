# Implementation of geometric operators

A geometric operator in its most general form takes some parameters
and some geometric objects as input to construct one or more output objects.

Parameters in the above formulation include continuous parameters,
like the position of a free point or the angle of a point on a circle,
as well as discrete parameters, like choosing one element from a finite set.
In the following text, the term “parameters” will usually refer to continuous parameters only.

A geometric element is an instance of a geometric operator.
It binds the operator to a set of parameters and specific input elements.
A geometric element `el` can contain several pieces of information:

* A current position. This is often stored in `el.homog`.
  Depending elements will use that as input.
* An index `el.stateIdx` into the state arrays.
  At the indicated position, the element can store information
  about its continuous parameters as well as data used
  to facilitate continuous tracing of discrete choices.
* A parameter `el.parameter`: We'll have to see whether we still need this.
* A list of arguments, which identify elements on which this one depends.
* Some members describing the initial position of the element.
* Various properties controlling appearance, which are of no relevance here.

A geometric operator has functions which operate on these values.
The following sections describe the functions and other properties
each of the geometric operators may define.

In the following text, there are some terms
which have overlapping meaning in general,
but which have very specific meaning in this context,
so these terms need to be defined.

* The *position* of an element is the current position.
  See the section on `kind` for where that position is stored
  and the section on `updatePosition` for how it is computed.
  The position is the output of an operation.

* The *state* of an element is something which is used to provide continuity.
  This is only relevant for either multi-valued operations
  or free and semi-free elements.
  The `el.stateIdx` is used as an index into the `stateIn` resp. `stateOut` arrays
  to facilitate read-only access to the previous state
  and write-only access to the newly updated state.

  So the state is a subarray of floating-point numbers
  which are considered as pairs forming complex numbers.
  This interpretation is relevant since from time to time,
  numbers which are almost real will be made exactly real.

* The *parameter* is used to construct an interpolation path while tracing.
  Usually this will be a vector or matrix
  for which a linear interpolation (along a complex detour) can be performed.
  The parameter can be reconstructed from the state.

## kind = ‹string›

A short string describing the kind of object which is the result of this operation.
Possible values include:

* `P` – Point
* `L` – Line
* `S` – Segment
* `C` – Conic (which includes circles)
* `*s` – set of `*` (e.g. `Ps` for several points)
* `Tr` – Transformation

The objects of kind point, line and segment store their result in `el.homog`.
Segments also contain `el.startpos`, `el.endpos` and `el.farpoint`, but this may change.
Conics are described by `el.matrix`, as are transformations.
Sets of objects are represented in `el.results`.

## signature = [‹strings›]

While this is not implemented yet, there should be a future version
where this property is used to describe the number and types
of permissible input elements.

## isMovable = ‹boolean›

A boolean property which defaults to `false`.
If set to `true`, then the element in question is at least semi-free,
so it is described by at least one continuous parameter.
Elements of this kind may be moved through user interaction or scripts.

## stateSize = ‹integer›

A numeric property which defaults to zero.
This is the number of floating point numbers which are reserved
in the state arrays for each element which is an instance of this operator.
So the range of permissible state variables is from `el.stateIdx`
to `el.stateIdx + op.stateSize` exclusive.
Since the state is at times interpreted as an array of complex numbers,
this state size should usually be an even number equal to
twice the number of complex variables which describe the state.

## initialize(el)

This function, if present, will get called exactly once for every element,
when the element is first included into the geometric configuration.
It may compute the initial parameter of the element
from arbitrary properties of the object that describes the element.
By the time this function is executed,
all previous elements will be initialized and have updated their position.

The `initialize` function may write to the output state.
Any state it writes will be available in the input state when the
`updatePosition` function is run for the first time.
The global flag `tracingInitial` will be true at the time `initialize` is called.
If it does write to the state array, then it might want to set that flag to `false`
so that the initial run of `updatePosition` already uses tracing to match results,
as opposed to simply returning results in an arbitrary order.

## getParamForInput(el, pos, type)

Provided with the desired new position
(either from mouse input or some assignment in some script)
this function computes the corresponding parameter vector to represent
either that position or the (in some sense) closest condition
under the constraints of a semi-free element.
The returned parameter can be used as the end point of some interpolation path.
The computation may take the current position of input elements into account.

The `type` field can be used to describe the kind of input we are dealing with.
`type === "mouse"` represents user interaction, while `type === "homog"`
describes scripted access to the `"homog"` field of the element.
Other types can be introduced as needed, but efforts should be made to keep
the number of distinct cases low.  For example, there should be no `"xy"` type,
since setting cartesian coordinates can be modeled by setting homogeneous ones.

When the input is `"mouse"`, then the position represents
the current mouse position, expressed as homogeneous coordinates,
and already including an offset to the original point position
which was remembered from the mouse down.

## getParamFromState(el)

Reading from the current input state `stateIn`,
this function returns the parameter corresponding to that state.
The returned parameter can be used as the starting point of some interpolation path.
The returned result should not depend on the current position of any input element.

## putParamToState(el, param)

Write a given parameter value to the state `stateOut`.
This function is called along ain interpolation path,
to adjust the position of the element which is being moved.

## parameterPath(el, tr, tc, src, dst)

Compute parameter along interpolation path.
If absent, a default implementation will be used,
which performs a single semi-circular complex detour.
`tr` is the real parameter, in the range -1…1.
`tc` is a resulting complex parameter on the seimicircle.
Either `tr` or `tc` may be used to compute the alternate path.
`src` and `dst` are the parameters at the endpoints of the path.
The returned value should be a linear interpolation between these.


## updatePosition(el, isMover)

Every geometric operator must implement this function.
It will recompute the position of the resulting element
based on the argument elements and the current parameters.

For elements which have state,
`updatePosition` should write all of the state variables,
usually after taking the previous state into account.
Even if the new state should be identical to the old one,
that should be made explicit by copying the values.

The `isMover` argument will be `true` if the current element is the
one which is actively being moved around, and `false` if it is only
updated in response to one of its arguments changing position.
