#!/bin/bash

set -e
umask 0077
openssl aes-256-cbc -K "${encrypted_dab4c61606db_key}" -iv "${encrypted_dab4c61606db_iv}" \
    -in tools/travis-ssh.enc -out build/travis-ssh -d
umask 0022
set -x
eval "$(ssh-agent -s)"
ssh-add build/travis-ssh
rm build/travis-ssh

mkdir -p "${HOME}/.ssh"
cat tools/cinderella.de.pub >> "${HOME}/.ssh/known_hosts"
rsync --delete-delay -rci --rsh='ssh -l travis' \
    build/deploy/ cinderella.de::CindyJS/snapshot/

name=$(git describe --always)
preserve=(.git README.md LICENSE)
branch=snapshot
cd build/deploy
rm -rf ../prevdeploy "${preserve[@]}"
git clone --depth 1 --branch "${branch}" git@github.com:CindyJS/deploy.git ../prevdeploy
cd ../prevdeploy
mv "${preserve[@]}" ../deploy/
cd ../deploy
git add -A
git status
if ! git diff --staged --quiet; then
    git config --local user.name "Travis CI"
    git config --local user.email "travis-ci@cinderella.de"
    git commit -m "Build of CindyJS ${name}"
    git push origin "${branch}"
fi
ssh-agent -k
rm -rf ../prevdeploy "${preserve[@]}"
