# gas-gh-repo-files

GitHub 上のリポジトリから指定した Git 参照のファイルツリーを取得する Google Apps Script ライブラリです。

## Setup

### App Script

ライブラリは App Script で利用可能です。App Script のコードエディタで次の手順を実行するとプロジェクトに追加できます。

1. コードエディターのファイル名一覧が表示される部分の「ライブラリ +」をクリック
2. 「スクリプト ID」フィールドに `1TMTHAEC_IGrCL6ckqTa19h0MaWx9FELM88WkSgXUiW71y9pkYGQI89Tf` を入力し検索をクリック
3. バージョンを選択 (通常は最新版)
4. 「ID」を任意の名前に変更 例: `GhRepoFiles`
5. 「追加」をクリック

上記以外にも、Release ページから `gas-gh-repo-files` をダウンロードし、`/dist` ディレクトリーをプロジェクトへコピーできます。

## Usage

Google Drive へ保存するサンプルコードです。

```js
async function toGdoc(repoOpts, opts) {
  console.log('start')

  const [dataMimeType, fileMimeType, fileExt] = (() => {
    if (
      typeof opts.fileFormat === 'undefined' ||
      opts.fileFormat === 'document'
    ) {
      return ['text/html', 'application/vnd.google-apps.document', '']
    } else if (opts.fileFormat === 'html') {
      return ['text/html', 'text/html', 'html']
    } else if (opts.fileFormat === 'pdf') {
      return ['text/html', 'application/pdf', 'pdf']
    } else if (opts.fileFormat === 'markdown') {
      return ['text/plain', 'text/plain', 'md']
    }
    return ['text/plain', 'text/plain', 'txt']
  })()

  const c = new (GhRepoFilesTohHml.getGasClient())(repoOpts)
  if (opts.description) {
    c.description = opts.description
  }
  //console.log(t)
  const fileName = c.documentName + `${fileExt && `.${fileExt}`}`
  const existFileId = getExistFileId_(opts.folderId, fileName)
  if (existFileId) {
    const file = DriveApp.getFileById(existFileId)
    const updated = new Date(file.getLastUpdated()).valueOf()
    if (opts.pushedAt && opts.pushedAt < updated) {
      // push されている分は更新されているとみなす。
      //(Google Document のファイルはメタ情報の更新でもタイムスタンプが更新されれるので絶対ではない)
      console.log('already updated')
      return
    }
  }

  const body =
    dataMimeType === 'text/html'
      ? await GhRepoFilesTohHml.filesToHtml(c)
      : await GhRepoFilesTohHml.filesToMarkdown(c)
  const mediaData = Utilities.newBlob('')
    .setDataFromString(body, 'UTF-8')
    .setContentType(dataMimeType)

  let res = {}
  if (existFileId) {
    console.log('- update')
    const resource = {
      name: fileName
    }
    res = Drive.Files.update(resource, existFileId, mediaData)
  } else {
    console.log('- create')
    // https://stackoverflow.com/questions/77752561/how-to-convert-docx-files-to-google-docs-with-apps-script-2024-drive-api-v3
    const resource = {
      name: fileName,
      parents: [opts.folderId],
      mimeType: fileMimeType
    }
    res = Drive.Files.create(resource, mediaData)
  }

  console.log(res)
  console.log('end')
}

const escapeQueryStringRegExp_ = new RegExp("'", 'g')
function escapeQueryString_(str) {
  return str.replace(escapeQueryStringRegExp_, "\\'")
}

function getExistFileId_(folderId, documentName) {
  const f = Drive.Files.list({
    q: `name = '${escapeQueryString_(
      documentName
    )}' and '${folderId}' in parents and trashed=false`
  })
  if (f.files.length > 0) {
    return f.files[0].id
  }
  return ''
}
```

以下のようなコードで利用できます。

```js
async function run() {
  const props = PropertiesService.getScriptProperties()
  const folderId = props.getProperty('FOLDER_ID')

  await toGdoc(
    {
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    },
    {
      folderId,
      description: ''
      //fileFormat: 'pdf'
    }
  )
}
```

### TypeScript

TypeScript(clasp) でコードを記述している場合は、以下の方法で型定義を設定できます。

型定義パッケージをインストールします。

```console
$ npm install --save-dev @hankei6km/gas-gh-repo-files
```

`tsconfig.json` に定義を追加します。

```json
{
  "compilerOptions": {
    "target": "ES2019",
    "module": "ES2020",
    "lib": ["ESNext"],
    "types": ["@types/google-apps-script", "@hankei6km/gas-gh-repo-files"]
  }
}
```

## License

MIT License

Copyright (c) 2024 hankei6km
