import * as fs from 'node:fs/promises'
import type JSZip from 'jszip'
import { GhRepoFilesClient } from '../../src/lib/client.js'
//import type { ClientOpts } from '../../src/lib/client.js'
import { TextEncoder } from 'util'

class SimpleClient extends GhRepoFilesClient.Client {
  protected async fetch(): Promise<Uint8Array> {
    return new Uint8Array(await fs.readFile('test/assets/test.zip'))
  }
}

function mockZipObject(name: string, data?: Uint8Array): JSZip.JSZipObject {
  return {
    name,
    async: async (_type: string) => {
      return data || new Uint16Array()
    }
  } as any
}

describe('Client', () => {
  it('info', () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    expect(client.info).toBe(
      'owner: hankei6km, repo: gas-gh-repo-files, ref: main, host: github.com, rawContentHost: raw.githubusercontent.com'
    )
  })
  it('info(上書き)', () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files',
      ref: 'develop',
      host: 'github.co.jp',
      rawContentHost: 'raw.github.co.jp'
    })
    expect(client.info).toBe(
      'owner: hankei6km, repo: gas-gh-repo-files, ref: develop, host: github.co.jp, rawContentHost: raw.github.co.jp'
    )
  })
  it('info(blank)', () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files',
      ref: '',
      host: '',
      rawContentHost: ''
    })
    expect(client.info).toBe(
      'owner: hankei6km, repo: gas-gh-repo-files, ref: main, host: github.com, rawContentHost: raw.githubusercontent.com'
    )
  })
  it('info(blank)', () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files',
      ref: undefined,
      host: undefined,
      rawContentHost: undefined
    })
    expect(client.info).toBe(
      'owner: hankei6km, repo: gas-gh-repo-files, ref: main, host: github.com, rawContentHost: raw.githubusercontent.com'
    )
  })
  it('documentName', () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    expect(client.documentName).toBe('hankei6km gas-gh-repo-files main')
  })
  it('documentName(slash)', () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files',
      ref: 'topic/slash'
    })
    expect(client.documentName).toBe('hankei6km gas-gh-repo-files topic slash')
  })
  it('title', () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    expect(client.title).toBe('hankei6km/gas-gh-repo-files/main')
  })
  it('desciption', () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    expect(client.description).toBe('')
    client.description = 'test'
    expect(client.description).toBe('test')
  })
  it('fileKind(image)', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    await expect(
      (client as any).fileKind(mockZipObject('path/to/test.png')) // protected なので as any
    ).resolves.toBe('image')
  })
  it('fileKind(binary)', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    await expect(
      (client as any).fileKind(
        mockZipObject('path/to/test', new Uint8Array([0x1f, 0x8b])) // gzip magic number
      ) // protected なので as any
    ).resolves.toBe('binary')
  })
  it('fileKind(source)', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    await expect(
      (client as any).fileKind(
        mockZipObject(
          'path/to/test.txt',
          new Uint8Array(new TextEncoder().encode('あいうえお')) // hiragana(あいうえお)
        )
      ) // protected なので as any
    ).resolves.toBe('source')
  })
  it('rawUrl', () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    expect((client as any).rawUrl('path/to/test.png')).toBe(
      'https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/path/to/test.png'
    )
  })
  it('getFileList', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    const ret = await client.getFileList()
    expect(ret.length).toBe(3)
    expect(ret).toEqual(
      expect.arrayContaining([
        {
          name: 'README.txt',
          kind: 'source',
          content:
            'テストに使う zip に追加されるディレクトリ\n\n```html\n<p>テスト</p>\n```\n',
          rawUrl:
            'https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/README.txt'
        },
        {
          name: 'test.bin',
          kind: 'binary',
          content: '',
          rawUrl:
            'https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/test.bin'
        },
        {
          name: 'images/hiragana.png',
          kind: 'image',
          content: '',
          rawUrl:
            'https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/images/hiragana.png'
        }
      ])
    )
  })
})
