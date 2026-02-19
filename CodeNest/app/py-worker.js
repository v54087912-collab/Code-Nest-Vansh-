importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js");

let pyodide = null;
let sharedBuffer = null;
let int32View = null;
let uint8View = null;

async function loadPyodideAndPackages() {
    try {
        // Reusable function for reading input from SharedArrayBuffer
        const waitAndReadInput = () => {
            // Reset flag to 0 (WAIT)
            Atomics.store(int32View, 0, 0);

            // Wait for main thread to set flag to 1 (READY)
            Atomics.wait(int32View, 0, 0);

            // Read data length
            const len = Atomics.load(int32View, 1);

            // Read string data
            const strBytes = new Uint8Array(sharedBuffer, 8, len);
            const localBytes = new Uint8Array(strBytes);
            const decoder = new TextDecoder();
            return decoder.decode(localBytes);
        };

        // Standard stdin handler (no prompt)
        const pythonInputHandler = () => {
            postMessage({ type: 'INPUT_REQUEST' });
            return waitAndReadInput();
        };

        pyodide = await loadPyodide({
            stdout: (text) => postMessage({ type: 'OUTPUT', content: text }),
            stderr: (text) => postMessage({ type: 'OUTPUT', content: text, error: true }),
            stdin: pythonInputHandler
        });

        // Explicitly set stdin to ensure it's registered
        pyodide.setStdin({ stdin: pythonInputHandler });

        // Expose a direct output function to bypass stdout buffering
        pyodide.globals.set("js_print", (text) => {
             postMessage({ type: 'OUTPUT', content: text });
        });

        // Expose custom input function that sends prompt with request
        pyodide.globals.set("js_input", (prompt) => {
             postMessage({ type: 'INPUT_REQUEST', content: prompt });
             return waitAndReadInput();
        });

        postMessage({ type: 'OUTPUT', content: "Python environment loaded.\n", system: true });

        await pyodide.loadPackage("micropip");
        postMessage({ type: 'OUTPUT', content: "Package Manager (Micropip) Ready.\n", system: true });

        // Monkey patch input to ensure stdout is flushed and prompt is handled correctly
        await pyodide.runPythonAsync(`
import builtins
import sys

_orig_input = builtins.input

def _input_patch(prompt=""):
    sys.stdout.flush()
    # Add newline to ensure prompt is on new line if previous output exists
    full_prompt = str(prompt) if prompt else ""
    # Use custom js_input to send prompt with the request, ensuring order
    return js_input(full_prompt)

builtins.input = _input_patch
`);

        // Define syntax check function
        pyodide.runPython(`
import ast
import json

def check_syntax_json(code):
    try:
        ast.parse(code)
        return json.dumps({"error": False})
    except SyntaxError as e:
        return json.dumps({
            "error": True,
            "lineno": e.lineno,
            "offset": e.offset,
            "msg": e.msg,
            "text": e.text
        })
    except Exception:
        return json.dumps({"error": False})
`);

        postMessage({ type: 'LOADED' });

    } catch (err) {
        postMessage({ type: 'OUTPUT', content: `Error loading Pyodide: ${err}\n`, error: true });
    }
}

self.onmessage = async (event) => {
    const { type, content, buffer } = event.data;

    if (type === 'INIT') {
        sharedBuffer = buffer;
        int32View = new Int32Array(sharedBuffer);
        uint8View = new Uint8Array(sharedBuffer);
        await loadPyodideAndPackages();
    } else if (type === 'RUN') {
        if (!pyodide) return;
        try {
            pyodide.globals.set("user_code", content);
            await pyodide.runPythonAsync(`exec(user_code, globals())`);
        } catch (err) {
            // Handle SyntaxErrors specially to allow editor highlighting
            if (err.type === "SyntaxError" || err.type === "IndentationError") {
                postMessage({
                    type: 'ERROR',
                    error: {
                        type: err.type,
                        lineno: err.lineno,
                        msg: err.msg
                    }
                });
            }
            // Send full traceback as stderr
            postMessage({ type: 'OUTPUT', content: String(err) + "\n", error: true });
        } finally {
             postMessage({ type: 'OUTPUT', content: "Process finished.\n", system: true });
        }
    } else if (type === 'INSTALL') {
        if (!pyodide) return;
        try {
            const micropip = pyodide.pyimport("micropip");
            await micropip.install(content);
            postMessage({ type: 'OUTPUT', content: `Successfully installed ${content}\n`, system: true });
        } catch (err) {
            postMessage({ type: 'OUTPUT', content: `Failed to install ${content}: ${err}\n`, error: true });
        }
    } else if (type === 'LINT') {
        if (!pyodide) return;
        try {
            pyodide.globals.set("code_to_check", content);
            const jsonResult = pyodide.runPython(`check_syntax_json(code_to_check)`);
            postMessage({ type: 'LINT_RESULT', content: jsonResult });
        } catch (e) {
             // Ignore linting errors
        }
    } else if (type === 'RESTORE_PACKAGES') {
        if (!pyodide) return;
        const packages = content; // content is array of strings
        if (packages && packages.length > 0) {
            postMessage({ type: 'OUTPUT', content: "Restoring installed packages...\n", system: true });
            try {
                const micropip = pyodide.pyimport("micropip");
                for (const pkg of packages) {
                    await micropip.install(pkg);
                }
                postMessage({ type: 'OUTPUT', content: "Packages restored.\n", system: true });
            } catch (err) {
                 postMessage({ type: 'OUTPUT', content: `Failed to restore packages: ${err}\n`, error: true });
            }
        }
    }
};
