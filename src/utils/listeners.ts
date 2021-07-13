/* eslint no-console: off */
import { ipcMain, screen } from 'electron';
import { closeSearch, handleFindText, updateWebContents } from './windows';
import { validURL, windowHasView } from './utils';
import WindowManager from './window-manager';
import TabView from './tab-view';

export function closeFind(wm: WindowManager) {
  closeSearch(wm.mainWindow, wm.findView, wm, () => {
    wm.resetTextSearch();
  });
}

export const setTab = (
  id: number,
  oldId: number,
  windowManager: WindowManager
) => {
  if (id === oldId) {
    return;
  }

  const oldTabView = windowManager.allTabViews[oldId];
  if (typeof oldTabView !== 'undefined') {
    windowManager.mainWindow.removeBrowserView(oldTabView.view);
    windowManager.activeTabId = -1;
  }

  if (id === -1) {
    return;
  }
  const tabView = windowManager.allTabViews[id];
  if (typeof tabView === 'undefined') {
    throw new Error(`setTab: tab with id ${id} does not exist`);
  }

  windowManager.mainWindow.addBrowserView(tabView.view);
  windowManager.activeTabId = id;
  windowManager.mainWindow.setTopBrowserView(windowManager.titleBarView);
  closeFind(windowManager);
  if (windowHasView(windowManager.mainWindow, windowManager.urlPeekView)) {
    windowManager.mainWindow.setTopBrowserView(windowManager.urlPeekView);
  }
  tabView.resize();
};

export function createNewTab(
  id: number,
  browserPadding: number,
  windowManager: WindowManager
) {
  windowManager.allTabViews[id] = new TabView(
    windowManager.mainWindow,
    id,
    windowManager.titleBarView,
    windowManager.urlPeekView,
    windowManager.findView,
    browserPadding
  );
}

export function removeTab(
  id: number,
  event: Electron.IpcMainEvent,
  windowManager: WindowManager
) {
  const tabView = windowManager.allTabViews[id];
  if (typeof tabView === 'undefined') {
    throw new Error(`remove-tab: tab with id ${id} does not exist`);
  }
  windowManager.mainWindow.removeBrowserView(tabView.view);
  windowManager.activeTabId = -1;
  closeFind(windowManager);
  if (windowHasView(windowManager.mainWindow, windowManager.urlPeekView)) {
    windowManager.mainWindow.removeBrowserView(windowManager.urlPeekView);
  }
  // eslint-disable-line
  (tabView.view.webContents as any).destroy();
  delete windowManager.allTabViews[id];
  event.reply('tab-removed', id);
}

export function loadUrlInTab(
  id: number,
  url: string,
  event: Electron.IpcMainEvent,
  windowManager: WindowManager
) {
  if (id === -1 || url === '') {
    return;
  }
  const tabView = windowManager.allTabViews[id];
  if (typeof tabView === 'undefined') {
    throw new Error(`load-url-in-active-tab: tab with id ${id} does not exist`);
  }
  let fullUrl = url;
  if (!/^https?:\/\//i.test(url)) {
    fullUrl = `http://${url}`;
  }

  // url is invalid
  if (!validURL(fullUrl)) {
    fullUrl = `https://www.google.com/search?q=${url}`;
  }

  event.reply('web-contents-update', [id, true, false, fullUrl]);

  (async () => {
    await tabView.view.webContents.loadURL(fullUrl).catch(() => {
      // failed to load url
      // todo: handle this
      console.log(`error loading url: ${fullUrl}`);
    });
    const newUrl = tabView.view.webContents.getURL();
    closeFind(windowManager);
    event.reply('url-changed', [id, newUrl]);
    updateWebContents(event, id, tabView);
  })();
}

export function tabBack(
  id: number,
  event: Electron.IpcMainEvent,
  windowManager: WindowManager
) {
  if (windowManager.allTabViews[id].view.webContents.canGoBack()) {
    closeFind(windowManager);
    windowManager.allTabViews[id].view.webContents.goBack();
  }
  updateWebContents(event, id, windowManager.allTabViews[id]);
}

export function tabForward(
  id: number,
  event: Electron.IpcMainEvent,
  windowManager: WindowManager
) {
  if (windowManager.allTabViews[id].view.webContents.canGoForward()) {
    closeFind(windowManager);
    windowManager.allTabViews[id].view.webContents.goForward();
  }
  updateWebContents(event, id, windowManager.allTabViews[id]);
}

export function tabRefresh(id: number, windowManager: WindowManager) {
  closeFind(windowManager);
  windowManager.reloadTab(id);
}

export function findTextChange(boxText: string, windowManager: WindowManager) {
  windowManager.findText = boxText;
  const tabView = windowManager.allTabViews[windowManager.activeTabId];
  if (typeof tabView !== 'undefined') {
    windowManager.lastFindTextSearch = handleFindText(
      tabView.view,
      windowManager.findText,
      windowManager.lastFindTextSearch
    );
  }
}

export function findPrevious(windowManager: WindowManager) {
  const tabView = windowManager.allTabViews[windowManager.activeTabId];
  if (typeof tabView !== 'undefined') {
    windowManager.lastFindTextSearch = handleFindText(
      tabView.view,
      windowManager.findText,
      windowManager.lastFindTextSearch,
      true
    );
  }
}

export function findNext(windowManager: WindowManager) {
  const tabView = windowManager.allTabViews[windowManager.activeTabId];
  if (typeof tabView !== 'undefined') {
    windowManager.lastFindTextSearch = handleFindText(
      tabView.view,
      windowManager.findText,
      windowManager.lastFindTextSearch
    );
  }
}

export function windowMoved(windowManager: WindowManager) {
  windowManager.movingWindow = false;
}

export function windowMoving(
  mouseX: number,
  mouseY: number,
  windowManager: WindowManager
) {
  const { x, y } = screen.getCursorScreenPoint();
  windowManager.mainWindow.setPosition(x - mouseX, y - mouseY);
  windowManager.movingWindow = true;
}

export function addListeners(wm: WindowManager, browserPadding: number) {
  ipcMain.on('create-new-tab', (_, id) => {
    createNewTab(id, browserPadding, wm);
  });
  ipcMain.on('remove-tab', (event, id) => {
    removeTab(id, event, wm);
  });
  ipcMain.on('set-tab', (_, [id, oldId]) => {
    setTab(id, oldId, wm);
  });
  ipcMain.on('load-url-in-tab', (event, [id, url]) => {
    loadUrlInTab(id, url, event, wm);
  });
  ipcMain.on('tab-back', (event, id) => {
    tabBack(id, event, wm);
  });
  ipcMain.on('tab-forward', (event, id) => {
    tabForward(id, event, wm);
  });
  ipcMain.on('tab-refresh', (_, id) => {
    tabRefresh(id, wm);
  });
  ipcMain.on('close-find', () => {
    closeFind(wm);
  });
  ipcMain.on('find-text-change', (_, boxText) => {
    findTextChange(boxText, wm);
  });
  ipcMain.on('find-previous', () => {
    findPrevious(wm);
  });
  ipcMain.on('find-next', () => {
    findNext(wm);
  });
  ipcMain.on('windowMoving', (_, { mouseX, mouseY }) => {
    windowMoving(mouseX, mouseY, wm);
  });
  ipcMain.on('windowMoved', () => {
    windowMoved(wm);
  });
}
