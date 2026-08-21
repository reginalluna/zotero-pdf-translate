# Translate for Zotero

Translates selected text, annotations, titles, abstracts, notes, PDFs, EPUBs, and webpages in Zotero through multiple translation services.

## What's New in v1.1.0

Compared with the original [`windingwind/zotero-pdf-translate` v2.4.7](https://github.com/windingwind/zotero-pdf-translate/releases/tag/v2.4.7), this release adds scholar-focused reading and metadata workflows:

- **Translation history** — browse recent text translations in the Zotero sidebar with **Previous** and **Next** during the current session. Each history entry keeps its source and target language pair.
- **True reverse translation** — use the language-swap button to create a new translation from the previous result back into the previous source language, while keeping the original history entry.
- **Scholar Markdown copy** — use **Copy → Markdown** to copy the displayed original and translation with language labels and the Zotero item's title when available.
- **Session-note export** — use **History → Copy All** to copy all successful text translations from the current session as one Markdown research note.
- **Combined metadata translation** — select one or more regular Zotero items and use **Translate Title + Abstract** to translate both fields in one batch action without replacing translations that already exist.
- **Text-aware language detection** — detect the source language from longer selected text when automatic detection is enabled, while retaining Zotero item metadata and configured languages as fallbacks.
- **Corrected inferred-language metadata** — when a language is inferred from an item's title or abstract, the inferred language is written to the Zotero item instead of the configured source language.
- **History-aware translation controls** — changing the translation service or pressing **Translate** while viewing a history entry acts on that displayed entry.
- **Updated Italian localisation** — the affected reader-panel and metadata-translation controls use Italian labels.

## Compatibility

| Zotero       | Download                                                                                                                            | Manifest support                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 7.9.9–10.9.9 | [`translate-for-zotero.xpi`](https://github.com/reginalluna/zotero-pdf-translate/releases/download/v1.1.0/translate-for-zotero.xpi) | `strict_min_version: 7.9.9` to `strict_max_version: 10.9.9` |

## Install

1. Download [`translate-for-zotero.xpi`](https://github.com/reginalluna/zotero-pdf-translate/releases/download/v1.1.0/translate-for-zotero.xpi).
2. In Zotero, open **Tools → Plugins**.
3. Open the gear menu and choose **Install Plugin From File…**.
4. Select the downloaded XPI and follow the Zotero prompt.

## Core Features

- Translate selected text in the Zotero reader pop-up and item pane.
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
