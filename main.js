// Copyright 2018. Douglas G. Moore. All rights reserved.
//
// Use of this source code is governed by the MIT license that can be found in
// the LICENSE file.

// # The Caim UI
//
// Caim's UI is built on [electron](https://electronjs.org). This design
// decision was based on two factors:
//
// 1. Electron is a reasonable cross-platform UI toolkit
// 2. It is 100% Javascript + HTML + CSS
//
// The original version of [caim](https://github.com/elife-asu/caim-go) was
// written using a Server + Client architecture, with the front-end implemented
// with the standard web technologies. The hope is that this will make porting
// caim to a standalone application using electron fairly straitforward.
//
// To start, I get `app`, `dialog`, `BrowserWindow` and `Menu` from electron.
// The former will be our application object, and I'll use the latter to create
// windows.
const {app, dialog, BrowserWindow, Menu} = require('electron');
const fs = require('fs');

// ## Creating Windows
//
// I then need to create a global variable to keep track of our active window.
// Caim is to be designed as a single-window application, so I don't need `win`
// to be an array.
let win = null;

// From here I define a `create_window` function will will take care of
// building a new Caim window.
function create_window() {
    // This entails initializing `win` with a new `BrowserWindow`.
    win = new BrowserWindow();

    // Now that we have a window, I need to setup it's menu.  It consists of
    // the following menu items:
    //
    // 1. File
    //     * New Session
    //     * Import Video
    //     * Quit
    // 2. View
    //     * Fullscreen
    Menu.setApplicationMenu(new Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Session',
                    id: 'new-session',
                    click: new_session_dialog
                },
                {
                    label: 'Import Video',
                    id: 'import-video',
                    enabled: false
                },
                {
                    label: 'Quit',
                    id: 'quit',
                    role: 'quit'
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Fullscreen',
                    id: 'fullscreen',
                    role: 'toggleFullScreen'
                }
            ]
        }
    ]));

    // The primary UI is provided in the `assets/startup.html` directory. To
    // load it, I simply pass the path to the `loadFile` method of `win`.
    win.loadFile('assets/startup.html');

    // I then register an `onclosed` event handler which sets our `win`
    // variable to `null` so it can be garbage collected.
    win.on('closed', () => win = null);
}

// ## Handling App Events
//
// I create a window in response two events:
//
// 1. when the app's `'ready'` event fires
// 2. when the application becomes activated and there is no window.
app.on('ready', create_window);

app.on('activate', function() {
    if (win === null) {
        create_window();
    }
});

// Finally, we quit the app if when the last window is close.
//
// **Note**: it is OS X standard operating procedure to keep the application
// running after the last window is closed. Users have to explictly quit the
// application.
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ## Handling Menu Events
//
// I need to be able to create new sessions, load old sessions, etc... That is
// all handled via the menu. Each menu item, then, needs an associated event
// handler.
//
// I started with the `File -> New Session` menu item, and created the
// `new_session_dialog` handler. It starts a `dialog.showOpenDialog` allowing
// the user to select a directory.
function new_session_dialog(menuItem, browserWindow, event) {
    dialog.showOpenDialog(browserWindow, {
        title: 'Choose New Session Directory',
        properties: [
            'openDirectory',
            'createDirectory',
            'promptToCreate'
        ]
    }, new_session);
}

// The resulting paths are then passed to the `new_session` function.
function new_session(session_path) {
    // I first ensure that the user made a selection.
    if (session_path !== undefined) {
        // Since a session must exist in a single directory,
        // I also make sure they've only selected one path.
        if (session_path.length !== 1) {
            new_session_error({
                message: 'Too many paths selected, select only one'
            });
            return;
        }
        session_path = session_path[0];

        // I can then create the session directory if it doesn't exit, display
        // an error if it isn't a directory, or display an error if it isn't
        // empty.
        if (!fs.existsSync(session_path)) {
            fs.mkdirSync(session_path);
        } else if (!fs.statSync(session_path).isDirectory()) {
            new_session_error({
                message: `Requested session path (${session_path}) is not a directory`,
                detail: 'Please report this error the maintainer Douglas G. Moore <doug@dglmoore.com>',
            });
            return;
        } else if (fs.readdirSync(session_path).length != 0) {
            new_session_error({
                message: `Requested session path (${session_path}) is not empty`,
            });
            return;
        }

        // I then load the `assets/session.html` page into the UI.
        win.loadFile("assets/session.html");

        // Finally, I enable the `File -> Import Video` menu item.
        app.getApplicationMenu().getMenuItemById('import-video').enabled = true;
    }
}

// ## Error Dialogs
//
// Errors are likely time a program has to interact with humans. I need to be
// able to easily report errors, in the form of dialog messages, to the users.
//
// Our first such message dialog is opened whenever an error occurs within the
// `new_session` function.
function new_session_error(options) {
    options = Object.assign({
        type: 'error',
        title: 'New Session Error',
        buttons: ['OK']
    }, options);

    dialog.showMessageBox(options);
}

// ## Conclusion
//
// That's all we need to create a basic UI with electron. As we develop the
// project further, we'll need to extend electron's base menus with options for
// loading videos and reloading sessions, but this is good for now.
