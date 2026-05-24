import { maxios } from "../../api/axiosConfig";

export const getAllRequest = (page, status) => maxios.get("/admin/allRequest", {params: {cPage: page, status: status}});
export const getUserInfo = (seq) => maxios.get(`/admin/${seq}`);