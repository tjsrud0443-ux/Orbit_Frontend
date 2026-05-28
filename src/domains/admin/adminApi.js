import { makeStyles } from "@mui/material";
import { maxios } from "../../api/axiosConfig";

export const getAllRequest = (page, status, searchTerm) => maxios.get("/admin/hr/allRequest", {params: {cPage: page, status: status, searchTerm: searchTerm}});
export const getUserInfo = (seq) => maxios.get(`/admin/hr/${seq}`);
export const getDeptList = () => maxios.get("/admin/hr/getDeptList");
export const getRankList = () => maxios.get("/admin/hr/getRankList");
export const approveUserSignup = (approvalData) => maxios.post("/admin/hr/userSignup", approvalData);
export const rejectUserSignup = (seq) => maxios.put(`/admin/hr/rejectSignup?signup_seq=${seq}`);
export const getHrInfo = (id) => maxios.get("/admin/hr/getHrInfo", {params: {id: id}});

/*직원 관리 */
export const getAllUsers = (page, keyword, status) => maxios.get("/admin/hr/getAllUsers",{
    params:{page:page, keyword:keyword, status:status}
});
export const updateUsersState = (upUsersSeq, newStatus) => maxios.put("/admin/hr/updateUsersState",{
    users_seq:upUsersSeq,
    status:newStatus
});
export const updateUsersInfo = (usersSeq, editForm) =>maxios.put("/admin/hr/updateUsersInfo",{
    users_seq:usersSeq,
    ...editForm
})

/* 부서 관리 */
export const addDept = (formData) => maxios.post("/admin/hr/addDept", formData);
