import { useState, useEffect } from 'react';
import { FaFingerprint, FaLock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { recordBiometricAuth } from '../../store/vaultSlice';

// ⚙️ CONFIGURATION FLAG
// Set this to FALSE when you want to disable the lock during testing
const ENABLE_SCREEN_LOCK = true; // or import.meta.env.VITE_ENABLE_LOCK === 'true'

const BiometricGate = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  // Read prefs from Redux
  const { biometricPrefs } = useSelector(state => state.vault);
  // Helper: Calculate if Auth is needed
  const isAuthRequired = () => {
    if (!ENABLE_SCREEN_LOCK) return false;
    
    const { interval, lastAuthTime } = biometricPrefs;
    if (interval === 'always') return true;
    if (!lastAuthTime) return true;

    const now = Date.now();
    const elapsed = now - lastAuthTime;
    
    // Time Constants in ms
    const ONE_HOUR = 60 * 60 * 1000;
    const ONE_DAY = 24 * ONE_HOUR;

    let maxDuration = 0;
    switch(interval) {
        case '24h': maxDuration = ONE_DAY; break;
        case '48h': maxDuration = 2 * ONE_DAY; break;
        case '72h': maxDuration = 3 * ONE_DAY; break;
        case '1w':  maxDuration = 7 * ONE_DAY; break;
        case '2w':  maxDuration = 14 * ONE_DAY; break;
        case '1m':  maxDuration = 30 * ONE_DAY; break;
        default: return true; // 'always'
    }

    // If time elapsed is greater than allowed, we lock
    return elapsed > maxDuration;
  };

  // Helper: Convert string to Uint8Array for WebAuthn
  const strToBin = (str) => Uint8Array.from(atob(str), c => c.charCodeAt(0));
  const binToStr = (bin) => btoa(String.fromCharCode(...new Uint8Array(bin)));

    useEffect(() => {
        // 1. Bypass if disabled
        if (!isAuthRequired()) {
            setIsUnlocked(true);
        } else {
            // 2. Try to unlock immediately on load
            triggerBiometricPrompt();
        }
  }, []);

  const triggerBiometricPrompt = async () => {
    setLoading(true);
    try {
      // Check if browser supports WebAuthn
      if (!window.PublicKeyCredential) {
        toast.error("Security not supported on this device.");
        setIsUnlocked(true); // Fallback: Allow access or block entirely
        return;
      }

      const savedCredentialId = localStorage.getItem('vault_auth_cred_id');

      if (!savedCredentialId) {
        // --- CASE A: FIRST TIME (REGISTER) ---
        // We create a "dummy" credential to bind this browser instance
        const publicKey = {
          challenge: new Uint8Array(32), // Dummy challenge
          rp: { name: "Secure Vault App" },
          user: {
            id: new Uint8Array(16),
            name: "user@vault.local",
            displayName: "Vault User"
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: { 
            authenticatorAttachment: "platform", // Forces TouchID/FaceID/Windows Hello
            userVerification: "required"         // Forces Screen Lock/PIN
          },
          timeout: 60000
        };

        const credential = await navigator.credentials.create({ publicKey });
        
        // Save ID for next time
        const newCredId = binToStr(credential.rawId);

        localStorage.setItem('vault_auth_cred_id', newCredId);
        
        toast.success("Device Security Linked!");
        setIsUnlocked(true);
        

      } else {
        // --- CASE B: RETURNING USER (VERIFY) ---
        const publicKey = {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            id: strToBin(savedCredentialId),
            type: "public-key"
          }],
          userVerification: "required" // Forces the prompt
        };

        await navigator.credentials.get({ publicKey });
        
        // If code reaches here, OS verified the user
        setIsUnlocked(true);
      }
      dispatch(recordBiometricAuth()); // Update Redux timestamp
      setIsUnlocked(true);
      toast.success("Identity Verified");

    } catch (error) {
      console.error("Auth Failed:", error);
      toast.error("Authentication Failed or Cancelled");
    } finally {
      setLoading(false);
    }
  };

  // If unlocked, render the App
  if (isUnlocked) {
    return children;
  }

  // Otherwise, render the Lock Screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050510] text-white p-4">
      <div className="bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full backdrop-blur-md">
        
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 animate-pulse">
          <FaLock className="text-red-500 text-3xl" />
        </div>

        <h1 className="text-2xl font-bold mb-2">System Locked</h1>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Strict authentication is required to access the Vault. Please verify your identity.
        </p>

        <button 
          onClick={triggerBiometricPrompt}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95"
        >
          {loading ? (
             <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"/>
          ) : (
             <FaFingerprint className="text-xl" />
          )}
          {loading ? "Verifying..." : "Unlock with System Password"}
        </button>


      </div>
      {/* ... Lock Screen UI ... */}
       <div className="bg-white/5 p-8 rounded-2xl flex flex-col items-center">
          <FaLock className="text-4xl text-red-500 mb-4 animate-pulse"/>
          <h2 className="text-xl font-bold mb-4">Vault Locked</h2>
          <button onClick={triggerBiometricPrompt} className="bg-blue-600 px-6 py-2 rounded-lg font-bold">
            {loading ? "Verifying..." : "Unlock"}
          </button>
       </div>
    </div>
  );
};

export default BiometricGate;
