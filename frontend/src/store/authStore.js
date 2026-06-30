import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as loginApi, register as registerApi, logout as logoutApi, getMe } from '../api/auth';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        const res = await loginApi(credentials);
        localStorage.setItem('access_token', res.data.tokens.access);
        localStorage.setItem('refresh_token', res.data.tokens.refresh);
        set({ user: res.data.user, isAuthenticated: true, isLoading: false });
        return res.data;
      },

      register: async (data) => {
        set({ isLoading: true });
        const res = await registerApi(data);
        set({ isLoading: false });
        return res.data;
      },

      logout: async () => {
        const refresh = localStorage.getItem('refresh_token');
        try { await logoutApi(refresh); } catch {}
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const res = await getMe();
          set({ user: res.data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },

      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
