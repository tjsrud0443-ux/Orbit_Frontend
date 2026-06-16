// src/api/holidayApi.js

// .env 금고에 저장해 둔 비밀 API 키를 안전하게 꺼내옵니다.
const HOLIDAY_API_KEY = import.meta.env.VITE_HOLIDAY_API_KEY || '';

/**
 * 특정 연도/월의 공휴일을 호출하는 내부 함수
 */
const fetchHolidaysByMonth = async (year, month) => {
  // 공공데이터포털 특성상 Vite 프록시 설정(/holiday-api)을 경유하여 호출합니다.
  const url =
    `/holiday-api/B090041/openapi/service/SpcdeInfoService/getRestDeInfo` +
    `?serviceKey=${HOLIDAY_API_KEY}` +
    `&solYear=${year}` +
    `&solMonth=${String(month).padStart(2, '0')}` +
    `&numOfRows=50` +
    `&_type=json`;

  const res  = await fetch(url);

  // ⭐ 안전장치 추가: 서버 응답이 올바르지 않으면(429, 500 등) json()을 실행하지 않음
  if (!res.ok) {
    console.error(`API 서버 에러 발생 (${res.status}): ${res.statusText}`);
    return []; 
  }

  try {
      const json = await res.json();
      const items = json?.response?.body?.items?.item;
      const list = !items ? [] : Array.isArray(items) ? items : [items];

      return list.map((item, idx) => {
        const d = String(item.locdate);
        const start = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
        return {
          id: `holiday-${year}-${month}-${idx}`,
          title: item.dateName,
          start,
          category: 'holiday',
          color: '#EF4444',
        };
      });
    } catch (parseError) {
      // 혹시라도 JSON 파싱에서 에러가 나면 정상적으로 빈 배열 반환
      console.error("JSON 파싱 에러:", parseError);
      return [];
    }
};
// 모듈 레벨 캐시 (메모리, sessionStorage보다 가벼움)
const holidayCache = {};
/**
 * [외부에서 가져다 쓸 함수] 1월부터 12월까지의 모든 공휴일을 한 번에 병합하여 반환합니다.
 */
export const fetchHolidays = (year) => {
  if (holidayCache[year]) return holidayCache[year];

  // ✅ async 함수 선언 제거, Promise를 즉시 캐시에 저장
  holidayCache[year] = (async () => {
    const allHolidays = [];
    for (let month = 1; month <= 12; month++) {
      const monthData = await fetchHolidaysByMonth(year, month);
      allHolidays.push(...monthData);
    }
    return allHolidays;
  })().catch(err => {
    delete holidayCache[year]; // 실패 시 캐시 제거
    console.error(`공휴일 API 오류 (${year}):`, err);
    return [];
  });

  return holidayCache[year];
};