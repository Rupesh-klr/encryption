import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setMasterKey } from '../store/vaultSlice'; // Or whatever action you want to trigger

export const useInactivityTimer = (timeoutMs = 30000) => {
  const dispatch = useDispatch();
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Start new timer
    timerRef.current = setTimeout(() => {
      console.log("🔒 Inactivity detected! Locking vault...");
      // ACTION: Clear the key or lock the screen
      // dispatch(setMasterKey("")); 
      // You can also emit a custom event here if you just want to hide the input
      window.dispatchEvent(new Event('lock-ui'));
    }, timeoutMs);
  };

  useEffect(() => {
    // List of events to listen for (mouse move, key press, click)
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Attach listeners
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [dispatch, timeoutMs]);
};