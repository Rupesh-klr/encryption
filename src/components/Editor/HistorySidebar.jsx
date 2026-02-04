import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaHistory, FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { updateEditorContent } from '../../store/vaultSlice'; // 👈 Import Action
import { decryptData } from '../../utils/encryption';

const HistorySidebar = () => {
  const dispatch = useDispatch();
  const { history, failedRequests, maxDisplayRecords, masterKey } = useSelector((state) => state.vault);
  
  // 1. FIX: Re-added missing state
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [activeVersion, setActiveVersion] = useState(null);

  // 2. FEATURE: Handle Click to Restore
  const handleRestore = (record) => {
    try {
      if (!record.payload) throw new Error("Empty Payload");

      // --- DECRYPTION SIMULATION ---
      // In a real app, you would do: 
      // const bytes = AES.decrypt(record.payload, masterKey);
      // const originalText = bytes.toString(enc.Utf8);
      // 🔐 DECRYPT LOGIC
      // The utility handles the "ENCP::" check internally
      
      // For now, since we store plain text (as per your last request), we just check if it exists.
      const originalText = record.payload; 

      if (!originalText) {
        throw new Error("Decryption yielded empty result");
      }
      const plainText = decryptData(originalText.payload, masterKey);
      dispatch(updateEditorContent(plainText));

      // ✅ SUCCESS: Update Main Editor
      // dispatch(updateEditorContent(originalText));
      setActiveVersion(record.version);
      
      // Silent success (or minimal feedback)
      // toast.success(`Restored v${record.version}`); 

    } catch (error) {
      // ❌ FAIL: Show Corrupted Data Toaster
      console.error(error);
      toast.error(`Record v${record.version} is corrupted or key is wrong!`, {
        icon: '☠️',
        style: { background: '#330000', color: '#ffaaaa', border: '1px solid #ff0000' }
      });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-black/20 border-l border-white/10">
      
      {/* Header */}
      <div className="p-3 border-b border-white/10 bg-black/30 backdrop-blur-md flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-purple-300">
            <FaHistory />
            <span className="font-bold text-sm">Log</span>
            </div>
            <span className="text-[10px] text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
            Show: {maxDisplayRecords}
            </span>
        </div>
        
        {/* Active Version Indicator */}
        {activeVersion && (
            <div className="text-[10px] text-green-400 flex items-center gap-1 bg-green-900/20 p-1 rounded px-2">
                <FaCheckCircle /> Viewing Version: v{activeVersion}
            </div>
        )}
      </div>

      {/* List Area - Scrolls after ~7 items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        
        {/* 1. FAILED REQUESTS (Red) */}
        {failedRequests.map((fail, idx) => (
           <div key={`fail-${idx}`} className="p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-200 text-xs">
              <div className="flex justify-between items-center mb-1">
                 <span className="font-bold flex items-center gap-1"><FaExclamationTriangle /> Failed</span>
                 <span className="opacity-60">{new Date(fail.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="opacity-70 truncate">{fail.error}</div>
           </div>
        ))}

        {/* 2. SUCCESS HISTORY */}
        {history.slice(0, maxDisplayRecords).map((record) => (
          <div 
            key={record.id} 
            onClick={() => handleRestore(record)} // 👈 Click to Restore
            className={`
              p-3 rounded-lg border text-xs cursor-pointer transition-all hover:scale-[1.02] group
              ${activeVersion === record.version 
                ? 'bg-purple-500/20 border-purple-500/50 ring-1 ring-purple-500' // Highlight Active
                : record.isNew 
                    ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-100' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }
            `}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-purple-400 font-bold">v{record.version}</span>
              <span className="opacity-60">{new Date(record.timestamp).toLocaleTimeString()}</span>
            </div>
            
            {/* Payload Preview */}
            <div className="font-mono bg-black/30 p-2 rounded flex justify-between items-center group-hover:bg-black/50 transition-colors">
              <span className="truncate max-w-[140px] opacity-70">
                {record.payload ? record.payload.substring(0, 8) : ""}...
              </span>
              
              {/* Info Button - Opens Popup */}
              <button 
                onClick={(e) => { 
                    e.stopPropagation(); // Stop click from restoring
                    setSelectedInfo(record); 
                }}
                className="text-white/30 hover:text-blue-400 transition-colors p-1"
              >
                 <FaInfoCircle size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. INFO POPUP MODAL */}
      <AnimatePresence>
        {selectedInfo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedInfo(null)}
          >
            <motion.div 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="bg-[#1a1a2e] border border-white/20 p-4 rounded-xl shadow-2xl w-full max-w-xs"
                onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <FaInfoCircle className="text-blue-400"/> Record Details
              </h3>
              
              <div className="space-y-2 text-xs text-gray-300 font-mono break-all max-h-[60vh] overflow-y-auto custom-scrollbar">
                <p><span className="text-purple-400">ID:</span> {selectedInfo.id}</p>
                <p><span className="text-purple-400">Time:</span> {new Date(selectedInfo.timestamp).toLocaleString()}</p>
                <p><span className="text-purple-400">Version:</span> {selectedInfo.version}</p>
                
                <div className="bg-black/40 p-2 rounded mt-2 border border-white/10">
                   <span className="text-purple-400 block mb-1 font-bold">Full Payload:</span>
                   {selectedInfo.payload}
                </div>
              </div>

              <button 
                onClick={() => setSelectedInfo(null)}
                className="mt-4 w-full bg-white/10 hover:bg-white/20 py-2 rounded text-xs text-white transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistorySidebar;
