import { FrameTemplate } from '../types';

const DB_NAME = 'FrameLibraryDB';
const STORE_NAME = 'templates';
const DB_VERSION = 1;

interface StoredTemplate {
    id: string;
    file: File;
}

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(true);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB error:', request.error);
            reject('Error opening DB');
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(true);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

export const addTemplateToDB = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const id = crypto.randomUUID();
        const template: StoredTemplate = { id, file };
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.add(template);

        request.onsuccess = () => {
            resolve(id);
        };

        request.onerror = () => {
            console.error('Error adding template:', request.error);
            reject('Could not add template to DB');
        };
    });
};

export const getAllTemplatesFromDB = (): Promise<StoredTemplate[]> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject('DB not initialized');
        }
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result as StoredTemplate[]);
        };

        request.onerror = () => {
            console.error('Error getting templates:', request.error);
            reject('Could not get templates from DB');
        };
    });
};

export const deleteTemplateFromDB = (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            console.error('Error deleting template:', request.error);
            reject('Could not delete template from DB');
        };
    });
};

export const getTemplateCountFromDB = (): Promise<number> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject('DB not initialized');
        }
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error('Error getting count:', request.error);
            reject('Could not get template count from DB');
        };
    });
}
