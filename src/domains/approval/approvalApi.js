import { maxios } from "../../api/axiosConfig";

export const getAllEmployees = () => maxios.get("/approval/all");
export const submitVacation = (payload) => maxios.post("/approval/submit/vacation", payload);
export const submitPurchase = (formData) => maxios.post("/approval/submit/purchase", formData, {
    headers: {
        "Content-Type": "multipart/form-data"
    }
});
export const submitPayment = (payload) => maxios.post("/approval/submit/payment", payload);
export const submitGeneral = (payload) => maxios.post("/approval/submit/general", payload);
export const getApprovalDetail = (type, docSeq) => maxios.get(`/approval/detail/${type}/${docSeq}`);
export const updateApproval = (docSeq, payload) => maxios.put(`/approval/update/${docSeq}`, payload);
export const approveDraft = (docSeq, id) => maxios.put(`/approval/approve/${docSeq}`, {params : {users_id: id}});




































































export const getAllCcDocuments = () => maxios.get("/approval/cc");
export const getPageDocuments = (status, cpage, keyword, docType ) => maxios.get("/approval/cc/page", { params: { status, cpage, keyword, docType } });
export const getTempDoc = () => maxios.get("/approval/temp");
export const deleteTempDoc = (doc_seq, doc_type) => maxios.delete(`/approval/tempDelete/${doc_seq}`, { params: { doc_type: doc_type } });
export const getMyDoc = () => maxios.get("/approval/myDoc");
export const getPageMyDoc = (status, cpage, keyword, docType) => maxios.get("/approval/myDoc/page", { params: { status, cpage, keyword, docType } });
export const getMyDraftDoc = () => maxios.get("/approval/MydraftDoc");
export const getPageMyDoneDoc = (cpage, keyword, docType) => maxios.get("/approval/MyDoneDoc/page", { params: { cpage, keyword, docType } });