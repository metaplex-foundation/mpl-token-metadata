#!/bin/bash

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
PROGRAMS_OUTPUT="./programs/.bin"
# go to parent folder
cd $(dirname $(dirname $SCRIPT_DIR))

# command-line input
ARGS=$*

WORKING_DIR=$(pwd)
SOLFMT="solfmt"
export SBF_OUT_DIR="${WORKING_DIR}/${PROGRAMS_OUTPUT}"

# client SDK tests
cd ${WORKING_DIR}/clients/rust

if [ ! "$(command -v $SOLFMT)" = "" ]; then
    CARGO_TERM_COLOR=always cargo test-sbf --sbf-out-dir ${WORKING_DIR}/${PROGRAMS_OUTPUT} ${ARGS} 2>&1 | ${SOLFMT}
else
    cargo test-sbf --sbf-out-dir ${WORKING_DIR}/${PROGRAMS_OUTPUT} ${ARGS}
fi
