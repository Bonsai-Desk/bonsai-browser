/* eslint no-console: off */
import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  Tray,
} from 'electron';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import WindowManager from './window-manager';
import { windowHasView } from './utils';
import { makeWebContentsSafe } from './wm-utils';
import MixpanelManager from './mixpanel-manager';
import { ICON_PNG, ICON_PNG_2, ICON_SMALL_PNG } from '../main-constants';
import { View } from '../constants';

function initMenu(wm: WindowManager) {
  const edit: MenuItemConstructorOptions = {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo',
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo',
      },
      {
        type: 'separator',
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut',
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy',
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste',
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectAll',
      },
    ],
  };
  const main: MenuItem = new MenuItem({
    label: 'Main',
    submenu: [
      {
        label: 'New Tab',
        accelerator: 'CmdOrCtrl+T',
        click: () => {
          if (wm.activeTabId !== -1) {
            const id = wm.createNewTab();
            wm.setTab(id);
            wm.tabPageView.webContents.focus();
          }
        },
      },
      {
        label: 'Find',
        accelerator: 'CmdOrCtrl+F',
        click: () => {
          if (wm.activeTabId !== -1) {
            wm.clickFind();
          }
        },
      },
      {
        label: 'Close current tab',
        accelerator: 'CmdOrCtrl+W',
        click: () => {
          if (wm.activeTabId === -1) {
            return;
          }
          wm.tabPageView.webContents.send('close-tab', wm.activeTabId);
          // wm.removeTabs([wm.activeTabId]);
        },
      },
      {
        label: 'Back to home',
        accelerator: 'CmdOrCtrl+E',
        click: () => {
          if (wm.activeTabId === -1) {
            return;
          }

          if (wm.webBrowserViewActive()) {
            wm.unSetTab(true, false, View.Tabs);
          }
        },
      },
      {
        label: 'Refresh',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          if (wm.activeTabId === -1) {
            return;
          }

          wm.tabRefresh(wm.activeTabId);
        },
      },
      {
        label: 'Select Search',
        accelerator: 'CmdOrCtrl+L',
        click: () => {
          wm.focusMainSearch();
        },
      },
      {
        label: 'Open Tag Modal',
        accelerator: 'CmdOrCtrl+D',
        click: () => {
          if (wm.activeTabId === -1) {
            return;
          }

          if (!windowHasView(wm.mainWindow, wm.tagModalView)) {
            wm.openTagModal();
          }
        },
      },
      {
        label: 'Go Back View',
        accelerator: 'CmdOrCtrl+[',
        click: () => {
          wm.tabPageView.webContents.send('go-back-view');
        },
      },
      {
        label: 'Go Forward View',
        accelerator: 'CmdOrCtrl+]',
        click: () => {
          wm.tabPageView.webContents.send('go-forward-view');
        },
      },
      {
        label: 'Go Back View',
        accelerator: 'CmdOrCtrl+b',
        click: () => {
          wm.tabPageView.webContents.send('go-back-view');
        },
      },
      {
        label: 'Go Forward View',
        accelerator: 'CmdOrCtrl+shift+b',
        click: () => {
          wm.tabPageView.webContents.send('go-forward-view');
        },
      },
      {
        label: 'Undo Removed Tabs',
        accelerator: 'CmdOrCtrl+Shift+T',
        click: () => {
          if (windowHasView(wm.mainWindow, wm.tabPageView)) {
            wm.undoRemovedTabs();
          }
        },
      },
      {
        label: 'Quit',
        accelerator: 'Cmd+Q',
        click: () => {
          wm.tabPageView.webContents.send('save-snapshot');
          wm.saveHistory();
          setTimeout(() => {
            app.quit();
          }, 100);
        },
      },
      {
        label: 'Float Left Vim',
        accelerator: 'Alt+H',
        click: () => {
          wm.mixpanelManager.track('float left (vim)');
          wm.float('left');
        },
      },
      {
        label: 'Float Left',
        accelerator: 'Alt+Left',
        click: () => {
          wm.mixpanelManager.track('float left (arrow)');
          wm.float('left');
        },
      },
      {
        label: 'Float Right Vim',
        accelerator: 'Alt+L',
        click: () => {
          wm.mixpanelManager.track('float right (vim)');
          wm.float('right');
        },
      },
      {
        label: 'Float Right',
        accelerator: 'Alt+Right',
        click: () => {
          wm.mixpanelManager.track('float right (arrow)');
          wm.float('right');
        },
      },
      {
        label: 'Max Floating Window Vim',
        accelerator: 'Alt+K',
        click: () => {
          if (wm.windowFloating) {
            wm.mixpanelManager.track('unfloat window (vim)');
            wm.unFloat();
          }
        },
      },
      {
        label: 'Max Floating Window',
        accelerator: 'Alt+Up',
        click: () => {
          if (wm.windowFloating) {
            wm.mixpanelManager.track('unfloat window (arrow)');
            wm.unFloat();
          }
        },
      },
      {
        label: 'Select Left tab',
        accelerator: 'Ctrl+Shift+Tab',
        click: () => {
          if (wm.activeTabId !== -1) {
            wm.selectNeighborTab('left');
          }
        },
      },
      {
        label: 'Select Right tab',
        accelerator: 'Ctrl+Tab',
        click: () => {
          if (wm.activeTabId !== -1) {
            wm.selectNeighborTab('right');
          }
        },
      },
      {
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        click: () => {
          wm.zoomOutCurrentPage();
        },
      },
      {
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+=',
        click: () => {
          wm.zoomInCurrentPage();
        },
      },
      {
        label: 'Go to All Tags Page',
        accelerator: 'CmdOrCtrl+g',
        click: () => {
          if (wm.activeTabId === -1) {
            wm.tabPageView.webContents.send('set-view', View.AllTagsView);
          } else {
            wm.unSetTab(true, false, View.AllTagsView);
          }
        },
      },
    ],
  });

  const tabs: MenuItem = new MenuItem({
    label: 'Tabs',
    submenu: [
      {
        label: 'Select Left tab',
        accelerator: 'Cmd+Alt+Left',
        click: () => {
          if (wm.activeTabId !== -1) {
            wm.selectNeighborTab('left');
          }
        },
      },
      {
        label: 'Select Right tab',
        accelerator: 'Cmd+Alt+Right',
        click: () => {
          if (wm.activeTabId !== -1) {
            wm.selectNeighborTab('right');
          }
        },
      },
    ],
  });

  const template = [main, edit];

  if (process.platform === 'darwin') {
    template.push(tabs);
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// function initFixedUpdate(wm: WindowManager) {
//   const fixedTimeStep = 0.01;
//   let lastFixedUpdateTime = 0;
//   const fixedUpdate = () => {
//     // const deltaTime = fixedTimeStep;
//     // const [floatingWidth, floatingHeight] = floatingSize(wm.display);
//     // windowFixedUpdate(wm, deltaTime, floatingWidth, floatingHeight);
//   };
//
//   let startTime: number | null = null;
//
//   const update = () => {
//     const currentTime = Date.now() / 1000.0;
//     if (startTime === null) {
//       startTime = currentTime;
//     }
//     const time = currentTime - startTime;
//
//     while (lastFixedUpdateTime < time) {
//       lastFixedUpdateTime += fixedTimeStep;
//       fixedUpdate();
//     }
//   };
//   setInterval(update, 1);
// }

function initWindow(): BrowserWindow {
  app.on('web-contents-created', (_, contents) => {
    contents.on('will-attach-webview', (event, webPreferences) => {
      // Strip away preload scripts if unused or verify their location is legitimate
      delete webPreferences.preload;

      // Disable Node.js integration
      webPreferences.nodeIntegration = false;

      event.preventDefault();
    });
  });

  const options: BrowserWindowConstructorOptions = {
    frame: false,
    transparent: true,
    resizable: false,
    width: 600,
    height: 300,
    minWidth: 50,
    minHeight: 50,
    show: false,
    icon: process.platform === 'linux' ? ICON_PNG_2 : ICON_SMALL_PNG,
    // vibrancy: mac ? VIBRANCY : undefined, // menu, popov er, hud, fullscreen-ui
    // visualEffectState: mac ? 'active' : undefined,
    roundedCorners: false,
    webPreferences: {
      nodeIntegration: false,
      devTools: false,
      contextIsolation: true,
    },
  };

  // const mac = process.platform === 'darwin';
  const mainWindow: BrowserWindow = new BrowserWindow(options);
  makeWebContentsSafe(mainWindow.webContents);
  mainWindow.setAlwaysOnTop(true, 'pop-up-menu');
  return mainWindow;
}

function initApp(wm: WindowManager) {
  app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  if (process.platform === 'darwin') {
    app.dock.setIcon(ICON_PNG);
  }

  app.on('activate', () => {
    wm.handleAppActivate();
  });

  app.on('before-quit', () => {
    wm.handleAppBeforeQuit();
  });
}

export function initTray(appIconPath: string, wm: WindowManager): Tray {
  const appIcon = new Tray(appIconPath);
  const contextMenu = Menu.buildFromTemplate([
    {
      label:
        'Hey, the tray is broken on linux. You can toggle the app on then right click the dock icon to close it.',
      click() {
        // do nothing. this is just to show the shortcut
      },
    },
    // {
    //   label: 'Exit (broken on linux)',
    //   click() {
    //     console.log('exit');
    //     wm.tabPageView.webContents.send('save-snapshot');
    //     wm.saveHistory();
    //     setTimeout(() => {
    //       wm.mainWindow?.destroy();
    //       app.quit();
    //     }, 100);
    //   },
    // },
  ]);

  appIcon.on('double-click', () => {
    wm.mainWindow?.show();
  });
  appIcon.setToolTip('Bonsai Browser');
  appIcon.setContextMenu(contextMenu);

  // todo
  // mainWindow.on('closed', () => {
  //   appIcon.destroy();
  //   mainWindow = null;
  // });

  return appIcon;
}

const installer = require('electron-devtools-installer');

const installExtensions = async () => {
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

export const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  let userId = '';
  const idPath = path.join(app.getPath('userData'), 'da');
  try {
    // Loading user id
    userId = fs.readFileSync(idPath, 'utf8');
  } catch {
    // could not load user id
  }

  if (userId === '') {
    try {
      // creating new id
      userId = uuidv4();
      fs.writeFileSync(idPath, userId);
    } catch {
      // could not save id
    }
  }

  const mixpanelManager = new MixpanelManager(userId);

  const wm = new WindowManager(initWindow(), mixpanelManager);

  initTray(ICON_SMALL_PNG, wm);

  initMenu(wm);

  initApp(wm);

  if (app.isPackaged) {
    const second = 1000;
    const minute = 60;
    setInterval(() => {
      wm.checkForUpdates();
    }, second * minute * 5);
  }
};
