import { maxios } from "../../api/axiosConfig";

export const checkIn_api = () => maxios.post('/Attendance/checkIn');
export const checkOut_api = () => maxios.put('/Attendance/checkOut');
export const getAttendanceStatus = () => maxios.get('/Attendance/status');
export const insertCheckoutReq = (data) => maxios.post('/checkoutRQ/insert', data);