// src/api/holidayApi.js
import { maxios } from './axiosConfig'; // 다른 파일들과 동일한 axios 인스턴스 사용

/*
 * 특정 연도의 공휴일을 백엔드에서 호출
 */
export const fetchHolidays = (year) => {
  return maxios.get('/holidays', { params: { year } }).then(resp => {
      // 백엔드가 준 { locdate, date_name, is_holiday } 형태를
      // FullCalendar가 원하는 이벤트 형태로 변환
      return resp.data.map((h, idx) => ({
        id: `holiday-${year}-${idx}`,
        title: h.date_name,
        start: h.locdate, // 'YYYY-MM-DD' 형태로 백엔드에서 이미 변환해서 줌
        category: 'holiday',
        color: h.is_holiday === 'Y' ? '#EF4444' : '#94A3B8', // 공휴일(빨강) / 국경일만(회색)
        is_holiday: h.is_holiday,
      }));
    })
    .catch(err => {
      console.error(`공휴일 API 오류 (${year}):`, err);
      return []; // 실패해도 캘린더 전체가 깨지지 않도록 빈 배열 반환
    });
};

// 관리자가 특정 연도 공휴일을 강제로 재동기화
export const resyncHolidays = (year) => {
  return maxios.post(`/holidays/${year}/resync`);
};