import { create } from 'zustand';

const useAuthStore = create(set => ({
    token: sessionStorage.getItem("token") || null,
    login: (response) => {
        sessionStorage.setItem("token", response.token);
        set({ token: response.token });
    },
    logout: () => {
        sessionStorage.removeItem("token");
        set({ token: null });
    }
}));
export default useAuthStore;