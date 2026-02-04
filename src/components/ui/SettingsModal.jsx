import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FaTimes, FaSave, FaUndo, FaTrash, FaFingerprint, FaNetworkWired, FaServer, FaFileAlt } from 'react-icons/fa';
import { updateSettings, clearLocalHistory } from '../../store/vaultSlice';
import { toast } from 'react-hot-toast';

const DEFAULT_FILENAME_PREFIX = "chunk"; // Constant for default

const SettingsModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.vault);

  const [activeTab, setActiveTab] = useState('general');

  // Local Form State
  const [formData, setFormData] = useState({
    filename: settings.customFilename || DEFAULT_FILENAME_PREFIX,
    maxLocal: settings.maxLocalRecords,
    maxCloud: settings.maxCloudRecords,
    maxDisplay: settings.maxDisplayRecords,
    biometricInterval: settings.biometricPrefs?.interval || 'always',
    useDefaultEndpoint: settings.customNetwork?.useDefault ?? true,
    customEndpoint: settings.customNetwork?.endpoint || '',
    customToken: settings.customNetwork?.token || ''
  });

  // State for the Checkbox
  const [useDefaultName, setUseDefaultName] = useState(
    formData.filename === DEFAULT_FILENAME_PREFIX
  );

  // Toggle Logic
  const handleDefaultToggle = () => {
    if (!useDefaultName) {
        // Checking the box -> Set to default "chunk"
        setFormData(prev => ({ ...prev, filename: DEFAULT_FILENAME_PREFIX }));
        setUseDefaultName(true);
    } else {
        // Unchecking -> Allow editing (keep current value)
        setUseDefaultName(false);
    }
  };

  const handleSave = () => {
    dispatch(updateSettings({
        filename: formData.filename, // This will send "chunk" if checkbox is on
        maxLocal: formData.maxLocal,
        maxCloud: formData.maxCloud,
        maxDisplay: formData.maxDisplay,
        biometricInterval: formData.biometricInterval,
        customNetwork: {
            useDefault: formData.useDefaultEndpoint,
            endpoint: formData.customEndpoint,
            token: formData.customToken
        }
    }));
    toast.success("Configuration Updated!");
    onClose();
  };

  const handleClearHistory = () => {
      if(confirm("Are you sure? This deletes local logs. It does NOT delete your text.")) {
          dispatch(clearLocalHistory());
          toast.success("Local History Cleared");
      }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-[#1a1a2e] border border-white/20 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-purple-400">⚡</span> Vault Config
            </h2>
            <button onClick={onClose}><FaTimes className="text-white/50 hover:text-white"/></button>
        </div>

        {/* Tabs */}
        <div className="flex bg-black/40 text-xs font-bold text-gray-400">
            <button onClick={() => setActiveTab('general')} className={`flex-1 p-3 hover:bg-white/5 ${activeTab === 'general' ? 'text-purple-400 border-b-2 border-purple-500 bg-white/5' : ''}`}>GENERAL</button>
            <button onClick={() => setActiveTab('security')} className={`flex-1 p-3 hover:bg-white/5 ${activeTab === 'security' ? 'text-purple-400 border-b-2 border-purple-500 bg-white/5' : ''}`}>SECURITY</button>
            <button onClick={() => setActiveTab('network')} className={`flex-1 p-3 hover:bg-white/5 ${activeTab === 'network' ? 'text-purple-400 border-b-2 border-purple-500 bg-white/5' : ''}`}>NETWORK</button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* --- TAB: GENERAL --- */}
            {activeTab === 'general' && (
                <div className="space-y-4">
                    
                    {/* Filename Section */}
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-xs text-purple-300 flex items-center gap-2">
                                <FaFileAlt /> Filename Prefix
                             </label>
                             
                             {/* 👇 DEFAULT CHECKBOX */}
                             <div 
                                onClick={handleDefaultToggle}
                                className="flex items-center gap-2 cursor-pointer group"
                             >
                                <div className={`w-3 h-3 border rounded-sm flex items-center justify-center ${useDefaultName ? 'bg-purple-500 border-purple-500' : 'border-gray-500'}`}>
                                    {useDefaultName && <div className="w-1.5 h-1.5 bg-white rounded-full"/>}
                                </div>
                                <span className="text-[10px] text-gray-400 group-hover:text-white">Use Default</span>
                             </div>
                        </div>

                        <input 
                          value={formData.filename}
                          onChange={(e) => setFormData({...formData, filename: e.target.value})}
                          disabled={useDefaultName} // 👈 Disables input if default is checked
                          className={`w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 outline-none transition-opacity
                              ${useDefaultName ? 'opacity-50 cursor-not-allowed text-gray-500' : ''}
                          `}
                          placeholder="e.g. my-notes"
                        />
                        {useDefaultName && <p className="text-[10px] text-gray-500 mt-1">Files will be saved as <b>chunk-1.json</b>, <b>chunk-2.json</b>...</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div><label className="text-[10px] text-gray-400">Max Local</label><input type="number" value={formData.maxLocal} onChange={(e) => setFormData({...formData, maxLocal: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-sm text-white"/></div>
                        <div><label className="text-[10px] text-gray-400">Max Cloud</label><input type="number" value={formData.maxCloud} onChange={(e) => setFormData({...formData, maxCloud: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-sm text-white"/></div>
                        <div><label className="text-[10px] text-gray-400">Display Limit</label><input type="number" value={formData.maxDisplay} onChange={(e) => setFormData({...formData, maxDisplay: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-sm text-white"/></div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10">
                        <label className="text-xs text-red-300 block mb-2">Danger Zone</label>
                        <button onClick={handleClearHistory} className="w-full border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                            <FaTrash /> Clear Local History Records
                        </button>
                    </div>
                </div>
            )}

            {/* --- OTHER TABS (Security/Network) - Keep same as before --- */}
            {activeTab === 'security' && (
                <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg flex items-start gap-3">
                        <FaFingerprint className="text-blue-400 text-xl mt-1"/>
                        <div>
                            <h3 className="text-sm font-bold text-blue-200">Biometric Refresh</h3>
                            <p className="text-[10px] text-gray-400 leading-tight">Control how often the app asks for FaceID/TouchID.</p>
                        </div>
                    </div>
                    <select 
                        value={formData.biometricInterval} 
                        onChange={(e) => setFormData({...formData, biometricInterval: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 outline-none appearance-none"
                    >
                        <option value="always">Every time I open the app</option>
                        <option value="24h">Every 24 hours</option>
                        <option value="48h">Every 2 days</option>
                        <option value="72h">Every 3 days</option>
                        <option value="1w">Every 1 week</option>
                        <option value="2w">Every 2 weeks</option>
                        <option value="1m">Every 1 month</option>
                    </select>
                </div>
            )}
            
            {activeTab === 'network' && (
                <div className="space-y-4">
                     {/* ... (Keep your existing Network Tab code) ... */}
                     <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2">
                            <FaServer className={formData.useDefaultEndpoint ? "text-green-400" : "text-gray-500"} />
                            <span className="text-sm font-bold text-gray-300">Use Default Google Script</span>
                        </div>
                        <div 
                            onClick={() => setFormData({...formData, useDefaultEndpoint: !formData.useDefaultEndpoint})}
                            className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors ${formData.useDefaultEndpoint ? 'bg-green-600' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.useDefaultEndpoint ? 'left-6' : 'left-1'}`} />
                        </div>
                    </div>
                    {!formData.useDefaultEndpoint && (
                         <div className="space-y-3">
                            <label className="text-xs text-purple-300 block mb-1">Target Endpoint</label>
                            <input value={formData.customEndpoint} onChange={(e) => setFormData({...formData, customEndpoint: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white"/>
                            <label className="text-xs text-purple-300 block mb-1">Auth Token</label>
                            <textarea value={formData.customToken} onChange={(e) => setFormData({...formData, customToken: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white h-24"/>
                         </div>
                    )}
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex gap-3">
           <button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-500 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-white">
              <FaSave /> Save Changes
           </button>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default SettingsModal;