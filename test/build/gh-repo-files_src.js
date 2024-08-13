describe('exported', () => {
  class SimpleClient extends getGasClient() {
    //fetch(_opts) {
    //  return new Uint8Array([])
    //}
    getFileList() {
      return [
        {
          name: 'images/hiragana.png',
          kind: 'image',
          content: '',
          rawUrl:
            'https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/images/hiragana.png'
        }
      ]
    }
  }
  it('should return html', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    // expect(await toHtml(client)).toMatchInlineSnapshot() // 連結したファイルでテストするので、ここには書き戻されない。
    expect(await filesToHtml(client)).toEqual(
      '<h1>hankei6km/gas-gh-repo-files/main</h1><p>owner: hankei6km, repo: gas-gh-repo-files, ref: main, host: github.com, rawContentHost: raw.githubusercontent.com</p><h2>files</h2><h3>images/hiragana.png</h3><img src="https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/images/hiragana.png">'
    )
  })
  it('should return html(hast)', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    const hast = await filesToHast(client)
    expect(hastToHtml(hast)).toEqual(
      '<h1>hankei6km/gas-gh-repo-files/main</h1><p>owner: hankei6km, repo: gas-gh-repo-files, ref: main, host: github.com, rawContentHost: raw.githubusercontent.com</p><h2>files</h2><h3>images/hiragana.png</h3><img src="https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/images/hiragana.png">'
    )
  })
  it('should return markdown', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    // expect(await toMarkdown(client)).toMatchInlineSnapshot() // 連結したファイルでテストするので、ここには書き戻されない。
    expect(await filesToMarkdown(client))
      .toEqual(`# hankei6km/gas-gh-repo-files/main

owner: hankei6km, repo: gas-gh-repo-files, ref: main, host: github.com, rawContentHost: raw\\.githubusercontent.com

## files

### images/hiragana.png

![](https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/images/hiragana.png)
`)
  })
  it('should return markdown(hast)', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    const hast = await filesToHast(client)
    expect(hastToMarkdown(hast)).toEqual(`# hankei6km/gas-gh-repo-files/main

owner: hankei6km, repo: gas-gh-repo-files, ref: main, host: github.com, rawContentHost: raw\\.githubusercontent.com

## files

### images/hiragana.png

![](https://raw.githubusercontent.com/hankei6km/gas-gh-repo-files/main/images/hiragana.png)
`)
  })
})
