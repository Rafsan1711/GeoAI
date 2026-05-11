import { create } from 'zustand';
import { User, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AdminState {
  user: User | null;
  idToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIdToken: (token: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  user: null,
  idToken: null,
  isLoading: true,
  
  setUser: (user) => set({ user }),
  setIdToken: (idToken) => set({ idToken }),
  setIsLoading: (isLoading) => set({ isLoading }),
  
  signIn: async () => {
    try {
      set({ isLoading: true });
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  signOut: async () => {
    try {
      set({ isLoading: true });
      await firebaseSignOut(auth);
      set({ user: null, idToken: null });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  getToken: async () => {
    const user = get().user;
    if (!user) return null;
    try {
      const token = await user.getIdToken(true); // force refresh
      set({ idToken: token });
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }
}));
