import Url from 'url-parse'
import { h } from 'hastscript'
import type { Child } from 'hastscript'
import type { Nodes } from 'hast'
import { toHtml as hastToHtml } from 'hast-util-to-html'
import { sanitize, defaultSchema } from 'hast-util-sanitize'
import { toMdast as hastToMdast } from 'hast-util-to-mdast'
import { toMarkdown as mdastToMarkdown } from 'mdast-util-to-markdown'
import { gfmToMarkdown } from 'mdast-util-gfm'
import { Client } from './lib/client'

/**
 * GitHub リポジトリのファイルを操作するためのユーティリティを提供します。
 */
export namespace GhRepoFiles {
  /**
   * Google Apps Script 環境用の GitHub リポジトリクライアント。
   *
   * @remarks
   * このクラスは、`Client` クラスを拡張し、Google Apps Script の `UrlFetchApp` を使用して
   * GitHub リポジトリからファイルをフェッチします。
   */
  export class GasClient extends Client {
    protected static isErrRes(
      res: GoogleAppsScript.URL_Fetch.HTTPResponse
    ): boolean {
      const code = Math.trunc(res.getResponseCode() / 100)
      if (code === 4 || code === 5) {
        return true
      }
      return false
    }
    /**
     * GitHub リポジトリからファイルを ZIP アーカイブとしてフェッチします。
     *
     * @returns {Promise<Uint8Array>} ファイルの内容を含む `Uint8Array` を解決する Promise。
     *          リクエストが失敗した場合、Promise は拒否されます。
     */
    protected async fetch(): Promise<Uint8Array> {
      const url = new Url('')
        .set('protocol', 'https')
        .set('host', this._opts.host)
        .set(
          'pathname',
          `${this._opts.owner}/${this._opts.repo}/archive/${this._opts.ref}.zip`
        )

      const res = UrlFetchApp.fetch(url.toString(), {
        method: 'get',
        muteHttpExceptions: true
      })
      if (GasClient.isErrRes(res)) {
        return Promise.reject(
          new Error(
            `GasClient#fetch ${res.getResponseCode()}, opts:${
              this.info
            }, text: ${res.getContentText()}`
          )
        )
      }
      return new Uint8Array(res.getBlob().getBytes())
    }
  }
  async function filesToHHast(client: Client): Promise<Nodes> {
    const children: Child = []
    for (const o of await client.getFileList()) {
      children.push(h('h3', o.name))
      if (o.kind === 'source') {
        children.push(h('pre', h('code', o.content)))
      } else if (o.kind === 'image') {
        children.push(h('img', { src: o.rawUrl }))
      } else if (o.kind === 'binary') {
        children.push(h('p', 'binary'))
      }
    }
    const description = (() => {
      if (client.description) {
        return [h('p', client.description)]
      }
      return []
    })()
    return sanitize(
      h('div', [
        h('h1', client.title),
        h('p', client.info),
        ...description,
        h('h2', 'files'),
        ...children
      ]),
      defaultSchema
    )
  }

  /**
   * GitHub リポジトリのファイルリストを HTML 形式の文字列に変換します。
   *
   * @param {Client} client - GitHub リポジトリクライアント。
   * @returns HTML 形式のファイルリストを表す文字列を解決する Promise。
   */
  export async function filesToHtml(client: Client): Promise<string> {
    return hastToHtml(await filesToHHast(client))
  }

  /**
   * GitHub リポジトリのファイルリストを Markdown 形式の文字列に変換します。
   *
   * @param {Client} client - GitHub リポジトリクライアント。
   * @returns Markdown 形式のファイルリストを表す文字列を解決する Promise。
   */
  export async function filesToMarkdown(client: Client): Promise<string> {
    return mdastToMarkdown(hastToMdast(await filesToHHast(client)), {
      extensions: [gfmToMarkdown()]
    })
  }
}
