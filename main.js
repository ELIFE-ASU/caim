const {app, dialog, BrowserWindow, Menu} = require('electron');
const fs = require('fs');
const path = require('path');
const {Session} = require('./src/session');

let win = null;

function create_window() {
    win = new BrowserWindow();

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
                    enabled: false,
                    click: import_video_dialog
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

    win.loadFile('assets/startup.html');

    win.on('closed', () => win = null);
}

app.on('ready', create_window);

app.on('activate', function() {
    if (win === null) {
        create_window();
    }
});

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

let session = {
    path: null,
    data: null,
    save: function() {
        return this.data.save(this.path);
    }
};

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

function new_session(session_path) {
    if (session_path !== undefined) {
        if (session_path.length !== 1) {
            new_session_error({
                message: 'Too many paths selected, select only one'
            });
            return;
        }
        session_path = session_path[0];

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

        session.path = session_path;
        session.data = Session();
        session.save();

        win.loadFile("assets/session.html");

        app.getApplicationMenu().getMenuItemById('import-video').enabled = true;
    }
}

function import_video_dialog(menuItem, browserWindow, event) {
    dialog.showOpenDialog(browserWindow, {
        title: 'Choose a Video to Import',
        buttonLabel: 'Import',
        filters: [
            {name: 'Videos', extensions: ['mkv', 'avi', 'mp4']},
            {name: 'All Files', extensions: ['*']}
        ],
        properties: [
            'openFile'
        ]
    }, import_video);
}

function import_video(video_path) {
    if (video_path !== undefined) {
        if (video_path.length !== 1) {
            import_video_error({
                message: 'Too many paths selected, select only one'
            });
            return;
        }
        video_path = video_path[0];

        let ext = path.extname(video_path),
            dst = path.join(session.path, 'video' + ext);

        fs.copyFileSync(video_path, dst);
    }
}

function new_session_error(options) {
    options = Object.assign({
        type: 'error',
        title: 'New Session Error',
        buttons: ['OK']
    }, options);

    dialog.showMessageBox(options);
}

function import_video_error(options) {
    options = Object.assign({
        type: 'error',
        title: 'Video Import Error',
        buttons: ['OK']
    }, options);

    dialog.showMessageBox(options);
}
