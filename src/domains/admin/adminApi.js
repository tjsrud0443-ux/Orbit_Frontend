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

export const getMyDeptQuestion = (dept_seq, auth_group) => maxios.get("/admin/ai/myDeptQuestion", { params: { dept_seq: dept_seq, auth_group: auth_group } });
export const insertUpdateAnswer = (payload) => maxios.put("/admin/ai/insertUpdateAnswer", payload);
export const deleteMyAnswer = (question_seq) => maxios.put("/admin/ai/deleteAnswer/" + question_seq);

// 근무시간 정정 신청 관리
export const getAllCheckoutRQ = (page, status) => maxios.get("/admin/hr/getAllCheckoutRQ", { params: { cPage: page, status: status } });
export const getAllOvertimeRQ = (page, status) => maxios.get("/admin/hr/getAllOvertimeRQ", { params: { cPage: page, status: status } });
export const approveCheckout = (seq) => maxios.put(`/admin/hr/approveCheckout/${seq}`);
export const rejectCheckout = (seq) => maxios.put(`/admin/hr/rejectCheckout/${seq}`);
export const approveOvertime = (seq) => maxios.put(`/admin/hr/approveOvertime/${seq}`);
export const rejectOvertime = (seq) => maxios.put(`admin/hr/rejectOvertime/${seq}`);

export const adminAiQuestionsData = (dept_seq, auth_group) => maxios.get("/admin/ai/adminAiQuestionsData", { params: { dept_seq: dept_seq, auth_group: auth_group } });

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

export const updatePageInfo = (pageSeq, editRowData) =>
    maxios.put(`/admin/updatePageInfo/${pageSeq}`, editRowData);

export const updateCategory = (oldCategoryName, editCategoryNewName) =>
    maxios.put("/admin/updateCategory", { oldCategoryName, editCategoryNewName }
    );





















































































































































































































































































































































//연차 관리
export const getAllLeaves = (cPage, keyword) => {
    return maxios.get('/admin/hr/getAllLeaveList', { params: { cPage, keyword }, });
};

export const updateUserLeave = (leaveSeq, delta) => {
    return maxios.put(`/admin/hr/updateUserLeave/${leaveSeq}`, { delta_days: delta });
}; 