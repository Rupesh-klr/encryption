import CryptoJS from 'crypto-js';

const PREFIX = "ENCP::";

export const encryptData = (text, key) => {
  if (!text) return "";
  if (!key) return text; // No key? Return plain text (or throw error)
  
  const encrypted = CryptoJS.AES.encrypt(text, key).toString();
  return PREFIX + encrypted;
};

export const decryptData = (cipherText, key) => {
  if (!cipherText) return "";
  
  // 1. Check if it is actually encrypted
  if (!cipherText.startsWith(PREFIX)) {
    return cipherText; // Return as-is (It was stored as Plain Text)
  }

  // 2. Remove Prefix
  const rawCipher = cipherText.slice(PREFIX.length);

  try {
    // 3. Attempt Decrypt
    const bytes = CryptoJS.AES.decrypt(rawCipher, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);

    // 4. Validate (CryptoJS returns empty string if key is wrong)
    if (!originalText) throw new Error("Wrong Key");
    
    return originalText;

  } catch (error) {
    throw new Error("Decryption Failed");
  }
};