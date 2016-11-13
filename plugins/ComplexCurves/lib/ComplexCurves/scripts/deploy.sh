#!/bin/bash
name=$(git describe --always)
eval "$(ssh-agent -s)"
chmod 600 .travis/github_deploy_key
ssh-add .travis/github_deploy_key
rm -rf build/deploy
mkdir -p build/deploy
git clone --depth 1 git@github.com:kranich/ComplexCurves.git build/deploy || exit 1
(
    cd build/deploy
    git fetch origin gh-pages
    git checkout FETCH_HEAD
    git checkout -b gh-pages
    mv ./models ../models
    rm -rf * .gitignore .jshintrc .travis.yml .travis
    echo "complexcurves.org" >CNAME
    cp ../../README.md ./README.md
    mkdir build
    cp ../ComplexCurves.js build/ComplexCurves.js
    cp ../ComplexCurves.js.map build/ComplexCurves.js.map
    cp ../../examples.json ./examples.json
    cp ../../favicon.ico ./favicon.ico
    cp -R ../../images ./images
    cp ../../index.css ./index.css
    cp ../../index.html ./index.html
    cp ../../index.js ./index.js
    mv ../models ./models
    mkdir lib
    cp -R ../../node_modules/jquery lib/jquery
    cp -R ../../node_modules/semantic-ui-css lib/semantic-ui-css
    sed -i 's/node_modules/lib/g' index.html
    git add -A
    git config user.name "Travis CI"
    git config user.email "travis-ci@complexcurves.org"
    git commit -m "Deployment of Complex Curves ${name}"
    git push git@github.com:kranich/ComplexCurves.git gh-pages:gh-pages
)
