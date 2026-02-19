// CodeNest PWA IDE - Main Logic
import { initDB, saveFile, getFile, getAllFiles, deleteFile } from './js/db.js';

// DOM Elements
const els = {
    viewHome: document.getElementById('view-home'),
    viewEditor: document.getElementById('view-editor'),
    viewLoading: document.getElementById('view-loading'),

    // Home
    btnNewProject: document.getElementById('btn-new-project'),
    btnOpenProject: document.getElementById('btn-open-project'),
    recentList: document.getElementById('recent-projects-list'),

    // Editor
    monacoContainer: document.getElementById('monaco-container'),
    filenameDisplay: document.getElementById('current-filename'),
    fileIcon: document.getElementById('file-icon'),
    btnRun: document.getElementById('btn-run-floating'),
    btnToggleFiles: document.getElementById('btn-toggle-files'),
    btnSettings: document.getElementById('btn-settings'),

    // Panels
    panelFiles: document.getElementById('panel-files'),
    overlayFiles: document.getElementById('overlay-files'),
    panelConsole: document.getElementById('panel-console'),
    consoleOutput: document.getElementById('console-output'),
    consoleHandle: document.getElementById('console-handle'),
    btnCloseConsole: document.getElementById('btn-close-console'),
    btnClearConsole: document.getElementById('btn-clear-console'),
    panelPreview: document.getElementById('panel-preview'),
    previewFrame: document.getElementById('preview-frame'),
    btnClosePreview: document.getElementById('btn-close-preview'),
    btnTogglePreviewMode: document.getElementById('btn-toggle-preview-mode'),

    // Modal
    modalSettings: document.getElementById('modal-settings'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    inputLibName: document.getElementById('input-lib-name'),
    btnInstallLib: document.getElementById('btn-install-lib'),
    settingMinimap: document.getElementById('setting-minimap'),
    settingWordWrap: document.getElementById('setting-wordwrap'),

    // Files
    fileTree: document.getElementById('file-tree'),
    btnNewFile: document.getElementById('btn-new-file'),
    btnNewFolder: document.getElementById('btn-new-folder'),
    btnHome: document.getElementById('btn-home'),
};

// State
let state = {
    currentProject: null,
    currentFile: null,
    editor: null, // Monaco Instance
    worker: null, // Pyodide Worker
    isRunning: false,

    // UI State
    filesOpen: false,
    consoleOpen: false,
    previewMode: 'desktop'
};

// --- Initialization ---

async function init() {
    await initDB();
    await checkFirstRun();
    renderRecentProjects();

    // Bind Events
    els.btnNewProject.onclick = createNewProject;
    els.btnOpenProject.onclick = openProjectDialog;
    els.btnHome.onclick = goHome;

    els.btnToggleFiles.onclick = () => toggleFiles(true);
    els.overlayFiles.onclick = () => toggleFiles(false);

    els.btnRun.onclick = runCode;
    els.btnSettings.onclick = () => toggleSettings(true);
    els.btnCloseSettings.onclick = () => toggleSettings(false);

    els.consoleHandle.onclick = () => toggleConsole(!state.consoleOpen);
    els.btnCloseConsole.onclick = () => toggleConsole(false);
    els.btnClearConsole.onclick = clearConsole;

    els.btnNewFile.onclick = createNewFile;
    els.btnNewFolder.onclick = createNewFolder;

    els.btnClosePreview.onclick = closePreview;
    if (els.btnTogglePreviewMode) els.btnTogglePreviewMode.onclick = togglePreviewMode;

    els.btnInstallLib.onclick = installLibrary;

    // Settings Listeners
    els.settingMinimap.onchange = updateEditorSettings;
    els.settingWordWrap.onchange = updateEditorSettings;

    // Gestures
    initGestures();

    // Load Python Environment in background
    initPythonWorker();
}

async function checkFirstRun() {
    const files = await getAllFiles();
    if (files.length === 0) {
        // Create Default Project
        await saveFile('Demo/main.py', '# Welcome to CodeNest\nprint("Hello World!")\n');
        await saveFile('Demo/script.js', 'console.log("Hello from JS");');
        await saveFile('Demo/index.html', '<h1>Hello HTML</h1>');
    }
}

// --- Home Screen Logic ---

async function renderRecentProjects() {
    els.recentList.innerHTML = '';

    const files = await getAllFiles();
    const projects = new Set();
    files.forEach(f => {
        const parts = f.path.split('/');
        if (parts.length > 1) projects.add(parts[0]);
    });

    if (projects.size === 0) {
        els.recentList.innerHTML = '<div class="text-muted text-xs text-center py-4 italic">No recent projects</div>';
        return;
    }

    projects.forEach(proj => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-3 p-3 bg-surface hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-white/5";

        div.innerHTML = `
            <div class="w-10 h-10 rounded-lg bg-green-900/20 flex items-center justify-center text-accent">
                <i class="fa-solid fa-cube text-lg"></i>
            </div>
            <div class="flex flex-col">
                <span class="font-bold text-sm text-white">${proj}</span>
                <span class="text-[10px] text-muted">Project • Local</span>
            </div>
            <i class="fa-solid fa-chevron-right text-muted ml-auto text-xs"></i>
        `;
        div.onclick = () => openProject(proj);
        els.recentList.appendChild(div);
    });
}

function createNewProject() {
    const name = prompt("Project Name:");
    if (!name) return;

    // Basic check if already displayed, but strictly we should check DB
    // For now, just create main.py
    const mainPath = `${name}/main.py`;
    saveFile(mainPath, `# ${name}\nprint("Hello CodeNest!")\n`).then(() => {
        openProject(name);
    });
}

function openProjectDialog() {
    alert("Select a project from the Recent list below.");
}

async function openProject(name) {
    state.currentProject = name;

    const files = await getAllFiles();
    const projectFiles = files.filter(f => f.path.startsWith(name + '/'));
    const main = projectFiles.find(f => f.path.endsWith('main.py')) || projectFiles[0];

    if (main) {
        switchToEditor(main.path);
    } else {
        alert("Empty project");
    }
}

function goHome() {
    toggleFiles(false);
    els.viewEditor.classList.add('opacity-0');
    setTimeout(() => {
        els.viewEditor.classList.add('hidden');
        els.viewHome.classList.remove('hidden');
        void els.viewHome.offsetWidth;
        els.viewHome.classList.remove('opacity-0');
        renderRecentProjects();
    }, 300);
}

// --- Editor Logic (Monaco) ---

async function switchToEditor(filename) {
    els.viewHome.classList.add('opacity-0');
    setTimeout(() => {
        els.viewHome.classList.add('hidden');
        els.viewEditor.classList.remove('hidden');
        void els.viewEditor.offsetWidth;
        els.viewEditor.classList.remove('opacity-0');

        loadEditor(filename);
    }, 300);
}

let monacoLoaded = false;

async function loadEditor(filename) {
    if (!filename) return;

    // Save previous if exists
    if (state.editor && state.currentFile) {
        const content = state.editor.getValue();
        await saveFile(state.currentFile, content);
    }

    state.currentFile = filename;

    els.filenameDisplay.textContent = filename.split('/').pop();
    updateFileIcon(filename);
    renderFileTree();

    // Ensure Monaco is loaded
    if (!monacoLoaded) {
        els.monacoContainer.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-muted text-xs">Loading Editor Engine...</div>';
        await initMonaco();
        monacoLoaded = true;
        els.monacoContainer.innerHTML = '';
    }

    const content = await getFile(filename) || "";
    const ext = filename.split('.').pop();
    let lang = 'python';
    if (ext === 'js') lang = 'javascript';
    if (ext === 'ts') lang = 'typescript';
    if (ext === 'html') lang = 'html';
    if (ext === 'css') lang = 'css';
    if (ext === 'java') lang = 'java';

    // If editor exists, just update model
    if (state.editor) {
        const model = monaco.editor.createModel(content, lang);
        state.editor.setModel(model);
    } else {
        // Create Editor
        state.editor = monaco.editor.create(els.monacoContainer, {
            value: content,
            language: lang,
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            padding: { top: 20 }
        });

        // Auto-save on change
        state.editor.onDidChangeModelContent(() => {
            // Debounce save?
            // For now direct save to memory/db
            const val = state.editor.getValue();
            // Don't await to avoid lag
            saveFile(state.currentFile, val);
        });
    }
}

function initMonaco() {
    return new Promise((resolve) => {
        if (window.monaco) {
            resolve();
            return;
        }
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});
        require(['vs/editor/editor.main'], function() {
            resolve();
        });
    });
}

function updateEditorSettings() {
    if (!state.editor) return;

    state.editor.updateOptions({
        minimap: { enabled: els.settingMinimap.checked },
        wordWrap: els.settingWordWrap.checked ? 'on' : 'off'
    });
}

function updateFileIcon(filename) {
    let icon = "fa-file";
    if (filename.endsWith('.py')) icon = "fa-brands fa-python";
    else if (filename.endsWith('.js')) icon = "fa-brands fa-js";
    else if (filename.endsWith('.html')) icon = "fa-brands fa-html5";
    else if (filename.endsWith('.css')) icon = "fa-brands fa-css3-alt";
    else if (filename.endsWith('.java')) icon = "fa-brands fa-java";

    els.fileIcon.className = `${icon} text-accent text-xs`;
}

// --- File Management ---

async function renderFileTree() {
    els.fileTree.innerHTML = '';
    if (!state.currentProject) return;

    const files = await getAllFiles();
    const projectFiles = files.filter(f => f.path.startsWith(state.currentProject + '/'));

    projectFiles.forEach(fileObj => {
        const name = fileObj.path.substring(state.currentProject.length + 1);
        const isActive = fileObj.path === state.currentFile;

        const div = document.createElement('div');
        div.className = `file-item ${isActive ? 'active' : 'text-muted'}`;

        const icon = document.createElement('i');
        icon.className = "fa-solid fa-file text-xs";
        div.appendChild(icon);

        const nameSpan = document.createElement('span');
        nameSpan.className = "text-sm truncate";
        nameSpan.textContent = name;
        div.appendChild(nameSpan);

        div.onclick = () => {
            loadEditor(fileObj.path);
            if (window.innerWidth < 768) toggleFiles(false);
        };
        els.fileTree.appendChild(div);
    });
}

function createNewFile() {
    const name = prompt("File name (e.g. util.py):");
    if (!name) return;
    const path = `${state.currentProject}/${name}`;

    saveFile(path, "").then(() => {
        renderFileTree();
        loadEditor(path);
    });
}

function createNewFolder() {
    alert("Folder creation not supported in MVP.");
}

function toggleFiles(show) {
    state.filesOpen = show;
    if (show) {
        els.panelFiles.classList.remove('-translate-x-full');
        els.overlayFiles.classList.remove('hidden');
    } else {
        els.panelFiles.classList.add('-translate-x-full');
        els.overlayFiles.classList.add('hidden');
    }
}

function toggleSettings(show) {
    if (show) els.modalSettings.classList.remove('hidden');
    else els.modalSettings.classList.add('hidden');
}

// --- Gestures ---

function initGestures() {
    let startX = 0;
    let startY = 0;

    document.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, {passive: true});

    document.addEventListener('touchend', e => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;

        // Horizontal Swipe (Left/Right)
        if (Math.abs(diffX) > 100 && Math.abs(diffY) < 50) {
            // Swipe Right -> Open Files
            if (diffX > 0 && startX < 50) { // Edge swipe
                toggleFiles(true);
            }
            // Swipe Left -> Close Files (if open)
            if (diffX < 0 && state.filesOpen) {
                toggleFiles(false);
            }
        }

        // Vertical Swipe (Up) -> Open Console
        if (diffY < -100 && Math.abs(diffX) < 50) {
            // Bottom edge swipe
            if (startY > window.innerHeight - 50) {
                toggleConsole(true);
            }
        }

        // Vertical Swipe (Down) -> Close Console
        if (diffY > 100 && Math.abs(diffX) < 50 && state.consoleOpen) {
            toggleConsole(false);
        }
    }, {passive: true});
}

// --- Execution ---

function initPythonWorker() {
    try {
        state.worker = new Worker('./py-worker.js');
        state.worker.onmessage = handleWorkerMessage;
        state.worker.postMessage({ type: 'INIT' });
    } catch (e) {
        console.error("Worker Init Failed", e);
    }
}

function handleWorkerMessage(e) {
    const { type, content, error } = e.data;
    if (type === 'OUTPUT') {
        addToConsole(content, error ? 'stderr' : 'stdout');
        if (content.includes('Successfully installed')) {
            alert(content);
        }
    } else if (type === 'LOADED') {
        console.log("Python Loaded");
    }
}

async function runCode() {
    // Save current
    if (state.editor) {
        await saveFile(state.currentFile, state.editor.getValue());
    }

    const ext = state.currentFile.split('.').pop();

    if (ext === 'py') {
        runPython();
    } else if (ext === 'html' || ext === 'js') {
        runWeb();
    } else {
        alert(`Runtime for .${ext} is not available.`);
    }
}

async function runPython() {
    toggleConsole(true);
    els.consoleOutput.innerHTML = '<div class="terminal-system">Running...</div>';

    if (!state.worker) {
        addToConsole("Python environment not ready.", 'stderr');
        return;
    }

    const code = await getFile(state.currentFile);
    state.worker.postMessage({ type: 'RUN', content: code });
}

async function runWeb() {
    els.panelPreview.classList.remove('hidden');

    let htmlContent = "";
    const raw = await getFile(state.currentFile);

    if (state.currentFile.endsWith('.html')) {
        htmlContent = raw;
    } else if (state.currentFile.endsWith('.js')) {
        htmlContent = `<html><body><script>${raw}</script></body></html>`;
    }

    const blob = new Blob([htmlContent], { type: 'text/html' });
    els.previewFrame.src = URL.createObjectURL(blob);
}

function togglePreviewMode() {
    if (state.previewMode === 'desktop') {
        state.previewMode = 'mobile';
        els.previewFrame.style.width = '375px';
        els.previewFrame.style.margin = '0 auto';
        els.previewFrame.style.border = '1px solid #ccc';
    } else {
        state.previewMode = 'desktop';
        els.previewFrame.style.width = '100%';
        els.previewFrame.style.margin = '0';
        els.previewFrame.style.border = 'none';
    }
}

function closePreview() {
    els.panelPreview.classList.add('hidden');
    els.previewFrame.src = "about:blank";
}

function installLibrary() {
    const pkg = els.inputLibName.value.trim();
    if (!pkg) return;

    if (state.worker) {
        els.btnInstallLib.textContent = "Installing...";
        state.worker.postMessage({ type: 'INSTALL', content: pkg });
        setTimeout(() => els.btnInstallLib.textContent = "Install", 2000);
    } else {
        alert("Python environment not ready.");
    }
}

// --- Console ---

function toggleConsole(show) {
    state.consoleOpen = show;
    if (show) {
        els.panelConsole.classList.remove('translate-y-full');
    } else {
        els.panelConsole.classList.add('translate-y-full');
    }
}

function addToConsole(text, type) {
    const span = document.createElement('div');
    span.textContent = text;
    span.className = type === 'stderr' ? 'terminal-stderr' : 'terminal-stdout';
    els.consoleOutput.appendChild(span);
    els.consoleOutput.scrollTop = els.consoleOutput.scrollHeight;
}

function clearConsole() {
    els.consoleOutput.innerHTML = '';
}

// Start
init();
