/**
 * jszip で setImmidiate が使われているのでダミーを定義。
 * GAS の場合でも、以下は `1 2 end` の順番で表示される。
 * return 値は使われてないようなので、とりあえず `{}` を返している。
 * ```ts
 * console.log('1')
 * new Promise(resolve => resolve()).then(() => { console.log('end') })
 * console.log('2')
 * ```
 * @param {*} callback
 * @param  {...any} args
 * @returns
 */
function setImmediate(callback, ...args) {
  new Promise((resolve) => resolve()).then(() => callback(...args))
  return {}
}

function getGasClient() {
  return _entry_point_.GhRepoFiles.GasClient
}
// class GasClient extends _entry_point_.GhRepoFiles.GasClient {} // これは GAS でロードときに _entry_point_ がないのでエスポートされない。たぶん。

function filesToHtml(client, opts) {
  return _entry_point_.GhRepoFiles.filesToHtml(client, opts)
}
function filesToMarkdown(client, opts) {
  return _entry_point_.GhRepoFiles.filesToMarkdown(client, opts)
}
