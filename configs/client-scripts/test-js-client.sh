#!/bin/bash

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
# go to parent folder
cd $(dirname $(dirname $SCRIPT_DIR))
WORKING_DIR=$(pwd)

# command-line input
ARGS=$*

# js client tests folder
cd ${WORKING_DIR}/clients/js

pnpm install && pnpm build && pnpm test ${ARGS}
