const {app, dialog, BrowserWindow, Menu, ipcMain} = require('electron');
const fs = require('fs-extra');
const Session = require('./src/session');
const {Toolset} = require('./src/selection');

let windows = {
    main: null,
    mutual_info: null,
    transfer_entropy: null
};

function create_window() {
    Menu.setApplicationMenu(new Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Session',
                    id: 'new-session',
                    click: new_session_dialog,
                    accelerator: 'CommandOrControl+N'
                },
                {
                    label: 'Open Session',
                    id: 'open-session',
                    click: open_session_dialog,
                    accelerator: 'CommandOrControl+O'
                },
                {
                    label: 'Import Video',
                    id: 'import-video',
                    enabled: false,
                    click: import_video_dialog,
                    accelerator: 'CommandOrControl+I'
                },
                {
                    label: 'Quit',
                    id: 'quit',
                    role: 'quit'
                }
            ]
        },
        {
            label: 'Analysis',
            submenu: [
                {
                    label: 'Mutual Information',
                    id: 'mutual-info',
                    click: mutual_info,
                    accelerator: 'CommandOrControl+M',
                    enabled: false
                },
                {
                    label: 'Transfer Entropy',
                    id: 'transfer-entropy',
                    click: transfer_entropy,
                    accelerator: 'CommandOrControl+T',
                    enabled: false
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
                },
                {
                    label: 'Zoom In',
                    id: 'zoomin',
                    role: 'zoomin'
                },
                {
                    label: 'Reset Zoom',
                    id: 'resetzoom',
                    role: 'resetzoom'
                },
                {
                    label: 'Zoom Out',
                    id: 'zoomout',
                    role: 'zoomout'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Developer Tools',
                    id: 'devtools',
                    role: 'toggleDevTools'
                }
            ]
        }
    ]));

    windows.main = new BrowserWindow({
        width: 1600,
        height: 900,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    }).on('ready-to-show', function() {
        this.show();
    }).on('closed', function() {
        BrowserWindow.getAllWindows().forEach((w) => w.close());
        for (let w in windows) {
            windows[w] = null;
        }
    });

    windows.main.loadFile('assets/caim.html');
}

app.on('ready', create_window);

app.on('activate', function() {
    if (windows.main === null) {
        create_window();
    }
});

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

let session = null;

function new_session_dialog(menuItem, browserWindow) {
    let session_path = dialog.showOpenDialog(browserWindow, {
        title: 'Choose New Session Directory',
        properties: [
            'openDirectory',
            'createDirectory',
            'promptToCreate'
        ]
    });

    if (session_path !== undefined) {
        if (session_path.length === 1) {
            session_path = session_path[0];

            fs.ensureDirSync(session_path);

            if (fs.readdirSync(session_path).length != 0) {
                error_dialog({
                    title: 'New Session Error',
                    message: `Requested session path (${session_path}) is not empty`,
                });
            } else {
                session = new Session(session_path);
                session.save();

                menu_item_state('import-video', true);

                browserWindow.send('load-session', session.path, session.metadata);
            }
        } else {
            error_dialog({
                title: 'New Session Error',
                message: 'Too many paths selected, select only one'
            });
        }
    }
}

async function open_session_dialog(menuItem, browserWindow) {
    let session_filename = dialog.showOpenDialog(browserWindow, {
        title: 'Choose Session File',
        buttonLabel: 'Open',
        filters: [
            {name: 'JSON', extensions: ['json']},
            {name: 'All Files', extensions: ['*']}
        ],
        properties: [
            'openFile',
        ]
    });

    if (session_filename !== undefined) {
        if (session_filename.length === 1) {
            session = await Session.load(session_filename[0]);

            menu_item_state('import-video', true);

            if (session.metadata.shapes && session.metadata.shapes.length !== 0) {
                menu_item_state('mutual-info', true);
            }
            if (session.metadata.shapes && session.metadata.shapes.length !== 0) {
                menu_item_state('transfer-entropy', true);
            }

            let uri = undefined;
            if (session.range_image !== null) {
                uri = await session.range_image.getBase64Async('image/png');
            }

            browserWindow.send('load-session', session.path, session.metadata, uri);
        } else {
            error_dialog({
                title: 'Open Session Error',
                message: 'Too many files selected, select only one'
            });
        }
    }
}

async function import_video_dialog(menuItem, browserWindow) {
    const video_path = dialog.showOpenDialog(browserWindow, {
        title: 'Choose a Video to Import',
        buttonLabel: 'Import',
        filters: [
            {name: 'Videos', extensions: ['mkv', 'avi', 'mp4']},
            {name: 'All Files', extensions: ['*']}
        ],
        properties: [
            'openFile'
        ]
    });

    if (video_path !== undefined) {
        if (video_path.length === 1) {
            try {
                await session.import_video(video_path[0]);
                await session.save();

                let uri = await session.range_image.getBase64Async('image/png');

                browserWindow.send('load-session', session.path, session.metadata, uri);
            } catch(err) {
                error_dialog({
                    title: 'Import Video Error',
                    message: 'Failed to import video',
                    detail: err.toString()
                });
            }
        } else {
            error_dialog({
                title: 'Import Video Error',
                message: 'Too many paths selected, select only one'
            });
        }
    }
}

function mutual_info() {
    if (session) {
        if (!windows.mutual_info) {
            windows.mutual_info = new BrowserWindow({
                width: 1030,
                height: 800,
                show: false,
                webPreferences: {
                    nodeIntegration: true
                }
            }).on('ready-to-show', function() {
                if (session.metadata.shapes && session.metadata.shapes.length !== 0) {
                    session.mutual_info();
                    session.save();
                }
                this.send('mutual-info', session.metadata.analyses.mutual_info);
                this.show();
            }).on('closed', function() {
                windows.mutual_info = null;
                menu_item_state('mutual-info', true);
            });

            windows.mutual_info.loadFile('assets/mutual_info.html');
        }
    }
    menu_item_state('mutual-info', false);
}

function transfer_entropy() {
    if (session) {
        if (!windows.transfer_entropy) {
            windows.transfer_entropy = new BrowserWindow({
                width: 1030,
                height: 800,
                show: false,
                webPreferences: {
                    nodeIntegration: true
                }
            }).on('ready-to-show', function() {
                if (session.metadata.shapes && session.metadata.shapes.length !== 0) {
                    session.transfer_entropy();
                    session.save();
                }
                this.send('transfer-entropy', session.metadata.analyses.transfer_entropy);
                this.show();
            }).on('closed', function() {
                windows.transfer_entropy = null;
                menu_item_state('transfer-entropy', true);
            });

            windows.transfer_entropy.loadFile('assets/transfer_entropy.html');
        }
    }
    menu_item_state('transfer-entropy', false);
}

function error_dialog(options) {
    options = Object.assign({
        type: 'error',
        buttons: ['OK']
    }, options);

    dialog.showMessageBox(options);
}

ipcMain.on('new-session', function() {
    new_session_dialog(null, windows.main);
});

ipcMain.on('open-session', function() {
    open_session_dialog(null, windows.main);
});

ipcMain.on('import-video', function() {
    import_video_dialog(null, windows.main);
});

ipcMain.on('clear-shapes', function() {
    if (session !== null) {
        session.clear_shapes();
        session.save();

        menu_item_state('mutual-info', session.metadata.shapes.length !== 0);
        menu_item_state('transfer-entropy', session.metadata.shapes.length !== 0);

        windows.main.send('plot-timeseries', {
            timeseries: session.metadata.timeseries,
            binned: session.metadata.binned
        });

        if (windows.mutual_info) {
            windows.mutual_info.close();
            windows.mutual_info = null;
        }
        if (windows.transfer_entropy) {
            windows.transfer_entropy.close();
            windows.transfer_entropy = null;
        }
    }
});

ipcMain.on('push-shape', function(event, shape, binner) {
    if (session && session.active_frames) {
        shape = Toolset.from(shape);

        session.push_shape(shape, binner);
        if (windows.mutual_info) {
            session.mutual_info();
        }
        if (windows.transfer_entropy) {
            session.transfer_entropy();
        }
        session.save();

        menu_item_state('mutual-info', session.metadata.shapes.length !== 0);
        menu_item_state('transfer-entropy', session.metadata.shapes.length !== 0);

        windows.main.send('plot-timeseries', {
            timeseries: session.metadata.timeseries,
            binned: session.metadata.binned
        });

        if (windows.mutual_info) {
            if (session.metadata.shapes.length !== 0) {
                windows.mutual_info.send('mutual-info', session.metadata.analyses.mutual_info);
            } else {
                windows.mutual_info.close();
                windows.mutual_info = null;
            }
        }
        if (windows.transfer_entropy) {
            if (session.metadata.shapes.length !== 0) {
                windows.transfer_entropy.send('transfer-entropy', session.metadata.analyses.transfer_entropy);
            } else {
                windows.transfer_entropy.close();
                windows.transfer_entropy = null;
            }
        }
    }
});

ipcMain.on('pop-shape', function() {
    if (session && session.active_frames) {
        session.pop_shape();
        if (windows.mutual_info) {
            session.mutual_info();
        }
        if (windows.transfer_entropy) {
            session.transfer_entropy();
        }
        session.save();

        windows.main.send('plot-timeseries', {
            timeseries: session.metadata.timeseries,
            binned: session.metadata.binned
        });

        if (windows.mutual_info) {
            if (session.metadata.shapes.length !== 0) {
                windows.mutual_info.send('mutual-info', session.metadata.analyses.mutual_info);
            } else {
                windows.mutual_info.close();
                windows.mutual_info = null;
            }
        }
        if (windows.transfer_entropy) {
            if (session.metadata.shapes.length !== 0) {
                windows.transfer_entropy.send('transfer-entropy', session.metadata.analyses.transfer_entropy);
            } else {
                windows.transfer_entropy.close();
                windows.transfer_entropy = null;
            }
        }

        menu_item_state('mutual-info', session.metadata.shapes.length !== 0);
        menu_item_state('transfer-entropy', session.metadata.shapes.length !== 0);
    }
});

ipcMain.on('rebin', function(event, binner) {
    if (session) {
        session.rebin(binner);
        if (windows.mutual_info) {
            session.mutual_info();
        }
        if (windows.transfer_entropy) {
            session.transfer_entropy();
        }
        session.save();

        windows.main.send('plot-timeseries', {
            timeseries: session.metadata.timeseries,
            binned: session.metadata.binned
        });

        if (windows.mutual_info) {
            windows.mutual_info.send('mutual-info', session.metadata.analyses.mutual_info);
        }
        if (windows.transfer_entropy) {
            windows.transfer_entropy.send('transfer-entropy', session.metadata.analyses.transfer_entropy);
        }
    }
});

const menu_item_state = function(id, state) {
    app.getApplicationMenu().getMenuItemById(id).enabled = state;
};
