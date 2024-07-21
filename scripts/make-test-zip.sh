#!/bin/bash

set -e

cd test/assets
test -f test.zip && rm test.zip
zip -r test.zip owner-repo-ref
cd -