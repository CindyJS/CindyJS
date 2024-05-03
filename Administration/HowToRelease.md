# How to create a CindyJS release

This document is for project administrators,
outlining the process used to create new CindyJS releases.

## Important note

We had to abandon the Travis CI, so all releases have to be made manually by
kortenkamp@cinderella.de currently. Still, tagging etc. should remain the same.
Note to kortenkamp@cinderella.de: Please pull main, `node make build=release alltests`,
do an `export TRAVIS_TAG=v0.8.25` (with the correct version number) or
`export TRAVIS_TAG=snapshot` before running the deployment script `tools/travis-deploy.sh`.

## Listing changes

Go to the [GitHub list of CindyJS releases][releases].
Next to the date of each release there is a link titled
“… commits to main since this release”.
Follow that to obtain a listing of all the changes this release will contain.
If the release is not based on main, but on some other branch,
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
the [snapshot deployments](https://cindyjs.org/dist/snapshot/) of the
CindyJS main might be a more suitable solution for the purpose of testing.
If you decide on a prerelease, make sure to read semantic versioning
guidelines about how to name these, and also decide how to deploy it,
since the automatic deployment is intended for releases and will not
work for prerelease versions.

For now we'll assume that you want to release version `v2.1.0`.
All the examples below will be built on this.
Adjust version numbers as needed, and in case of `0.x.y` releases,
also shift the meaning of what is a major and what a minor bump.

## Writing the message

Later on there will be several occasions where we need a list of changes,
or part of it, so it makes sense to start by writing that list in an editor.
The most notable use case is the tag message, which is like a commit message.
For release 2.1.0 this tag message should be formatted like this:

```markdown
CindyJS 2.1.0

Breaking changes:

-   Changed unit of time from microfortnights to centiseconds (#666)
    (This section should only be needed for MAJOR version changes!)

Features:

-   Added some new feature (#123)
-   Implemented another required thing, consisting of several subcomponents
    so that describing all of them requires more than one line (#345)

Cinderella compatibility:

-   Support foobars (#444)
-   Added function baz(‹list›) (#531)

Improvements:

-   Increased frobenication performance (#432)

Bug fixes:

-   Avoided bit overflow in fubb (#111, #112)

Other:

-   Revised some examples (#543)
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
The section on bug fixes should take this form for backported bug fixes, too.

The line between features and improvements is blurry.
The general rule is that making something possible that wasn't possible before
is a feature, while making something that was already possible work better now
is an improvement.
However, sometimes an improvement will make a feature more widely applicable,
to larger input or specific corner cases not covered before.
That is still an improvement until the newly covered cases are of such high
relevance that handling them does qualify as a new feature.
Changes to plugins may be listed as improvements in order to not distract
too much from the list of features of the core implementation.

You will need this text in several places later on,
so keep the editor window ready to copy and paste this text.

## Backporting features

Features should also be ported into older major version branches
unless they cause incompatibilities.
For a major version bump (like from `1.17.0` to `2.0.0`)
this can be done by creating a new branch `v1` from the current
`main` and then reverting all the incompatible changes
using [`git revert`][git-revert]:

```sh
git checkout main
git checkout -b v1
git revert --mainline 1 123abc 234cde 345def # three breaking changes
```

When editing messages for these reversions, you can add something like
`That was a breaking change which will not be kept in version 1.`
to the text that `git revert` automatically adds.
See [v0.7.4](https://github.com/CindyJS/CindyJS/commits/v0.7.4)
for a real life example of a version created by reverting breaking changes.

For a minor version bump (like from `2.0.0` to `2.1.0`),
one can merge `main` into `v1` since the minor bump should not
create any new incompatibilities.
The merge may cause conflicts that require manual resolution, though.

```sh
git checkout v1
git merge main -m "Merge tag 'v2.1.0' into v1"
```

This commit message is a bit cheated, since the tag doesn't exist at this point.
But GitHub orders releases by the date the tag was created,
so if we want `v2.1.0` listed as the most recent release,
we need to have the corresponding `1.x.0` tagged first.
See [v0.7.6](https://github.com/CindyJS/CindyJS/commits/v0.7.6)
for a real life example of a version created by such a merge.

## Tagging backported versions

If you backported any features, you should tag the older branch first.
Pick the next version number from that branch and create a tag for it:

```sh
git tag --sign v1.19.0
```

You will be asked to edit a message for the tag.
The suggested form is the following:

```
CindyJS 1.19.0

Like CindyJS 2.1.0 but without the breaking changes from 2.0.0.
```

After editing the message, this will ask for the password to your GPG key.
If for some reason you don't want to sign the release,
replace the `--sign` (abbreviated `-s`) with `--annotate` (abbreviated `-a`).

## Backporting bug fixes

If there are bug fixes or internal improvements
and you can be fairly sure that they won't break anything,
these should be included in a new patch release for existing minor releases.
For each version `x.y` that is still actively maintained
and affected by at least one of the bug fixes of the upcoming release,
create or check out the corresponding branch:

```sh
git checkout -b v1.16 v1.16.0 # first patch release for 1.16  OR
git checkout v1.15            # existing branch from previous patch releases
```

Then use [`git cherry-pick`][git-cherry-pick]
to selectively choose the bug fixes to go into this specific branch.
Create a signed tag like above, but use the bug fixes section from the
tag message described above to explicitely list the picked fixes.

Cherry-picking bug fixes may cause similar conflicts in several versions.
Consider enabling [`git rerere`][git-rerere] in order to record your
resolutions for these, so that you only have to resolve them once.

## Tagging the version

Now that all the backporting tags are in place, it is time to actually tag
the most recent release from the `main` branch.
So type the following commands:

```sh
git checkout main
git tag --sign v2.1.0
```

When asked to enter a description, copy and paste the message described above.
After entering the description,
you will be asked for the password to your GPG key.
If for some reason you don't want to sign the release,
replace the `--sign` (abbreviated `-s`) with `--annotate` (abbreviated `-a`).

## Pushing the tags

After the release has been tagged, that tag needs to be pushed to GitHub.
Assuming that `origin` is your name for the [`CindyJS/CindyJS`][cjs] repository,
you push the tag for release v2.1.0 using

```sh
git push origin tag v2.1.0
```

But if you backported some features and bug fixes, there might be a lot more
to push. You can name all the tags and branches to push individually,
or just name the branches and include all annotated tags on these like this:

```sh
git push --follow-tags origin main v1 v1.16 v1.15
```

A push that includes version tags triggers the deployment process,
since Travis will react to this new tag
by building the files for deployment and pushing them to the cindyjs.org server.
Look at [the Travis build status][travis-builds]
to see this progressing (and to investigate any problems that might occur).

[cjs]: https://github.com/CindyJS/CindyJS
[travis-builds]: https://travis-ci.org/CindyJS/CindyJS/builds

## Editing the release notes

GitHub has two similar pages, one on [tags][tags]
and one on [releases][releases].
After pushing a tag as described, it will appear in both of these.
In the tags list you click a link “Add release notes”
and paste the description you wrote above.
(You can also click on the “…” link next to the tag name in the list of tags
to expand the message so you can copy it from there.)

Move the first line (“CindyJS 2.1.0”) from the description text area
to the release title form field.
Remove the empty line that follows it, so the description text
starts with the title of the first section of changes.

In the remainder of the text, add Markdown markup as you see fit.
For example, enclose function names and the likes in `` ` ``,
like in the case of `` `baz(‹list›)` `` in the example above.
Try to be consistent with release notes for existing releases.

Once the release notes are formatted nicely,
press the button “Publish release”.

Also consider creating release notes for minor version releases
and patch level releases, by copying their tag messages in a similar way.

## Notify people

Congratulations, the release is now officially complete.
Tell interested people about it.
Feel free to link to the GitHub page of the release,
and / or paste some or all of the change descriptions.

Writing a HTML mail it may be possible to copy the HTML-formatted
release notes from the GitHub page, which makes for easier reading
than the corresponding plain text notation.

## Update the website

Consider whether the website should be updated.

-   Has the documentation been modified?
    You can check this using a command like `git diff --stat v2.0.0..v2.1.0 ref`
    or – more verbosely – `git log v2.0.0..v2.1.0 ref`.

-   Are there any new or improved examples?
    Just substitute `examples` instead of `ref` in the above commands.

-   Do any of the existing examples benefit from some bug fix?
    This requires a bit of knowledge about what examples we have,
    and what functionality they use.

If the answer to any of these questions is “yes”,
then the website should be updated.
Go to your checkout of [the website repository][website]
and perform the following steps:

```sh
git checkout main
git pull
git checkout -b bump2.1.0
git submodule update --init CindyJS  # just in case
cd CindyJS
git fetch origin
git checkout v2.1.0  # substitute actual version number!
npm start  # test site, make sure examples work and docs look all right
cd ..
git add CindyJS
git commit -m "Update CindyJS to 2.1.0"
git push -u myname HEAD  # substitute the name of your GitHub remote
```

Then create a pull request, asking for this bump to be reviewed.

[tags]: https://github.com/CindyJS/CindyJS/tags
[releases]: https://github.com/CindyJS/CindyJS/releases
[website]: https://github.com/CindyJS/website
[git-cherry-pick]: https://git-scm.com/docs/git-cherry-pick
[git-rerere]: https://git-scm.com/docs/git-rerere
[git-revert]: https://git-scm.com/docs/git-revert
