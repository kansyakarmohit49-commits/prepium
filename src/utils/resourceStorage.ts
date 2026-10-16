import { StoredResource } from '../types/resources';
import { SubjectId } from '../types/planner';
import JSZip from 'jszip';

const DB_NAME = 'StudySphere12th_ResourcesDB';
const DB_VERSION = 1;
const STORE_NAME = 'resources';
const CHANGE_EVENT = 'studysphere_resources_updated';

let hasPurgedSynthetic = false;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('subjectId', 'subjectId', { unique: false });
        store.createIndex('importedAt', 'importedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function notifyChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

/**
 * Clean out previous synthetic/fake auto-generated starter templates
 * so ONLY real handwritten PDFs uploaded by the user exist in the app.
 */
export async function purgeSyntheticSeeds(): Promise<void> {
  if (hasPurgedSynthetic) return;
  hasPurgedSynthetic = true;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const list = (request.result || []) as StoredResource[];
      const synthetic = list.filter((r) => r.id.startsWith('res_seed_'));
      if (synthetic.length > 0) {
        for (const item of synthetic) {
          store.delete(item.id);
        }
        notifyChange();
      }
    };
  } catch {
    // Ignore error
  }
}

export async function getAllResources(): Promise<StoredResource[]> {
  await purgeSyntheticSeeds();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const list = ((request.result || []) as StoredResource[]).filter(
        (r) => !r.id.startsWith('res_seed_')
      );
      // Sort newest first
      list.sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getResourcesBySubject(subjectId: SubjectId): Promise<StoredResource[]> {
  const all = await getAllResources();
  return all.filter((r) => r.subjectId === subjectId);
}

export async function getResourceById(id: string): Promise<StoredResource | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const res = request.result as StoredResource | undefined;
      if (res && res.id.startsWith('res_seed_')) {
        resolve(null);
      } else {
        resolve(res || null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveResource(resource: StoredResource): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(resource);

    request.onsuccess = () => {
      notifyChange();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteResource(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      notifyChange();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllResources(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      notifyChange();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function updateResourceSubject(id: string, newSubjectId: SubjectId): Promise<void> {
  const existing = await getResourceById(id);
  if (!existing) return;
  existing.subjectId = newSubjectId;
  await saveResource(existing);
}

export async function getResourceStats(): Promise<{
  totalCount: number;
  totalSize: number;
  bySubject: Record<SubjectId, number>;
}> {
  const all = await getAllResources();
  const bySubject: Record<SubjectId, number> = {
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    biology: 0,
    english: 0,
    painting: 0,
  };

  let totalSize = 0;
  for (const r of all) {
    if (bySubject[r.subjectId] !== undefined) {
      bySubject[r.subjectId]++;
    }
    totalSize += r.fileSize || 0;
  }

  return {
    totalCount: all.length,
    totalSize,
    bySubject,
  };
}

/**
 * Download all stored resources as a structured ZIP file.
 * The original handwritten PDF files remain 100% untouched and organized by subject folder.
 */
export async function downloadAllResourcesZip(): Promise<boolean> {
  const all = await getAllResources();
  if (all.length === 0) return false;

  const zip = new JSZip();

  for (const item of all) {
    if (item.fileBlob) {
      const folderName = item.subjectId.charAt(0).toUpperCase() + item.subjectId.slice(1);
      const folder = zip.folder(folderName);
      if (folder) {
        folder.file(item.cleanedName, item.fileBlob);
      } else {
        zip.file(item.cleanedName, item.fileBlob);
      }
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Prepium_Resources_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export function onResourcesChange(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}
