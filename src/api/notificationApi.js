import { maxios } from "./axiosConfig";

export const getMyNotiList = () => maxios.get("/noti/getMyNotiList");