import { maxios } from "../../api/axiosConfig";

// 회원가입 관리
export const getAllRequest = (page, status, searchTerm) => maxios.get("/admin/hr/allRequest", { params: { cPage: page, status: status, searchTerm: searchTerm } });
export const getUserInfo = (seq) => maxios.get(`/admin/hr/${seq}`);
export const getDeptList = () => maxios.get("/admin/hr/getDeptList");
export const getRankList = () => maxios.get("/admin/hr/getRankList");
export const approveUserSignup = (approvalData) => maxios.post("/admin/hr/userSignup", approvalData);
export const rejectUserSignup = (seq) => maxios.put(`/admin/hr/rejectSignup?signup_seq=${seq}`);
export const getHrInfo = (id) => maxios.get("/admin/hr/getHrInfo", { params: { id: id } });

/*직원 관리 */
export const getAllUsers = (page, keyword, status) => maxios.get("/admin/hr/getAllUsers", {
    params: { page: page, keyword: keyword, status: status }
});
export const updateUsersState = (upUsersSeq, newStatus) => maxios.put("/admin/hr/updateUsersState", {
    users_seq: upUsersSeq,
    status: newStatus
});
export const updateUsersInfo = (usersSeq, editForm) => maxios.put("/admin/hr/updateUsersInfo", {
    users_seq: usersSeq,
    ...editForm
})
//개인에게 권한 부여
export const getUserRoles = (usersId) => maxios.get(`/usersRole/hr/${usersId}/roles`);
//수정
export const updateUserRoles = (usersId, roles) => maxios.put(`/usersRole/hr/${usersId}/roles`, roles);

//직원 등록
export const registerUser = (data) => maxios.post("/admin/hr/registerUser", data);

/* 부서 관리 */
export const addDept = (formData) => maxios.post("/admin/hr/addDept", formData);
export const delDept = (seq) => maxios.delete("/admin/hr/delDept/" + seq);
export const updateDept = (formData) => maxios.put("/admin/hr/updateDept", formData);

export const getDashboard = () => maxios.get("/admin/dashboard");
export const getDeptEmployeeCount = () => maxios.get("/admin/deptEmployeeCount");
export const getDeptLeave = () => maxios.get("/admin/deptLeave");
export const getJoinResign = () => maxios.get("/admin/joinResign");
export const getAiQuestions = () => maxios.get("/admin/aiQuestions")

// 문서 관리
export const getAllDocs = () => maxios.get("/admin/getAllDocs");
export const createDocument = (formData) => maxios.post('/admin/addDocument', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export const editDocument = (formData) => maxios.put('/admin/editDocument', formData);
export const deleteDocument = (document_seq) => maxios.delete(`/admin/deleteDocument/${document_seq}`);

// 회의실 관리
export const getAllRooms = () => maxios.get("/admin/ga/getAllRooms");
export const addMeetingRoom = (data) => maxios.post("/admin/ga/addMeetingRoom", data);
export const editMeetingRoom = (data) => maxios.put("/admin/ga/editMeetingRoom", data);
export const deleteMeetingRoom = (seq) => maxios.delete(`/admin/ga/deleteMeetingRoom/${seq}`);

/*비품 관리 */
//비품 전체 리스트
export const getAdminSupplies = () => maxios.get("/admin/supply");
export const insertAdminSupplies = (inData) => maxios.post("/admin/supplyInsert", inData);
export const deleteAdminSupplies = (ids) => maxios.delete('/admin/supplyDelete', { data: { ids } });
export const updateAdminSupplies = (upData) => maxios.put('/admin/supplyUpdate', upData);
//비품 신청 관리 신청 리스트
export const getSuppyReqList = (params) => maxios.get("/admin/supplyReq", { params });
export const updateSupplyReqStatus = (upData) => maxios.put("/admin/supplyReqStatus", upData);
//비품 대여 관련
export const getSupplyRentalList = (params) => maxios.get("/admin/supplyRental", { params });
export const updateRentalStatus = (upRental) => maxios.put("/admin/returnSupply", upRental);

export const getMyDeptQuestion = (dept_seq, isSuperAdmin) => maxios.get("/admin/ai/myDeptQuestion", { params: { dept_seq, is_super_admin : isSuperAdmin } });
export const insertUpdateAnswer = (payload) => maxios.put("/admin/ai/insertUpdateAnswer", payload);
export const deleteMyAnswer = (question_seq) => maxios.put("/admin/ai/deleteAnswer/" + question_seq);
export const adminAiQuestionsData = (dept_seq, isSuperAdmin) => maxios.get("/admin/ai/adminAiQuestionsData", { params: { dept_seq, is_super_admin : isSuperAdmin} });

// 근무시간 정정 신청 관리
export const getAllCheckoutRQ = (page, status) => maxios.get("/admin/hr/getAllCheckoutRQ", { params: { cPage: page, status: status } });
export const getAllOvertimeRQ = (page, status) => maxios.get("/admin/hr/getAllOvertimeRQ", { params: { cPage: page, status: status } });
export const approveCheckout = (seq) => maxios.put(`/admin/hr/approveCheckout/${seq}`);
export const rejectCheckout = (seq) => maxios.put(`/admin/hr/rejectCheckout/${seq}`);
export const approveOvertime = (seq) => maxios.put(`/admin/hr/approveOvertime/${seq}`);
export const rejectOvertime = (seq) => maxios.put(`admin/hr/rejectOvertime/${seq}`);

export const getCompanyInfo = () => maxios.get("/admin/company/getCompanyInfo");
export const insertCompanyInfo = (data) => maxios.post("/admin/company/insertCompanyInfo", data);
export const updateCompanyInfo = (data) => maxios.put("/admin/company/updateCompanyInfo", data);
export const updateCompanyStamp = (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return maxios.put('/admin/company/updateCompanyStamp', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const updateCompanyWatermark = (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return maxios.put('/admin/company/updateCompanyWatermark', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const insertRank = (data) => maxios.post("/admin/hr/insertRank", data);
export const updateRank = (data) => maxios.put("/admin/hr/updateRank", data);
export const deleteRank = (rank_seq) => maxios.delete(`/admin/hr/deleteRank/${rank_seq}`);
export const updateRankOrder = (data) => maxios.put("/admin/hr/updateRankOrder", data);

// 페이지 안내 문구 관리
export const updatePageInfo = (pageSeq, editRowData) =>
    maxios.put(`/admin/updatePageInfo/${pageSeq}`, editRowData);

export const updateCategory = (oldCategoryName, editCategoryNewName) =>
    maxios.put("/admin/updateCategory", { oldCategoryName, editCategoryNewName }
    );

// 결재선 관리
export const getApprovalLines = (doc_type) =>
    maxios.get("/admin/defaultApprovalLine/list", { params: { doc_type } });

export const saveApprovalLines = (doc_type, drafter_rank_seq, lines) =>
    maxios.post("/admin/defaultApprovalLine/save", lines, { params: { doc_type, drafter_rank_seq } });

export const deleteApprovalLine = (doc_type, drafter_rank_seq) =>
    maxios.delete("/admin/defaultApprovalLine/delete", { params: { doc_type, drafter_rank_seq } });

export const getAdminCertRequestList = () => maxios.get("/admin/hr/getAdminCertRequestList");
export const approveCertRequest = (certRequestSeq) => maxios.put(`/admin/hr/approveCertRequest/${certRequestSeq}`);
export const rejectCertRequest = (certRequestSeq, rejectReason) => maxios.put(`/admin/hr/rejectCertRequest/${certRequestSeq}`,{reject_reason: rejectReason});

export const getAdminCertTypeList = () => maxios.get("/admin/hr/getAdminCertTypeList");
export const updateCertTypeHidden = (certTypeSeq , hiddenYn) => maxios.put("/admin/hr/updateCertTypeHidden",{cert_type_seq: certTypeSeq, hidden_yn: hiddenYn});
export const updateCertType = (data) => maxios.put("/admin/hr/updateCertType", data);
export const getCertIssueHistoryList = () => maxios.get("/admin/hr/getCertIssueHistoryList");

//연차 관리
export const getAllLeaves = (cPage, keyword) => {
    return maxios.get('/admin/hr/getAllLeaveList', { params: { cPage, keyword }, });
};

export const updateUserLeave = (leaveSeq, delta) => {
    return maxios.put(`/admin/hr/updateUserLeave/${leaveSeq}`, { delta_days: delta });
}; 

