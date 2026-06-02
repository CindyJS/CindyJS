#!/bin/bash
# Deploy script for GitHub Actions (migrated from tools/travis-deploy.sh)
set -e

# Set up SSH key from environment secret
umask 0077
mkdir -p ~/.ssh
echo "${DEPLOY_SSH_KEY}" > ~/.ssh/deploy_key
chmod 600 ~/.ssh/deploy_key
umask 0022

# Add known hosts (cindyjs.org and github.com)
cat tools/cindyjs.org.pub >> ~/.ssh/known_hosts
ssh-keyscan -H github.com >> ~/.ssh/known_hosts

# Start ssh-agent and add key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/deploy_key

set -x

# Distinguish between snapshot and tag deployment
if [[ ${GIT_TAG} ]]; then
    dir=${GIT_TAG}
    name=${GIT_TAG}
    branch=${GIT_TAG%.*}
else
    dir=snapshot
    name=$(git describe --always)
    branch=snapshot
fi

# Deploy via rsync to cindyjs.org
rsync --delete-delay -rci --rsh="ssh -l deploy -p 7723 -i $HOME/.ssh/deploy_key" \
    build/deploy/ "cindyjs.org::CindyJS/${dir}/"

# Deploy via git commit to "deploy" repository
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
    git config --local user.name "GitHub Actions"
    git config --local user.email "github-actions@cinderella.de"
    git commit -m "Build of CindyJS ${name}"
    git push origin "HEAD:refs/heads/${branch}"
    if [[ ${GIT_TAG} ]]; then
        git tag "${GIT_TAG}"
        git push origin tag "${GIT_TAG}"
    fi
fi
rm -rf ../prevdeploy "${preserve[@]}"

# Terminate ssh-agent
ssh-agent -k
