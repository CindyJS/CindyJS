# CindyJS

**CindyJS is a framework to create interactive
(mathematical) content for the web.**

It aims to be compatible with [Cinderella](http://cinderella.de/),
providing an interpreter for the scripting language CindyScript
as well as a set of geometric operations which can be used to describe
constructions.
Together, these components make it very easy to visualize various
concepts, from geometry in particular and mathematics in general,
but also from various other fields.

## Examples

Examples on the web can be seen [here](http://science-to-touch.com/CJS/).

There is also [an `examples` directory]
(https://github.com/CindyJS/CindyJS/tree/master/examples)
inside the repository, demonstrating individual functions and operations.

## Building

To use the project, simply type `make` in the top level source directory.
All required third-party tools should be downloaded automatically,
and installed inside the project directory tree.
One exception is a Java Development Kit, which has to be installed before.
If `make` terminated successfully, then `build/js` will contain
the artifacts which you'd likely want to include in your web site.

## Contributing

When you work on the code base `make plain=1` will give you a
considerably faster compile time, and more readable source files.
If you are confident that your work is done, call `make alltests`
after you did `git add` to stage your changes.
That will ensure that your modifications pass all kinds of tests.
The same tests will be run automatically on pull requests.
Once your modifications satisfy your expectations, pass these tests
and are accompanied by a suitable test case or demonstrating example
(where appropriate), you may file a pull request for your changes.

## Documentation

[The `createCindy` documentation]
(https://github.com/CindyJS/CindyJS/blob/master/ref/createCindy.md)
describes how to create a widget on an HTML page using this framework.

Other documentation in [the `ref` directory]
(https://github.com/CindyJS/CindyJS/tree/master/ref) describes
large portions of the CindyScript programming language. This
documentation, however, started as a copy of
[the corresponding Cinderella documentation]
(http://doc.cinderella.de/tiki-index.php?page=CindyScript). It
is currently meant as a goal of what functionality *should* be
supported, while actual support might still be lagging behind. If there
is a particular feature you'd need for your work, don't hesitate to
[file a feature request](https://github.com/CindyJS/CindyJS/issues) for it.

## License

CindyJS is licensed under the
[Apache 2 license](http://www.apache.org/licenses/LICENSE-2.0.html).
