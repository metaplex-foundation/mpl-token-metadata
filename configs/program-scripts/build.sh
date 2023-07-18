#!/bin/bash

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
OUTPUT="./programs/.bin"
# saves external programs binaries to the output directory
source ${SCRIPT_DIR}/dump.sh ${OUTPUT}
# go to parent folder
cd $(dirname $(dirname ${SCRIPT_DIR}))

if [ -z ${PROGRAMS+x} ]; then
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

PROGRAMS=$(echo ${PROGRAMS} | jq -c '.[]' | sed 's/"//g')

# creates the output directory if it doesn't exist
if [ ! -d ${OUTPUT} ]; then
    mkdir ${OUTPUT}
fi

WORKING_DIR=$(pwd)
export BPF_OUT_DIR="${WORKING_DIR}/${OUTPUT}"

for p in ${PROGRAMS[@]}; do
    cd ${WORKING_DIR}/programs/${p}
    cargo build-bpf --bpf-out-dir ${WORKING_DIR}/${OUTPUT} $ARGS
done
