import { maxios } from "./axiosConfig";

export const getPageInfoList = () => maxios.get("/pageInfo/getPageInfoList");