import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { parseUserRole, type UserRole } from '@/lib/rbac';
import { COLLECTIONS } from '@/lib/constants';

export function subscribeUserRole(
  uid: string,
  onRole: (role: UserRole | null) => void,
): () => void {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  return onSnapshot(
    ref,
    (snap) => {
      onRole(parseUserRole(snap.data()?.role));
    },
    () => {
      onRole(null);
    },
  );
}
