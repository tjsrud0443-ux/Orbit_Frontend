import { create } from "zustand";
import { getPageInfoList } from "../api/pageInfoApi";

const usePageInfoStore = create((set) => ({
    categories: [],
    pages: [],
    fetchPageInfo: async () => {
        const resp = await getPageInfoList();
        set({ categories: resp.data.categories, pages: resp.data.pages });
    }
}));

export default usePageInfoStore;