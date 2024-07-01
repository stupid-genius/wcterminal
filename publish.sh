#!/bin/bash
#publish to gh-pages

set -e
shopt -s extglob

echo Publishing disabled by default
exit

ORIGBRANCH=$(git rev-parse --abbrev-ref HEAD)
cleanup(){
	set +e
	git switch $ORIGBRANCH
	git branch -D publish
	echo Cleanup complete
}
trap cleanup INT HUP TERM QUIT ABRT EXIT

MESG=$(git show --no-patch --format=%s master)
echo Preparing repo
git checkout --orphan publish
npm ci
NODE_ENV=production npm run build spa
rm -rf ./!(dist) || :
rm -rf .github
rm -f .[^.]* || :
mv dist/client/* .
rmdir dist/client
rmdir dist
git add -A
git commit -m "Prepping to publish ($(git rev-parse --short master))"

echo Publish to gh-pages
git fetch origin gh-pages:gh-pages
git checkout gh-pages
git read-tree -mu publish
git commit -m "Publishing: $MESG"
git push origin gh-pages
echo Publishing complete
