import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaUndo, FaRedo, FaLock, FaUnlock, FaCopy, FaPaste, 
  FaAlignLeft, FaArrowsAlt, FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight, FaObjectGroup 
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { updateEditorContent, toggleBookmark, toggleEncryption } from '../../store/vaultSlice';
import { useUndoRedo } from '../../hooks/useUndoRedo';

const CodeEditor = () => {
  const dispatch = useDispatch();
  const { originalText, bookmarks, isEncryptEnabled } = useSelector((state) => state.vault);
  const { setContent, undo, redo, canUndo, canRedo } = useUndoRedo(originalText);
  
  const textareaRef = useRef(null);
  const [isWrapEnabled, setIsWrapEnabled] = useState(false);
  const [showMouseControls, setShowMouseControls] = useState(false);

  // Sync Redux -> Local State
  useEffect(() => { setContent(originalText); }, [originalText, setContent]);

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    dispatch(updateEditorContent(val));
  };

  const handleUndo = () => { const val = undo(); if (val !== null) dispatch(updateEditorContent(val)); };
  const handleRedo = () => { const val = redo(); if (val !== null) dispatch(updateEditorContent(val)); };
  
  const copyAll = () => { navigator.clipboard.writeText(originalText); toast.success("Copied All!"); };
  const selectAll = () => { if (textareaRef.current) textareaRef.current.select(); };
  
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && textareaRef.current) {
          const start = textareaRef.current.selectionStart;
          const end = textareaRef.current.selectionEnd;
          const newVal = originalText.substring(0, start) + text + originalText.substring(end);
          setContent(newVal);
          dispatch(updateEditorContent(newVal));
          toast.success("Pasted!");
      }
    } catch (err) { toast.error("Clipboard permission denied"); }
  };

  const copyLine = (lineContent, index) => {
    navigator.clipboard.writeText(lineContent);
    toast.success(`Copied Line ${index + 1}`);
  };

  const scrollEditor = (direction) => {
    // Scroll the main container
    const container = document.getElementById('editor-scroll-container');
    if (!container) return;
    const amount = 50;
    switch(direction) {
        case 'up': container.scrollTop -= amount; break;
        case 'down': container.scrollTop += amount; break;
        case 'left': container.scrollLeft -= amount; break;
        case 'right': container.scrollLeft += amount; break;
    }
  };

  const lines = originalText.split('\n');

  // ⚡ CRITICAL: Shared Font Settings for Perfect Alignment
  const fontSettings = "font-mono text-sm leading-6"; 

  // ⚡ CRITICAL: Padding Logic
  // Gutter Width (w-12) = 3rem = 48px
  // Text Left Padding (pl-4) = 1rem = 16px
  // Total Offset needed for Textarea = 64px
  const textareaPadding = "pl-[64px] pr-4 pt-4 pb-4";

  return (
    <div className={`
      flex flex-col min-h-[500px] h-full relative bg-[#0d0d15] rounded-xl overflow-hidden border border-white/10 shadow-2xl
      w-full min-[350px]:w-[90%] min-[350px]:mx-auto md:w-full md:mx-0
    `}>
      
      {/* --- TOOLBAR --- */}
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-2 border-b border-white/10 z-30 overflow-x-auto custom-scrollbar shrink-0 h-12 relative">
        <div className="flex bg-white/5 rounded-lg p-1 shrink-0">
            <button onClick={handleUndo} disabled={!canUndo} className={`p-1.5 rounded hover:bg-white/10 ${!canUndo && 'opacity-30'}`}><FaUndo size={12} /></button>
            <button onClick={handleRedo} disabled={!canRedo} className={`p-1.5 rounded hover:bg-white/10 ${!canRedo && 'opacity-30'}`}><FaRedo size={12} /></button>
        </div>
        <div className="w-px h-4 bg-white/10 shrink-0" />
        <button onClick={selectAll} title="Select All" className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white shrink-0"><FaObjectGroup size={12} /></button>
        <button onClick={copyAll} title="Copy All" className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white shrink-0"><FaCopy size={12} /></button>
        <button onClick={pasteFromClipboard} title="Paste" className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white shrink-0"><FaPaste size={12} /></button>
        <div className="w-px h-4 bg-white/10 shrink-0" />
        <button onClick={() => setIsWrapEnabled(!isWrapEnabled)} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border shrink-0 whitespace-nowrap ${isWrapEnabled ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-transparent text-gray-400 border-white/10'}`}>
            <FaAlignLeft size={10}/> {isWrapEnabled ? "Wrap ON" : "Wrap OFF"}
        </button>
        <button onClick={() => dispatch(toggleEncryption())} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border ml-auto shrink-0 whitespace-nowrap ${isEncryptEnabled ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-red-600/20 text-red-400 border-red-500/30'}`}>
          {isEncryptEnabled ? <FaLock size={10}/> : <FaUnlock size={10}/>} <span className="hidden sm:inline">{isEncryptEnabled ? "ENCRYPT" : "PLAIN"}</span>
        </button>
        <button onClick={() => setShowMouseControls(!showMouseControls)} className={`p-1.5 rounded hover:bg-white/10 shrink-0 ${showMouseControls ? 'text-blue-400' : 'text-white/50'}`}><FaArrowsAlt size={12} /></button>
      </div>

      {/* --- MOUSE CONTROLS --- */}
      {showMouseControls && (
          <div className="absolute top-12 right-2 z-40 bg-[#1a1a2e] border border-white/20 p-2 rounded-lg shadow-xl grid grid-cols-3 gap-1 w-24">
              <div /><button onClick={() => scrollEditor('up')} className="bg-white/10 p-1 rounded hover:bg-white/20"><FaArrowUp size={10}/></button><div />
              <button onClick={() => scrollEditor('left')} className="bg-white/10 p-1 rounded hover:bg-white/20"><FaArrowLeft size={10}/></button><div className="flex items-center justify-center text-[8px] text-gray-500">PAN</div><button onClick={() => scrollEditor('right')} className="bg-white/10 p-1 rounded hover:bg-white/20"><FaArrowRight size={10}/></button>
              <div /><button onClick={() => scrollEditor('down')} className="bg-white/10 p-1 rounded hover:bg-white/20"><FaArrowDown size={10}/></button><div />
          </div>
      )}

      {/* --- UNIFIED EDITOR AREA --- */}
      <div id="editor-scroll-container" className="flex-1 relative overflow-auto custom-scrollbar group">
        
        {/* LAYER 1: VISUAL BOARD (Numbers + Text) */}
        <div className={`min-h-full w-full ${fontSettings} pt-4 pb-4`}>
          {lines.map((lineContent, i) => (
            <div key={i} className="flex relative hover:bg-white/5">
              
              {/* === GUTTER (Z-INDEX 20) === 
                  Placed ABOVE the textarea so buttons are clickable.
              */}
              <div className="w-12 text-right pr-3 text-white/30 select-none shrink-0 relative z-20 pointer-events-auto">
                <span 
                    onClick={() => dispatch(toggleBookmark(i))} 
                    className="cursor-pointer hover:text-white transition-colors text-[10px] block"
                >
                    {i + 1}
                </span>
                {bookmarks[i] && <div className="absolute right-1 top-2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_red]" />}
                
                {/* Copy Icon (Now Clickable!) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); copyLine(lineContent, i); }} 
                    className="absolute left-1 top-0 opacity-0 group-hover:opacity-100 text-white/50 hover:text-green-400 transition-all p-0.5 cursor-pointer"
                    title="Copy Line"
                >
                    <FaCopy size={8} />
                </button>
              </div>

              {/* === VISUAL TEXT (Z-INDEX 0) === 
                  Sits BEHIND the textarea. Purely for looking good.
              */}
              <div className={`flex-1 px-4 text-white/90 break-all z-0 ${isWrapEnabled ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}>
                {lineContent || <br/>}
              </div>
            </div>
          ))}
          <div className="h-32"></div> 
        </div>

        {/* LAYER 2: INPUT (Z-INDEX 10) 
            Transparent textarea that handles typing.
            It sits BETWEEN the Gutter and the Visual Text visually.
            It is padded LEFT so it doesn't cover the buttons.
        */}
        <textarea
          ref={textareaRef}
          value={originalText}
          onChange={handleChange}
          className={`
            absolute inset-0 w-full h-full bg-transparent text-transparent caret-white 
            outline-none resize-none overflow-hidden z-10
            ${fontSettings} ${textareaPadding}
            ${isWrapEnabled ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}
          `}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
        />

      </div>
    </div>
  );
};

export default CodeEditor;