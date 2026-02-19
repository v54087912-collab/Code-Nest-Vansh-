// db.js - IndexedDB Wrapper for CodeNest
const DB_NAME = 'CodeNestDB';
const STORE_FILES = 'files';
const DB_VERSION = 1;

let db;

export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Database error: " + event.target.errorCode);
            reject("Database error: " + event.target.errorCode);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            // console.log("DB initialized");
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Create object store for files
            // Key path is the file path (string)
            if (!db.objectStoreNames.contains(STORE_FILES)) {
                db.createObjectStore(STORE_FILES, { keyPath: "path" });
            }
        };
    });
}

export function saveFile(path, content) {
    return new Promise((resolve, reject) => {
        if (!db) {
            initDB().then(() => saveFile(path, content).then(resolve).catch(reject));
            return;
        }
        const transaction = db.transaction([STORE_FILES], "readwrite");
        const store = transaction.objectStore(STORE_FILES);
        const request = store.put({ path: path, content: content, timestamp: Date.now() });

        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e);
    });
}

export function getFile(path) {
    return new Promise((resolve, reject) => {
        if (!db) {
            initDB().then(() => getFile(path).then(resolve).catch(reject));
            return;
        }
        const transaction = db.transaction([STORE_FILES], "readonly");
        const store = transaction.objectStore(STORE_FILES);
        const request = store.get(path);

        request.onsuccess = () => {
            resolve(request.result ? request.result.content : null);
        };
        request.onerror = (e) => reject(e);
    });
}

export function getAllFiles() {
    return new Promise((resolve, reject) => {
        if (!db) {
            initDB().then(() => getAllFiles().then(resolve).catch(reject));
            return;
        }
        const transaction = db.transaction([STORE_FILES], "readonly");
        const store = transaction.objectStore(STORE_FILES);
        const request = store.getAll();

        request.onsuccess = () => {
            // Returns array of objects {path, content, timestamp}
            resolve(request.result);
        };
        request.onerror = (e) => reject(e);
    });
}

export function deleteFile(path) {
    return new Promise((resolve, reject) => {
        if (!db) {
            initDB().then(() => deleteFile(path).then(resolve).catch(reject));
            return;
        }
        const transaction = db.transaction([STORE_FILES], "readwrite");
        const store = transaction.objectStore(STORE_FILES);
        const request = store.delete(path);

        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e);
    });
}
