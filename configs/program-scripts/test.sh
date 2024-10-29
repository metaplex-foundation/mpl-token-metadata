#!/bin/bash

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
OUTPUT="./programs/.bin"
# saves external programs binaries to the output directory
source ${SCRIPT_DIR}/dump.sh ${OUTPUT}
# go to parent folder
cd $(dirname $(dirname $SCRIPT_DIR))

if [ ! -z "$PROGRAM" ]; then
    PROGRAMS='["'${PROGRAM}'"]'
fi

if [ -z "$PROGRAMS" ]; then
    PROGRAMS="$(cat .github/.env | grep "PROGRAMS" | cut -d '=' -f 2)"
fi

# default to input from the command-line
ARGS=$*

# command-line arguments override env variable
if [ ! -z "$ARGS" ]; then
    PROGRAMS="[\"${1}\"]"
    shift
    ARGS=$*
fi

PROGRAMS=$(echo $PROGRAMS | jq -c '.[]' | sed 's/"//g')

WORKING_DIR=$(pwd)
SOLFMT="solfmt"
export SBF_OUT_DIR="${WORKING_DIR}/${OUTPUT}"

for p in ${PROGRAMS[@]}; do
    cd ${WORKING_DIR}/programs/${p}

    if [ ! "$(command -v $SOLFMT)" = "" ]; then
        CARGO_TERM_COLOR=always cargo test-sbf --sbf-out-dir ${WORKING_DIR}/${OUTPUT} ${ARGS} -- --nocapture 2>&1 | ${SOLFMT} && \
        CARGO_TERM_COLOR=always cargo test-sbf --sbf-out-dir ${WORKING_DIR}/${OUTPUT} ${ARGS} --features padded -- --nocapture 2>&1 | ${SOLFMT} && \
        CARGO_TERM_COLOR=always cargo test-sbf --sbf-out-dir ${WORKING_DIR}/${OUTPUT} ${ARGS} --features padded resize -- --nocapture 2>&1 | ${SOLFMT}
    else
        cargo test-sbf --sbf-out-dir ${WORKING_DIR}/${OUTPUT} ${ARGS} -- --nocapture --test-threads=1 && \
        cargo test-sbf --sbf-out-dir ${WORKING_DIR}/${OUTPUT} ${ARGS} --features padded -- --nocapture --test-threads=1 && \
        cargo test-sbf --sbf-out-dir ${WORKING_DIR}/${OUTPUT} ${ARGS} --features padded resize -- --nocapture --test-threads=1
    fi
done
