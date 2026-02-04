import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// ⚙️ DEFAULT GOOGLE SCRIPT URL (Replace with your actual deployed script URL)
const googleScriptUrl  = "AKfycbxPCW4sh6_U4f3s4NOktYuhWFHwn8Kq-4sLrUGuDVvGcEbY61pG_HV2Irk-B7FtOO7L";
const DEFAULT_SCRIPT_URL = `https://script.google.com/macros/s/${googleScriptUrl}/exec`;


// 👇 NEW REFRESH ACTION
export const refreshFromDrive = createAsyncThunk(
  'vault/refreshFromDrive',
  async (_, { getState, rejectWithValue }) => {
    const state = getState().vault;
    const { customNetwork, driveLink, customFilename } = state;

    // 1. Determine Endpoint
    let targetUrl = DEFAULT_SCRIPT_URL;
    let headers = { "Content-Type": "text/plain" };

    if (!customNetwork.useDefault) {
       if (!customNetwork.endpoint) return rejectWithValue("Missing Endpoint");
       targetUrl = customNetwork.endpoint;
       headers = {
         "Content-Type": "application/json",
         "x-api-token-rupesh-klr-syn": customNetwork.token || ""
       };
    }

    // 2. Prepare Fetch Payload
    const payload = {
      action: "FETCH_RECENT", // 👈 Tells Script to Read, not Save
      folderId: driveLink,
      filename: customFilename || "chunk",
      authToken: "rupesh-secure-token-2026"
    };

    try {
      const body = customNetwork.useDefault ? JSON.stringify(payload) : payload;
      const response = await axios.post(targetUrl, body, { headers });

      // Check for Google Script errors
      if (response.data && response.data.status === 'error') {
        throw new Error(response.data.message);
      }

      // Expecting { status: 'success', files: [...] }
      return response.data.files; // Array of 3 files

    } catch (error) {
      return rejectWithValue(error.message || "Refresh Failed");
    }
  }
);
export const saveToDrive = createAsyncThunk(
  'vault/saveToDrive',
  async (encryptedContent, { getState, rejectWithValue }) => {
    const state = getState().vault;
    const { customNetwork, biometricPrefs } = state;

    // 1. CHOOSE ENDPOINT
    let targetUrl = DEFAULT_SCRIPT_URL;
    let headers = { "Content-Type": "text/plain" }; // Google Script requires text/plain to avoid CORS preflight sometimes

    if (!customNetwork.useDefault) {
       // 🛑 USE CUSTOM ENDPOINT
       if (!customNetwork.endpoint) return rejectWithValue("Custom Endpoint URL is missing");
       targetUrl = customNetwork.endpoint;
       
       // Add Custom Header
       headers = {
         "Content-Type": "application/json",
         "x-api-token-rupesh-klr-syn": customNetwork.token || ""
       };
    }

    const newRecordId = uuidv4();
    
    // 2. PREPARE PAYLOAD
    const payload = {
      id: newRecordId,
      timestamp: Date.now(),
      author: "WebUser",
      action: "UPDATE",
      version: state.history.length + 1,
      payload: encryptedContent,
      changed_versiosnid: state.history.length > 0 ? state.history[0].id : "INIT",
      filename: state.customFilename || "chunk", 
      folderId: state.driveLink,
      authToken: "rupesh-secure-token-2026", // Legacy token for Google Script
      max_cloud_limit: state.maxCloudRecords,
      max_local_records : state.maxLocalRecords
    };

    try {
      // 3. SEND REQUEST
      // Note: Google Apps Script 'doPost' expects stringified body usually
      const body = customNetwork.useDefault ? JSON.stringify(payload) : payload;

      const response = await axios.post(targetUrl, body, { headers });

      // Handle Google Script text/plain response wrapping
      if (customNetwork.useDefault && typeof response.data === 'string' && response.data.includes("error")) {
         throw new Error("Google Script Error: " + response.data);
      }

      return { 
        id: newRecordId, 
        version: payload.version, 
        timestamp: payload.timestamp, 
        payload: encryptedContent 
      };

    } catch (error) {
      return rejectWithValue(error.message || "Network Error");
    }
  }
);

const vaultSlice = createSlice({
  name: 'vault',
  initialState: {
    // ... existing state ...
    driveLink: "",
    masterKey: "",
    status: "idle",
    history: [],
    failedRequests: [],
    originalText: "",
    customFilename: "chunk",
    maxLocalRecords: 50,
    maxCloudRecords: 100,
    maxDisplayRecords: 20,
    isEncryptEnabled: true,
    maxLocalRecords: 10,

    // 👇 NEW: BIOMETRIC SETTINGS
    biometricPrefs: {
      interval: 'always', // 'always', '24h', '48h', '72h', '1w', '2w', '1m'
      lastAuthTime: 0
    },

    // 👇 NEW: NETWORK SETTINGS
    customNetwork: {
      useDefault: true,
      endpoint: "",
      token: ""
    },
    // ... existing state ...
    refreshStatus: 'idle', // For loading spinner
  },
  reducers: {
    setDriveLink: (state, action) => { state.driveLink = action.payload; },
    setMasterKey: (state, action) => { state.masterKey = action.payload; },
    updateEditorContent: (state, action) => { state.originalText = action.payload; },
    toggleBookmark: (state, action) => {
      const line = action.payload;
      state.bookmarks[line] = !state.bookmarks[line];
    },
    toggleEncryption: (state) => { state.isEncryptEnabled = !state.isEncryptEnabled; },
    
    // 👇 UPDATE SETTINGS (Merged)
    updateSettings: (state, action) => {
      const { filename, maxLocal, maxCloud, maxDisplay, biometricInterval, customNetwork } = action.payload;
      if(filename !== undefined) state.customFilename = filename;
      if(maxLocal) state.maxLocalRecords = maxLocal;
      if(maxCloud) state.maxCloudRecords = maxCloud;
      if(maxDisplay) state.maxDisplayRecords = maxDisplay;
      
      // Update Biometric Interval
      if(biometricInterval) state.biometricPrefs.interval = biometricInterval;

      // Update Network
      if(customNetwork) state.customNetwork = customNetwork;
    },

    // 👇 ACTION: Clear History
    clearLocalHistory: (state) => {
      state.history = [];
      state.failedRequests = [];
    },

    // 👇 ACTION: Record Successful Auth
    recordBiometricAuth: (state) => {
      state.biometricPrefs.lastAuthTime = Date.now();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveToDrive.pending, (state) => { state.status = 'loading'; })
      .addCase(saveToDrive.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.history.unshift({ ...action.payload, isNew: true });
        if (state.history.length > state.maxLocalRecords) {
          state.history = state.history.slice(0, state.maxLocalRecords);
        }
      })
      .addCase(saveToDrive.rejected, (state, action) => {
        state.status = 'failed';
        state.failedRequests.unshift({
          timestamp: Date.now(),
          error: action.payload || "Unknown Error"
        });
      })
      // 👇 2. ADD THIS NEW BLOCK FOR REFRESH 👇
      .addCase(refreshFromDrive.pending, (state) => {
        state.refreshStatus = 'loading';
      })
      .addCase(refreshFromDrive.fulfilled, (state, action) => {
        state.refreshStatus = 'succeeded';
        const fetchedFiles = action.payload; // Top 3 files from Drive

        if (fetchedFiles && fetchedFiles.length > 0) {
            // A. Update Editor with the LATEST file content
            const latestFile = fetchedFiles[0];
            if (latestFile.payload) {
                state.originalText = latestFile.payload;
            }

            // B. Merge into History (Avoid Duplicates)
            fetchedFiles.forEach(remoteFile => {
                const exists = state.history.find(h => h.id === remoteFile.id);
                if (!exists) {
                    state.history.unshift({
                        id: remoteFile.id,
                        version: remoteFile.version,
                        timestamp: remoteFile.timestamp,
                        payload: remoteFile.payload,
                        isNew: false, // It's from cloud
                        author: "CloudSync"
                    });
                }
            });

            // Re-sort history by timestamp (Newest first)
            state.history.sort((a, b) => b.timestamp - a.timestamp);
        }
      })
      .addCase(refreshFromDrive.rejected, (state, action) => {
        state.refreshStatus = 'failed';
        state.failedRequests.unshift({
          timestamp: Date.now(),
          error: "Refresh: " + action.payload
        });
      });// 👆 END OF NEW BLOCK 👆
  },
});

export const { 
  setDriveLink, setMasterKey, updateEditorContent, toggleBookmark, 
  toggleEncryption, updateSettings, clearLocalHistory, recordBiometricAuth 
} = vaultSlice.actions;

export default vaultSlice.reducer;
