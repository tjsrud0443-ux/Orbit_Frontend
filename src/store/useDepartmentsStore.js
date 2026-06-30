import { create } from "zustand";

const useDepartmentsStore = create((set, get) => ({
    fullTree: {
        root: null,
        nodeMap: {}
    },
    employees: [],
    profileImageMap: {},
    profileObjectUrls: {},
    loaded: false,

    setGroupData: ({ root, nodeMap, users }) => {
        set({
            fullTree: {
                root,
                nodeMap
            },
            employees: users,
            loaded: true
        });
    },

    setProfileImage: (sysname, imageUrl) => {
        const oldUrls = get().profileObjectUrls[sysname];
        if (oldUrls && oldUrls !== imageUrl) {
            URL.revokeObjectURL(oldUrls);
        }

        set((state) => ({
            profileImageMap: {
                ...state.profileImageMap,
                [sysname]: imageUrl
            },
            profileObjectUrls: {
                ...state.profileObjectUrls,
                [sysname]: imageUrl
            }
        }));
    },

    clearProfileImages: () => {
        const urls = Object.values(get().profileObjectUrls);
        urls.forEach(url => URL.revokeObjectURL(url));

        set({
            profileImageMap: {},
            profileObjectUrls: {}
        });
    },

    clearAll: () => {
        const urls = Object.values(get().profileObjectUrls);
        urls.forEach(url => URL.revokeObjectURL(url));

        set({
            fullTree: {
                root: null,
                nodeMap: {}
            },
            employees: [],
            profileImageMap: {},
            profileObjectUrls: {},
            loaded: false
        });
    }
}));

export default useDepartmentsStore;