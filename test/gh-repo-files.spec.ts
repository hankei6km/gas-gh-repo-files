import { jest } from '@jest/globals'
import * as fs from 'node:fs/promises'
import { Client } from '../src/lib/client.js'
import type { ClientOpts, FileList } from '../src/lib/client.js'
import { GhRepoFiles } from '../src/gh-repo-files.js'

describe('GhRepoFiles.GasClient', () => {
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
    const client = new GhRepoFiles.GasClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    await client.getFileList()
    expect(mockfetch).toHaveBeenCalledWith(
      'https://github.com/hankei6km/gas-gh-repo-files/archive/main.zip',
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
    const client = new GhRepoFiles.GasClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    await expect(client.getFileList()).rejects.toThrow(
      'GasClient#fetch 404, opts:owner: hankei6km, repo: gas-gh-repo-files, ref: main, host: github.com, rawContentHost: raw.githubusercontent.com, text: {"message":"Not Found","documentation_url":"https://docs.github.com/rest"}'
    )
  })
})

describe('GhRepoFiles.toHtml()', () => {
  class SimpleClient extends Client {
    protected fetch() {
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
      repo: 'gas-gh-repo-files'
    })
    expect(await GhRepoFiles.filesToHtml(client)).toMatchInlineSnapshot(`
"<div><h1>hankei6km/gas-gh-repo-files/main</h1><p>owner: hankei6km, repo: gas-gh-repo-files, ref: main, host: github.com, rawContentHost: raw.githubusercontent.com</p><h2>files</h2><h3>images/hiragana.png</h3><img src="https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/images/hiragana.png"><h3>README.txt</h3><pre><code>テストに使う zip に追加されるディレクトリ

\`\`\`html
&#x3C;p>テスト&#x3C;/p>
\`\`\`
</code></pre><h3>test.bin</h3><p>binary</p></div>"
`)
  })
  it('should return html(description)', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    client.description = 'test'
    expect(await GhRepoFiles.filesToHtml(client)).toMatchInlineSnapshot(`
"<div><h1>hankei6km/gas-gh-repo-files/main</h1><p>owner: hankei6km, repo: gas-gh-repo-files, ref: main, host: github.com, rawContentHost: raw.githubusercontent.com</p><p>test</p><h2>files</h2><h3>images/hiragana.png</h3><img src="https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/images/hiragana.png"><h3>README.txt</h3><pre><code>テストに使う zip に追加されるディレクトリ

\`\`\`html
&#x3C;p>テスト&#x3C;/p>
\`\`\`
</code></pre><h3>test.bin</h3><p>binary</p></div>"
`)
  })
})

describe('GhRepoFiles.filesToMarkdown()', () => {
  class SimpleClient extends Client {
    protected fetch() {
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
      repo: 'gas-gh-repo-files'
    })
    expect(await GhRepoFiles.filesToMarkdown(client)).toMatchInlineSnapshot(`
"# hankei6km/gas-gh-repo-files/main

owner: hankei6km, repo: gas-gh-repo-files, ref: main, host: github.com, rawContentHost: raw\\.githubusercontent.com

## files

### images/hiragana.png

![](https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/images/hiragana.png)

### README.txt

\`\`\`\`
テストに使う zip に追加されるディレクトリ

\`\`\`html
<p>テスト</p>
\`\`\`
\`\`\`\`

### test.bin

binary
"
`)
  })
  it('should return html(description)', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    client.description = 'test'
    expect(await GhRepoFiles.filesToMarkdown(client)).toMatchInlineSnapshot(`
"# hankei6km/gas-gh-repo-files/main

owner: hankei6km, repo: gas-gh-repo-files, ref: main, host: github.com, rawContentHost: raw\\.githubusercontent.com

test

## files

### images/hiragana.png

![](https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/images/hiragana.png)

### README.txt

\`\`\`\`
テストに使う zip に追加されるディレクトリ

\`\`\`html
<p>テスト</p>
\`\`\`
\`\`\`\`

### test.bin

binary
"
`)
  })
})
