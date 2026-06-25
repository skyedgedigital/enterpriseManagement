import { useEffect } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { useAppSelector } from './useAppSelector';
import { setUser, setRoleState } from '@/store/slices/authSlice';
import { authService } from '@/services/auth.service';
import { subscribeUserRole } from '@/services/userRole.service';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, role, roleStatus, loading, initialized } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      dispatch(setUser(user));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      // Only reset if we had a previous user
      if (role !== null) {
        dispatch(setRoleState({ role: null, roleStatus: 'idle' }));
      }
      return;
    }

    // Only set loading if we're not already loading/ready for this user
    if (roleStatus === 'idle' || roleStatus === 'missing') {
      dispatch(setRoleState({ role: null, roleStatus: 'loading' }));
    }

    const unsubscribe = subscribeUserRole(user.uid, (nextRole) => {
      dispatch(
        setRoleState({
          role: nextRole,
          roleStatus: nextRole ? 'ready' : 'missing',
        }),
      );
    });

    return unsubscribe;
  }, [user?.uid]);

  return { user, role, roleStatus, loading, initialized };
}
