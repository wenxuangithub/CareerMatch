import { useState } from 'react';
import * as Crypto from 'expo-crypto';

const SECRET_KEY = 'your-secret-key'; // Replace with a secure key

export const useQRCodeEncryption = () => {
  const [error, setError] = useState<string | null>(null);

  const xorEncrypt = (text: string, key: string): string => {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result); // Base64 encode the result
  };

  const xorDecrypt = (encoded: string, key: string): string => {
    const text = atob(encoded); // Base64 decode
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  };

  const encryptData = async (data: string): Promise<string> => {
    try {
      const hashedKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        SECRET_KEY
      );
      return xorEncrypt(data, hashedKey);
    } catch (err) {
      setError('Encryption failed');
      return '';
    }
  };

  const decryptData = async (encryptedData: string): Promise<string> => {
    try {
      const hashedKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        SECRET_KEY
      );
      return xorDecrypt(encryptedData, hashedKey);
    } catch (err) {
      setError('Decryption failed');
      return '';
    }
  };

  return { encryptData, decryptData, error };
};