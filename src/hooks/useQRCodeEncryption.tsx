import { useState } from "react";
import * as Crypto from "expo-crypto";
import CryptoES from "crypto-es";
import { QR_ENCRYPT } from "@env";

const SECRET_KEY = QR_ENCRYPT; // Replace with a secure key in the .env file

export const useQRCodeEncryption = () => {
  const [error, setError] = useState<string | null>(null);

  const generateKey = async (salt: string): Promise<CryptoES.lib.WordArray> => {
    const keyMaterial = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      SECRET_KEY + salt
    );
    return CryptoES.enc.Hex.parse(keyMaterial);
  };

  const encryptData = async (data: string): Promise<string> => {
    try {
      const salt = Crypto.randomUUID();
      const iv = CryptoES.lib.WordArray.random(16);
      const key = await generateKey(salt);

      const encrypted = CryptoES.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoES.mode.CBC,
        padding: CryptoES.pad.Pkcs7
      });

      const result = salt + ':' + iv.toString() + ':' + encrypted.toString();
      return result;
    } catch (err) {
      setError("Encryption failed");
      return "";
    }
  };

  const decryptData = async (encryptedData: string): Promise<string> => {
    try {
      const [salt, ivString, encryptedString] = encryptedData.split(':');
      const key = await generateKey(salt);
      const iv = CryptoES.enc.Hex.parse(ivString);

      const decrypted = CryptoES.AES.decrypt(encryptedString, key, {
        iv: iv,
        mode: CryptoES.mode.CBC,
        padding: CryptoES.pad.Pkcs7
      });

      return decrypted.toString(CryptoES.enc.Utf8);
    } catch (err) {
      setError("Decryption failed");
      return "";
    }
  };

  return { encryptData, decryptData, error };
};