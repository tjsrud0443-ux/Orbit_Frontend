import { maxios } from "../../api/axiosConfig";

export const getAllEmployees = () => maxios.get("/approval/all");
export const getTopReferrers = () => maxios.get("/approval/topReferrers");
export const getAllVacationTypes = () => maxios.get("/approval/vacationTypes");

export const submitVacation = (formData, originalDocSeq = null) => maxios.post(`/approval/submit/vacation${originalDocSeq ? `?originalDocSeq=${originalDocSeq}` : ''}`, formData, {
    headers: {
        "Content-Type": "multipart/form-data"
    }
});
export const submitPurchase = (formData, originalDocSeq = null) => maxios.post(`/approval/submit/purchase${originalDocSeq ? `?originalDocSeq=${originalDocSeq}` : ''}`, formData, {
    headers: {
        "Content-Type": "multipart/form-data"
    }
});
export const submitPayment = (payload, originalDocSeq = null) => maxios.post(`/approval/submit/payment${originalDocSeq ? `?originalDocSeq=${originalDocSeq}` : ''}`, payload);
export const submitGeneral = (formData, originalDocSeq = null) => maxios.post(`/approval/submit/general${originalDocSeq ? `?originalDocSeq=${originalDocSeq}` : ''}`, formData, {
    headers: {
        "Content-Type": "multipart/form-data"
    }
});
export const submitCancelVacation = (payload, originalDocSeq = null) => maxios.post(`/approval/submit/cancelVacation${originalDocSeq ? `?originalDocSeq=${originalDocSeq}` : ''}`, payload);

export const getApprovalDetail = (type, docSeq) => maxios.get(`/approval/detail/${type}/${docSeq}`);

export const approveDraft = (docSeq, doc_type) => maxios.put(`/approval/approve/${docSeq}`, null, { params: { doc_type: doc_type } });
export const rejectApproval = (docSeq, reject_reason) => maxios.put(`/approval/reject/${docSeq}`, { reject_reason: reject_reason });

export const updateVacation = (docSeq, payload) => maxios.put(`/approval/update/vacation/${docSeq}`, payload);
export const updateGeneral = (docSeq, payload) => maxios.put(`/approval/update/general/${docSeq}`, payload);
export const updatePayment = (docSeq, payload) => maxios.put(`/approval/update/payment/${docSeq}`, payload);
export const updatePurchase = (docSeq, payload) => maxios.put(`/approval/update/purchase/${docSeq}`, payload);
export const updateCancelVacation = (docSeq, payload) => maxios.put(`/approval/update/cancelVacation/${docSeq}`, payload);

export const getApprovalHomeData = () => maxios.get("/approval/home");

export const getAllCcDocuments = () => maxios.get("/approval/cc");
export const getPageDocuments = (status, cpage, keyword, docType) => maxios.get("/approval/cc/page", { params: { status, cpage, keyword, docType } });
export const getTempDoc = () => maxios.get("/approval/temp");
export const deleteDoc = (doc_seq, doc_type) => maxios.delete(`/approval/delete/${doc_seq}`, { params: { doc_type: doc_type } });
export const getMyDoc = () => maxios.get("/approval/myDoc");
export const getPageMyDoc = (status, cpage, keyword, docType) => maxios.get("/approval/myDoc/page", { params: { status, cpage, keyword, docType } });
export const getMyDraftDoc = () => maxios.get("/approval/MydraftDoc");
export const getPageMyDoneDoc = (cpage, keyword, docType) => maxios.get("/approval/MyDoneDoc/page", { params: { cpage, keyword, docType } });

export const bulkApproveDocuments = (docSeqList) => maxios.put("/approval/bulkApproveDocuments", docSeqList);

export const getDefaultApprovers = (doc_type) => maxios.get("/approval/defaultApprovalLine", { params: { doc_type: doc_type } });

export const getApprovedVacationList = () => maxios.get("/approval/getApprovedVacationList");