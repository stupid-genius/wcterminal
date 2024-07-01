#!/bin/bash
# auto-reloading development server
# setting SPAMODE will run in SPA mode
# setting NODE_ENV=production will run without dev tooling

set -e
set -a
. .env
set +a
APPPORT=3000

if [ "$NODE_ENV" = "production" ]; then
	if [ -n "$SPAMODE" ]; then
		npx http-server -c-1 client/ -p $APPPORT
	else
		npx nodemon server/index.js
	fi
else
	./node_modules/.bin/browser-sync start --port 9000 --proxy localhost:$APPPORT --no-open -f dist/client &
	BSPID=$!
	echo BrowserSync PID $BSPID
	trap "kill -0 $BSPID &> /dev/null && kill $BSPID && echo sending SIGTERM to $BSPID" INT HUP TERM QUIT ABRT EXIT
	if [ -n "$SPAMODE" ]; then
		echo Server in SPA mode
		(fswatch -ol 1 app/client | xargs -n1 -I{} ./build.sh spa) &
		npx http-server -c-1 dist/client/ -p $APPPORT
	else
		(fswatch -ol 1 app | xargs -n1 -I{} ./build.sh) &
		npm run nodemon
	fi
fi

