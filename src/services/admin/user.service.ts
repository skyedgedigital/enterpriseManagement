import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  type DocumentData,
} from 'firebase/firestore';
import { firebaseConfig } from '@/config/firebase';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import {
  parseUserRole,
  type CreatableUserRole,
  type UserRole,
} from '@/lib/rbac';

const SECONDARY_APP_NAME = 'AdminUserCreation';

function userRecordFromData(id: string, raw: DocumentData): UserRoleRecord | null {
  const role = parseUserRole(raw.role);
  if (!role) return null;
  const email =
    typeof raw.email === 'string' && raw.email.trim().length > 0
      ? raw.email.trim()
      : undefined;
  const name =
    typeof raw.name === 'string' && raw.name.trim().length > 0
      ? raw.name.trim()
      : undefined;
  const phone =
    typeof raw.phone === 'string' && raw.phone.trim().length > 0
      ? raw.phone.trim()
      : undefined;
  return { id, role, email, name, phone };
}

/** Firestore users/{authUid} — role required; profile fields optional. */
export type UserRoleRecord = {
  id: string;
  role: UserRole;
  email?: string;
  name?: string;
  phone?: string;
};

function getSecondaryAuth(): Auth {
  const existing = getApps().find((a) => a.name === SECONDARY_APP_NAME);
  const secondaryApp =
    existing ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  return getAuth(secondaryApp);
}

function mapAuthError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: string }).code)
      : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/weak-password':
      return 'Password is too weak (use at least 6 characters)';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-up is not enabled in Firebase';
    default:
      return error instanceof Error ? error.message : 'Failed to create user';
  }
}

export const adminUserService = {
  getAll: async (): Promise<UserRoleRecord[]> => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    const users: UserRoleRecord[] = [];
    for (const d of snapshot.docs) {
      const rec = userRecordFromData(d.id, d.data());
      if (!rec) continue;
      users.push(rec);
    }
    return users;
  },

  create: async (data: {
    email: string;
    password: string;
    role: CreatableUserRole;
    name?: string;
    phone?: string;
  }): Promise<UserRoleRecord> => {
    const secondaryAuth = getSecondaryAuth();
    let uid: string;
    try {
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        data.email.trim(),
        data.password,
      );
      uid = credential.user.uid;
    } catch (error) {
      throw new Error(mapAuthError(error));
    } finally {
      await signOut(secondaryAuth).catch(() => undefined);
    }

    const trimmedEmail = data.email.trim();
    const trimmedName = data.name?.trim();
    const trimmedPhone = data.phone?.trim();

    const docBody: Record<string, string | CreatableUserRole> = {
      role: data.role,
      email: trimmedEmail,
    };
    if (trimmedName) docBody.name = trimmedName;
    if (trimmedPhone) docBody.phone = trimmedPhone;

    await setDoc(doc(db, COLLECTIONS.USERS, uid), docBody);

    return {
      id: uid,
      role: data.role,
      email: trimmedEmail,
      ...(trimmedName && { name: trimmedName }),
      ...(trimmedPhone && { phone: trimmedPhone }),
    };
  },

  getById: async (uid: string): Promise<UserRoleRecord | null> => {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (!snap.exists()) return null;
    return userRecordFromData(uid, snap.data());
  },

  updateProfile: async (
    uid: string,
    data: {
      email: string;
      role: UserRole;
      name?: string;
      phone?: string;
    },
  ): Promise<UserRoleRecord> => {
    const trimmedEmail = data.email.trim();
    const trimmedName = data.name?.trim();
    const trimmedPhone = data.phone?.trim();

    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      role: data.role,
      email: trimmedEmail,
      name: trimmedName?.length ? trimmedName : deleteField(),
      phone: trimmedPhone?.length ? trimmedPhone : deleteField(),
    });

    const next: UserRoleRecord = {
      id: uid,
      role: data.role,
      email: trimmedEmail,
      ...(trimmedName?.length ? { name: trimmedName } : {}),
      ...(trimmedPhone?.length ? { phone: trimmedPhone } : {}),
    };
    return next;
  },
};
