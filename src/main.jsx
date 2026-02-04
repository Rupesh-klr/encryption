import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'react-hot-toast'; // Need toaster outside for Auth errors
import { HelmetProvider } from 'react-helmet-async';

import App from './App.jsx';
import BiometricGate from './components/Auth/BiometricGate'; // 👈 Import Gate
import { store, persistor } from './store/store.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <HelmetProvider>
          {/* Toaster is placed here so it can show messages 
            even if the Gate is locked 
          */}
          <Toaster position="bottom-right" />
          
          {/* 🔒 THE SECURITY GATE */}
          <BiometricGate>
            <App />
          </BiometricGate>

        </HelmetProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);