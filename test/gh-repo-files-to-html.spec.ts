import { jest } from '@jest/globals'
import * as fs from 'node:fs/promises'
import { Client } from '../src/lib/client.js'
import type { ClientOpts, FileList } from '../src/lib/client.js'
import { GhRepoFilesToHtml } from '../src/gh-repo-files-to-html.js'

describe('GhRepoFilesToHtml.GasClient', () => {
  const saveUrlFetchApp = global.UrlFetchApp
  afterEach(() => {
    global.UrlFetchApp = saveUrlFetchApp
  })
  it('should fetch zip', async () => {
    const mockfetch = jest.fn().mockReturnValue({
      getResponseCode: jest.fn().mockReturnValue(200),
      getBlob: jest.fn().mockReturnValueOnce({
        getBytes: jest
          .fn()
          .mockReturnValue(await fs.readFile('test/assets/test.zip'))
      })
    })
    global.UrlFetchApp = {
      fetch: mockfetch
    } as any
    const client = new GhRepoFilesToHtml.GasClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files-to-html'
    })
    await client.getFileList()
    expect(mockfetch).toHaveBeenCalledWith(
      'https://github.com/hankei6km/gas-gh-repo-files-to-html/archive/main.zip',
      { method: 'get', muteHttpExceptions: true }
    )
  })
  it('should fetch zip', async () => {
    const mockfetch = jest.fn().mockReturnValue({
      getResponseCode: jest.fn().mockReturnValue(404),
      getContentText: jest
        .fn()
        .mockReturnValue(
          '{"message":"Not Found","documentation_url":"https://docs.github.com/rest"}'
        )
    })
    global.UrlFetchApp = {
      fetch: mockfetch
    } as any
    const client = new GhRepoFilesToHtml.GasClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files-to-html'
    })
    await expect(client.getFileList()).rejects.toThrow(
      'GasClient#fetch 404, opts:owner: hankei6km, repo: gas-gh-repo-files-to-html, ref: main, host: github.com, rawContentHost: raw.githubusercontent.com, text: {"message":"Not Found","documentation_url":"https://docs.github.com/rest"}'
    )
  })
})

describe('GhRepoFilesToHtml.toHtml()', () => {
  class SimpleClient extends Client {
    protected fetch(_opts: ClientOpts) {
      return fs.readFile('test/assets/test.zip')
    }
    async getFileList(): Promise<FileList> {
      const fileList = await super.getFileList()
      fileList.sort((a, b) => a.name.localeCompare(b.name))
      return fileList
    }
  }

  it('should return html', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files-to-html'
    })
    expect(await GhRepoFilesToHtml.filesToHtml(client)).toMatchInlineSnapshot(`
"<div><h1>hankei6km/gas-gh-repo-files-to-html/main</h1><p>owner: hankei6km, repo: gas-gh-repo-files-to-html, ref: main, host: github.com, rawContentHost: raw.githubusercontent.com</p><h2>files</h2><h3>images/hiragana.png</h3><img src="https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files-to-html/main/images/hiragana.png"><h3>README.txt</h3><pre><code>テストに使う zip に追加されるディレクトリ
</code></pre><h3>test.bin</h3><p>binary</p></div>"
`)
  })
  it('should return html(description)', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files-to-html'
    })
    client.description = 'test'
    expect(await GhRepoFilesToHtml.filesToHtml(client)).toMatchInlineSnapshot(`
"<div><h1>hankei6km/gas-gh-repo-files-to-html/main</h1><p>owner: hankei6km, repo: gas-gh-repo-files-to-html, ref: main, host: github.com, rawContentHost: raw.githubusercontent.com</p><p>test</p><h2>files</h2><h3>images/hiragana.png</h3><img src="https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files-to-html/main/images/hiragana.png"><h3>README.txt</h3><pre><code>テストに使う zip に追加されるディレクトリ
</code></pre><h3>test.bin</h3><p>binary</p></div>"
`)
  })
})
