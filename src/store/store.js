import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import vaultReducer from './vaultSlice';

// Manual Storage Wrapper
const storage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};

const persistConfig = {
  key: 'vault-root',
  storage: storage,
  // ⚠️ CHANGE 1: Added 'masterKey' here so it stays after refresh
  whitelist:
  [
    'driveLink', 
    'customFilename', 
    'history', 
    'bookmarks', 
    'masterKey', 
    'originalText',
    'maxLocalRecords',
    'maxCloudRecords',
    'maxDisplayRecords'
  ],
  blacklist: ['status'] // Only 'status' (loading/idle) should reset on refresh
};

const persistedReducer = persistReducer(persistConfig, vaultReducer);

export const store = configureStore({
  reducer: {
    vault: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);