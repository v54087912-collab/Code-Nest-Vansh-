// Imports
import { EditorView, basicSetup } from "https://esm.sh/codemirror";
import { python } from "https://esm.sh/@codemirror/lang-python";
import { oneDark } from "https://esm.sh/@codemirror/theme-one-dark";
import { syntaxHighlighting, defaultHighlightStyle } from "https://esm.sh/@codemirror/language";
import { EditorState, Compartment, Transaction, StateField, StateEffect } from "https://esm.sh/@codemirror/state";
import { keymap, Decoration, WidgetType } from "https://esm.sh/@codemirror/view";
import { cmTheme } from "./js/cm-theme.js";
import { initSettings } from "./js/settings.js";
import { indentWithTab, undo, redo, selectAll, deleteLine, indentMore, indentLess, toggleComment } from "https://esm.sh/@codemirror/commands";
import { openSearchPanel, gotoLine } from "https://esm.sh/@codemirror/search";
import { startCompletion } from "https://esm.sh/@codemirror/autocomplete";
import { linter, lintGutter } from "https://esm.sh/@codemirror/lint";
import { PyMainThread } from "./js/py-main-thread.js";

function insertSnippet(view, type) {
    const snippets = {
        'def': 'def function_name(args):\n    """Docstring"""\n    pass\n',
        'for': 'for item in iterable:\n    pass\n',
        'if': 'if condition:\n    pass\nelse:\n    pass\n',
        'class': 'class ClassName:\n    def __init__(self, args):\n        pass\n',
        'try': 'try:\n    pass\nexcept Exception as e:\n    print(e)\n',
        'import': 'import module_name\nfrom module import submodule\n'
    };

    const text = snippets[type];
    if (text) {
        const selection = view.state.selection.main;
        view.dispatch({
            changes: {from: selection.from, to: selection.to, insert: text},
            selection: {anchor: selection.from + text.length}
        });
        view.focus();
    }
}

// Popular Libraries Config
const POPULAR_LIBS = [
    { name: "numpy", desc: "Scientific computing with Python" },
    { name: "pandas", desc: "Data analysis and manipulation" },
    { name: "matplotlib", desc: "Plotting and visualization" },
    { name: "scipy", desc: "Mathematics, science, and engineering" },
    { name: "requests", desc: "HTTP for Humans" },
    { name: "beautifulsoup4", desc: "Screen-scraping library" },
    { name: "micropip", desc: "Package installer (built-in)" },
    { name: "pyodide-http", desc: "Patch requests for Pyodide" }
];

// DOM Elements Mapping
const els = {
    editorContainer: document.getElementById('editor-container'),
    output: document.getElementById('console-output'),
    fileList: document.getElementById('file-list'),
    btnRun: document.getElementById('btn-run'),
    btnNew: document.getElementById('btn-new-file'),
    btnUndo: document.getElementById('btn-undo'),
    btnRedo: document.getElementById('btn-redo'),
    btnClearCode: document.getElementById('btn-clear-code'),
    btnClearConsole: document.getElementById('btn-clear-console'),

    // Sidebar
    btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
    btnCloseSidebar: document.getElementById('btn-close-sidebar'),
    sidebarMenu: document.getElementById('sidebar-menu'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    avatarContainer: document.getElementById('sidebar-avatar-container'),
    avatarPlaceholder: document.getElementById('sidebar-avatar-placeholder'),
    avatarImg: document.getElementById('sidebar-avatar-img'),
    inputAvatar: document.getElementById('input-avatar-upload'),

    // Library
    libSearch: document.getElementById('lib-search'),
    btnInstallLib: document.getElementById('btn-install-lib'),
    libList: document.getElementById('lib-list'),

    // Quick Keys
    quickKeys: document.querySelectorAll('.key-btn')
};

// State
let state = {
    files: {},
    currentFile: 'main.py',
    currentDir: '', // Root is empty string, 'subfolder/' otherwise
    worker: null,
    sharedBuffer: null,
    int32View: null,
    uint8View: null,
    editor: null,
    wrapEnabled: false,
    pendingLintResolve: null,
    isRunning: false,
    isWaitingForInput: false,
    runAfterInit: null
};

const wrapCompartment = new Compartment();
const themeCompartment = new Compartment();

// --- CodeMirror Error Handling Extension ---

// 1. Define the Effect to Add/Clear Errors
const setErrorEffect = StateEffect.define();

// 2. Define the Widget that renders the Error Box
class ErrorWidget extends WidgetType {
    constructor(message, type) {
        super();
        this.message = message;
        this.type = type;
    }

    toDOM() {
        const wrap = document.createElement("div");
        wrap.className = "cm-error-widget";

        // Icon
        const icon = document.createElement("i");
        icon.className = "fa-solid fa-triangle-exclamation cm-error-icon";
        wrap.appendChild(icon);

        // Content Container
        const content = document.createElement("div");
        content.className = "cm-error-content";

        // Title (Error Type)
        const title = document.createElement("div");
        title.className = "cm-error-title";
        title.textContent = this.type;
        content.appendChild(title);

        // Message (Explanation)
        const msg = document.createElement("div");
        msg.className = "cm-error-msg";
        msg.textContent = this.message;
        content.appendChild(msg);

        wrap.appendChild(content);
        return wrap;
    }
}

// 3. Define the State Field to manage decorations
const errorField = StateField.define({
    create() {
        return Decoration.none;
    },
    update(underlying, tr) {
        let deco = underlying;

        // Clear error on any document change (user typing)
        if (tr.docChanged) {
            return Decoration.none;
        }

        // Handle dispatched effects (setting the error)
        for (let e of tr.effects) {
            if (e.is(setErrorEffect)) {
                // Expecting { line: number, message: string, type: string } or null to clear
                if (e.value) {
                    const { line, message, type } = e.value;
                    // Line Decoration (Highlight)
                    const lineDeco = Decoration.line({
                        attributes: { class: "cm-error-line" }
                    }).range(tr.state.doc.line(line).from);

                    // Widget Decoration (Box Below)
                    const widgetDeco = Decoration.widget({
                        widget: new ErrorWidget(message, type),
                        block: true,
                        side: 1 // below
                    }).range(tr.state.doc.line(line).to); // attach to end of line so it renders below block

                    deco = Decoration.set([lineDeco, widgetDeco]);
                } else {
                    deco = Decoration.none;
                }
            }
        }
        return deco;
    },
    provide: f => EditorView.decorations.from(f)
});

// --- CodeMirror Linter ---
const pythonLinter = async (view) => {
    // Only run if Worker is ready
    if (!state.worker) return [];

    const doc = view.state.doc;
    const code = doc.toString();

    // Skip if empty to avoid noise
    if (!code.trim()) return [];

    return new Promise((resolve) => {
        state.pendingLintResolve = (result) => {
             if (result.error && result.lineno > 0) {
                // Python lineno is 1-based
                let line;
                try {
                     line = doc.line(result.lineno);
                } catch(e) {
                    resolve([]); // invalid line
                    return;
                }

                // Calculate offsets
                let fromPos = line.from;
                let toPos = line.to;

                if (result.offset) {
                    fromPos = Math.min(line.to, line.from + (result.offset - 1));
                    toPos = Math.min(line.to, fromPos + 1);
                }

                resolve([{
                    from: fromPos,
                    to: toPos,
                    severity: "error",
                    message: result.msg,
                    source: "Python Syntax"
                }]);
            } else {
                resolve([]);
            }
        };

        state.worker.postMessage({ type: 'LINT', content: code });

        // Safety timeout
        setTimeout(() => {
            if (state.pendingLintResolve) {
                // If the promise hasn't been resolved yet by the handler
                // We don't null it out here because we can't check identity easily without keeping ref
                // But it's fine, next lint will overwrite.
            }
        }, 2000);
    });
};


// Initialization
async function init() {
    initSettings(); // Initialize settings (themes, font size)
    loadFiles();
    loadUserProfile(); // Load avatar
    initEditor();
    renderFileList();
    renderLibraryList();
    bindEvents();
    // Expose state for debugging/testing
    window.appState = state;
    startApp();
}

// User Profile Logic
function loadUserProfile() {
    const avatarUrl = localStorage.getItem('pyide_user_avatar');
    if (avatarUrl) {
        updateAvatarUI(avatarUrl);
    }
}

function updateAvatarUI(url) {
    if (!url) return;
    if (els.avatarImg) {
        els.avatarImg.src = url;
        els.avatarImg.classList.remove('hidden');
        // Ensure z-index is correct relative to placeholder if CSS is tricky,
        // though hidden on placeholder should suffice.
    }
    if (els.avatarPlaceholder) {
        els.avatarPlaceholder.classList.add('hidden');
    }
}

async function uploadProfileImage(file) {
    if (!file) return;

    // Optional: Size Check (e.g. 2MB Limit for localStorage)
    if (file.size > 2 * 1024 * 1024) {
        alert("Image too large! Please upload an image smaller than 2MB.");
        return;
    }

    // Show loading state
    if(els.avatarContainer) els.avatarContainer.classList.add('opacity-50', 'pointer-events-none');

    const reader = new FileReader();

    reader.onload = function(e) {
        const base64Image = e.target.result;

        try {
            // Save to LocalStorage
            localStorage.setItem('pyide_user_avatar', base64Image);

            // Update UI
            updateAvatarUI(base64Image);

            // alert("Profile image updated locally!");
        } catch (err) {
            console.error("Storage Error:", err);
            alert("Failed to save image. It might be too large for browser storage.");
        } finally {
            if(els.avatarContainer) els.avatarContainer.classList.remove('opacity-50', 'pointer-events-none');
        }
    };

    reader.onerror = function(err) {
        console.error("FileReader Error:", err);
        alert("Error reading file.");
        if(els.avatarContainer) els.avatarContainer.classList.remove('opacity-50', 'pointer-events-none');
    };

    reader.readAsDataURL(file);
}

async function startApp() {
    // Switch to Loading View
    // if (window.uiSetLoading) window.uiSetLoading(true);

    addToTerminal("Initializing Python environment...\n", "system");
    restartWorker();
}

function restartWorker() {
    // Clear any stuck input UI
    const input = els.output.querySelector('input');
    if (input) input.remove();

    if (state.worker) {
        state.worker.terminate();
    }

    // Check Environment Support
    const isSecureContext = window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined';

    try {
        if (isSecureContext) {
            // Standard Worker Mode (High Performance, Non-blocking)
            state.worker = new Worker('./py-worker.js');

            // Init SharedArrayBuffer if not exists
            if (!state.sharedBuffer) {
                state.sharedBuffer = new SharedArrayBuffer(1024);
                state.int32View = new Int32Array(state.sharedBuffer);
                state.uint8View = new Uint8Array(state.sharedBuffer);
            } else {
                Atomics.store(state.int32View, 0, 0);
            }

            state.worker.onmessage = handleWorkerMessage;
            state.worker.postMessage({ type: 'INIT', buffer: state.sharedBuffer });

        } else {
            // Fallback: Main Thread Mode (Low Performance, Blocking UI, but Compatible)
            console.warn("SharedArrayBuffer missing. Falling back to Main Thread execution.");
            addToTerminal("Warning: Running in Compatibility Mode (Main Thread). Performance may be slower and input uses prompts.\n", "stderr");

            state.worker = new PyMainThread(); // Mimics Worker Interface
            state.worker.onmessage = handleWorkerMessage;

            // Start Init (No buffer needed)
            state.worker.postMessage({ type: 'INIT' });
        }

        // Reset flags
        state.isRunning = false;
        state.isWaitingForInput = false;

    } catch (err) {
        console.error("Critical Error initializing environment:", err);
        addToTerminal(`Critical Error: ${err.message}\n`, "stderr");

        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = "Error: Failed to initialize Python environment.";
            loadingText.classList.add('text-red-500');
        }
    }
}

// Persistence Helper
function savePackage(pkg) {
    const packages = JSON.parse(localStorage.getItem('pyide_packages') || '[]');
    if (!packages.includes(pkg)) {
        packages.push(pkg);
        localStorage.setItem('pyide_packages', JSON.stringify(packages));
    }
}

function restorePackages() {
    const packages = JSON.parse(localStorage.getItem('pyide_packages') || '[]');
    if (packages.length > 0 && state.worker) {
        state.worker.postMessage({ type: 'RESTORE_PACKAGES', content: packages });
    }
}

function handleWorkerMessage(event) {
    const { type, content, system, error } = event.data;

    if (type === 'LOADED') {
        // if (window.uiSetLoading) window.uiSetLoading(false);
        // if (window.uiSwitchView) window.uiSwitchView('view-files');
        addToTerminal("Python Ready.\n", "system");

        restorePackages();

        if (state.runAfterInit) {
            const codeToRun = state.runAfterInit;
            state.runAfterInit = null;
            // Delay slightly to ensure ready
            setTimeout(() => {
                if(state.worker) state.worker.postMessage({ type: 'RUN', content: codeToRun });
            }, 100);
        }
    } else if (type === 'OUTPUT') {
        const style = error ? 'stderr' : (system ? 'system' : 'stdout');
        addToTerminal(content, style);

        // Detect finish
        if (system && content.includes("Process finished.")) {
            state.isRunning = false;
            state.isWaitingForInput = false;
             if(els.btnRun) {
                els.btnRun.disabled = false;
                els.btnRun.classList.remove('opacity-75');
            }
        }

        // Detect Library Install Success
        if (system && content.includes("Successfully installed")) {
             const match = content.match(/Successfully installed (.+)/);
             if (match) {
                 const pkgName = match[1].trim();
                 savePackage(pkgName);
                 renderLibraryList(); // Refresh UI

                 if(els.btnInstallLib) {
                     els.btnInstallLib.disabled = false;
                     els.btnInstallLib.textContent = "Install";
                     if(els.libSearch) els.libSearch.value = "";
                 }
             }
        }

        // Detect Library Install Failure
        if (error && content.includes("Failed to install")) {
             if(els.btnInstallLib) {
                 els.btnInstallLib.disabled = false;
                 els.btnInstallLib.textContent = "Retry";
             }
        }
    } else if (type === 'LINT_RESULT') {
        if (state.pendingLintResolve) {
            const result = JSON.parse(content);
            state.pendingLintResolve(result);
            state.pendingLintResolve = null;
        }
    } else if (type === 'INPUT_REQUEST') {
        state.isWaitingForInput = true;
        handleInputRequest(content);
    } else if (type === 'ERROR') {
        // Handle Syntax Errors from Runner
        const errObj = error;
        if (errObj && (errObj.type === "SyntaxError" || errObj.type === "IndentationError")) {
            const line = errObj.lineno;
            const msg = errObj.msg;
            if (line > 0) {
                 const friendlyMsg = getFriendlyErrorMessage(msg);
                 state.editor.dispatch({
                    effects: setErrorEffect.of({
                        line: line,
                        message: friendlyMsg,
                        type: errObj.type
                    })
                });
                const linePos = state.editor.state.doc.line(line).from;
                state.editor.dispatch({
                    effects: EditorView.scrollIntoView(linePos, {y: "center"})
                });
            }
        }
    }
}

function handleInputRequest(prompt) {
    if (prompt) {
        addToTerminal(prompt, 'stdout');
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'terminal-input';
    input.autocomplete = 'off';
    input.spellcheck = false;

    els.output.appendChild(input);
    input.focus();

    // Auto-scroll
    els.output.scrollTop = els.output.scrollHeight;

    // Keep focus
    // input.onblur = () => input.focus();

    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = input.value;

            // 1. Encode value
            const encoder = new TextEncoder();
            const bytes = encoder.encode(value);

            // Check buffer size (1024 bytes total, 8 header -> 1016 data)
            if (bytes.length > 1016) {
                alert("Input too long!");
                return;
            }

            // 2. Write length to Int32Array index 1
            Atomics.store(state.int32View, 1, bytes.length);

            // 3. Write bytes to Uint8Array starting at offset 8
            // Note: TypedArray constructor with offset creates a view
            const dataSubArray = new Uint8Array(state.sharedBuffer, 8, bytes.length);
            dataSubArray.set(bytes);

            // 4. Set flag to 1 (READY)
            Atomics.store(state.int32View, 0, 1);

            // 5. Notify worker
            Atomics.notify(state.int32View, 0);

            // 6. UI Cleanup
            input.remove();
            state.isWaitingForInput = false;

            // Echo input in Cyan
            addToTerminal(value + "\n", 'input-echo');
        }
    };
}

// Editor Logic
function initEditor() {
    // Determine initial syntax theme based on body class or default
    // We check if body has any 'light' theme class or defaults to dark
    const currentThemeId = localStorage.getItem('pyide_theme') || 'dark';
    const lightThemes = ['light', 'minimal-white', 'flat', 'pastel', 'frosted', 'classic'];
    const isLight = lightThemes.includes(currentThemeId);

    const initialSyntax = isLight ? syntaxHighlighting(defaultHighlightStyle) : oneDark;

    const extensions = [
        basicSetup,
        python(),
        themeCompartment.of([initialSyntax, cmTheme]), // cmTheme overrides structural colors
        keymap.of([indentWithTab]),
        errorField, // Add error field extension
        linter(pythonLinter, { delay: 800 }), // Add Real-time Linter with debounce
        lintGutter(),
        EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                saveCurrentFile();
            }
        }),
        wrapCompartment.of(state.wrapEnabled ? EditorView.lineWrapping : [])
    ];

    state.editor = new EditorView({
        doc: state.files[state.currentFile] || "",
        extensions: extensions,
        parent: els.editorContainer
    });
}

// File Management
function loadFiles() {
    const stored = localStorage.getItem('pyide_files');
    if (stored) {
        state.files = JSON.parse(stored);
    } else {
        state.files = { 'main.py': '# Welcome to PyMobile Pro\n\nuser = input("Enter your name: ")\nprint(f"Hello, {user}!")\n' };
    }

    // Check URL for Shared Code
    const urlParams = new URLSearchParams(window.location.search);
    const sharedCode = urlParams.get('code');
    if (sharedCode) {
        try {
            // Base64 Decode (Unicode safe)
            const decoded = decodeURIComponent(escape(atob(sharedCode)));
            // Create a temporary file for it
            const shareName = "shared_snippet.py";
            state.files[shareName] = decoded;
            state.currentFile = shareName;

            // Clean URL without refresh
            window.history.replaceState({}, document.title, window.location.pathname);

            updateFileHeader();
            return; // Skip loading last file logic
        } catch (e) {
            console.error("Failed to load shared code", e);
            alert("Failed to load shared code: Invalid format.");
        }
    }

    const lastFile = localStorage.getItem('pyide_current');
    if (lastFile && state.files[lastFile]) {
        state.currentFile = lastFile;
        // infer directory from file
        const parts = lastFile.split('/');
        if (parts.length > 1) {
            state.currentDir = parts.slice(0, -1).join('/') + '/';
        } else {
            state.currentDir = '';
        }
    } else {
        state.currentFile = Object.keys(state.files)[0];
        state.currentDir = '';
    }
    updateFileHeader();
}

function saveCurrentFile() {
    if (!state.editor) return;
    const content = state.editor.state.doc.toString();
    state.files[state.currentFile] = content;

    // Debounce save
    if (state.saveTimeout) clearTimeout(state.saveTimeout);
    state.saveTimeout = setTimeout(() => {
        localStorage.setItem('pyide_files', JSON.stringify(state.files));
        localStorage.setItem('pyide_current', state.currentFile);
    }, 1000);
}

function updateFileHeader() {
    const el = document.getElementById('current-filename');
    if (el) el.textContent = state.currentFile;
}

function renderFileList() {
    els.fileList.innerHTML = '';

    // Render "Back to Parent" if in subdirectory
    if (state.currentDir) {
        const backDiv = document.createElement('div');
        backDiv.className = "flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-white/5 border-b border-white/5 transition-colors";
        backDiv.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gray-800/50 flex items-center justify-center text-gray-500">
                    <i class="fa-solid fa-arrow-left"></i>
                </div>
                <div class="flex flex-col">
                    <span class="text-white text-sm font-medium">..</span>
                    <span class="text-xs text-gray-500">Back</span>
                </div>
            </div>
        `;
        backDiv.onclick = () => {
            const parts = state.currentDir.slice(0, -1).split('/');
            parts.pop(); // remove current folder
            state.currentDir = parts.length > 0 ? parts.join('/') + '/' : '';
            renderFileList();
        };
        els.fileList.appendChild(backDiv);
    }

    // Identify Items in Current Directory
    const entries = new Set();

    Object.keys(state.files).forEach(path => {
        if (!path.startsWith(state.currentDir)) return;

        const relative = path.substring(state.currentDir.length);
        const parts = relative.split('/');

        if (parts.length > 1) {
            // It's a directory
            entries.add({ type: 'folder', name: parts[0] });
        } else {
            // It's a file
            entries.add({ type: 'file', name: parts[0] });
        }
    });

    // Convert Set to Array and Sort (Folders first)
    const sortedEntries = Array.from(entries).sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
    });

    // Deduplicate (since multiple files can imply same folder)
    const uniqueEntries = [];
    const seen = new Set();
    sortedEntries.forEach(e => {
        if (!seen.has(e.name)) {
            uniqueEntries.push(e);
            seen.add(e.name);
        }
    });

    uniqueEntries.forEach(entry => {
        const div = document.createElement('div');
        const isFolder = entry.type === 'folder';
        const fullPath = state.currentDir + entry.name;
        const isActive = !isFolder && fullPath === state.currentFile;

        let baseClass = "relative flex justify-between items-center px-4 py-3 cursor-pointer transition-all border-b border-white/5 overflow-hidden group";
        if (isActive) baseClass += " bg-green-900/10";
        else baseClass += " hover:bg-white/5";
        div.className = baseClass;

        if (isFolder) {
            div.onclick = () => {
                state.currentDir += entry.name + '/';
                renderFileList();
            };
        } else {
            div.onclick = () => switchFile(fullPath);
        }

        // Icon logic
        let iconClass = "fa-solid fa-file";
        let iconColor = "text-gray-400";
        let iconBg = "bg-gray-800";

        if (isFolder) {
            iconClass = "fa-solid fa-folder";
            iconColor = "text-yellow-500";
            iconBg = "bg-yellow-900/20";
        } else if (entry.name.endsWith('.py')) {
            iconClass = "fa-brands fa-python";
            iconColor = "text-accent";
            iconBg = "bg-green-900/20";
        } else if (entry.name.endsWith('.json')) {
            iconClass = "fa-solid fa-file-code";
            iconColor = "text-yellow-500";
            iconBg = "bg-yellow-900/20";
        } else if (entry.name.endsWith('.txt')) {
            iconClass = "fa-solid fa-file-lines";
            iconColor = "text-gray-400";
            iconBg = "bg-gray-800";
        }

        // Active Indicator
        const activeIndicator = isActive ? `<div class="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>` : '';
        const activeDot = isActive ? '<div class="absolute bottom-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-darker shadow-lg z-10"></div>' : '';

        // Random metadata (for visual demo)
        const size = isFolder ? "" : "2 KB";
        const time = isFolder ? "" : "10m ago";

        div.innerHTML = `
            ${activeIndicator}
            <div class="flex items-center gap-3 pl-2">
                <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} relative shrink-0">
                    <i class="${iconClass} text-lg"></i>
                    ${activeDot}
                </div>
                <div class="flex flex-col overflow-hidden">
                    <span class="${isActive ? 'text-accent font-bold' : 'text-gray-300 font-medium'} text-sm truncate">${entry.name}</span>
                    <span class="text-xs text-gray-500 truncate">${isFolder ? 'Folder' : `${size} • ${time}`}</span>
                </div>
            </div>
            ${isFolder ? '<i class="fa-solid fa-chevron-right text-gray-600 text-xs"></i>' : ''}
        `;

        // Actions (Rename/Delete) for Files Only (simpler for now)
        if (!isFolder) {
            const actions = document.createElement('div');
            actions.className = "flex items-center gap-2 z-10 pl-2";
            actions.onclick = (e) => e.stopPropagation();

            const renameBtn = document.createElement('button');
            renameBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
            renameBtn.className = "w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors";
            renameBtn.onclick = () => renameFile(fullPath);
            actions.appendChild(renameBtn);

            if (Object.keys(state.files).length > 1) {
                const delBtn = document.createElement('button');
                delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                delBtn.className = "w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors";
                delBtn.onclick = () => deleteFile(fullPath);
                actions.appendChild(delBtn);
            }
            div.appendChild(actions);
        }

        els.fileList.appendChild(div);
    });
}

function switchFile(filename) {
    if (filename === state.currentFile) return;
    state.currentFile = filename;

    // Switch editor content
    const content = state.files[filename];
    state.editor.dispatch({
        changes: {from: 0, to: state.editor.state.doc.length, insert: content}
    });

    renderFileList();
    updateFileHeader();
    localStorage.setItem('pyide_current', filename);

    // Switch back to editor view if we are in file view
    // Trigger click on Editor tab
    const editorTab = document.querySelector('.nav-btn[data-target="view-editor"]');
    if (editorTab) editorTab.click();
}

function createNewItem() {
    // Custom Modal or Prompt could go here. For now, simple prompt.
    const type = prompt("Create 'file' or 'folder'?", "file");
    if (!type) return;

    if (type.toLowerCase() === 'folder') {
        const folderName = prompt("Enter folder name:");
        if (folderName) {
            // Create a placeholder file to persist the folder
            const path = state.currentDir + folderName + '/.keep';
            state.files[path] = "";
            renderFileList();
            saveCurrentFile(); // trigger save to localstorage
        }
    } else {
        const name = prompt("Enter file name (e.g., script.py):", "script.py");
        if (name) {
            const path = state.currentDir + name;
            if (state.files[path]) {
                alert("File already exists!");
                return;
            }
            state.files[path] = "# New file\n";
            renderFileList();
            switchFile(path);
            localStorage.setItem('pyide_files', JSON.stringify(state.files));
        }
    }
}

function renameFile(oldPath) {
    const oldName = oldPath.split('/').pop();
    const newName = prompt("Enter new file name:", oldName);
    if (newName && newName !== oldName) {
        const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + newName;

        if (state.files[newPath]) {
            alert("File already exists!");
            return;
        }
        state.files[newPath] = state.files[oldPath];
        delete state.files[oldPath];
        if (state.currentFile === oldPath) state.currentFile = newPath;
        renderFileList();
        updateFileHeader();
        localStorage.setItem('pyide_files', JSON.stringify(state.files));
        localStorage.setItem('pyide_current', state.currentFile);
    }
}

function deleteFile(path) {
    if (confirm(`Delete ${path}?`)) {
        delete state.files[path];
        // If we deleted the current file, switch to another one
        if (state.currentFile === path) {
            const remaining = Object.keys(state.files);
            if (remaining.length > 0) {
                switchFile(remaining[0]);
            } else {
                // Should create a default file?
                state.files['main.py'] = "";
                switchFile('main.py');
            }
        }
        renderFileList();
        updateFileHeader();
        localStorage.setItem('pyide_files', JSON.stringify(state.files));
        localStorage.setItem('pyide_current', state.currentFile);
    }
}

// Execution
async function runCode() {
    // Open Console Pane via UI Helper
    if (window.uiShowConsole) window.uiShowConsole();

    const userCode = state.editor.state.doc.toString();

    // Check if worker is stuck or waiting
    if (state.isRunning || state.isWaitingForInput) {
        addToTerminal("\n[System] Restarting environment for new run...\n", "system");
        state.runAfterInit = userCode;
        restartWorker();
        return;
    }

    if (!state.worker) {
        addToTerminal("Python is loading, please wait...\n", "system");
        return;
    }

    // Do not disable run button to allow restarts
    /*
    if(els.btnRun) {
        els.btnRun.disabled = true;
        els.btnRun.classList.add('opacity-75');
    }
    */

    // Append run marker
    addToTerminal(`\n➜  ~/${state.currentDir} python3 ${state.currentFile.split('/').pop()}\n`, "system");

    state.isRunning = true;

    // Clear previous errors
    state.editor.dispatch({ effects: setErrorEffect.of(null) });

    state.worker.postMessage({ type: 'RUN', content: userCode });
}

// Helper: Friendly Error Messages
function getFriendlyErrorMessage(rawMsg) {
    if (rawMsg.includes("expected ':'")) return "It looks like you missed a colon ':' at the end of this line.";
    if (rawMsg.includes("unexpected indent")) return "The indentation here is incorrect. Try removing the extra spaces at the start of the line.";
    if (rawMsg.includes("unindent does not match")) return "This line's indentation doesn't match the previous block. Check your spaces/tabs.";
    if (rawMsg.includes("EOF while scanning triple-quoted string")) return "You have an unclosed triple-quoted string. Add ''' or \"\"\" to close it.";
    if (rawMsg.includes("EOL while scanning string literal")) return "You have an unclosed string. Add a quote (' or \") at the end of the text.";
    if (rawMsg.includes("invalid syntax")) return "This syntax is invalid. Check for missing brackets, quotes, or typos.";
    if (rawMsg.includes("unmatched ')'")) return "You have an extra closing parenthesis ')' without a matching opening one.";
    if (rawMsg.includes("unmatched '}'")) return "You have an extra closing brace '}' without a matching opening one.";
    if (rawMsg.includes("unmatched ']'")) return "You have an extra closing bracket ']' without a matching opening one.";
    if (rawMsg.includes("'(' was never closed")) return "You opened a parenthesis '(' but never closed it.";
    if (rawMsg.includes("'{' was never closed")) return "You opened a curly brace '{' but never closed it.";
    if (rawMsg.includes("'[' was never closed")) return "You opened a square bracket '[' but never closed it.";

    return rawMsg; // Return original if no friendly map found
}

// Sidebar Actions Logic
function runAction(action, arg) {
    if (!state.editor) return;
    const view = state.editor;
    const dispatch = view.dispatch.bind(view);
    const stateDoc = view.state.doc;
    const selection = view.state.selection.main;

    // Helper to get line info
    const line = stateDoc.lineAt(selection.head);

    switch(action) {
        case 'insert-snippet':
            insertSnippet(view, arg);
            toggleSidebar(false);
            break;
        case 'copy':
            // Naive copy (Clipboard API permissions can be tricky without user gesture, but click is user gesture)
            navigator.clipboard.writeText(stateDoc.sliceString(line.from, line.to));
            toggleSidebar(false);
            break;
        case 'copy-all':
            navigator.clipboard.writeText(stateDoc.toString());
            toggleSidebar(false);
            break;
        case 'cut':
            navigator.clipboard.writeText(stateDoc.sliceString(line.from, line.to));
            deleteLine(view);
            toggleSidebar(false);
            break;
        case 'paste':
            navigator.clipboard.readText().then(text => {
                view.dispatch({
                    changes: {from: selection.from, to: selection.to, insert: text},
                    selection: {anchor: selection.from + text.length}
                });
            }).catch(err => {
                console.error("Paste failed:", err);
                alert("Unable to paste. Please check permissions.");
            });
            toggleSidebar(false);
            break;
        case 'select-all':
            selectAll(view);
            toggleSidebar(false);
            break;
        case 'delete-line':
            deleteLine(view);
            toggleSidebar(false);
            break;
        case 'duplicate-line':
            // Duplicate current line(s)
            const dupLineContent = stateDoc.sliceString(line.from, line.to);
            view.dispatch({
                changes: {from: line.to, insert: '\n' + dupLineContent}
            });
            toggleSidebar(false);
            break;
        case 'move-line-up':
            // Basic move up implementation (swap with previous line)
             if (line.number > 1) {
                const prevLine = stateDoc.line(line.number - 1);
                const prevContent = stateDoc.sliceString(prevLine.from, prevLine.to);
                const currentContent = stateDoc.sliceString(line.from, line.to);

                view.dispatch({
                    changes: [
                        {from: prevLine.from, to: prevLine.to, insert: currentContent},
                        {from: line.from, to: line.to, insert: prevContent}
                    ],
                    selection: {anchor: prevLine.from + (selection.head - line.from)} // Try to keep cursor rel pos
                });
             }
             toggleSidebar(false);
             break;
        case 'move-line-down':
             if (line.number < stateDoc.lines) {
                const nextLine = stateDoc.line(line.number + 1);
                const nextContent = stateDoc.sliceString(nextLine.from, nextLine.to);
                const currentContent = stateDoc.sliceString(line.from, line.to);

                view.dispatch({
                    changes: [
                        {from: line.from, to: line.to, insert: nextContent},
                        {from: nextLine.from, to: nextLine.to, insert: currentContent}
                    ],
                    selection: {anchor: nextLine.from + (selection.head - line.from)}
                });
             }
             toggleSidebar(false);
             break;
        case 'find':
        case 'replace':
            openSearchPanel(view);
            toggleSidebar(false);
            break;
        case 'goto-line':
            gotoLine(view);
            toggleSidebar(false);
            break;
        case 'scroll-top':
             view.dispatch({
                effects: EditorView.scrollIntoView(0, {y: "start"})
            });
            toggleSidebar(false);
            break;
        case 'scroll-bottom':
             view.dispatch({
                effects: EditorView.scrollIntoView(stateDoc.length, {y: "end"})
            });
            toggleSidebar(false);
            break;
        case 'upper':
            if (!selection.empty) {
                const text = stateDoc.sliceString(selection.from, selection.to);
                view.dispatch({ changes: {from: selection.from, to: selection.to, insert: text.toUpperCase()} });
            }
            toggleSidebar(false);
            break;
        case 'lower':
            if (!selection.empty) {
                const text = stateDoc.sliceString(selection.from, selection.to);
                view.dispatch({ changes: {from: selection.from, to: selection.to, insert: text.toLowerCase()} });
            }
            toggleSidebar(false);
            break;
        case 'indent':
            indentMore(view);
            break;
        case 'outdent':
            indentLess(view);
            break;
        case 'syntax':
            checkSyntax();
            toggleSidebar(false);
            break;
        case 'comment':
        case 'uncomment':
            toggleComment(view);
            toggleSidebar(false);
            break;
        case 'format':
            // Naive formatting: Select All + Indent?
            if(selection.empty) selectAll(view);
            indentMore(view);
            toggleSidebar(false);
            break;
        case 'format-pep8':
            formatCodePEP8();
            toggleSidebar(false);
            break;
        case 'auto-complete':
            startCompletion(view);
            toggleSidebar(false);
            break;
        case 'restart':
            restartWorker();
            toggleSidebar(false);
            break;
        case 'run-selected':
            const code = stateDoc.sliceString(selection.from, selection.to);
            if (code.trim()) {
                if(window.uiShowConsole) window.uiShowConsole();
                addToTerminal("\n[Running Selection]\n", "system");
                if (state.worker) state.worker.postMessage({ type: 'RUN', content: code });
            } else {
                alert("No code selected!");
            }
            toggleSidebar(false);
            break;
        case 'clear-console':
             if (els.btnClearConsole) els.btnClearConsole.click();
             toggleSidebar(false);
             break;
        case 'stats':
             const text = stateDoc.toString();
             const words = text.trim() ? text.trim().split(/\s+/).length : 0;
             const chars = text.length;
             alert(`Word Count: ${words}\nCharacter Count: ${chars}`);
             toggleSidebar(false);
             break;
        case 'show-error':
            checkSyntax(); // Re-uses existing syntax check which jumps to error
            toggleSidebar(false);
            break;
        case 'remove-extra-spaces':
             const clean = stateDoc.toString().split('\n').map(l => l.replace(/\s+$/, '')).join('\n');
             view.dispatch({
                changes: {from: 0, to: stateDoc.length, insert: clean}
             });
             toggleSidebar(false);
             break;
        case 'download':
             downloadCode();
             toggleSidebar(false);
             break;
        case 'share':
             shareCode();
             toggleSidebar(false);
             break;
    }
    view.focus();
}

function downloadCode() {
    const code = state.editor.state.doc.toString();
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.currentFile.split('/').pop() || 'script.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function shareCode() {
    const code = state.editor.state.doc.toString();
    try {
        // Unicode safe Base64
        const encoded = btoa(unescape(encodeURIComponent(code)));
        const url = new URL(window.location.href);
        url.searchParams.set('code', encoded);

        navigator.clipboard.writeText(url.toString()).then(() => {
            alert("Share Link Copied to Clipboard!");
        }).catch(err => {
            console.error(err);
            prompt("Copy this link:", url.toString());
        });
    } catch (e) {
        alert("Failed to generate link.");
    }
}

async function checkSyntax() {
    if (!state.worker) {
        alert("Python engine not ready.");
        return;
    }
    const code = state.editor.state.doc.toString();
    const pythonCode = `
import ast
import json
code = ${JSON.stringify(code)}
try:
    ast.parse(code)
    print("Syntax OK")
except SyntaxError as e:
    print(f"Syntax Error on line {e.lineno}: {e.msg}")
`;
    state.worker.postMessage({ type: 'RUN', content: pythonCode });
    if(window.uiShowConsole) window.uiShowConsole();
}

// PEP-8 Formatter (Simple Python-based approach via Worker)
async function formatCodePEP8() {
    if (!state.worker) {
        alert("Python environment not ready.");
        return;
    }

    // We can't easily install 'black' or 'autopep8' via micropip in 1 second if not cached.
    // So we'll use a custom Python script that does basic formatting using 'tokenize' or similar if available,
    // OR we just try to use a regex-based JS formatter for now to be fast and offline-friendly without deps.
    // BUT the user asked for PEP-8.
    // Let's try a clever trick: Use Python's built-in `ast` unparse (Python 3.9+) if possible,
    // effectively re-generating code from AST which enforces some standard spacing!

    const code = state.editor.state.doc.toString();
    const pythonFormatter = `
import ast
import sys

code = ${JSON.stringify(code)}

try:
    # Parse code to AST
    tree = ast.parse(code)

    if sys.version_info >= (3, 9):
        import ast
        formatted = ast.unparse(tree)
        print("___FORMATTED_START___")
        print(formatted)
        print("___FORMATTED_END___")
    else:
        print("Error: Python 3.9+ required for AST unparse")

except Exception as e:
    print(f"Format Error: {e}")
`;

    // Listen for the specific output
    const originalHandler = state.worker.onmessage;
    let accumulatedOutput = "";

    // Create a robust handler wrapper
    const formatHandler = (event) => {
        const { type, content, system, error } = event.data;

        if (type === 'OUTPUT' && !system && !error) {
             accumulatedOutput += content;

             if (accumulatedOutput.includes("___FORMATTED_END___")) {
                 const parts = accumulatedOutput.split("___FORMATTED_START___");
                 if (parts.length > 1) {
                     let cleanCode = parts[1].split("___FORMATTED_END___")[0];
                     // Trim first newline if ast.unparse adds one? usually it's fine.
                     cleanCode = cleanCode.trim();

                     // Apply to editor
                     if (cleanCode && state.editor) {
                        state.editor.dispatch({
                            changes: {from: 0, to: state.editor.state.doc.length, insert: cleanCode}
                        });
                        addToTerminal("[System] Code formatted (AST Re-generation).\n", "system");
                     }
                 }
                 // Restore handler
                 state.worker.onmessage = originalHandler;
             }
        } else if (type === 'ERROR') {
             // If worker reports error, formatting failed (likely syntax error in user code prevents parsing)
             // We restore handler and show error
             state.worker.onmessage = originalHandler;
             handleWorkerMessage(event); // Let original handler show syntax error
        } else {
             // Pass through other messages
             handleWorkerMessage(event);
        }
    };

    state.worker.onmessage = formatHandler;

    state.worker.postMessage({ type: 'RUN', content: pythonFormatter });
}

// Sidebar Toggle Logic
function toggleSidebar(show) {
    const menu = els.sidebarMenu;
    const overlay = els.sidebarOverlay;
    if (show) {
        menu.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        // Push state for back button handling
        history.pushState({ view: 'sidebar' }, "", "#sidebar");
    } else {
        menu.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
        // If we are closing via UI (not back button), go back in history if top is sidebar?
        // Actually simplest is just close visually.
        // If the user presses back button later, we handle that in ui.js via popstate
    }
}

// Output
function addToTerminal(text, type = 'stdout') {
    const span = document.createElement('span');
    span.textContent = text;

    // Map types to CSS classes
    let className = 'terminal-stdout';
    switch (type) {
        case 'stderr': className = 'terminal-stderr'; break;
        case 'system': className = 'terminal-system'; break;
        case 'input-echo': className = 'terminal-input-echo'; break;
        case 'stdout': default: className = 'terminal-stdout'; break;
    }
    span.className = className;

    els.output.appendChild(span);
    els.output.scrollTop = els.output.scrollHeight;
}

// Library Management
function renderLibraryList() {
    if (!els.libList) return;
    els.libList.innerHTML = '';

    // Get installed packages
    const installed = JSON.parse(localStorage.getItem('pyide_packages') || '[]');

    POPULAR_LIBS.forEach(lib => {
        const isInstalled = installed.includes(lib.name);

        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-3 bg-surface rounded-xl border border-white/5";

        div.innerHTML = `
            <div class="flex flex-col">
                <span class="text-text font-bold text-sm">${lib.name}</span>
                <span class="text-muted text-[10px]">${lib.desc}</span>
            </div>
            <button class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isInstalled
                ? 'bg-green-900/20 text-green-400 cursor-default'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }" ${isInstalled ? 'disabled' : `onclick="window.cmdInstallLib('${lib.name}')"`}>
                ${isInstalled ? '<i class="fa-solid fa-check mr-1"></i> Installed' : 'Install'}
            </button>
        `;
        els.libList.appendChild(div);
    });

    // Footer
    const hint = document.createElement('div');
    hint.className = "text-center text-muted text-xs mt-4 opacity-50";
    hint.textContent = "Search above for any PyPI package";
    els.libList.appendChild(hint);
}

window.cmdInstallLib = (name) => {
    if(els.libSearch) els.libSearch.value = name;
    installLibrary();
};

async function installLibrary() {
    const pkg = els.libSearch.value.trim();
    if (!pkg) return;

    // Show visual feedback immediately
    if(els.btnInstallLib) {
        els.btnInstallLib.disabled = true;
        els.btnInstallLib.textContent = "Working...";
    }

    // We rely on the worker to send back confirmation
    if(state.worker) {
        state.worker.postMessage({ type: 'INSTALL', content: pkg });
    } else {
        alert("Python environment not ready.");
    }
}

// Quick Keys Logic
function insertText(text) {
    if (!state.editor) return;
    const transaction = state.editor.state.update({
        changes: {from: state.editor.state.selection.main.head, insert: text},
        selection: {anchor: state.editor.state.selection.main.head + text.length}
    });
    state.editor.dispatch(transaction);
    state.editor.focus();
}

// Bind Events
function bindEvents() {
    // btnRun might be removed in later steps, but binding here if exists
    if (els.btnRun) els.btnRun.onclick = runCode;

    // New File Button now acts as New Item
    if (els.btnNew) els.btnNew.onclick = createNewItem;

    if (els.btnUndo) els.btnUndo.onclick = () => undo(state.editor);
    if (els.btnRedo) els.btnRedo.onclick = () => redo(state.editor);
    if (els.btnClearCode) els.btnClearCode.onclick = () => {
        if (confirm("Are you sure you want to clear everything? Unsaved changes will be lost.")) {
            if (state.editor) {
                state.editor.dispatch({
                    changes: {from: 0, to: state.editor.state.doc.length, insert: ''}
                });
                state.editor.focus();
            }
        }
    };
    if (els.btnClearConsole) els.btnClearConsole.onclick = () => {
        const input = els.output.querySelector('input');
        els.output.innerHTML = '';
        if(input) {
             els.output.appendChild(input);
             input.focus();
        } else {
             // If no input, just show empty message or nothing
             // els.output.innerHTML = '<div class="text-gray-500 italic">Console cleared.</div>';
        }
    };

    // Library
    if (els.btnInstallLib) els.btnInstallLib.onclick = installLibrary;

    // Sidebar
    if (els.btnToggleSidebar) els.btnToggleSidebar.onclick = () => toggleSidebar(true);
    if (els.btnCloseSidebar) els.btnCloseSidebar.onclick = () => toggleSidebar(false);
    if (els.sidebarOverlay) els.sidebarOverlay.onclick = () => toggleSidebar(false);

    // Avatar Upload
    if (els.avatarContainer && els.inputAvatar) {
        els.avatarContainer.onclick = () => els.inputAvatar.click();
        els.inputAvatar.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                uploadProfileImage(e.target.files[0]);
            }
        };
    }

    // Quick Keys
    els.quickKeys.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent focus loss?
            const key = btn.dataset.key;
            if (key === 'TAB') insertText("    ");
            else insertText(key);
        });
    });

    // Theme Change Listener
    window.addEventListener('theme-changed', (e) => {
        const type = e.detail.type;
        const isLight = type === 'light';
        const newSyntax = isLight ? syntaxHighlighting(defaultHighlightStyle) : oneDark;

        if (state.editor) {
            state.editor.dispatch({
                effects: themeCompartment.reconfigure([newSyntax, cmTheme])
            });
        }
    });

    // Expose runCode and runAction globally
    window.cmdRunCode = runCode;
    window.cmdRunAction = runAction;
}

// Handle Back Button specifically for Sidebar (if ui.js doesn't catch it perfectly)
// Actually ui.js handles views. Sidebar is an overlay.
// We can hook into popstate here too or just let ui.js manage main views.
// Ideally ui.js should know about sidebar?
// For now, let's add a simple check in popstate in ui.js or here.
window.addEventListener('popstate', (e) => {
    // If we popped a state and sidebar is open, close it
    if (!e.state || e.state.view !== 'sidebar') {
         els.sidebarMenu.classList.add('-translate-x-full');
         els.sidebarOverlay.classList.add('hidden');
    }
});

// Start
init();
