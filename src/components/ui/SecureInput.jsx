import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const SecureInput = ({ value, onChange, placeholder }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-Hide Logic: If visible, hide after 5 seconds of no focus
  useEffect(() => {
    let timer;
    if (isVisible && !isFocused) {
      timer = setTimeout(() => setIsVisible(false), 5000);
    }
    return () => clearTimeout(timer);
  }, [isVisible, isFocused]);

  return (
    <div className="relative w-full group">
      <input
        type={isVisible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 transition-all placeholder-white/30"
      />
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="absolute right-3 top-3 text-white/50 hover:text-white transition-colors"
      >
        {isVisible ? <FaEyeSlash /> : <FaEye />}
      </button>
      
      {/* Cool "Typing" underline effect */}
      <div className={`absolute bottom-0 left-0 h-[2px] bg-purple-500 transition-all duration-300 ${isFocused ? "w-full" : "w-0"}`} />
    </div>
  );
};

export default SecureInput;