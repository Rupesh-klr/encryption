import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react'; // Import this
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import { store, persistor } from './store/store.js'; // Import persistor
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* Wrapper that delays rendering until old data is loaded */}
      <PersistGate loading={null} persistor={persistor}> 
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);