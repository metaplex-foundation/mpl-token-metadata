#!/bin/bash

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
OUTPUT="./programs/.bin"
# go to parent folder
cd $(dirname $(dirname $SCRIPT_DIR))

# default to input from the command-line
ARGS=$*

WORKING_DIR=$(pwd)
SOLFMT="solfmt"
export SBF_OUT_DIR="${WORKING_DIR}/${OUTPUT}"

# client SDK tests
cd ${WORKING_DIR}/clients/rust

if [ ! "$(command -v $SOLFMT)" = "" ]; then
    CARGO_TERM_COLOR=always cargo test-sbf --sbf-out-dir ${WORKING_DIR}/${OUTPUT} ${ARGS} 2>&1 | ${SOLFMT}
else
    cargo test-sbf --sbf-out-dir ${WORKING_DIR}/${OUTPUT} ${ARGS}
fi
