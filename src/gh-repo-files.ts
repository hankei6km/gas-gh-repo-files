import Url from 'url-parse'
import { h } from 'hastscript'
import type { Child } from 'hastscript'
import { toHtml as hastToHtml } from 'hast-util-to-html'
import { sanitize, defaultSchema } from 'hast-util-sanitize'
import { Client } from './lib/client'

export function isErrRes(
  res: GoogleAppsScript.URL_Fetch.HTTPResponse
): boolean {
  const code = Math.trunc(res.getResponseCode() / 100)
  if (code === 4 || code === 5) {
    return true
  }
  return false
}

export namespace GhRepoFiles {
  export class GasClient extends Client {
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
      if (isErrRes(res)) {
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
  export async function filesToHtml(client: Client): Promise<string> {
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
    return hastToHtml(
      sanitize(
        h('div', [
          h('h1', client.title),
          h('p', client.info),
          ...description,
          h('h2', 'files'),
          ...children
        ]),
        defaultSchema
      )
    )
  }
}
