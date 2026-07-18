import { create } from "zustand";
import { getPageInfoList } from "../api/pageInfoApi";

const usePageInfoStore = create((set) => ({
    categories: [],
    pages: [],
    fetchPageInfo: async () => {
        try {
            const resp = await getPageInfoList();
            set({
                categories: resp.data.categories || [],
                pages: resp.data.pages || []
            });
        } catch (err) {
            console.error('pageInfo 로드 실패:', err);
        }
    }
}));

export default usePageInfoStore;