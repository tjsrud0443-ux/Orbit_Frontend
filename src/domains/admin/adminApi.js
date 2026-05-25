import { maxios } from "../../api/axiosConfig";

export const getAllRequest = (page, status, searchTerm) => maxios.get("/admin/allRequest", {params: {cPage: page, status: status, searchTerm: searchTerm}});
export const getUserInfo = (seq) => maxios.get(`/admin/${seq}`);
export const getDeptList = () => maxios.get("/admin/getDeptList");
export const getRankList = () => maxios.get("/admin/getRankList");
export const approveUserSignup = (approvalData) => maxios.post("/admin/userSignup", approvalData);
export const rejectUserSignup = (seq) => maxios.put(`/admin/rejectSignup?signup_seq=${seq}`);
export const getHrInfo = (id) => maxios.get("/admin/getHrInfo", {params: {id: id}});