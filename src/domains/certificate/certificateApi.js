import { maxios } from "../../api/axiosConfig";

export const getCertType = () => maxios.get("/certType/getCertType");