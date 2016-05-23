## System Information

These functions provide access to the environment in which the script is being executed.

#### Version information: `version()`

**Description:**
This operator returns a list.
The first element of that list is the string `CindyJS` when run inside CindyJS.
Other CindyScript implementations will return other values,
e.g. `Cinderella` for the Java version of Cinderella.
The remaining components describe the actual version of the engine in question.

For CindyJS, there are five version components after the engine name.
The first three are the major, minor and patch version components
of [semantic versioning](http://semver.org/).
Next comes the number of commits since the release, so this will always be zero
for an official release, but may be non-zero for development snapshots.
The last component is a string, indicating the git commit id
of the working tree in question.
This can be used to distinguish parallel development branches.
An exclamation mark will be appended to this string if the code
contains additional uncommited changes.
For snapshots taken before the first official release,
The version will be `0.0.0` and the number of commits will be `-1`.
