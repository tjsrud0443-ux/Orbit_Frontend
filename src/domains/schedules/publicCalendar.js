import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHolidays } from '../../api/holidayApi';

const generateCompanyEvents = (years) => {
  const events = [];
  years.forEach(year => {
    events.push({ id: `c-town-${year}-02`, title: '타운홀 미팅 (12:00~14:00)', start: `${year}-02-15`, category: 'team', color: '#0EA5E9' });
    events.push({ id: `c-town-${year}-07`, title: '타운홀 미팅 (12:00~14:00)', start: `${year}-07-15`, category: 'team', color: '#0EA5E9' });
    events.push({ id: `c-work-${year}-04`, title: '전사 워크숍 (1박 2일)', start: `${year}-04-16`, end: `${year}-04-18`, category: 'company', color: '#F59E0B' });
    events.push({ id: `c-work-${year}-09`, title: '전사 워크숍 (1박 2일)', start: `${year}-09-17`, end: `${year}-09-19`, category: 'company', color: '#F59E0B' });
    events.push({ id: `c-survey-${year}-05`, title: '임직원 만족도 조사', start: `${year}-05-10`, category: 'company', color: '#F59E0B' });
    events.push({ id: `c-health-${year}-05`, title: '건강 챌린지 시작', start: `${year}-05-01`, category: 'company', color: '#F59E0B' });
    events.push({ id: `c-survey-${year}-11`, title: '임직원 만족도 조사', start: `${year}-11-10`, category: 'company', color: '#F59E0B' });
    events.push({ id: `c-health-${year}-11`, title: '건강 챌린지 시작', start: `${year}-11-01`, category: 'company', color: '#F59E0B' });
    events.push({ id: `c-found-${year}`, title: '창립기념일 (휴무)', start: `${year}-07-06`, category: 'holiday', color: '#EC4899' });
    events.push({ id: `c-award-${year}`, title: '연간 시상식', start: `${year}-12-24`, category: 'company', color: '#EC4899' });
  });
  return events;
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
const COMPANY_EVENTS = generateCompanyEvents(years);

const usePublicCalendar = () => {
  const navigate = useNavigate();
  const [calendarEvents, setCalendarEvents] = useState(COMPANY_EVENTS);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const loadedYears = useRef(new Set());

  const loadHolidaysForYear = useCallback(async (year) => {
    if (loadedYears.current.has(year)) return;
    loadedYears.current.add(year);
    try {
      const holidays = await fetchHolidays(year);
      if (holidays?.length > 0) {
        setCalendarEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          return [...prev, ...holidays.filter(h => !existingIds.has(h.id))];
        });
      }
    } catch (err) {
      console.error(`${year}년 공휴일 로드 실패:`, err);
    }
  }, []);

  useEffect(() => {
    const year = new Date().getFullYear();
    loadHolidaysForYear(year);
    loadHolidaysForYear(year + 1);
  }, [loadHolidaysForYear]);

  const handleDateClick = (info) => {
    const clickedDate = new Date(info.dateStr);
    const today = new Date();
    if (
      clickedDate.getFullYear() !== today.getFullYear() ||
      clickedDate.getMonth() !== today.getMonth()
    ) {
      const ok = window.confirm('이번 달 이외의 일정은 캘린더 페이지에서 확인할 수 있습니다.\n캘린더 페이지로 이동하시겠습니까?');
      if (ok) navigate('/calendar');
      return;
    }
    const filtered = calendarEvents.filter(e => e.date === info.dateStr || e.start === info.dateStr);
    setSelectedDate(info.dateStr);
    setSelectedSchedules(filtered);
  };

  return {
    calendarEvents,
    selectedDate,
    selectedSchedules,
    handleDateClick,
    loadHolidaysForYear,
  };
};

export default usePublicCalendar;