import { maxios } from "../../api/axiosConfig";

export const getCertType = () => maxios.get("/certType/getCertType");
export const insertCertRequest = (data) => maxios.post("/certType/insertCertRequest", data);
export const cancelCertRequest = (certRequestSeq) => maxios.delete(`/certType/cancelCertRequest/${certRequestSeq}`);