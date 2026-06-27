import { create } from "zustand";

const useDepartmentsStore = create((set, get) => ({
    fullTree: {
        root: null,
        nodeMap: {}
    },
    employees: [],
    profileImageMap: {},
    profileObjectUrls: [],
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

    setProfileImages: (imageMap) => {
        const oldUrls = get().profileObjectUrls;
        oldUrls.forEach(url => URL.revokeObjectURL(url));

        set({
            profileImageMap: imageMap,
            profileObjectUrls: Object.values(imageMap)
        });
    },

    clearProfileImages: () => {
        const urls = get().profileObjectUrls;
        urls.forEach(url => URL.revokeObjectURL(url));

        set({
            profileImageMap: {},
            profileObjectUrls: []
        });
    },

    clearAll: () => {
        const urls = get().profileObjectUrls;
        urls.forEach(url => URL.revokeObjectURL(url));

        set({
            fullTree: {
                root: null,
                nodeMap: {}
            },
            employees: [],
            profileImageMap: {},
            profileObjectUrls: [],
            loaded: false
        });
    }
}));

export default useDepartmentsStore;