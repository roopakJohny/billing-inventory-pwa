import { CreateSalePayload } from '../api/billing.api';
import { ProductRecord } from '../api/catalog.api';

const DB_NAME = 'ApexPOS_OfflineDB';
const DB_VERSION = 1;
const STORE_PRODUCTS = 'cached_products';
const STORE_OFFLINE_BILLS = 'offline_bills_queue';

export interface QueuedOfflineBill {
  offlineTempId: string;
  createdAt: string;
  payload: CreateSalePayload;
  grandTotal: number;
  customerName: string;
  syncStatus: 'PENDING' | 'CONFLICT';
  conflictError?: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_OFFLINE_BILLS)) {
        db.createObjectStore(STORE_OFFLINE_BILLS, { keyPath: 'offlineTempId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineDb = {
  async cacheProducts(products: ProductRecord[]): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
      const store = tx.objectStore(STORE_PRODUCTS);
      store.clear();
      for (const p of products) {
        store.put(p);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getCachedProducts(): Promise<ProductRecord[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PRODUCTS, 'readonly');
      const store = tx.objectStore(STORE_PRODUCTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async enqueueOfflineBill(bill: QueuedOfflineBill): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OFFLINE_BILLS, 'readwrite');
      const store = tx.objectStore(STORE_OFFLINE_BILLS);
      store.put(bill);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getQueuedOfflineBills(): Promise<QueuedOfflineBill[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OFFLINE_BILLS, 'readonly');
      const store = tx.objectStore(STORE_OFFLINE_BILLS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async removeOfflineBill(offlineTempId: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OFFLINE_BILLS, 'readwrite');
      const store = tx.objectStore(STORE_OFFLINE_BILLS);
      store.delete(offlineTempId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async markOfflineBillConflict(
    offlineTempId: string,
    errorMessage: string
  ): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OFFLINE_BILLS, 'readwrite');
      const store = tx.objectStore(STORE_OFFLINE_BILLS);
      const getReq = store.get(offlineTempId);
      getReq.onsuccess = () => {
        const record = getReq.result as QueuedOfflineBill | undefined;
        if (record) {
          record.syncStatus = 'CONFLICT';
          record.conflictError = errorMessage;
          store.put(record);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

