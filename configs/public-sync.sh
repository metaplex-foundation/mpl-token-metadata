#!/bin/bash

# 0. Ensure the working directory is clean.
if [[ -n $(git status --porcelain) ]]; then
  echo "Working directory is not clean. Please commit or stash your changes."
  exit 1
fi

# 1. Update public branch using the public remote.
git checkout public
git remote add public https://github.com/metaplex-foundation/mpl-token-metadata.git 2> /dev/null || true
git fetch public
git merge public/main
git push

# 2. Squash merge public branch into main.
git checkout main
git merge --squash -X ours origin/public

# 3. Now review, commit and push the changes...

# A few things to note:
#
# - We squash merge into the private main branch to
#   avoid polluting its commit history but we use
#   merge commits to ensure the public branch is kept
#   up to date with the public remote.
#
# - The "-X ours" option means that, if there are
#   any conflicts, we will keep "our" changes from
#   the private main branch and discard the public
#   changes. Remove or adjust this option accordingly.
#
# - Instead of using a dedicated public branch, we could
#   simply merge public/main into main. However, we would
#   have to revert non-conflicting changes every time as
#   we do not want merge commits polluting the private main
#   branch. Otherwise, we would include public-specific
#   commit messages such as program or client deployments.