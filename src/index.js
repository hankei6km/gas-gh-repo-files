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

/**
 * GasClient クラスのコンストラクタ関数を返します。
 *
 * @returns {function(new: GasClient)} GasClient クラスのコンストラクタ関数。
 */
function getGasClient() {
  return _entry_point_.GhRepoFiles.getGasClient()
}
// class GasClient extends _entry_point_.GhRepoFiles.GasClient {} // これは GAS でロードときに _entry_point_ がないのでエスポートされない。たぶん。

/**
 * GitHub リポジトリのファイルリストを hast 形式のオブジェクトに変換します。
 *
 * @param {Client} client - GitHub リポジトリクライアント。
 * @returns  hast 形式のファイルリストを表すオブジェクトを解決する Promise。
 */
async function filesToHast(client) {
  return _entry_point_.GhRepoFiles.filesToHast(client)
}

/**
 * hast 形式のオブジェクトを HTML 形式の文字列に変換します。
 *
 * @param {Awaited<ReturnType<typeof filesToHast>>} hast - hast 形式のオブジェクト。
 * @returns HTML 形式の文字列
 */
export function hastToHtml(hast) {
  return _entry_point_.GhRepoFiles.hastToHtml(hast)
}
/**
 * 指定されたクライアントとオプションを使用して、ファイルリストを HTML 形式に変換します。
 *
 * @param {Client} client - ファイルリストを取得するGitHubリポジトリクライアント。
 * @returns {Promise<string>} HTML 形式のファイルリストを表す文字列を解決する Promise。
 */
function filesToHtml(client, opts) {
  return _entry_point_.GhRepoFiles.filesToHtml(client, opts)
}

/**
 * hast 形式のオブジェクトを Markdown 形式の文字列に変換します。
 *
 * @param {Nodes} hast - hast 形式のオブジェクト。
 * @returns Markdown 形式の文字列
 */
function hastToMarkdown(hast) {
  return _entry_point_.GhRepoFiles.hastToMarkdown(hast)
}

/**
 * 指定されたクライアントとオプションを使用して、ファイルリストを Markdown 形式に変換します。
 *
 * @param {Client} client - ファイルリストを取得するGitHubリポジトリクライアント。
 * @returns {Promise<string>} Markdown 形式のファイルリストを表す文字列を解決する Promise。
 */
function filesToMarkdown(client, opts) {
  return _entry_point_.GhRepoFiles.filesToMarkdown(client, opts)
}
