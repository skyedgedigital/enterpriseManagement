import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/config/firebase";

export const storageService = {
  upload: async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  },

  delete: async (url: string): Promise<void> => {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      // If file doesn't exist, ignore the error
      console.warn("Failed to delete file from storage:", error);
    }
  },

  getUrl: async (path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  },
};
