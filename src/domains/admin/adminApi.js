import { makeStyles } from "@mui/material";
import { maxios } from "../../api/axiosConfig";

// 회원가입 관리
export const getAllRequest = (page, status, searchTerm) => maxios.get("/admin/hr/allRequest", {params: {cPage: page, status: status, searchTerm: searchTerm}});
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
































































export const getMyDeptQuestion = (dept_seq, auth_group) => maxios.get("/admin/ai/myDeptQuestion", { params: { dept_seq: dept_seq, auth_group: auth_group } });
export const updateAnswer = (payload) => maxios.post("/admin/ai/updateAnswer", payload) ;



