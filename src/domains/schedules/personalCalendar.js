import { useState, useEffect } from 'react';
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    const year = new Date().getFullYear();

    Promise.all([getSchedules(), fetchHolidays(year)])
      .then(([scheduleResp, holidays]) => {
        const scheduleEvents = scheduleResp.data.map(item => ({
          id: item.schedule_seq.toString(),
          title: item.title,
          date: item.start_dt?.split('T')[0],
          color: CATEGORY_COLORS[item.schedule_type] ?? '#3530B8',
        }));

        const holidayEvents = holidays.map(h => ({
          ...h,
          date: h.start,
          color: '#EF4444',
        }));

        setCalendarEvents([...scheduleEvents, ...holidayEvents]);
      })
      .catch(err => console.error('로드 실패:', err));
  }, []);

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
    const filtered = calendarEvents.filter(e => e.date === info.dateStr);
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