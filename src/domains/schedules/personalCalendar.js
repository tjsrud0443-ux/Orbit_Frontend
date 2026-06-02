import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSchedules } from './schedulesApi';
import { fetchHolidays } from '../../api/holidayApi';

const CATEGORY_COLORS = {
  personal: '#3530B8',
  leave:    '#10B981',
  project:  '#6366F1',
  meeting:  '#ff75bf',
  holiday:  '#EF4444',
};

const useCalendar = () => {
  const navigate = useNavigate();
  const calendarEventsRef = useRef([]);  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    const year = new Date().getFullYear();

    Promise.all([getSchedules(), fetchHolidays(year)])
      .then(([scheduleResp, holidays]) => {
        const scheduleEvents = scheduleResp.data.map(item => {
          const start = item.start_dt?.split('T')[0];
          const end = item.end_dt?.split('T')[0];
          const isMultiDay = end && end !== start;
          // end날짜 하루 추가
const adjustedEnd = isMultiDay 
  ? new Date(new Date(end).getTime() + 86400000).toISOString().split('T')[0]
  : undefined;
        return {
          id: item.schedule_seq.toString(),
          title: item.title,
          start,
          end:adjustedEnd,
          originalEnd: end,  // ← 추가
          allDay: true,
          display: isMultiDay ? 'block' : 'list-item',
          color: CATEGORY_COLORS[item.schedule_type] ?? '#3530B8',
        };
  });

    const holidayEvents = holidays.map(h => ({
      ...h,
      start: h.start,
      allDay: true, 
       display: 'list-item', 
      color: '#EF4444',
    }));
    const allEvents = [...scheduleEvents, ...holidayEvents];
    calendarEventsRef.current = allEvents;  // ← 추가
    setCalendarEvents(allEvents);
    }).catch(err => console.error('로드 실패:', err));
  }, []);

  const handleDateClick = (info) => {
      console.log('calendarEventsRef:', calendarEventsRef.current);  // ← 추가
  console.log('클릭한 날짜:', info.dateStr);
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
    const filtered = calendarEventsRef.current.filter(e =>{
      const endDate = e.originalEnd || e.end;
        if (e.end) {
          return info.dateStr >= e.start && info.dateStr <= e.end;
        }
        return e.start === info.dateStr;
      });
    setSelectedDate(info.dateStr);
    setSelectedSchedules(filtered);
  };

  return {
    selectedDate,
    selectedSchedules,
    calendarEvents,
    handleDateClick,
  };
};

export default useCalendar;