# Translate for Zotero

Translates selected text, annotations, titles, abstracts, notes, PDFs, EPUBs, and webpages in Zotero through multiple translation services.

## Release

`v1.1.0` adds translation-history navigation, one-click reverse translation, and text-aware source-language detection.

`v1.0.0` is the baseline and first published release of this independent repository. Earlier upstream version numbers are not part of this repository's release line.

## Compatibility

| Zotero | Download | Manifest support |
| --- | --- | --- |
| 7.9.9–10.9.9 | [`translate-for-zotero.xpi`](https://github.com/reginalluna/zotero-pdf-translate/releases/download/v1.1.0/translate-for-zotero.xpi) | `strict_min_version: 7.9.9` to `strict_max_version: 10.9.9` |

The package declares support from Zotero 7.9.9 through Zotero 10.9.9, including Zotero 10.

## Install

1. Download [`translate-for-zotero.xpi`](https://github.com/reginalluna/zotero-pdf-translate/releases/download/v1.1.0/translate-for-zotero.xpi).
2. In Zotero, open **Tools → Plugins**.
3. Open the gear menu and choose **Install Plugin From File…**.
4. Select the downloaded XPI and follow the Zotero prompt.

## Features

- Translate selected text in the Zotero reader pop-up and item pane.
- Browse recent text translations with **Previous** and **Next** controls during the current Zotero session.
- Swap source and target languages and retranslate the displayed text in one action.
- Detect the source language from translated text when automatic language detection is enabled, while retaining Zotero item metadata and configured languages as fallbacks.
- Save annotation translations to the annotation comment or body.
- Translate item titles and abstracts.
- Add selected text and its translation to notes.
- Use dictionary lookup and sentence-by-sentence translation.
- Compare translation results in the standalone translation window.
- Cache matching translation results during the Zotero session.
- Configure automatic translation, language detection, annotation handling, display options, and translation services.

## Translation Services

The service registry includes Google, Bing, DeepL, DeepLX, Microsoft, MyMemory, LibreTranslate, NLLB, GPT, Azure GPT, custom GPT-compatible services, Gemini, Claude, Qwen-MT, Aliyun, Baidu, Tencent, Youdao, NiuTrans, Caiyun, Huoshan, CNKI, iCIBA, OpenL, Pot, MTranServer, Xftrans, and dictionary services.

Some services require an API key or an external endpoint. Configure them under **Settings → Translate → Service**.

## Development

```powershell
npm install
npm run build
```

The build produces the XPI in `build/`. For a development Zotero instance, use `npm run start` after configuring the project environment.

## Credits

Maintained by [reginalluna](https://github.com/reginalluna).

Original author: [windingwind](https://github.com/windingwind). This repository is an independent continuation of the original [windingwind/zotero-pdf-translate](https://github.com/windingwind/zotero-pdf-translate) project and retains its project history and licence.

Credit also belongs to the [original project contributors](https://github.com/windingwind/zotero-pdf-translate/graphs/contributors) whose work forms the basis of this repository.

## Licence

[GNU Affero General Public License v3.0 or later](LICENSE)
