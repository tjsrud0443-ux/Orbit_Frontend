import { maxios } from "../../api/axiosConfig";

export const getCertInfo = () => maxios.get("/certType/getCertInfo");