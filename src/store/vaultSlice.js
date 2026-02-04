import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast'; // Import Toast

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxPCW4sh6_U4f3s4NOktYuhWFHwn8Kq-4sLrUGuDVvGcEbY61pG_HV2Irk-B7FtOO7L/exec";

// --- ASYNC THUNK ---
export const saveToDrive = createAsyncThunk(
  'vault/saveToDrive',
  async (encryptedContent, { getState, rejectWithValue, dispatch }) => {
    const state = getState().vault;
    
    const newRecordId = uuidv4();
    const payload = {
      id: newRecordId,
      timestamp: Date.now(),
      author: "WebUser",
      action: "UPDATE",
      version: state.history.length + 1,
      payload: encryptedContent,
      changed_versiosnid: state.history.length > 0 ? state.history[0].id : "INIT",
      filename: state.customFilename || "chunk-default", 
      folderId: state.driveLink,
      authToken: "rupesh-secure-token-2026"
    };

    try {
      const response = await axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload), {
        headers: { "Content-Type": "text/plain" }
      });

      if (response.data.status === 'error') {
        throw new Error(response.data.message || "Unknown Server Error");
      }

      toast.success("Successfully Synced to Drive!", { icon: '🚀' });
      return payload; 

    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(`Sync Failed: ${errorMsg}`);
      // Return the payload + error so we can save it to "Failed Memory"
      return rejectWithValue({ ...payload, error: errorMsg });
    }
  }
);

const vaultSlice = createSlice({
  name: 'vault',
  initialState: {
    driveLink: "17Qghxb1MHobbuJ5uKRUrkSpA9lcY4ZE6", 
    masterKey: "",
    originalText: "",
    
    // --- NEW SETTINGS ---
    customFilename: "chunk-",
    maxLocalRecords: 500,
    maxCloudRecords: 1000,
    maxDisplayRecords: 50,
    isEncryptEnabled: true,
    
    history: [], 
    failedRequests: [], // Fallback Memory (Limit 10)
    
    status: 'idle', 
    bookmarks: {},
  },
  reducers: {
    setDriveLink: (state, action) => { state.driveLink = action.payload; },
    setMasterKey: (state, action) => { state.masterKey = action.payload; },
    updateEditorContent: (state, action) => { state.originalText = action.payload; },
    toggleBookmark: (state, action) => {
      const line = action.payload;
      if (state.bookmarks[line]) delete state.bookmarks[line];
      else state.bookmarks[line] = true;
    },
    toggleEncryption: (state) => {
      state.isEncryptEnabled = !state.isEncryptEnabled;
    },
    // Settings Updaters
    updateSettings: (state, action) => {
      const { filename, maxLocal, maxCloud, maxDisplay } = action.payload;
      state.customFilename = filename;
      state.maxLocalRecords = Number(maxLocal);
      state.maxCloudRecords = Number(maxCloud);
      state.maxDisplayRecords = Number(maxDisplay);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveToDrive.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(saveToDrive.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const newRecord = { ...action.payload, isNew: true, status: 'success' };
        state.history.unshift(newRecord);
        if (state.history.length > state.maxLocalRecords) {
          state.history = state.history.slice(0, state.maxLocalRecords);
        }
      })
      .addCase(saveToDrive.rejected, (state, action) => {
        state.status = 'failed';
        
        // --- FALLBACK MEMORY LOGIC ---
        // 1. Create failed record
        const failedRecord = { 
          ...action.payload, 
          status: 'failed', 
          error: action.payload?.error || "Network Error" 
        };

        // 2. Add to Failed List (Limit 10)
        state.failedRequests.unshift(failedRecord);
        if (state.failedRequests.length > 10) {
          state.failedRequests.pop(); // Remove oldest failure
        }
      });
  },
});

export const { setDriveLink, setMasterKey, updateEditorContent, toggleBookmark, toggleEncryption, updateSettings } = vaultSlice.actions;
export default vaultSlice.reducer;