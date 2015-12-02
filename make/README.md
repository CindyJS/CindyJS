# CindyJS Build Process

## Usage

Run `node make [SETTINGS] [TASKS]` to build the project.

Example: `node make js_compiler=plain Cindy.js`

### Settings

A setting on the command line is an argument of the form `NAME=VALUE`.
If multiple settings use the same name, the last one is in effect.
Settings and tasks may be mixed on the command line,
but even the all settings are applied before the first task gets executed.

The list of preset settings can be found in [`Settings.js`](Settings.js).
In addition to these, some parts of the configuration may respond to
additional settings, even though these are not defined by default.
Grep the code for `settings.get` and `settings.use` if you need to know.

Some of the settings which are more likely overridden on the command
line include

* **parallel** can be set to `true` to run tasks in parallel if possible,
  `false` to even run jobs marked for parallel execution sequentially,
  or any other value to run designated jobs in parallel but tasks sequentially
  which is the default.
* **js_compiler** which should be one of `closure` (default) or `plain`.
* **closure_version**
* **gwt_version**
* **gwt_args** which could be set to e.g. `-style PRETTY`.

### Tasks

The tasks are defined in [`build.js`](build.js).

The most important artifact-building tasks are:

* **all** builds `Cindy.js` and its plugins
* **Cindy.js** just builds `Cindy.js`, but no plugins
* **deploy** to create `build/deploy` ready for official deployment

In addition to these, there are some tools to help development:

* **beautify** reformats the code, replacing files in place
* **jshint** checks the code for possibly problematic patterns
* **tests** runs some unit tests
* **alltest** performs even more tests,
  after changes have been staged or committed

Contributors are encouraged to run these before creating a pull request.
Travis CI will run the same tests on every pull requests,
so addressing any issues before will save some time for everybody involved.

There is also ca task called **clean** which removes the `build` directory.
It is somewhat special because it will get executed first,
no matter the order of tasks on the command line.

## Internals

The descriptions below follow the typical flow of control
through the build system in more or less chronological order.

### Make and the Makefile

If users have make installed, they may call `make` instead of `node make`.
In this case the processing will start at the legacy [`Makefile`](../Makefile),
which simply forwards most commands to our build tools.
The most notable exception to this is its capability to automatically
download Node if either `node` or `npm` are unavailable or severely outdated.

### Prepublish script

Another way the build system may be triggered indirectly
is by invoking `npm install`.
This is what users of the npm ecosystem will most likely expect.
Look at the `prepublish` script in [`package.json`](../package.json)
to see the exact command being executed in this situation.

### Installation of node modules

When invoking `node make` and `make` is a directory,
then this is equivalent to invoking `node make/index.js`.
So the first stop in the JavaScript build tools is [`index.js`](index.js).
Its main concern is making sure that all node modules have been installed.
If `build/node_modules.stamp` is less recent than `package.json`,
then it will run `npm install` to fetch all development dependencies
of the project as listed in `package.json`.
It will not remove additional installed modules.

If additional `npm` got invoked in this way, then it will afterwards
re-launch itself. This is probably just a precaution,
aimed to ensure that no amount of caching
will leave us without the modules we just installed,
or with outdated versions of some of these.

Some extra machinery is required to avoid infinite recursions.
This is because as written above, `npm install` will usually call
our build system as part of its `prepublish` script.
If we get called in this way, we may assume that all modules are in place,
and won't call `npm install`.
Furthermore, when we do call `npm install` ourselves,
then we export an environment variable to ensure that
the recursive call remains a no-op. This allows us to use `npm install` to
[just install our dependencies](https://github.com/npm/npm/issues/9590),
without triggering the build system in an infinite recursion.

### Command line parsing

The file [`cli.js`](cli.js) is responsible for command line parsing.
It applies the settings from the command line,
and only then loads the task descriptions from `build.js`.
The order is important here, since the settings may affect the tasks
in very different ways.

### Handling of settings

In [`Settings.js`](Settings.js) is both a list of predefined settings
and the machinery to deal with settings.

Using `get`, a setting may be retrieved.
Using `use`, the setting is not only retrieved,
but also associated with the task currently being defined.
So if a change in setting may cause a task to create
a different output under the same output file name
(as can be expected for e.g. a change in compiler version),
then `settings.use` should be used.
If, on the other hand, the setting value is somehow encoded in the
output file name (like e.g. the version number in the output of some
download task), then `settings.get` is sufficient.
Outside tasks, `settings.use` is not available.
If settings used outside tasks affect the results of some tasks,
these tasks should again call `settings.use` to indicate this fact.

The `load` and `store` functions maintain a JSON file containing the
settings which were in use the last time each task got executed.
The `remember` and `forget` update the in-memory representation
of this information.

### Task definitions

Once the settings are in place, [`build.js`](build.js) is loaded.
It contains a sequence of task definitions.
In this it closely resembles a Makefile or similar build description file.
A task is defined using the `task` function, which accepts three arguments:
the name of the task, its dependencies and its definition function.

```js
task("name", ["dependency1", "dep2"], function() {
    this.input("foo.in"); // A file we read
    this.output("bar.out"); // A file we write
    this.somecmd("foo.in", "-o", "bar.out"); // Some command to run
});
```

although the definition may be shortened
by avoiding a repetition of the file names:

```js
    this.somecmd(this.input("foo.in"), "-o", this.output("bar.out"));
```

It is important to note that this definition function is executed to
*define* the task, not to run it.
It is executed in a context where `this` is bound to the current task,
and functions to describe jobs are available on `this` task object.
So basically the function should call some of these functions,
declare some input and output files using `this.input` and `this.output`,
or declare a dependency on some setting using `settings.use`.

### Available commands

The command defining functions described in the code above are
defined in [`commands.js`](commands.js).
Regarding nomenclature: a “job” is the combination of a “command” and
its arguments, associated with a given task.
So a “job” is essentially line an instance of a “command”.

Essentially a command definition has to call `this.addJob`
to register the function which actually *executes* the described command.
The registered function is expected to return a promise
which will be resolved (with arbitrary value) if the job succeeded
or rejected (preferably with a [`BuildError`](BuildError.js)
if you want no stack trace) if something goes wrong.
Jobs are executed sequentially unless they are defined inside a
`this.parallel(function(){…})` block.
Many commands are implemented by building on other, more elementary commands.
So often one can avoid directly calling `this.addJob`.

Here is a list of important commands.

* **cmd(command, args…):**
  Starts a new process to execute the given command.
  The `args` may contain strings or arrays of strings.
  Other commands which involve process execution tend to delegate to this.
* **node(module, args…):**
  Run the given node module.
  Uses the module file as a input as far as timestamp comparisons are concerned.
* **cmdscript(script, args…):**
  Use this to call scripts installed by dependency modules,
  i.e. files installed into the `node_modules/.bin` directory.
* **java(args…):**
  Run `java` with the given arguments.
* **sh(command[, wincommand]):**
  Run the given command using the shell `sh`.
  The second argument can be used to run a different command
  on Windows, using `cmd`.
  If no Windows alternative is provided,
  the same command will be used on both platforms.
* **closureCompiler(jar, opst):**
  Run the closure compiler, with the given options.
  The `opts` argument is an object,
  with keys corresponding to command line switches (without the leading `--`)
  and values corresponding to the argument for each switch.
  A value of `true` means a switch with no argument.
  An array-valued argument means the switch will be repeated.
  The `js` argument is special, since it will get sorted to the end
  and the `--js` switch will not be repeated.
  The command definition tries to designate inputs and outputs as such.
* **touch(dst):**
  Ensures that the file named `dst` exists and updates its timestamp.
* **copy(src, dst):**
  Copy a single file from `src` to `dst`.
* **delete(name):**
  Remove the named file or directory, like `rm -rf` does.
* **mkdir(name):**
  Create the named directory, like `mkdir -p` does.
  Note that for tasks which designate certain output files,
  the corresponding directories will get created automatically.
  So this command is mostly needed if some directory did exist
  when the task got started, but then got removed by some preceding job.
* **replace(src, dst, replacements):**
  Create file `dst` from file `src` by applying the given replacements.
  `replacements` is expected to be an array of objects,
  each of which has a property called `search` which is a regular expression
  and a property `replace` which is a string.
  They are applied in sequence via `String.prototype.replace`.
* **download(url, dst):**
  Download file from `url` and store it at `dst`.
* **unzip(src, dst[, files]):**
  Unzip the file given at `src` and extract it to `dst`.
  If `files` is given, only some files are extracted.
  If `files` is a string, then `dst` names the full name of the extracted file.
  Otherwise `files` must be an array of files to extract.
  In that case, or if `files` is omitted altogether,
  `dst` should name a directory.

### Build logic

Once all tasks have been defined, [`make.js`](make.js)
controls the overall logic of the build.
It performs the following steps in order:

* Execute the `clean` target (i.e. remove the `build` directory) if requested.
* Make sure the `build` directory exists,
  since that is where we will try to save our settings at the end.
* Schedule all requested tasks (or the `all` task if none were named).
* Report the final result of the build.
* Save the settings.
* Ensure an appropriate return value.

### Task logic

Each task is represented as an instance of the `Task` constructor
defined in [`Task.js`](Task.js).
Apart from the command definitions imported from `commands.js`,
there are various methods to control the execution of a task.

The central entry point for the execution of a task is its `promise` method.
This does all the things needed in order to run a task:
* Check whether the task actually has to be executed.
* Run all dependencies.
* Create directories for all output files.
* Run the jobs for this task.
* Store the relevant settings in effect during task execution.
* If things went wrong, delete output files and discard settings.

Checking whether a task has to be executed happens in the `mustRun`
method, which returns a promise that resolves to a boolean.
This check again involves several steps:
* If some setting affecting this task changed its value since the last
  execution, then the task needs to be run again.
* If the task has no output files but a non-empty list of jobs,
  then we assume that the task is run for its side effects
  and run it without comparing any timestamps.
  In the world of Makefiles, this would be a `PHONY` target.
* If any dependency of this task has to be executed,
  then this task has to be executed as well
  since its inputs will be out of date.
* If all output files exist and are more recent than any input files,
  then the execution may be skipped.
* Otherwise the task must be executed to recreate missing or outdated outputs.

Both the above promise-returning methods will cache their result.
So if multiple tasks depend on a given task,
that task will still be executed only once.

