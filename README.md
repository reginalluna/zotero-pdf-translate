# Translate for Zotero

[![Zotero compatibility](https://img.shields.io/badge/Zotero-7.9.9%E2%80%9310.9.9-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org/)
[![Release](https://img.shields.io/github/v/release/reginalluna/zotero-pdf-translate?style=flat-square)](https://github.com/reginalluna/zotero-pdf-translate/releases/latest)

Translate for Zotero, also known as Zotero PDF Translate, translates PDF and EPUB selections, webpages, metadata, annotations and notes. It supports more than twenty translation services.

This repository tracks the upstream [windingwind/zotero-pdf-translate](https://github.com/windingwind/zotero-pdf-translate) project and publishes builds from this fork.

## Compatibility

The add-on manifest accepts Zotero versions from `7.9.9` through `10.9.9`. This range includes Zotero 10.

Release `v2.4.7` incorporates the upstream `2.4.7` code level, including the MyMemory translation service and the current Microsoft Edge endpoint used by the Bing service.

## Installation

1. Download the `.xpi` file from [Latest Release](https://github.com/reginalluna/zotero-pdf-translate/releases/latest).
2. In Zotero, open `Tools` > `Plugins`.
3. Open the gear menu and select `Install Plugin From File...`.
4. Select the downloaded `.xpi` file.

All published versions are available on the [Releases](https://github.com/reginalluna/zotero-pdf-translate/releases) page.

## Usage

Open a PDF, EPUB or webpage in the Zotero reader and select text. Translation results can appear in the selection pop-up and the item pane.

The plugin also supports:

- translation of highlighted or underlined annotations;
- adding source text and translations to notes;
- title translation with the item context menu or `Ctrl+T`;
- abstract translation from the item context menu;
- a standalone translation window for comparing services;
- dictionary services for single-word translation;
- sentence-by-sentence translation;
- concatenating selections with `Ctrl` on Windows/Linux or `Command` on macOS.

To disable automatic translation, open `Settings` > `Translate` > `General` and clear `Automatically Translate Selection`.

## Translation services

The plugin includes free, configured and API-backed services. The current service set includes:

- Google Translate and Google Translate API;
- Bing and Microsoft Translate;
- MyMemory;
- DeepL, DeepLX and DeepLX API;
- LibreTranslate and MTranServer;
- NLLB and Pot;
- CNKI, Haici, iCIBA and Youdao;
- NiuTrans, Baidu, Aliyun, Tencent and Caiyun;
- GPT-compatible services, Azure OpenAI, Gemini, Qwen-MT and Claude;
- dictionary services for Bing, Cambridge, Collins, Haici, Youdao, FreeDictionaryAPI, Weblio and Gramota.ru.

Service credentials and endpoints are configured under `Settings` > `Translate` > `Service`.

## Development

Requirements:

- Node.js 20 or 22;
- npm;
- a Zotero installation for interactive testing.

Clone and build:

```bash
git clone https://github.com/reginalluna/zotero-pdf-translate.git
cd zotero-pdf-translate
npm install
npm run build
```

The build command runs TypeScript validation and creates the `.xpi` package under `build/`.

For development with Zotero:

```bash
npm start
```

The project uses `zotero-plugin-scaffold` and `zotero-plugin-toolkit`.

## Repository structure

```text
addon/      Zotero manifest, preferences, locales and packaged assets
src/        TypeScript source code
  modules/  Reader, UI and translation-service modules
  utils/    Shared utilities
typings/    Generated and project TypeScript declarations
docs/       Documentation media
.github/    Issue templates and GitHub Actions workflows
```

## Licence and upstream

The project is distributed under the GNU Affero General Public License v3.0 or later. Original authorship and contribution history remain available in the upstream repository and this fork's Git history.

Upstream project: [windingwind/zotero-pdf-translate](https://github.com/windingwind/zotero-pdf-translate)
