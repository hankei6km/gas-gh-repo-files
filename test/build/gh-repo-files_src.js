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
    expect(await filesToHtml(client)).toMatchSnapshot()
  })
  it('should return markdown', async () => {
    const client = new SimpleClient({
      owner: 'hankei6km',
      repo: 'gas-gh-repo-files'
    })
    // expect(await toMarkdown(client)).toMatchInlineSnapshot() // 連結したファイルでテストするので、ここには書き戻されない。
    expect(await filesToMarkdown(client)).toMatchSnapshot()
  })
})
