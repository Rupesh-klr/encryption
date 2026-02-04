import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FaTimes, FaSave, FaUndo } from 'react-icons/fa';
import { updateSettings } from '../../store/vaultSlice';

const SettingsModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.vault);

  // Local state for form (so we can discard)
  const [formData, setFormData] = useState({
    filename: settings.customFilename,
    maxLocal: settings.maxLocalRecords,
    maxCloud: settings.maxCloudRecords,
    maxDisplay: settings.maxDisplayRecords
  });

  const handleSave = () => {
    dispatch(updateSettings(formData));
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-[#1a1a2e]/90 border border-white/20 p-6 rounded-2xl shadow-2xl w-full max-w-md relative"
      >
        {/* Header */}
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-purple-400">⚡</span> Vault Configuration
        </h2>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-purple-300 block mb-1">Filename Prefix (Chunk)</label>
            <input 
              value={formData.filename}
              onChange={(e) => setFormData({...formData, filename: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
             <div>
                <label className="text-[10px] text-gray-400 block mb-1">Max Local</label>
                <input type="number"
                  value={formData.maxLocal}
                  onChange={(e) => setFormData({...formData, maxLocal: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-sm text-white"
                />
             </div>
             <div>
                <label className="text-[10px] text-gray-400 block mb-1">Max Cloud</label>
                <input type="number"
                  value={formData.maxCloud}
                  onChange={(e) => setFormData({...formData, maxCloud: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-sm text-white"
                />
             </div>
             <div>
                <label className="text-[10px] text-gray-400 block mb-1">Display Limit</label>
                <input type="number"
                  value={formData.maxDisplay}
                  onChange={(e) => setFormData({...formData, maxDisplay: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-sm text-white"
                />
             </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
           <button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
              <FaSave /> Save
           </button>
           <button onClick={onClose} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-gray-300">
              <FaUndo /> Discard
           </button>
        </div>

        {/* Close "X" Button */}
        <button 
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-black/50 border border-white/20 rounded-full flex items-center justify-center text-white/50 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-lg group"
        >
          <FaTimes className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

      </motion.div>
    </motion.div>
  );
};

export default SettingsModal;