import { create } from 'zustand';

const normalizeAuthGroups = (authGroups) => {
    if (Array.isArray(authGroups)) {
        return authGroups;
    }

    if (typeof authGroups === 'string' && authGroups.trim()) {
        return authGroups.split(',').map(group => group.trim()).filter(Boolean);
    }

    return [];
}

const useUserStore = create((set) => ({
    user: null,
    setUser: (userData) =>
        set({
            user: userData ? {
                    ...userData,
                    user_auth_group: normalizeAuthGroups(userData.user_auth_group)
                }
                : null
        }),
    clearUser: () =>
        set({ user: null })
}));

export default useUserStore;