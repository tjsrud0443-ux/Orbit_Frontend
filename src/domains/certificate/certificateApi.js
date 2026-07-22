import { maxios } from "../../api/axiosConfig";

export const getCertType = () => maxios.get("/certType/getCertType");
export const insertCertRequest = (data) => maxios.post("/certType/insertCertRequest", data);
export const cancelCertRequest = (certRequestSeq) => maxios.delete(`/certType/cancelCertRequest/${certRequestSeq}`);
export const createCertIssue = (certRequestSeq) => maxios.post(`/certType/createCertIssue/${certRequestSeq}`);
export const printCertificate = (certRequestSeq, issue_seq) => maxios.put(`/certType/printCertificate/${certRequestSeq}/${issue_seq}`);