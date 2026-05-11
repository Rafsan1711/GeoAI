import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAdminStore } from '../stores/adminStore';

export function useAdmin() {
  const { user, isLoading, signIn, signOut, setUser, setIdToken, setIsLoading, getToken } = useAdminStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
        } catch (error) {
          console.error("Failed to get token on auth state change", error);
        }
      } else {
        setIdToken(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setIdToken, setIsLoading]);

  // Refresh token every 50 minutes (Firebase tokens expire at 1hr)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        await getToken();
      } catch (error) {
        console.error("Failed to refresh token", error);
      }
    }, 50 * 60 * 1000); // 50 minutes in ms

    return () => clearInterval(interval);
  }, [user, getToken]);

  return { user, isLoading, signIn, signOut, getToken };
}
