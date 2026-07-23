import { maxios } from "../../api/axiosConfig";

export const checkIn_api = () => maxios.post('/Attendance/checkIn');
export const checkOut_api = () => maxios.put('/Attendance/checkOut');
export const getAttendanceStatus = () => maxios.get('/Attendance/status');
export const getMyCheckoutList = () => maxios.get('/Attendance/myCheckoutList');
export const getMyCheckinList = (yearMonth) => maxios.get('/Attendance/myCheckinList',{ params: { year_month: yearMonth } });
export const insertCheckoutReq = (data) => maxios.post('/checkoutRQ/insert', data);
export const insertOvertimeReq = (data) => maxios.post('/overtimeRQ/insert', data);
export const getNoticeList = () => maxios.get('/main/boardList');
// 빠른실행 설정 조회
export const getQuickActionSettings = () => maxios.get('/userSettings/quickActionOrder');

// 빠른실행 설정 저장
export const updateQuickActionSettings = (quickActionOrder) =>
  maxios.post('/userSettings/quickActionOrder', { quick_action_order: quickActionOrder });