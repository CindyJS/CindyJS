# How to create a CindyJS release

This document is for project administrators,
outlining the process used to create new CindyJS releases.

## Listing changes

Go to the [GitHub list of CindyJS releases][releases].
Next to the date of each release there is a link titled
“… commits to master since this release”.
Follow that to obtain a listing of all the changes this release will contain.
If the release is not based on master, but on some other branch,
edit the URL to name the branch from which you will be creating the release.

Make sure you have a reasonably good understanding about what these
changes entail, and follow links to read up on them in case you are uncertain.

## Choosing a version number

Choose a suitable version number for the release.
Try to follow [Semantic Versioning](http://semver.org/):
if the previous release was `x.y.z`,
then the new release should be
`(x+1).0.0` if it breaks backwards compatibility,
`x.(y+1).0` if it adds features in a compatible fashion or
`x.y.(z+1)` if it has no new features but only
bug fixes and (e.g. algorithmic) improvements to existing features.
In the initial phase of the project, while the first version component is zero,
things are shifted by one: features added bump `0.x.y` to `0.x.(y+1)`
and a breaking change to `0.(x+1).0` or `1.0.0` one day.

If you are tempted to create a prerelease (beta or similar), consider whether
the [snapshot deployments](http://cindyjs.org/dist/snapshot/) of the
CindyJS master might be a more suitable solution for the purpose of testing.
If you decide on a prerelease, make sure to read semantic versioning
guidelines about how to name these, and also decide how to deploy it,
since the automatic deployment is intended for releases and will not
work for prerelease versions.

## Tagging the version

For now we'll assume that you want to release version `v2.1.0`.
Check out the branch you want to release (e.g. latest `master`).
Then type the following command
(or perform the corresponding operation in the GUI of your choice):

```sh
git tag --sign v2.1.0
```

After entering a description (see next section),
this will ask for the password to your GPG key.
If for some reason you don't want to sign the release,
replace the `--sign` (abbreviated `-s`) with `--annotate` (abbreviated `-a`).

## Writing the message

For release 2.1.0 the tag message (which is like a commit message)
should be formatted like this:

```markdown
CindyJS 2.1.0

Breaking changes:

* Changed unit of time from microfortnights to centiseconds (#666)
  (This section should only be needed for MAJOR version changes!)

Features:

* Added some new feature (#123)
* Implemented another required thing, consisting of several subcomponents
  so that describing all of them requires more than one line (#345)

Cinderella compatibility:

* Support foobars (#444)
* Added function baz(‹list›) (#531)

Bug fixes:

* Avoided bit overflow in fubb (#111, #112)

Other:

* Revised some examples (#543)
```

The first line should give the project name and version number,
separated from the rest by an empty line.
Then you list the major changes since the previous release.
You can read them off the list of changes mentioned at the beginning
of this document.
Concentrate on the merges, but make sure you capture all relevant commits.
Also name relevant GitHub tickets for pull requests and issues.

The different sections above are a guideline to help categorize things
and make it easier for readers to go over longer lists of changes
in a systematic way.
If you feel like adding a section, consider adding them to this manual as well.
If one of the sections is empty, it can be omitted completely.
The breaking changes section should only occur for major version changes,
the features and Cinderella compatibility only for minor or major
version changes.

You will need this description text again later on,
so consider copying it to the clipboard.

## Pushing the tag

After the release has been tagged, that tag needs to be pushed to GitHub.
Assuming that `origin` is your name for the [`CindyJS/CindyJS`][CJS] repository,
you push the tag for release v2.1.0 using

```sh
git push origin tag v2.1.0
```

This triggers the deployment process, since Travis will react to this new tag
by building the files for deployment and pushing them to the cindyjs.org server.
Look at [the Travis build status](https://travis-ci.org/CindyJS/CindyJS)
to see this progressing (and to investigate any problems that might occur).

[CJS]: https://github.com/CindyJS/CindyJS

## Editing the release notes

GitHub has two similar pages, one on [tags][tags]
and one on [releases][releases].
After pushing the tag as described, it will appear in both of these.
In the tags list you click a link “Add release notes”
and paste the description you wrote above.
(If you did not copy the description to your clipboard as suggested,
clicking on the “…” link next to the tag name in the list of tags
will expand the message so you can copy it from there.)

Move the first line (“CindyJS v2.1.0”) from the description text area
to the release title form field.
Remove the empty line that follows it, so the description text
starts with the title of the first section of changes.

In the remainder of the text, add Markdown markup as you see fit.
For example, enclose function names and the likes in `` ` ``,
like in the case of `` `baz(‹list›)` `` in the example above.
Try to be consistent with release notes for existing releases.

Once the release notes are formatted nicely,
press the button “Publish release”.

## Notify people

Congratulations, the release is now officially complete.
Tell interested people about it.
Feel free to link to the GitHub page of the release,
and / or paste some or all of the change descriptions.

[tags]: https://github.com/CindyJS/CindyJS/tags
[releases]: https://github.com/CindyJS/CindyJS/releases
