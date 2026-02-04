import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { FaSync, FaSave, FaFolder, FaCog } from 'react-icons/fa';
import { Toaster, toast } from 'react-hot-toast'; // Import Toaster
import { AnimatePresence } from 'framer-motion';

import GlassCard from './components/ui/GlassCard';
import SecureInput from './components/ui/SecureInput';
import CodeEditor from './components/Editor/CodeEditor';
import HistorySidebar from './components/Editor/HistorySidebar';
import SettingsModal from './components/ui/SettingsModal'; // Import Modal
import { setDriveLink, setMasterKey, saveToDrive } from './store/vaultSlice';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import { encryptData } from './utils/encryption';

function App() {
  const dispatch = useDispatch();
  const { driveLink, masterKey, status, originalText, customFilename,isEncryptEnabled } = useSelector(state => state.vault);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useInactivityTimer(30000);

  const handleCommit = () => {
    if (!originalText) return toast.error("Editor is empty!");
    let payloadToSend = originalText;
    if (isEncryptEnabled) {
      if (!masterKey) return toast.error("Encryption enabled but Master Key is missing!");
      
      // Encrypts and adds "ENCP::" prefix
      payloadToSend = encryptData(originalText, masterKey);
    }

    // const simulatedEncrypted = btoa(originalText).substring(0, 20); 
    // dispatch(saveToDrive(simulatedEncrypted));
    // const fullPayload = originalText; 
    dispatch(saveToDrive(payloadToSend));
  };

  const handleRefresh = () => {
    toast("Refreshing is coming soon...", {
      icon: '⏳',
      style: { borderRadius: '10px', background: '#333', color: '#fff' },
    });
  };

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-[#0f0c29] bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white p-4 flex flex-col gap-4 overflow-hidden">
        <Helmet><title>Vault | {customFilename}</title></Helmet>
        <Toaster position="bottom-right" />

        {/* --- SETTINGS MODAL --- */}
        <AnimatePresence>
          {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
        </AnimatePresence>

        {/* --- TOP BAR --- */}
        <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between z-10">
          <div className="flex-1 w-full flex gap-4">
            {/* Drive ID */}
            <div className="flex-[2]">
              <label className="text-[10px] text-purple-300 ml-1 mb-1 flex items-center gap-1">
                <FaFolder /> Drive Folder ID
              </label>
              <input 
                value={driveLink}
                onChange={(e) => dispatch(setDriveLink(e.target.value))}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono"
              />
            </div>

            {/* Master Key */}
            <div className="flex-[1]">
              <label className="text-[10px] text-purple-300 ml-1 mb-1">Master Key</label>
              <SecureInput 
                value={masterKey} 
                onChange={(val) => dispatch(setMasterKey(val))} 
                placeholder="************"
              />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 items-center">
             
             {/* 1. BLINKING SETTINGS BUTTON */}
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-purple-300 hover:bg-purple-600 hover:text-white transition-all relative group"
             >
                <FaCog className="group-hover:rotate-180 transition-transform duration-500" />
                {/* Blinking Dot */}
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-purple-400 rounded-full" />
             </button>

             {/* 2. COMMIT */}
             <button 
                onClick={handleCommit}
                disabled={status === 'loading'}
                className={`bg-green-600/80 hover:bg-green-500 px-6 py-2 h-10 rounded-lg flex items-center gap-2 font-bold backdrop-blur-sm transition-all text-sm
                  ${status === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               {status === 'loading' ? <FaSync className="animate-spin"/> : <FaSave />} 
               Commit
             </button>

             {/* 3. REFRESH */}
             <button 
                onClick={handleRefresh}
                className="bg-blue-600/80 hover:bg-blue-500 px-4 py-2 h-10 rounded-lg flex items-center gap-2 font-bold backdrop-blur-sm transition-all text-sm"
             >
               <FaSync /> Refresh
             </button>
          </div>
        </GlassCard>

        {/* --- MAIN WORKSPACE --- */}
        {/* 👇 REPLACE THIS LINE 👇 */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden h-auto md:h-[80vh]">
          
          {/* 65% EDITOR AREA */}
          {/* <GlassCard className="flex-[0.65] flex flex-col relative group h-[60vh] md:h-full"> */}
          <GlassCard className="flex-[0.65] flex flex-col relative group h-[20vh] md:h-full">
             <div className="absolute top-0 right-0 p-2 bg-black/40 rounded-bl-xl text-[10px] text-gray-400 z-10">EDITOR</div>
             <CodeEditor />
          </GlassCard>

          {/* 35% HISTORY SIDEBAR */}
          {/* Note: Remove overflow-hidden from parent GlassCard here to let the Sidebar handle its own scrolling */}
          <GlassCard className="flex-[0.35] flex flex-col h-[70vh] md:h-full">
             <HistorySidebar />
          </GlassCard>
          
        </div>
      </div>
    </HelmetProvider>
  )
}

export default App;