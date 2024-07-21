import JSZip from 'jszip'
import mime from 'mime'
import chardet from 'chardet'
import Url from 'url-parse'
// import { fileTypeFromBuffer } from 'file-type' // TextEncoder が必要

export type ClientOpts = {
  owner: string
  repo: string
  ref?: string
  host?: string
  rawContentHost?: string
}
export type ClientNomalizedOpts = Required<ClientOpts>

export type FileInfo = {
  name: string
  kind: FileKind
  content: string
  rawUrl: string
}
export type FileList = FileInfo[]

function normalizeClientOpts(opts: ClientOpts): ClientNomalizedOpts {
  // バリデーションは？
  return {
    ref: 'main',
    host: 'github.com',
    rawContentHost: 'raw.githubusercontent.com',
    ...opts
  }
}

export type FileKind = 'source' | 'image' | 'binary'

export abstract class Client {
  protected _opts: ClientNomalizedOpts
  constructor(opts: ClientOpts) {
    this._opts = normalizeClientOpts(opts)
  }
  protected abstract fetch(opts: ClientOpts): Promise<Uint8Array>
  get info(): string {
    return `owner: ${this._opts.owner}, repo: ${this._opts.repo}, ref: ${this._opts.ref}, host: ${this._opts.host}, rawContentHost: ${this._opts.rawContentHost}`
  }
  get documentName(): string {
    return `${this._opts.owner} ${this._opts.repo} ${this._opts.ref}`
  }
  get title(): string {
    return `${this._opts.owner}/${this._opts.repo}/${this._opts.ref}`
  }
  protected async fileKind(zipObj: JSZip.JSZipObject): Promise<FileKind> {
    const filepath = zipObj.name

    const isImageFile = mime.getType(filepath)?.startsWith('image/')
    if (isImageFile) return 'image'

    const data = await zipObj.async('uint8array')
    const d = chardet.analyse(data)
    const isSourceFile =
      d.length > 0 && d[0].confidence > 10 && d.find((e) => e.name === 'UTF-8')
    if (isSourceFile) return 'source'

    return 'binary'
  }
  protected rawUrl(filepath: string): string {
    const url = new Url('')
      .set('protocol', 'https')
      .set('host', this._opts.rawContentHost)
      .set(
        'pathname',
        `${this._opts.owner}/${this._opts.repo}/${this._opts.ref}/${filepath}`
      )
    return url.toString()
  }
  async getFileList(): Promise<FileList> {
    const ret: FileList = []
    const data = await this.fetch(this._opts)
    const zip = await JSZip.loadAsync(data)
    for (const o in zip.files) {
      const zipObj = zip.files[o]
      if (!zipObj.dir) {
        const kind = await this.fileKind(zipObj)
        const name = zipObj.name.split('/').slice(1).join('/')
        ret.push({
          name,
          kind,
          content: kind === 'source' ? await zipObj.async('string') : '',
          rawUrl: this.rawUrl(name)
        })
      }
    }
    return ret
  }
}
