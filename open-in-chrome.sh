#!/bin/sh
# Opens the site in Google Chrome, which has the "Google polski" and "Google español" speech voices.
# Usage: ./open-in-chrome.sh [polish|spanish]   (no argument opens the language chooser)
exec google-chrome "$(dirname "$(readlink -f "$0")")/${1:+$1/}index.html"
