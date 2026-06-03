import { maxios } from "../../api/axiosConfig";

export const insertMinutes = (minuteData) => maxios.post("/minutes",minuteData);
export const getMinutesList = () => maxios.get("/minutes/minutesList");
export const getMinutesDetail = () => maxios.get(`/minutes/detail/${minute_seq}`);