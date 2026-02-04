import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaUndo, FaRedo, FaLock, FaUnlock } from 'react-icons/fa';
import { updateEditorContent, toggleBookmark, toggleEncryption } from '../../store/vaultSlice';
import { useUndoRedo } from '../../hooks/useUndoRedo';

const CodeEditor = () => {
  const dispatch = useDispatch();
  const { originalText, bookmarks, isEncryptEnabled } = useSelector((state) => state.vault);
  
  // Connect Undo/Redo Hook
  const { setContent, undo, redo, canUndo, canRedo } = useUndoRedo(originalText);

  // Sync Redux -> Hook (When loading from history)
  useEffect(() => {
    setContent(originalText);
  }, [originalText, setContent]);

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val); // Update local history
    dispatch(updateEditorContent(val)); // Update Redux
  };

  const handleUndo = () => {
    const val = undo();
    if (val !== null) dispatch(updateEditorContent(val));
  };

  const handleRedo = () => {
    const val = redo();
    if (val !== null) dispatch(updateEditorContent(val));
  };

  const lines = originalText.split('\n');

  return (
    <div className="flex flex-col h-full font-mono text-sm relative">
      
      {/* --- TOOLBAR (Undo/Redo/Encrypt) --- */}
      <div className="absolute top-2 right-4 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10">
        
        {/* Undo/Redo */}
        <button onClick={handleUndo} disabled={!canUndo} className={`p-1.5 rounded hover:bg-white/10 transition-colors ${!canUndo && 'opacity-30'}`}>
          <FaUndo size={12} />
        </button>
        <button onClick={handleRedo} disabled={!canRedo} className={`p-1.5 rounded hover:bg-white/10 transition-colors ${!canRedo && 'opacity-30'}`}>
          <FaRedo size={12} />
        </button>
        
        <div className="w-px h-4 bg-white/20 mx-1" />

        {/* Encryption Checkbox */}
        <button 
          onClick={() => dispatch(toggleEncryption())}
          className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-bold transition-all
            ${isEncryptEnabled ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-red-600/20 text-red-400 border border-red-500/30'}
          `}
        >
          {isEncryptEnabled ? <FaLock size={10}/> : <FaUnlock size={10}/>}
          {isEncryptEnabled ? "ENCRYPT ON" : "PLAIN TEXT"}
        </button>
      </div>

      {/* --- EDITOR AREA --- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Gutter */}
        <div className="w-12 bg-black/30 border-r border-white/10 text-right py-4 select-none overflow-hidden">
          {lines.map((_, i) => (
            <div 
              key={i} 
              onClick={() => dispatch(toggleBookmark(i))}
              className="h-6 px-2 text-white/40 hover:text-white cursor-pointer relative group"
            >
              {i + 1}
              {bookmarks[i] && (
                <div className="absolute left-1 top-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_red]" />
              )}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={originalText}
          onChange={handleChange}
          className="flex-1 bg-transparent text-white p-4 outline-none resize-none h-full leading-6 custom-scrollbar pt-4"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export default CodeEditor;