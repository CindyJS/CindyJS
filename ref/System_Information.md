## System Information

These functions provide access to the environment in which the script is being executed.

#### Version information: `version()`

**Description:**
This operator returns a list.
The first element of that list is the string `Cinderella` when run inside Cinderella.
Other [CindyScript](CindyScript.md) implementations will return other values, e.g.
`CindyJS` for the CindyJS project.
The remaining components describe the actual version of the engine in question.
For Cinderella there are three version components, namely major, minor and build number.
