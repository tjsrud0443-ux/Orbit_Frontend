import { maxios } from "../../api/axiosConfig";

export const getAllRequest = (page, status, searchTerm) => maxios.get("/admin/hr/allRequest", {params: {cPage: page, status: status, searchTerm: searchTerm}});
export const getUserInfo = (seq) => maxios.get(`/admin/hr/${seq}`);
export const getDeptList = () => maxios.get("/admin/hr/getDeptList");
export const getRankList = () => maxios.get("/admin/hr/getRankList");
export const approveUserSignup = (approvalData) => maxios.post("/admin/hr/userSignup", approvalData);
export const rejectUserSignup = (seq) => maxios.put(`/admin/hr/rejectSignup?signup_seq=${seq}`);
export const getHrInfo = (id) => maxios.get("/admin/hr/getHrInfo", {params: {id: id}});