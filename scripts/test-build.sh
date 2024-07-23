#!/bin/bash
set -e

BASENAME="gh-repo-files"

# ビルドされたコードにテスト用のコードを結合する.
# ビルドされたコードはエクスポートされていないための対応.
cat "build/${BASENAME}".js "test/build/${BASENAME}_src.js" > "test/build/${BASENAME}.spec.js"