import { maxios } from "../../api/axiosConfig";

/*마이페이지 회원 관련 */
export const getProfileInfo = () => maxios.get("/users/myPage");
export const updateUserInfo = (userData) => maxios.put("/users/myPage/edit", userData);

/*이번 달 요약 */
export const getCntMonth = () => maxios.get("/Attendance/monthCount");
/*이번 주 근태 요약 */
export const getCntWeek = () => maxios.get("/Attendance/weekCount");
/*연차 현황 도넛 차트 */
export const getAnuualSummary = () => maxios.get("/mypage/annualSummary");

// 내 관리자 문의 내역
export const getMyQuestions = () => maxios.get("/mypage/myQuestions");
export const deleteMyQuestions = (question_seq) => maxios.delete("/mypage/deleteMyQuestions/" + question_seq);

// 내 비품 신청 내역
export const getMySupplyRequest = () => maxios.get('/mypage/getMySupplyRequest');
export const deleteMySupplyRequest = (req_seq) => maxios.delete(`/mypage/deleteMySupplyRequest/${req_seq}`);

// 내 회의실 신청 내역
export const getAllMyMeetRsvn = () => maxios.get("/mypage/getAllMyMeetRsvn");
export const getMeetRsvnDetail = (rsvn_seq) => maxios.get(`/mypage/getMeetRsvnDetail/${rsvn_seq}`);
export const getAllRooms = () => maxios.get("/mypage/getAllRooms");
export const getOccupiedTimes = (room_seq, date, rsvn_seq) => maxios.get("/mypage/getOccupiedTimes", {params : { room_seq, date, rsvn_seq }});
export const updateMeetRsvn = (data) => maxios.put("/mypage/updateMeetRsvn", data);
export const cancelMeetRsvn = (rsvn_seq) => maxios.delete(`/mypage/cancelMeetRsvn/${rsvn_seq}`);