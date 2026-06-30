import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHolidays } from '../../api/holidayApi';
import { getSchedules } from '../schedules/schedulesApi';
import useLoadingStore from '../../store/useLoadingStore';
import { alertConfirm } from '../../utils/alert';
import useCalendarStore from '../../store/useCalendarStore';

const COMPANY_CATEGORIES = ['COMPANY', 'TEAM', 'ANNIVERSARY', 'PERSONAL'];

const COMPANY_COLORS = {
  COMPANY: '#F59E0B',
  TEAM: '#0EA5E9',
  ANNIVERSARY: '#EC4899',
  holiday: '#EF4444',
  PERSONAL: '#3530B8',
};

// 특정 날짜의 일정 필터링 헬퍼 함수
const filterEventsByDate = (events, dateStr) => {
  return (events || []).filter(e => {
    const eStartDay = e.start?.split(' ')[0];
    const eEndDay = e.originalEnd ?? eStartDay;
    if (eEndDay !== eStartDay) {
      return dateStr >= eStartDay && dateStr <= eEndDay;
    }
    return eStartDay === dateStr;
  });
};

const usePublicCalendar = () => {
  const calendarStore = useCalendarStore();
  const navigate = useNavigate();
  const calendarEventsRef = useRef([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSchedules, setSelectedSchedules] = useState(() => {
  const todayStr = new Date().toISOString().split('T')[0];
  return filterEventsByDate(useCalendarStore.getState().events, todayStr);
});
  const [isCalendarLoading, setIsCalendarLoading] = useState(
    () => useCalendarStore.getState().events.length === 0
  );   
  useEffect(() => {
  let cancelled = false; // ✅ 여기 추가
  const year = new Date().getFullYear();

  const load = async () => {
    setIsCalendarLoading(true);
        // 캐시 있으면 API 호출 스킵
    if (calendarStore.events.length > 0) {
      calendarEventsRef.current = calendarStore.events;
      setCalendarEvents(calendarStore.events);
      const todayStr = new Date().toISOString().split('T')[0];
      setSelectedSchedules(filterEventsByDate(calendarStore.events, todayStr));
      setIsCalendarLoading(false);
      return;
    }
    // 없으면 기존대로 API 호출
    const [schedResp, holidaysThisYear, holidaysNextYear] = await Promise.all([
      getSchedules(),
      fetchHolidays(year),
      fetchHolidays(year + 1),
    ]);
    if (cancelled) return;

    const companyEvents = schedResp.data
       .filter(item => {
          if (item.schedule_type === 'PERSONAL') {
            return item.show_in_company === 1; // ✅ 공유된 개인 일정만
          }
          return COMPANY_CATEGORIES.includes(item.schedule_type);
        })
      .map(item => {
        const startDate = item.start_dt?.split(/[T ]/)[0];
        const endDate = item.end_dt?.split(/[T ]/)[0];
        const isSameDay = startDate === endDate;

        let displayEnd = undefined;
        if (endDate && !isSameDay) {
          const d = new Date(endDate);
          d.setDate(d.getDate() + 1);
          displayEnd = d.toISOString().split('T')[0];
        }

        return {
          id: item.schedule_seq.toString(),
          title: item.title,
          start: startDate,
          end: displayEnd,
          originalEnd: endDate,
          allDay: true,
          display: 'list-item',
          category: item.schedule_type,
          color: COMPANY_COLORS[item.schedule_type] ?? '#F59E0B',
        };
      });

    const holidayEvents = [...holidaysThisYear, ...holidaysNextYear].map(h => ({
      ...h,
      allDay: true,
      display: 'list-item',
      category: 'holiday',
      color: COMPANY_COLORS.holiday,
    }));

    const allEvents = [...companyEvents, ...holidayEvents];
    calendarEventsRef.current = allEvents;
    setCalendarEvents(allEvents);
    calendarStore.setEvents(allEvents);
    const todayStr = new Date().toISOString().split('T')[0];
    setSelectedSchedules(filterEventsByDate(allEvents, todayStr));
    setIsCalendarLoading(false);
  };

  load().catch(err => {
    console.error('공용 캘린더 로드 실패:', err);
    if (!cancelled) setIsCalendarLoading(false);
  })

  return () => { cancelled = true; };
}, []);

  const handleDateClick = async (info) => {
    const clickedDate = new Date(info.dateStr);
    const today = new Date();

    if (
      clickedDate.getFullYear() !== today.getFullYear() ||
      clickedDate.getMonth() !== today.getMonth()
    ) {
      const result = await alertConfirm('페이지 이동', '이번 달 외의 일정은 캘린더 페이지에서 확인 가능합니다.');
      if (!result.isConfirmed) return;
      if (result.isConfirmed) navigate('/calendar');
    }

    const filtered = filterEventsByDate(calendarEventsRef.current, info.dateStr);

    setSelectedDate(info.dateStr);
    setSelectedSchedules(filtered);
  };

  return {
    calendarEvents,
    selectedDate,
    setSelectedDate,
    selectedSchedules,
    handleDateClick,
    isCalendarLoading,
  };
};

export default usePublicCalendar;