import JSZip from 'jszip'
import mime from 'mime'
import chardet from 'chardet'
import Url from 'url-parse'
// import { fileTypeFromBuffer } from 'file-type' // TextEncoder が必要

/**
 * GitHub リポジトリのファイルを操作するためのユーティリティを提供します。
 */
export namespace GhRepoFilesClient {
  /**
   * クライアントオプション。
   */
  export type ClientOpts = {
    /**
     * リポジトリのオーナー名。
     */
    owner: string
    /**
     * リポジトリ名。
     */
    repo: string
    /**
     * ブランチ名、タグ名、またはコミットハッシュ。デフォルトは'main'。
     */
    ref?: string
    /**
     * GitHubのホスト名。デフォルトは'github.com'。
     */
    host?: string
    /**
     * rawコンテンツのホスト名。デフォルトは'raw.githubusercontent.com'。
     */
    rawContentHost?: string
  }
  export type ClientNomalizedOpts = Required<ClientOpts>

  /**
   * ファイルに関する情報を表すオブジェクト。
   */
  export type FileInfo = {
    /**
     * ファイルの名前
     */
    name: string
    /**
     * ファイルの種類
     */
    kind: FileKind
    /**
     * ファイルの内容 (kindが'source'の場合のみ設定される)
     */
    content: string
    /**
     * ファイルのrawコンテンツを取得するためのURL
     */
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

  /**
   * ファイルの種類を表します。
   * - `source`: TypeScriptやJavaScriptのソースコードファイルです。
   * - `image`: PNGやJPEGなどの画像ファイルです。
   * - `binary`: 上記以外のバイナリファイルです。
   */
  export type FileKind = 'source' | 'image' | 'binary'

  /**
   * GitHub リポジトリと対話するためのクライアント。
   *
   * @remarks
   * このクラスは、GitHub リポジトリに関する情報へのアクセスと操作を提供するメソッドを定義しています。
   * 具体的なファイル取得方法は、サブクラスで実装される `fetch` メソッドによって決定されます。
   */
  export abstract class Client {
    protected _opts: ClientNomalizedOpts
    protected _description: string | undefined = ''
    constructor(opts: ClientOpts) {
      this._opts = normalizeClientOpts(opts)
    }

    /**
     * GitHub リポジトリからファイルをフェッチします。
     *
     * @remarks
     * このメソッドは抽象メソッドであり、サブクラスで実装する必要があります。
     *
     * @returns {Promise<Uint8Array>} - ファイルの内容を含むPromise。
     */
    protected abstract fetch(): Promise<Uint8Array>

    /**
     * クライアントが保持する GitHub リポジトリに関する情報を返します。
     *
     * @returns {string} - オーナー、リポジトリ、ブランチ、ホスト、rawContentHost などのリポジトリ情報を含む文字列。
     */
    get info(): string {
      return `owner: ${this._opts.owner}, repo: ${this._opts.repo}, ref: ${this._opts.ref}, host: ${this._opts.host}, rawContentHost: ${this._opts.rawContentHost}`
    }

    /**
     * "オーナー名 リポジトリ名 ブランチ名" 形式のドキュメント名を返します。
     *
     * @returns {string} - ドキュメント名を表す文字列。
     */
    get documentName(): string {
      return `${this._opts.owner} ${this._opts.repo} ${this._opts.ref}`
    }

    /**
     * "オーナー名/リポジトリ名/ブランチ名" 形式のタイトルを返します。
     *
     * @returns {string} - タイトルを表す文字列。
     */
    get title(): string {
      return `${this._opts.owner}/${this._opts.repo}/${this._opts.ref}`
    }

    /**
     * リポジトリの説明文を設定します。
     *
     * @param {string | undefined} description - 新しい説明文。
     */
    set description(description: string | undefined) {
      this._description = description
    }

    /**
     * リポジトリの説明文を返します。
     *
     * @remarks 実際の GitHub リポジトリの説明文ではなく、このクライアントで設定された説明文を返します。
     *
     * @returns {string | undefined} - リポジトリの説明文。設定されていない場合は `undefined`。
     */
    get description(): string | undefined {
      return this._description
    }

    /**
     * ファイルの種類を判定します。
     *
     * @param {JSZip.JSZipObject} zipObj - JSZip オブジェクト。
     * @returns {Promise<FileKind>} - ファイルの種類を表す `FileKind` 列挙型の値を含むPromise。
     */
    protected async fileKind(zipObj: JSZip.JSZipObject): Promise<FileKind> {
      const filepath = zipObj.name

      const isImageFile = mime.getType(filepath)?.startsWith('image/')
      if (isImageFile) return 'image'

      const data = await zipObj.async('uint8array')
      const d = chardet.analyse(data)
      const isSourceFile =
        d.length > 0 &&
        d[0].confidence > 10 &&
        d.find((e) => e.name === 'UTF-8')
      if (isSourceFile) return 'source'

      return 'binary'
    }

    /**
     * ファイルの raw コンテンツを取得するための URL を生成します。
     *
     * @param {string} filepath - ファイルのパス。
     * @returns {string} - ファイルの raw コンテンツを取得するための URL。
     */
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

    /**
     * GitHub リポジトリからファイルリストを取得します。
     *
     * @returns {Promise<FileList>} - ファイル情報を含む `FileInfo` オブジェクトの配列を含むPromise。
     */
    async getFileList(): Promise<FileList> {
      const ret: FileList = []
      const data = await this.fetch()
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
}
