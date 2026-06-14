import { maxios } from "./axiosConfig";

export const getMyNotiList = () => maxios.get("/noti/getMyNotiList");
export const getNotiDocType = (ref_seq) => maxios.get("/noti/getNotiDocType/" + ref_seq);
export const getNotiProjectSeq = (ref_seq) => maxios.get("/noti/getNotiProjectSeq/" + ref_seq);
export const updateReadNoti = (noti_seq) => maxios.put("/noti/updateReadNoti/" + noti_seq)