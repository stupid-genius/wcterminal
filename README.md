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
 - JSON-RPC including login
 - sub-terminals
 - command history, w/persistence

Bugs/Enhancements:
 - ctrl + c should cancel current command or exit sub-terminal
 - navigating through history gets out of sync
 - persistent session across refresh (implement cookie session and store token; return on authenticated request)
 - autocomplete
 - pipe, redirect, pager, etc
 - encoding issues (eg. weather cmd)
 - separate command history for each terminal
 - allow cmd retrieval from external sources (yikes)
 - Executor/registry injection needs work (what was this?)
