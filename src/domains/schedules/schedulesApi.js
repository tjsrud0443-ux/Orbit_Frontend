import { maxios } from "../../api/axiosConfig";

export const createSchedule = (scheduleData) => maxios.post('/Schedules', scheduleData);
// export const updateSchedule = (scheduleSeq, scheduleData) => maxios.put(`/Schedules/${scheduleSeq}`, scheduleData);
// export const deleteSchedule = (scheduleSeq) => maxios.delete(`/Schedules/${scheduleSeq}`);
export const getSchedules = () => maxios.get('/Schedules');
