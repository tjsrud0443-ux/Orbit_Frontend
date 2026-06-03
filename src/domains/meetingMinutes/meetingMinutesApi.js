import { maxios } from "../../api/axiosConfig";

export const insertMinutes = (minuteData) => maxios.post("/minutes",minuteData);
export const getMinutesList = () => maxios.get("/minutes/minutesList");
export const getMinutesDetail = (minute_seq) => maxios.get(`/minutes/detail/${minute_seq}`);
export const delMinutes = (minute_seq) => maxios.delete(`/minutes/${minute_seq}`);
export const upMinutes = (minuteData) => maxios.put("/minutes/update",minuteData);