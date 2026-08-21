import { config } from "../../package.json";
import { PluginCEBase } from "./base";
import { getPref, setPref } from "../utils/prefs";
import { LANG_CODE } from "../utils/config";
import {
  addTranslateTask,
  autoDetectLanguage,
  getLastTranslateTask,
  getTranslateTasks,
  putTranslateTaskAtHead,
} from "../utils/task";
import type { TranslationServices } from "../modules/services";

//@ts-expect-error addon instance not typed
const services = Zotero[config.addonInstance].data.translate
  .services as TranslationServices;

export class TranslatorPanel extends PluginCEBase {
  _item: Zotero.Item | null = null;

  _taskID = "";

  _historyOffset = 0;

  _latestTextTaskID = "";

  get item() {
    return this._item;
  }

  set item(val) {
    this._item = val;
  }

  get content() {
    return this._parseContentID(
      MozXULElement.parseXULToFragment(`
<linkset>
  <html:link rel="localization" href="${config.addonRef}-panel.ftl" />
  <html:link
    rel="stylesheet"
    href="chrome://${config.addonRef}/content/styles/panel.css"
  ></html:link>
</linkset>
<hbox id="engine" align="center">
  <menulist id="services" native="true">
    <menupopup>
      ${services
        .getAllServicesWithType("sentence")
        .map((service) => {
          const customName = services.getServiceNameByID(service.id);
          return `<menuitem label="${customName}" value="${service.id}" />`;
        })
        .join("\n")}
    </menupopup>
  </menulist>
  <button id="translate" data-l10n-id="translate" />
</hbox>
<hbox id="language" align="center">
  <menulist id="langfrom" class="lang-menulist" native="true">
    <menupopup>
      ${LANG_CODE.map((lang) => `<menuitem label="${lang.name}" value="${lang.code}" />`).join("\n")}
    </menupopup>
  </menulist>
  <toolbarbutton id="swap-language" class="icon-button" data-l10n-id="swapLanguage" />
  <menulist id="langto" class="lang-menulist" native="true">
    <menupopup>
      ${LANG_CODE.map((lang) => `<menuitem label="${lang.name}" value="${lang.code}" />`).join("\n")}
    </menupopup>
  </menulist>
</hbox>
<html:div class="separator"></html:div>
<html:div id="text-container" class="editor-container">
  ${
    (getPref("enableMathRendering") as boolean)
      ? `<math-textbox id="raw-text"></math-textbox>`
      : `<editable-text id="raw-text" multiline="true" />`
  }
  <html:div id="resizer" class="draggable-container">
    <html:div class="separator"></html:div>
  </html:div>
  ${
    (getPref("enableMathRendering") as boolean)
      ? `<math-textbox id="result-text"></math-textbox>`
      : `<editable-text id="result-text" multiline="true" />`
  }
</html:div>
<html:div class="separator"></html:div>
<html:div class="options-container">
  <html:div id="auto-container" class="options-grid">
    <html:label class="options-label" data-l10n-id="auto" />
    <html:div class="options-content">
      <checkbox id="auto-trans-selection" native="true" data-l10n-id="autoTranslateSelection" />
      <checkbox id="auto-trans-annotation" native="true" data-l10n-id="autoTranslateAnnotation" />
    </html:div>
  </html:div>
  <html:div id="concat-container" class="options-grid">
    <html:label class="options-label" data-l10n-id="selection" />
    <html:div class="options-content">
      <checkbox id="concat" native="true" data-l10n-id="enableConcat" />
      <button id="clear-concat" data-l10n-id="clearConcat" />
    </html:div>
  </html:div>
  <html:div id="copy-container" class="options-grid" >
    <html:label class="options-label" data-l10n-id="copy" />
    <html:div class="options-content">
      <button id="copy-raw" data-l10n-id="copyRaw" />
      <button id="copy-result" data-l10n-id="copyResult" />
      <button id="copy-both" data-l10n-id="copyBoth" />
    </html:div>
  </html:div>
  <html:div id="history-container" class="options-grid">
    <html:label class="options-label" data-l10n-id="history" />
    <html:div class="options-content">
      <button id="history-previous" data-l10n-id="historyPrevious" />
      <button id="history-next" data-l10n-id="historyNext" />
    </html:div>
  </html:div>
</html:div>
`),
    );
  }

  init(): void {
    // Services
    this._queryID("services")?.addEventListener("command", (e) => {
      const newService = (e.target as XUL.MenuList).value;
      setPref("translateSource", newService);
      this._addon.hooks.onReaderTabPanelRefresh();
      const data = getLastTranslateTask();
      if (!data) {
        return;
      }
      data.service = newService;
      this._addon.hooks.onTranslate(undefined, {
        noCheckZoteroItemLanguage: true,
      });
    });

    // Translate
    this._queryID("translate")?.addEventListener("command", () => {
      if (!getLastTranslateTask()) {
        addTranslateTask(
          (
            this._queryID(
              getPref("rawResultOrder") ? "result-text" : "raw-text",
            ) as HTMLTextAreaElement
          )?.value,
        );
      }
      this._addon.hooks.onTranslate(undefined, {
        noCheckZoteroItemLanguage: true,
        noCache: true,
      });
    });

    // Language change
    this._queryID("langfrom")?.addEventListener("command", (e) => {
      const newValue = (e.target as XUL.MenuList).value;
      setPref("sourceLanguage", newValue);
      const itemID = this.item?.id;
      if (itemID) {
        this._addon.data.translate.cachedSourceLanguage[Number(itemID)] =
          newValue;
      }
      this._addon.hooks.onReaderTabPanelRefresh();
    });

    this._queryID("swap-language")?.addEventListener("command", () => {
      const langfrom = getPref("sourceLanguage") as string;
      const langto = getPref("targetLanguage") as string;
      setPref("targetLanguage", langfrom);
      setPref("sourceLanguage", langto);

      const task = getLastTranslateTask({ id: this._taskID });
      if (!task) {
        this._addon.hooks.onReaderTabPanelRefresh();
        return;
      }

      task.langfromInferred = false;
      putTranslateTaskAtHead(task.id);
      this._historyOffset = 0;
      this._latestTextTaskID = task.id;
      this._addon.hooks.onTranslate(undefined, {
        noCheckZoteroItemLanguage: true,
        noCache: true,
      });
    });

    this._queryID("langto")?.addEventListener("command", (e) => {
      setPref("targetLanguage", (e.target as XUL.MenuList).value);
      this._addon.hooks.onReaderTabPanelRefresh();
    });

    // Text change
    this._queryID("raw-text")?.addEventListener("input", (e) => {
      let task = getLastTranslateTask({
        id: this._taskID,
      });
      if (!task) {
        task = addTranslateTask(
          (e.target as HTMLTextAreaElement).value,
          this.item?.id,
          "text",
        );
        if (task) this._taskID = task.id;
      }
      if (!task) {
        return;
      }
      const reverseRawResult = getPref("rawResultOrder");
      if (!reverseRawResult) {
        task.raw = (e.target as HTMLTextAreaElement).value;
      } else {
        task.result = (e.target as HTMLTextAreaElement).value;
      }
      putTranslateTaskAtHead(task.id);
    });

    this._queryID("result-text")?.addEventListener("input", (e) => {
      let task = getLastTranslateTask({
        id: this._taskID,
      });
      if (!task) {
        task = addTranslateTask(
          (e.target as HTMLTextAreaElement).value,
          this.item?.id,
          "text",
        );
        if (task) this._taskID = task.id;
      }
      if (!task) {
        return;
      }
      const reverseRawResult = getPref("rawResultOrder");
      if (!reverseRawResult) {
        task.result = (e.target as HTMLTextAreaElement).value;
      } else {
        task.raw = (e.target as HTMLTextAreaElement).value;
      }
      putTranslateTaskAtHead(task.id);
    });

    // Auto translate
    this._queryID("auto-trans-selection")?.addEventListener("command", (e) => {
      setPref("enableAuto", (e.target as XUL.Checkbox).checked);
      this._addon.hooks.onReaderTabPanelRefresh();
    });

    this._queryID("auto-trans-annotation")?.addEventListener("command", (e) => {
      setPref("enableComment", (e.target as XUL.Checkbox).checked);
      this._addon.hooks.onReaderTabPanelRefresh();
    });

    // Concat
    this._queryID("concat")?.addEventListener("command", (e) => {
      this._addon.data.translate.concatCheckbox = (
        e.target as XUL.Checkbox
      ).checked;
      this._addon.hooks.onReaderTabPanelRefresh();
    });

    this._queryID("clear-concat")?.addEventListener("command", () => {
      const task = getLastTranslateTask();
      if (task) {
        task.raw = "";
        task.result = "";
        task.extraTasks.forEach((t) => {
          t.result = "";
        });
        this._addon.hooks.onReaderTabPanelRefresh();
      }
    });

    // Copy
    this._queryID("copy-raw")?.addEventListener("command", () => {
      const task = getLastTranslateTask({
        id: this._taskID,
      });
      if (!task) {
        return;
      }
      new this._addon.data.ztoolkit.Clipboard()
        .addText(task.raw, "text/plain")
        .copy();
    });

    this._queryID("copy-result")?.addEventListener("command", () => {
      const task = getLastTranslateTask({
        id: this._taskID,
      });
      if (!task) {
        return;
      }
      new this._addon.data.ztoolkit.Clipboard()
        .addText(task.result, "text/plain")
        .copy();
    });

    this._queryID("copy-both")?.addEventListener("command", () => {
      const task = getLastTranslateTask({
        id: this._taskID,
      });
      if (!task) {
        return;
      }
      new this._addon.data.ztoolkit.Clipboard()
        .addText(`${task.raw}\n----\n${task.result}`, "text/plain")
        .copy();
    });

    // History
    const moveHistory = (offset: number) => {
      const tasks = getTranslateTasks(
        this._addon.data.translate.maximumQueueLength,
      ).filter((task) => task.type === "text");
      const maxOffset = Math.max(tasks.length - 1, 0);
      this._historyOffset = Math.min(
        maxOffset,
        Math.max(0, this._historyOffset + offset),
      );
      this._addon.hooks.onReaderTabPanelRefresh();
    };

    this._queryID("history-previous")?.addEventListener("command", () => {
      moveHistory(1);
    });

    this._queryID("history-next")?.addEventListener("command", () => {
      moveHistory(-1);
    });

    // Draggable text area
    const resizer = this._queryID("resizer") as HTMLElement;
    const container = this._queryID("text-container") as HTMLElement;
    const rawArea = this._queryID("raw-text") as HTMLElement;
    const resultArea = this._queryID("result-text") as HTMLElement;

    rawArea.style.flex = `${getPref("customRawRatio")} 1 0%`;
    resultArea.style.flex = `${getPref("customResultRatio")} 1 0%`;

    let isDragging = false;
    let containerRect: DOMRect;
    resizer?.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button !== 0) {
        return;
      }
      isDragging = true;
      e.preventDefault();
      containerRect = container.getBoundingClientRect();
      window.document.addEventListener("mousemove", doDrag);
      window.document.addEventListener("mouseup", (e: MouseEvent) => {
        isDragging = false;
        window.document.removeEventListener("mousemove", doDrag);
      });
    });

    function doDrag(e: MouseEvent) {
      if (!isDragging) {
        return;
      }
      const newRawHeight = e.clientY - containerRect.top;
      const maxRawHeight = containerRect.height - 100 - 13;
      if (newRawHeight >= 100 && newRawHeight <= maxRawHeight) {
        const newResultHeight = containerRect.height - newRawHeight - 13;
        const newRawRatio = (
          newRawHeight / Math.min(newRawHeight, newResultHeight)
        ).toFixed(3);
        const newResultRatio = (
          newResultHeight / Math.min(newRawHeight, newResultHeight)
        ).toFixed(3);
        rawArea.style.flex = `${newRawRatio} 1 0%`;
        resultArea.style.flex = `${newResultRatio} 1 0%`;
        setPref("customRawRatio", newRawRatio);
        setPref("customResultRatio", newResultRatio);
      }
    }

    resizer?.addEventListener("dblclick", (e: MouseEvent) => {
      if (e.button !== 0) {
        return;
      }
      e.preventDefault();
      rawArea.style.flex = "1 1 0%";
      resultArea.style.flex = "1 1 0%";
      setPref("customRawRatio", "1");
      setPref("customResultRatio", "1");
    });
  }

  destroy(): void {}

  /**
   * Filter unconfigured services from the dropdown menu.
   * Hides services that require API keys but haven't been configured.
   */
  _filterUnconfiguredServices() {
    const menuPopup = this._queryID("services")?.querySelector("menupopup");
    if (!menuPopup) return;

    const menuItems = menuPopup.querySelectorAll("menuitem");
    const hideUnconfigured = getPref("hideUnconfiguredServices") as boolean;
    const unconfiguredIds = hideUnconfigured
      ? services.getUnconfiguredServiceIds()
      : null;

    menuItems.forEach((item) => {
      const serviceId = item.getAttribute("value");
      (item as HTMLElement).hidden = !!unconfiguredIds?.has(serviceId || "");
    });
  }

  render() {
    const updateHidden = (type: string, pref: string) => {
      const elem = this._queryID(type) as XUL.Box;
      const hidden = !getPref(pref) as boolean;
      elem.hidden = hidden;
      if (
        elem.nextElementSibling?.classList.contains("separator") ||
        elem.nextElementSibling?.classList.contains("draggable-container")
      ) {
        (elem.nextElementSibling as HTMLDivElement).hidden = hidden;
      }
    };
    const setCheckBox = (type: string, checked: boolean) => {
      const elem = this._queryID(type) as XUL.Checkbox;
      elem.checked = checked;
    };
    const setValue = (type: string, value: string) => {
      const elem = this._queryID(type) as XUL.Textbox;
      elem.value = value;
    };
    const setPalceHolder = (type: string, placeholder: string) => {
      const elem = this._queryID(type) as XUL.Textbox;
      elem.placeholder = placeholder;
    };
    const setTextBoxStyle = (type: string) => {
      const elem = this._queryID(type) as XUL.Textbox;
      elem.style.fontSize = `${getPref("fontSize")}px`;
      elem.style.lineHeight = getPref("lineHeight") as string;
    };

    updateHidden("engine", "showSidebarEngine");
    updateHidden("language", "showSidebarLanguage");
    updateHidden("raw-text", "showSidebarRaw");
    updateHidden("auto-container", "showSidebarSettings");
    updateHidden("concat-container", "showSidebarConcat");
    updateHidden("copy-container", "showSidebarCopy");
    updateHidden("history-container", "showSidebarCopy");

    // Filter unconfigured services from dropdown if preference is enabled
    this._filterUnconfiguredServices();

    setValue("services", getPref("translateSource") as string);

    const { fromLanguage, toLanguage } = autoDetectLanguage(this.item);
    setValue("langfrom", fromLanguage);
    setValue("langto", toLanguage);

    setCheckBox("auto-trans-selection", getPref("enableAuto") as boolean);
    setCheckBox("auto-trans-annotation", getPref("enableComment") as boolean);
    setCheckBox("concat", this._addon.data.translate.concatCheckbox);

    setTextBoxStyle("raw-text");
    setTextBoxStyle("result-text");
    const reverseRawResult = getPref("rawResultOrder");
    setPalceHolder(
      "raw-text",
      reverseRawResult ? "" : "Select or type to translate",
    );
    setPalceHolder(
      "result-text",
      reverseRawResult ? "Select or type to translate" : "",
    );

    const textTasks = getTranslateTasks(
      this._addon.data.translate.maximumQueueLength,
    ).filter((task) => task.type === "text");
    const latestTextTask = textTasks[textTasks.length - 1];
    const previousButton = this._queryID("history-previous") as XUL.Button;
    const nextButton = this._queryID("history-next") as XUL.Button;

    if (!latestTextTask) {
      previousButton.disabled = true;
      nextButton.disabled = true;
      return;
    }

    if (latestTextTask.id !== this._latestTextTaskID) {
      this._historyOffset = 0;
      this._latestTextTaskID = latestTextTask.id;
    }

    const maxOffset = textTasks.length - 1;
    this._historyOffset = Math.min(this._historyOffset, maxOffset);
    previousButton.disabled = this._historyOffset >= maxOffset;
    nextButton.disabled = this._historyOffset === 0;

    const historyTask = textTasks[textTasks.length - 1 - this._historyOffset];
    this._taskID = historyTask.id;
    setValue("raw-text", reverseRawResult ? historyTask.result : historyTask.raw);
    setValue(
      "result-text",
      reverseRawResult ? historyTask.raw : historyTask.result,
    );
  }
}