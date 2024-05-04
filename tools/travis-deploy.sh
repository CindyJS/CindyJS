#!/bin/bash

# Distinguish between snapshot and tag deployment
# tags have to be of the form v0.8.99 
if [[ ${TRAVIS_TAG} ]]; then
    dir=${TRAVIS_TAG}
    name=${TRAVIS_TAG}
    branch=${TRAVIS_TAG%.*}
else
    dir=snapshot
    name=$(git describe --always)
    branch=snapshot
fi

# Deploy via rsync to cindyjs.org
# This is only possible if you have the necessary crendentials, that is, if you are kortenkamp@cinderella.de (currently)
#mkdir -p "${HOME}/.ssh"
#cat tools/cindyjs.org.pub >> "${HOME}/.ssh/known_hosts"
rsync -rci --rsh='ssh -l deploy -p 7723' \
    build/deploy/ "cindyjs.org::CindyJS/${dir}/"


# Deploy via git commit to “deploy” repository
preserve=(.git README.md LICENSE)
srcbranch=${branch}
if ! git ls-remote --exit-code --heads git@github.com:CindyJS/deploy.git \
     "${branch}"; then
    srcbranch=snapshot
fi
cd build/deploy
rm -rf ../prevdeploy "${preserve[@]}"
git clone --depth 1 --branch "${srcbranch}" \
    git@github.com:CindyJS/deploy.git ../prevdeploy
cd ../prevdeploy
mv "${preserve[@]}" ../deploy/
cd ../deploy
git add -A
git status
if ! git diff --staged --quiet; then
    #git config --local user.name "Travis CI"
    #git config --local user.email "travis-ci@cinderella.de"
    git commit -m "Build of CindyJS ${name}"
    git push origin "HEAD:${branch}"
    if [[ ${TRAVIS_TAG} ]]; then
        git tag "${TRAVIS_TAG}"
        git push origin tag "${TRAVIS_TAG}"
    fi
fi
rm -rf ../prevdeploy "${preserve[@]}"
