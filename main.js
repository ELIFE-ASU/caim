const {app, dialog, BrowserWindow, Menu, ipcMain} = require('electron');
const fs = require('fs-extra');
const Session = require('./src/session');
const {Toolset} = require('./src/selection');

let windows = {
    main: null,
    mutual_info: null
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
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Developer Tools',
                    id: 'devtools',
                    role: 'toggleDevTools'
                },
                {
                    label: 'Fullscreen',
                    id: 'fullscreen',
                    role: 'toggleFullScreen'
                }
            ]
        }
    ]));

    windows.main = new BrowserWindow({
        width: 1600,
        height: 900,
        show: false
    }).on('ready-to-show', function() {
        this.show();
    }).on('closed', function() {
        BrowserWindow.getAllWindows().forEach((w) => w.close());
        for (let w in windows) {
            windows[w] = null;
        }
    });

    windows.main.loadFile('assets/index.html');
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

                app.getApplicationMenu().getMenuItemById('import-video').enabled = true;
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

            app.getApplicationMenu().getMenuItemById('import-video').enabled = true;

            if (session.metadata.shapes && session.metadata.shapes.length !== 0) {
                app.getApplicationMenu().getMenuItemById('mutual-info').enabled = true;
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
    if (!windows.mutual_info) {
        windows.mutual_info = new BrowserWindow({
            width: 800,
            height: 800,
            show: false
        }).on('ready-to-show', function() {
            windows.mutual_info.show();
        }).on('closed', function() {
            windows.mutual_info = null;
            app.getApplicationMenu().getMenuItemById('mutual-info').enabled = true;
        });

        windows.mutual_info.loadURL('https://dglmoore.com');
    }
    app.getApplicationMenu().getMenuItemById('mutual-info').enabled = false;
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
        if (windows.mutual_info) {
            windows.mutual_info.close();
            windows.mutual_info = null;
        }
        app.getApplicationMenu().getMenuItemById('mutual-info').enabled = false;
        windows.main.send('plot-timeseries', {
            timeseries: session.metadata.timeseries,
            binned: session.metadata.binned
        });
    }
});

ipcMain.on('push-shape', function(event, shape, binner) {
    if (session && session.active_frames) {
        shape = Toolset.from(shape);

        session.push_shape(shape, binner);
        session.save();

        app.getApplicationMenu().getMenuItemById('mutual-info').enabled = true;

        windows.main.send('plot-timeseries', {
            timeseries: session.metadata.timeseries,
            binned: session.metadata.binned
        });
    }
});

ipcMain.on('pop-shape', function() {
    if (session && session.active_frames) {
        session.pop_shape();
        session.save();

        if (session.metadata.shapes.length !== 0) {
            if (windows.mutual_info) {
                windows.mutual_info.close();
                windows.mutual_info = null;
            }
            app.getApplicationMenu().getMenuItemById('mutual-info').enabled = true;
        } else {
            app.getApplicationMenu().getMenuItemById('mutual-info').enabled = false;
        }

        windows.main.send('plot-timeseries', {
            timeseries: session.metadata.timeseries,
            binned: session.metadata.binned
        });
    }
});

ipcMain.on('rebin', function(event, binner) {
    if (session) {
        session.rebin(binner);
        session.save();

        windows.main.send('plot-timeseries', {
            timeseries: session.metadata.timeseries,
            binned: session.metadata.binned
        });
    }
});
