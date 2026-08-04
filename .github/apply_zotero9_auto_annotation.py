from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}")
    file.write_text(text.replace(old, new), encoding="utf-8")


def replace_first(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    if old not in text:
        raise RuntimeError(f"{path}: source text not found")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "src/utils/task.ts",
    '  if (getPref("enableDict")) {',
    '  if (task.type === "text" && getPref("enableDict")) {',
)

replace_once(
    "src/hooks.ts",
    'import { initLocale } from "./utils/locale";',
    'import { getString, initLocale } from "./utils/locale";',
)

replace_once(
    "src/hooks.ts",
    '''  if (event === "add" && type === "item") {
    if (
      !getPref("enableAnnotationFromSyncTranslation") &&
      extraData?.skipAutoSync
    )
      return;
    const annotationItems = Zotero.Items.get(ids as number[]).filter((item) =>
      item.isAnnotation(),
    );
    if (annotationItems.length === 0) {
      return;
    }
    if (getPref("enableComment")) {
      addon.hooks.onTranslateInBatch(
        annotationItems
          .map((item) => addTranslateAnnotationTask(item.id))
          .filter((task) => task) as TranslateTask[],
        { noDisplay: true },
      );
    }
  } else if (type === "tab" && ["select", "add", "close"].includes(event)) {''',
    '''  if (["add", "modify"].includes(event) && type === "item") {
    if (extraData?.skipAutoAnnotationTranslation) {
      return;
    }
    if (
      !getPref("enableAnnotationFromSyncTranslation") &&
      extraData?.skipAutoSync
    ) {
      return;
    }
    const changed = extraData?.changed || extraData?.[ids[0]]?.changed;
    if (
      event === "modify" &&
      changed &&
      !Object.prototype.hasOwnProperty.call(changed, "annotationText")
    ) {
      return;
    }

    const annotationItems = Zotero.Items.get(ids as number[]).filter((item) =>
      item.isAnnotation(),
    );
    if (annotationItems.length === 0) {
      return;
    }

    const tasks: TranslateTask[] = [];
    for (const item of annotationItems) {
      const annotationText = (item.annotationText || "").trim();
      const pendingSelectionTask = addon.data.translate.queue.findLast(
        (task) =>
          task.type === "text" &&
          task.raw === annotationText &&
          ["waiting", "processing"].includes(task.status),
      );

      if (pendingSelectionTask) {
        pendingSelectionTask.type = "annotation";
        pendingSelectionTask.itemId = item.id;
        if (pendingSelectionTask.status === "waiting") {
          addon.hooks.onTranslate(pendingSelectionTask, {
            noCheckZoteroItemLanguage: true,
            noDisplay: true,
          });
        }
        if (!pendingSelectionTask.result) {
          pendingSelectionTask.result = getString("status-translating");
        }
        addon.api.getTemporaryRefreshHandler({
          task: pendingSelectionTask,
        })();
        continue;
      }

      const alreadyQueued = addon.data.translate.queue.some(
        (task) =>
          task.type === "annotation" &&
          task.itemId === item.id &&
          ["waiting", "processing"].includes(task.status),
      );
      if (alreadyQueued) {
        continue;
      }

      const task = addTranslateAnnotationTask(item.id);
      if (task) {
        tasks.push(task);
      }
    }

    if (tasks.length > 0) {
      addon.hooks.onTranslateInBatch(tasks, {
        noCheckZoteroItemLanguage: true,
        noDisplay: true,
      });
    }
  } else if (type === "tab" && ["select", "add", "close"].includes(event)) {''',
)

replace_once(
    "src/hooks.ts",
    '''  addTranslateTask(selection, event.reader.itemID);
  buildReaderPopup(event);
  addon.hooks.onReaderPopupRefresh();
  if (getPref("enableAuto")) {
    addon.hooks.onTranslate();
  }''',
    '''  addTranslateTask(selection, event.reader.itemID);
  buildReaderPopup(event);
  addon.hooks.onReaderPopupRefresh();
  const selectionTask = getLastTranslateTask({ type: "text" });
  if (getPref("enableAuto")) {
    addon.hooks.onTranslate(selectionTask);
  } else if (getPref("enableComment") && selectionTask) {
    addon.hooks.onTranslate(selectionTask, {
      noCheckZoteroItemLanguage: true,
      noDisplay: true,
    });
  }''',
)

replace_once(
    "src/api.ts",
    '''  item[savePosition === "comment" ? "annotationComment" : "annotationText"] =
    text;
  await item.saveTx({ skipSyncedUpdate: true });''',
    '''  item[savePosition === "comment" ? "annotationComment" : "annotationText"] =
    text;
  await item.saveTx({
    skipSyncedUpdate: true,
    notifierData: {
      skipAutoAnnotationTranslation: true,
    },
  });''',
)

replace_once(
    "src/api.ts",
    '''function getTemporaryRefreshHandler(options?: { task?: TranslateTask }) {
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
}''',
    '''function getTemporaryRefreshHandler(options?: { task?: TranslateTask }) {
  const translateTask = options?.task;
  const newTick = `${Zotero.Utilities.randomString()}-${Date.now()}`;
  addon.data.translate.refreshTick = newTick;
  let nextUpdate = 0;
  let updatingAnnotation = false;

  return () => {
    if (translateTask?.type === "annotation") {
      const now = Date.now();
      if (now < nextUpdate || updatingAnnotation) {
        return;
      }
      nextUpdate = now + 100;
      updatingAnnotation = true;
      void updateStreamingAnnotation(translateTask).finally(() => {
        updatingAnnotation = false;
      });
      return;
    }
    if (translateTask && translateTask.type !== "text") {
      return;
    }
    if (addon.data.translate.refreshTick === newTick) {
      addon.hooks.onReaderPopupRefresh();
      addon.hooks.onReaderTabPanelRefresh();
    }
  };
}''',
)

replace_first(
    "src/modules/services/index.ts",
    "              item.saveTx();",
    '''              await item.saveTx({
                notifierData: {
                  skipAutoAnnotationTranslation: true,
                },
              });''',
)
