# CindyJS docscrub branch

This branch of the CindyJS project does not contain regular development.
Instead it is used to transfer content from
[the Cinderella documentation website](http://doc.cinderella.de/)
to the CindyJS repository.

The normal workflow is to run [`docscrub.py`](ref/docscrub.py)
in this branch, then merge the results back into the master branch.
This way, edits to the upstream documentation can be integrated
using the git merge facilities, without accidentially overwriting changes
to the documentation which were performed in the CindyJS project.
