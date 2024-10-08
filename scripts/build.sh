#!/bin/bash
set -e

BASENAME="gh-repo-files"

TYPES_DIR="types"
BUILD_DIR="build"
# esbuild でビルドされた結果(定義は "esbuild.config.mjs" でされている).
OUT_MAIN="${BUILD_DIR}/main.js"
# 上記ファイルに結合して Apps Scpirt で参照できるようにするファイル.
SRC_INDEX_BANNER="src/index_banner.js"
SRC_INDEX="src/index.js"

# Apps Scipt へ push する用.
# iife 形式でビルドする(Apps Scriptからは参照できない状態).
# LICENSE の情報をまとめる.
node esbuild.config.mjs
tsc --emitDeclarationOnly --declaration --project ./tsconfig.build.json
# App Script で参照できるようにするファイルと結合.
cat "${SRC_INDEX_BANNER}" "${OUT_MAIN}" "${SRC_INDEX}" > "${BUILD_DIR}/${BASENAME}.js"

# Assets に含める LICENSE ファイルをコピー.
cp LICENSE "${BUILD_DIR}/LICENSE.txt"

# 型定義から良くない方法で export を外す(モジュールにしないため)
# "${TYPES_DIR}"/index.d.ts へ移動.
test -d "${TYPES_DIR}/lib" || mkdir -p "${TYPES_DIR}/lib"
test -d "${TYPES_DIR}" || mkdir -p "${TYPES_DIR}"
sed -e '1s|^.*$|/// <reference path="lib/client.d.ts"/>\n|' -e 's/^export \(declare namespace\)/\1/' -- "${BUILD_DIR}/src/${BASENAME}.d.ts" > "${TYPES_DIR}/index.d.ts"
sed -e '1s|^.*$|/// <reference types="jszip" />\n|' -e 's/^export \(declare namespace\)/\1/' -- "${BUILD_DIR}/src/lib/client.d.ts" > "${TYPES_DIR}/lib/client.d.ts"



# 作業用ファイルなどを削除.
rimraf "${OUT_MAIN}" "${BUILD_DIR}/src" "${BUILD_DIR}/test" "${BUILD_DIR}/src/main.js.map" 
