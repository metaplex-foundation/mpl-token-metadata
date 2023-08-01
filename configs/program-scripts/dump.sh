#!/bin/bash

EXTERNAL_ID=("auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg" "SysExL2WDyJi9aRZrXorrjHJut3JwHQ7R9bTyctbNNG" "TokExjvjJmhKaRBShsBAsbSvEWMA1AgUNK7ps4SAc2p" "Roostrnex2Z9Y2XZC49sFAdZARP8E4iFpEnZC5QJWdz")
EXTERNAL_SO=("mpl_token_auth_rules.so" "mpl_system_extras.so" "mpl_token_extras.so" "rooster.so")

# output colours
RED() { echo $'\e[1;31m'$1$'\e[0m'; }
GRN() { echo $'\e[1;32m'$1$'\e[0m'; }
YLW() { echo $'\e[1;33m'$1$'\e[0m'; }

CURRENT_DIR=$(pwd)
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
# go to parent folder
cd $(dirname $(dirname $SCRIPT_DIR))

OUTPUT=$1

if [ -z ${RPC+x} ]; then
    RPC="https://api.mainnet-beta.solana.com"
fi

if [ -z "$OUTPUT" ]; then
    echo "missing output directory"
    exit 1
fi

# creates the output directory if it doesn't exist
if [ ! -d ${OUTPUT} ]; then
    mkdir ${OUTPUT}
fi

# only prints this if we have external programs
if [ ${#EXTERNAL_ID[@]} -gt 0 ]; then
    echo "Dumping external accounts to '${OUTPUT}':"
fi

# copy external programs or accounts binaries from the chain
copy_from_chain() {
    ACCOUNT_TYPE=`echo $1 | cut -d. -f2`
    PREFIX=$2

    case "$ACCOUNT_TYPE" in
        "bin")
            solana account -u $RPC ${EXTERNAL_ID[$i]} -o ${OUTPUT}/$2$1 > /dev/null
            ;;
        "so")
            solana program dump -u $RPC ${EXTERNAL_ID[$i]} ${OUTPUT}/$2$1 > /dev/null
            ;;
        *)
            echo $(RED "[  ERROR  ] unknown account type for '$1'")
            exit 1
            ;;
    esac

    if [ -z "$PREFIX" ]; then
        echo "Wrote account data to ${OUTPUT}/$2$1"
    fi
}

# dump external programs binaries if needed
for i in ${!EXTERNAL_ID[@]}; do
    if [ ! -f "${OUTPUT}/${EXTERNAL_SO[$i]}" ]; then
        copy_from_chain "${EXTERNAL_SO[$i]}"
    else
        copy_from_chain "${EXTERNAL_SO[$i]}" "onchain-"

        ON_CHAIN=`sha256sum -b ${OUTPUT}/onchain-${EXTERNAL_SO[$i]} | cut -d ' ' -f 1`
        LOCAL=`sha256sum -b ${OUTPUT}/${EXTERNAL_SO[$i]} | cut -d ' ' -f 1`

        if [ "$ON_CHAIN" != "$LOCAL" ]; then
            echo $(YLW "[ WARNING ] on-chain and local binaries are different for '${EXTERNAL_SO[$i]}'")
        else
            echo "$(GRN "[ SKIPPED ]") on-chain and local binaries are the same for '${EXTERNAL_SO[$i]}'"
        fi

        rm ${OUTPUT}/onchain-${EXTERNAL_SO[$i]}
    fi
done

# only prints this if we have external programs
if [ ${#EXTERNAL_ID[@]} -gt 0 ]; then
    echo ""
fi

cd ${CURRENT_DIR}
