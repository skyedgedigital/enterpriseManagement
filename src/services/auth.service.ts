import {
  signInWithEmailAndPassword,
  signOut,
  updatePassword as fbUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/config/firebase";
import type { AuthUser } from "@/types";

function mapUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}

export const authService = {
  signIn: async (email: string, password: string): Promise<AuthUser> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(result.user);
  },

  signOut: async (): Promise<void> => {
    await signOut(auth);
  },

  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("No authenticated user found");

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await fbUpdatePassword(user, newPassword);
  },

  onAuthStateChanged: (callback: (user: AuthUser | null) => void) => {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? mapUser(user) : null);
    });
  },
};
