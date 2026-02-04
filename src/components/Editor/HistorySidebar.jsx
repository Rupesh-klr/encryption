import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaHistory, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { updateEditorContent } from '../../store/vaultSlice'; 
import { decryptData } from '../../utils/encryption';

const HistorySidebar = () => {
  const dispatch = useDispatch();
  const { history, failedRequests, maxDisplayRecords, masterKey } = useSelector((state) => state.vault);
  
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [activeVersion, setActiveVersion] = useState(null);

  const handleRestore = (record) => {
    try {
      if (!record.payload) throw new Error("Empty Payload");

      // 1. Decrypt (Utility handles "ENCP::" prefix check automatically)
      const plainText = decryptData(record.payload, masterKey);

      // 2. Validate Result
      if (!plainText && plainText !== "") {
        throw new Error("Decryption failed or yielded empty result");
      }

      // 3. Update Redux (Main Editor)
      dispatch(updateEditorContent(plainText));
      setActiveVersion(record.version);

    } catch (error) {
      console.error(error);
      toast.error(`Record v${record.version} cannot be decrypted. Check Master Key!`, {
        icon: '🔐',
        style: { background: '#330000', color: '#ffaaaa', border: '1px solid #ff0000' }
      });
    }
  };

  return (
    // 🎨 RESPONSIVE CONTAINER LOGIC:
    // 1. <350px: w-full (Default)
    // 2. 350px-650px: w-[90%] mx-auto (Centered with gap)
    // 3. >650px (md): w-full (Takes 100% of the sidebar column from App.jsx)
    <div className="min-h-[600px]  flex flex-col overflow-hidden bg-black/20 border-l border-white/10 
      w-full min-[350px]:w-[90%] min-[350px]:mx-auto md:w-full 
      max-h-[600px] md:h-full"
    >
      
      {/* Header */}
      <div className="p-3 border-b border-white/10 bg-black/30 backdrop-blur-md flex flex-col gap-2 shrink-0">
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

      {/* List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        
        {/* FAILED REQUESTS */}
        {failedRequests.map((fail, idx) => (
           <div key={`fail-${idx}`} className="p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-200 text-xs">
              <div className="flex justify-between items-center mb-1">
                 <span className="font-bold flex items-center gap-1"><FaExclamationTriangle /> Failed</span>
                 <span className="opacity-60">{new Date(fail.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="opacity-70 truncate">{fail.error}</div>
           </div>
        ))}

        {/* SUCCESS HISTORY */}
        {history.slice(0, maxDisplayRecords).map((record) => (
          <div 
            key={record.id} 
            onClick={() => handleRestore(record)} 
            className={`
              p-3 rounded-lg border text-xs cursor-pointer transition-all hover:scale-[1.02] group relative
              ${activeVersion === record.version 
                ? 'bg-purple-500/20 border-purple-500/50 ring-1 ring-purple-500'
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
            
            <div className="font-mono bg-black/30 p-2 rounded flex justify-between items-center group-hover:bg-black/50 transition-colors">
              <span className="truncate max-w-[140px] opacity-70">
                {record.payload ? record.payload.substring(0, 8) : ""}...
              </span>
              
              <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
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

      {/* 🚀 FIX: POPUP MODAL 
         Changed 'absolute' -> 'fixed' to escape the narrow sidebar.
         Added 'z-[100]' to ensure it sits on top of everything.
      */}
      <AnimatePresence>
        {selectedInfo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedInfo(null)}
          >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="bg-[#1a1a2e] border border-white/20 rounded-xl shadow-2xl w-[95%] max-w-lg flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaInfoCircle className="text-blue-400"/> Record Details
                </h3>
                <button onClick={() => setSelectedInfo(null)} className="text-white/50 hover:text-white transition-colors">
                    <FaTimes />
                </button>
              </div>
              
              {/* Modal Body (Scrollable) */}
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-400">
                    <div>
                        <span className="text-purple-400 block mb-1">Version</span>
                        <span className="bg-black/30 px-2 py-1 rounded block">{selectedInfo.version}</span>
                    </div>
                    <div>
                        <span className="text-purple-400 block mb-1">Time</span>
                        <span className="bg-black/30 px-2 py-1 rounded block">{new Date(selectedInfo.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="text-purple-400 block mb-1">UUID</span>
                        <span className="bg-black/30 px-2 py-1 rounded block truncate">{selectedInfo.id}</span>
                    </div>
                </div>
                
                <div>
                   <span className="text-purple-400 block mb-2 font-bold text-xs">Full Encrypted Payload</span>
                   <div className="bg-black/40 p-4 rounded-lg border border-white/10 text-xs text-gray-300 font-mono break-all leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                       {selectedInfo.payload}
                   </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-black/20">
                <button 
                    onClick={() => setSelectedInfo(null)}
                    className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm text-white font-bold transition-colors"
                >
                    Close
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistorySidebar;
