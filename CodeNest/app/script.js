import { EditorView, basicSetup } from "https://esm.sh/codemirror";
import { oneDark } from "https://esm.sh/@codemirror/theme-one-dark";
import { EditorState, Compartment, StateEffect } from "https://esm.sh/@codemirror/state";
import { keymap } from "https://esm.sh/@codemirror/view";
import { indentWithTab, undo, redo } from "https://esm.sh/@codemirror/commands";

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
    editorContainer: document.getElementById('editor-container'),
    filenameDisplay: document.getElementById('current-filename'),
    fileIcon: document.getElementById('file-icon'),
    btnRun: document.getElementById('btn-run-floating'),
    btnToggleFiles: document.getElementById('btn-toggle-files'),
    btnSettings: document.getElementById('btn-settings'),

    // Toolbar
    toolbarKeyboard: document.getElementById('toolbar-keyboard'),

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

    // Files
    fileTree: document.getElementById('file-tree'),
    btnNewFile: document.getElementById('btn-new-file'),
    btnNewFolder: document.getElementById('btn-new-folder'),
    btnHome: document.getElementById('btn-home'),
};

// State
let state = {
    files: {},
    currentProject: null,
    currentFile: null,
    editor: null,
    langCompartment: new Compartment(),
    worker: null,
    isRunning: false,

    // UI State
    filesOpen: false,
    consoleOpen: false,
    previewMode: 'desktop'
};

// --- Initialization ---

async function init() {
    loadFiles();
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

    // Toolbar keys
    document.querySelectorAll('.key-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const key = btn.dataset.key;
            if (key === 'undo') undo(state.editor);
            else if (key === 'redo') redo(state.editor);
            else if (key === 'TAB') insertText('    ');
            else insertText(key);
        }
    });

    // Load Python Environment in background
    initPythonWorker();
}

function loadFiles() {
    const stored = localStorage.getItem('codenest_files');
    if (stored) {
        state.files = JSON.parse(stored);
    } else {
        // Default Demo Project
        state.files = {
            'Demo/main.py': '# Welcome to CodeNest\nprint("Hello World!")\n',
            'Demo/script.js': 'console.log("Hello from JS");',
            'Demo/index.html': '<h1>Hello HTML</h1>'
        };
        localStorage.setItem('codenest_files', JSON.stringify(state.files));
    }
}

function saveFiles() {
    localStorage.setItem('codenest_files', JSON.stringify(state.files));
}

// --- Home Screen Logic ---

function renderRecentProjects() {
    els.recentList.innerHTML = '';

    const projects = new Set();
    Object.keys(state.files).forEach(path => {
        const parts = path.split('/');
        if (parts.length > 1) projects.add(parts[0]);
    });

    if (projects.size === 0) {
        els.recentList.innerHTML = '<div class="text-muted text-xs text-center py-4 italic">No recent projects</div>';
        return;
    }

    projects.forEach(proj => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-3 p-3 bg-surface hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-white/5";

        // Icon
        const iconDiv = document.createElement('div');
        iconDiv.className = "w-10 h-10 rounded-lg bg-green-900/20 flex items-center justify-center text-accent";
        iconDiv.innerHTML = '<i class="fa-solid fa-cube text-lg"></i>';
        div.appendChild(iconDiv);

        // Text Container
        const textDiv = document.createElement('div');
        textDiv.className = "flex flex-col";

        const nameSpan = document.createElement('span');
        nameSpan.className = "font-bold text-sm text-white";
        nameSpan.textContent = proj; // Safe textContent
        textDiv.appendChild(nameSpan);

        const metaSpan = document.createElement('span');
        metaSpan.className = "text-[10px] text-muted";
        metaSpan.textContent = "Project • 2m ago";
        textDiv.appendChild(metaSpan);

        div.appendChild(textDiv);

        // Arrow
        const arrow = document.createElement('i');
        arrow.className = "fa-solid fa-chevron-right text-muted ml-auto text-xs";
        div.appendChild(arrow);

        div.onclick = () => openProject(proj);
        els.recentList.appendChild(div);
    });
}

function createNewProject() {
    const name = prompt("Project Name:");
    if (!name) return;

    const exists = Object.keys(state.files).some(k => k.startsWith(name + '/'));
    if (exists) {
        alert("Project already exists!");
        return;
    }

    const mainFile = `${name}/main.py`;
    state.files[mainFile] = `# ${name}\nprint("Hello CodeNest!")\n`;
    saveFiles();

    openProject(name);
}

function openProjectDialog() {
    alert("Select a project from the Recent list below.");
}

function openProject(name) {
    state.currentProject = name;

    const files = Object.keys(state.files).filter(k => k.startsWith(name + '/'));
    const main = files.find(f => f.endsWith('main.py')) || files[0];

    switchToEditor(main);
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

// --- Editor Logic ---

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

async function loadEditor(filename) {
    if (!filename) return;

    if (state.editor && state.currentFile) {
        state.files[state.currentFile] = state.editor.state.doc.toString();
        saveFiles();
    }

    state.currentFile = filename;

    els.filenameDisplay.textContent = filename.split('/').pop();
    updateFileIcon(filename);
    renderFileTree();

    // Show Loading or Blank
    els.editorContainer.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-muted text-xs">Loading Editor...</div>';

    // Determine Language (Dynamic Import)
    let langExt = [];
    const ext = filename.split('.').pop();

    try {
        if (ext === 'py') {
            const { python } = await import("https://esm.sh/@codemirror/lang-python");
            langExt = python();
        } else if (ext === 'js') {
            const { javascript } = await import("https://esm.sh/@codemirror/lang-javascript");
            langExt = javascript();
        } else if (ext === 'ts') {
            const { javascript } = await import("https://esm.sh/@codemirror/lang-javascript");
            langExt = javascript({ typescript: true });
        } else if (ext === 'html') {
            const { html } = await import("https://esm.sh/@codemirror/lang-html");
            langExt = html();
        } else if (ext === 'css') {
            const { css } = await import("https://esm.sh/@codemirror/lang-css");
            langExt = css();
        } else if (ext === 'java') {
            const { java } = await import("https://esm.sh/@codemirror/lang-java");
            langExt = java();
        } else if (ext === 'php') {
            const { php } = await import("https://esm.sh/@codemirror/lang-php");
            langExt = php();
        }
        // Fallbacks for others (Kotlin, Dart -> Java; Ruby, Perl -> None/Text)
        else if (ext === 'kt' || ext === 'dart') {
            const { java } = await import("https://esm.sh/@codemirror/lang-java");
            langExt = java();
        }
    } catch (e) {
        console.error("Language load failed:", e);
    }

    els.editorContainer.innerHTML = ''; // Clear loading

    state.editor = new EditorView({
        doc: state.files[filename] || "",
        extensions: [
            basicSetup,
            oneDark,
            state.langCompartment.of(langExt),
            keymap.of([indentWithTab]),
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    // Debounced save
                }
            })
        ],
        parent: els.editorContainer
    });
}

function updateFileIcon(filename) {
    let icon = "fa-file";
    if (filename.endsWith('.py')) icon = "fa-brands fa-python";
    else if (filename.endsWith('.js')) icon = "fa-brands fa-js";
    else if (filename.endsWith('.ts')) icon = "fa-brands fa-js";
    else if (filename.endsWith('.html')) icon = "fa-brands fa-html5";
    else if (filename.endsWith('.css')) icon = "fa-brands fa-css3-alt";
    else if (filename.endsWith('.java')) icon = "fa-brands fa-java";
    else if (filename.endsWith('.php')) icon = "fa-brands fa-php";

    els.fileIcon.className = `${icon} text-accent text-xs`;
}

function insertText(text) {
    if (!state.editor) return;
    const transaction = state.editor.state.update({
        changes: {from: state.editor.state.selection.main.head, insert: text},
        selection: {anchor: state.editor.state.selection.main.head + text.length}
    });
    state.editor.dispatch(transaction);
    state.editor.focus();
}

// --- File Management ---

function renderFileTree() {
    els.fileTree.innerHTML = '';
    if (!state.currentProject) return;

    const prefix = state.currentProject + '/';
    const files = Object.keys(state.files).filter(k => k.startsWith(prefix));

    files.forEach(path => {
        const name = path.substring(prefix.length);
        const isActive = path === state.currentFile;

        const div = document.createElement('div');
        div.className = `file-item ${isActive ? 'active' : 'text-muted'}`;

        // Icon
        const icon = document.createElement('i');
        icon.className = "fa-solid fa-file text-xs";
        div.appendChild(icon);

        // Name
        const nameSpan = document.createElement('span');
        nameSpan.className = "text-sm truncate";
        nameSpan.textContent = name; // Safe
        div.appendChild(nameSpan);

        div.onclick = () => {
            loadEditor(path);
            if (window.innerWidth < 768) toggleFiles(false);
        };
        els.fileTree.appendChild(div);
    });
}

function createNewFile() {
    const name = prompt("File name (e.g. util.py):");
    if (!name) return;
    const path = `${state.currentProject}/${name}`;
    if (state.files[path]) {
        alert("File exists");
        return;
    }
    state.files[path] = "";
    saveFiles();
    renderFileTree();
    loadEditor(path);
}

function createNewFolder() {
    alert("Folder creation not supported in MVP flat view.");
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

function runCode() {
    if (state.editor) {
        state.files[state.currentFile] = state.editor.state.doc.toString();
        saveFiles();
    }

    const ext = state.currentFile.split('.').pop();

    if (ext === 'py') {
        runPython();
    } else if (ext === 'html' || ext === 'js') {
        runWeb();
    } else {
        alert(`Runtime for .${ext} is not available in the browser.`);
    }
}

function runPython() {
    toggleConsole(true);
    els.consoleOutput.innerHTML = '<div class="terminal-system">Running...</div>';

    if (!state.worker) {
        addToConsole("Python environment not ready.", 'stderr');
        return;
    }

    const code = state.files[state.currentFile];
    state.worker.postMessage({ type: 'RUN', content: code });
}

function runWeb() {
    els.panelPreview.classList.remove('hidden');

    let htmlContent = "";

    if (state.currentFile.endsWith('.html')) {
        htmlContent = state.files[state.currentFile];
    } else if (state.currentFile.endsWith('.js')) {
        htmlContent = `<html><body><script>${state.files[state.currentFile]}</script></body></html>`;
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
