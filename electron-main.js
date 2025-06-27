// electron-main.js
const path = require('path');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const spawn = require('cross-spawn');

let pythonProcess = null;
let mainWindow = null;

function startPythonBackend(dbPath /* string, optional */) {
    // If already running, kill previous instance
    if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = null;
    }

    // Determine which Python executable to use
    const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = path.join(__dirname, 'run_app.py');
    const args = ['--config', path.join(__dirname, 'config', 'settings_offline.json')];

    // If caller passed a custom DB path, append --db-path <path>
    if (dbPath) {
        args.push('--db-path', dbPath);
    }

    pythonProcess = spawn(pythonExecutable, [scriptPath, ...args], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    pythonProcess.on('error', (err) => {
        console.error('Failed to start Python backend:', err);
    });
    pythonProcess.on('exit', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'assets', 'app-icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // Delay 1 second so FastAPI has time to start and serve the static files
    setTimeout(() => {
        mainWindow.loadURL('http://127.0.0.1:5005/');
        // mainWindow.webContents.openDevTools(); // Uncomment if you need DevTools
    }, 1000);
}

app.whenReady().then(() => {
    // 1) Start the Python backend (no override DB path initially)
    startPythonBackend();

    // 2) Then create the BrowserWindow
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// When all windows are closed, kill Python and quit
app.on('window-all-closed', () => {
    if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = null;
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle “open file” dialog requests from renderer
ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Select SQLite Database',
        properties: ['openFile'],
        filters: [
            { name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

// Handle “quit” messages from renderer
ipcMain.on('app:quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = null;
    }
    app.quit();
});
