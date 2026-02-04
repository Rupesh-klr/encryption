import { useState, useCallback } from 'react';

export const useUndoRedo = (initialState = "") => {
  const [history, setHistory] = useState([initialState]);
  const [pointer, setPointer] = useState(0);

  const setContent = useCallback((newContent) => {
    // If content is same as current, do nothing
    if (newContent === history[pointer]) return;

    const nextHistory = [...history.slice(0, pointer + 1), newContent];
    setHistory(nextHistory);
    setPointer(nextHistory.length - 1);
  }, [history, pointer]);

  const undo = useCallback(() => {
    if (pointer > 0) {
      setPointer(prev => prev - 1);
      return history[pointer - 1];
    }
    return null;
  }, [history, pointer]);

  const redo = useCallback(() => {
    if (pointer < history.length - 1) {
      setPointer(prev => prev + 1);
      return history[pointer + 1];
    }
    return null;
  }, [history, pointer]);

  return { 
    content: history[pointer], 
    setContent, 
    undo, 
    redo,
    canUndo: pointer > 0,
    canRedo: pointer < history.length - 1
  };
};