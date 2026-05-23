import { create } from 'zustand';

const useAuthStore = create(set => ({
    token: sessionStorage.getItem("token") || null,
    loginId: sessionStorage.getItem("loginId") || "",
    login: (response) => {
        sessionStorage.setItem("token", response.token);
        sessionStorage.setItem("loginId", response.id);

        set({ token: response.token, loginId: response.id });
    },
    logout: () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("loginId");
        set({ token: null, loginId: null });
    }

}));
export default useAuthStore;