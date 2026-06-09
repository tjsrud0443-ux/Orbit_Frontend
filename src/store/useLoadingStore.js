import { create } from 'zustand';

const useLoadingStore = create(set => ({
    loading: false,
    loadingType: "default",

    showLoading: (type = "default") =>
        set({
            loading: true,
            loadingType: type
        }),
    hideLoading: () =>
        set({
            loading: false,
            loadingType: "default"
        })
}));

export default useLoadingStore;