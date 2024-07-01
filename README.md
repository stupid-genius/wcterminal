WC Terminal
===========

Inspired by [jQuery Terminal](https://terminal.jcubic.pl/)

I love jQuery Terminal, and back in the day I loved jQuery, but browsers have long-ago caught on that completely
eschewing the standards does not make them "innovative". _(lookin' achew, M$.)_

jQuery just isn't needed anymore.

This project is primarily for myself so that I can have the jQuery Terminal experience just without jQuery.  The goal is
to recreate its feature set using Web Components.

For the time being, this should be considered a reference implementation, not a drop-in solution.

**This project is immature and incomplete—PRs welcome!**

Features:
 - built-in Executor, w/command registry
 - JSON-RPC
 - login via JSON-RPC
 - sub-terminals
 - command history, w/persistence

TODO:
 - autocomplete
 - pipe, redirect, etc

Bugs/Enhancements:
 - command history is saving login with password
 - JSONRPC needs error handling
 - help cmd should include rpc cmds
 - fix Executor build (weird symlinks, copying, etc)
 - limit output lines
 - ctrl + c should cancel current command
 - add nesting prompts for sub-terminals
 - Executor needs a "delegation" mode, eg. for cas cmd
 - Executor/registry injection needs work
 - persistent session
 - for JSONRPC, if token passed in object, attach to func and let cmd decide if it's needed
 - allow cmd retrieval from external sources (yikes)
