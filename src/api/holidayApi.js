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
      color: '#F59E0B', // 캘린더에 노란색 점으로 표시
    };
  });
};

/**
 * [외부에서 가져다 쓸 함수] 1월부터 12월까지의 모든 공휴일을 한 번에 병합하여 반환합니다.
 */
export const fetchHolidays = async (year) => {
  try {
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) => fetchHolidaysByMonth(year, i + 1))
    );
    return results.flat(); // 12달 데이터를 하나의 배열로 깔끔하게 펴줍니다.
  } catch (err) {
    console.error(`공휴일 API 오류 (${year}):`, err);
    return [];
  }
};