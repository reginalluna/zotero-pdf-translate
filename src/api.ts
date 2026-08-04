import { getPref } from "./utils/prefs";
import { TranslateTask } from "./utils/task";
import { version } from "../package.json";

/**
 * To plugin developers: Please use this API to translate your custom text.
 *
 * @param raw raw text for translation.
 * @param options options.
 * @returns TranslateTask object.
 */
async function translate(
  raw: string,
  options: {
    /**
     * The caller identifier.
     * This is for translate service provider to identify the caller.
     * If not provided, the call will fail.
     */
    pluginID: string;
    /**
     * Service id. See src/utils/config.ts > SERVICES
     * If not provided, the default service will be used.
     * If you want to use multiple services, please provide an array of service ids.
     * The first service in the array will be used as the default service.
     * Others will be used as fallback services.
     */
    service?: string | string[];
    /**
     * Zotero item id.
     *
     * For language auto-detect check.
     * If not set, use the default value.
     */
    itemID?: number;
    /**
     * From language
     *
     * If not set, generate at task runtime.
     */
    langfrom?: string;
    /**
     * To language.
     *
     * If not set, generate at task runtime.
     */
    langto?: string;
  },
): Promise<TranslateTask>;
/**
 * @deprecated The implementation of call with second parameter `services` will be removed in the future. Please use `translate(raw, options)` instead.
 *
 * @param raw raw text for translation.
 * @param service service id. See src/utils/config.ts > SERVICES
 * If not provided, the default service will be used.
 * If you want to use multiple services, please provide an array of service ids.
 * The first service in the array will be used as the default service.
 * Others will be used as fallback services.
 * @returns TranslateTask object.
 */
async function translate(
  raw: string,
  service?: string | string[],
): Promise<TranslateTask>;
async function translate(
  raw: string,
  serviceOrOptions?: string | string[] | any,
) {
  let currentService: string;
  let candidateServices: string[] = [];
  let service;
  let isDeprecatedCall = false;

  if (
    !serviceOrOptions ||
    typeof serviceOrOptions === "string" ||
    Array.isArray(serviceOrOptions)
  ) {
    service = serviceOrOptions;
    isDeprecatedCall = true;
  } else if (typeof serviceOrOptions === "object") {
    service = serviceOrOptions.service;
  }
  serviceOrOptions = serviceOrOptions || {};

  if (!isDeprecatedCall && !(serviceOrOptions as any).pluginID) {
    throw `[Translate for Zotero:api.translate] pluginID is required since 1.1.0-23. Please contact the plugin developer for more information.`;
  }

  if (isDeprecatedCall) {
    Zotero.warn(
      new Error(
        "[Translate for Zotero:api.translate] This call is deprecated. Please use `translate(raw, options)` instead.",
      ),
    );
  }

  if (typeof service === "string") {
    currentService = service;
  } else if (Array.isArray(service)) {
    currentService = service[0];
    candidateServices = service.slice(1);
  } else {
    currentService = getPref("translateSource") as string;
  }

  const data: TranslateTask = {
    id: `${Zotero.Utilities.randomString()}-${new Date().getTime()}`,
    type: "custom",
    raw,
    result: "",
    audio: [],
    service: currentService,
    candidateServices,
    itemId: isDeprecatedCall ? -1 : (serviceOrOptions as any).itemID || -1,
    status: "waiting",
    extraTasks: [],
    silent: true,
    langfrom: isDeprecatedCall ? undefined : (serviceOrOptions as any).langfrom,
    langto: isDeprecatedCall ? undefined : (serviceOrOptions as any).langto,
    callerID: isDeprecatedCall
      ? "unknown caller with translate for zotero api"
      : (serviceOrOptions as any).pluginID,
  };
  await addon.data.translate.services.runTranslationTask(data, {
    noDisplay: true,
  });
  return data;
}

async function updateStreamingAnnotation(task: TranslateTask) {
  if (task.status !== "processing" || !task.result || !task.itemId) {
    return;
  }

  const item = Zotero.Items.get(task.itemId);
  if (!item) {
    return;
  }

  const splitChar = (getPref("splitChar") as string).trim();
  const regex =
    splitChar === ""
      ? ""
      : new RegExp(`${splitChar}[^${splitChar}]*${splitChar}`, "g");
  const savePosition = getPref("annotationTranslationPosition") as
    | "comment"
    | "body";
  const savePositionInBody = getPref("annotationTranslationPositionInBody") as
    | "before"
    | "after";
  const currentText = (
    (savePosition === "comment"
      ? item.annotationComment
      : item.annotationText) || ""
  ).replace(regex, "");
  const translationText = `${splitChar}${task.result}${splitChar}\n`;
  let text = `${
    currentText[currentText.length - 1] === "\n" ? "" : "\n"
  }${translationText}`;

  if (splitChar !== "") {
    text =
      savePosition === "body" && savePositionInBody === "before"
        ? `${translationText}${currentText}`
        : `${currentText}${text}`;
  }

  item[savePosition === "comment" ? "annotationComment" : "annotationText"] =
    text;
  await item.saveTx({ skipSyncedUpdate: true });
}

/**
 * Get a temporary refresh handler.
 * This handler will refresh the reader popup and item pane section.
 * This handler is temporary and will be invalid after another call.
 * @returns A temporary refresh handler.
 */
function getTemporaryRefreshHandler(options?: { task?: TranslateTask }) {
  const translateTask = options?.task;
  if (translateTask?.type === "annotation") {
    let nextUpdate = 0;
    return () => {
      const now = Date.now();
      if (now < nextUpdate) {
        return;
      }
      nextUpdate = now + 250;
      void updateStreamingAnnotation(translateTask);
    };
  }
  if (translateTask && translateTask.type !== "text") {
    return () => {};
  }
  const newTick = `${Zotero.Utilities.randomString()}-${Date.now()}`;
  addon.data.translate.refreshTick = newTick;
  return () => {
    if (addon.data.translate.refreshTick === newTick) {
      addon.hooks.onReaderPopupRefresh();
      addon.hooks.onReaderTabPanelRefresh();
    }
  };
}

/**
 * Get all available services.
 * @returns Array of services.
 */
function getServices() {
  return addon.data.translate.services
    .getAllServices()
    .map((service) => Object.assign({}, service));
}

/**
 * Get version of the plugin.
 */
function getVersion() {
  return version;
}

export default {
  translate,
  getServices,
  getVersion,
  getTemporaryRefreshHandler,
};
