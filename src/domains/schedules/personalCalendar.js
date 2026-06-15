import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApprovedVacations, getSchedules } from './schedulesApi';
import { fetchHolidays } from '../../api/holidayApi';
import useLoadingStore from '../../store/useLoadingStore';
import { alertConfirm } from '../../utils/alert';

const CATEGORY_COLORS = {
  PERSONAL: '#3530B8',
  ANNUAL:   '#67adef',
  PROJECT:  '#8c8eef',
  MEETING:  '#ff9fd2',
  holiday:  '#EF4444',
};

const useCalendar = (setDayModal) => {
  const navigate = useNavigate();
  const calendarEventsRef = useRef([]);  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  useEffect(() => {
    const year = new Date().getFullYear();
    showLoading();
    Promise.all([getSchedules(), getApprovedVacations(), fetchHolidays(year)])
      .then(([scheduleResp,vacResp, holidays]) => {
        const scheduleEvents = scheduleResp.data.map(item => {
          // 'T'를 공백으로 치환하여 통일 (DB 데이터가 ISO나 YYYY-MM-DD HH:mm:ss 혼용일 경우 대비)
          const fullStart = item.start_dt?.replace('T', ' ');
          const fullEnd = item.end_dt?.replace('T', ' ');
          
          const startDate = fullStart?.split(' ')[0];
          const endDate = fullEnd?.split(' ')[0];
          
          const isMultiDay = endDate && endDate !== startDate;
          
          // FullCalendar display를 위해 종료일 하루 추가 (allDay: true일 때 마지막 날이 안 나오는 것 방지)
          const adjustedEnd = isMultiDay 
            ? new Date(new Date(endDate).getTime() + 86400000).toISOString().split('T')[0]
            : undefined;

          return {
            id: item.schedule_seq.toString(),
            title: item.title,
            start: fullStart,
            end: adjustedEnd,
            originalEnd: fullEnd,
            allDay: true,
            display: isMultiDay ? 'block' : 'list-item',
            schedule_type: item.schedule_type,
            color: CATEGORY_COLORS[item.schedule_type] ?? '#3530B8',
          };
        });

        const vacEvents = vacResp.data.map(item => ({
          id: `vac_${item.schedule_seq}`,
          title: item.title,
          start: item.start_dt?.replace('T', ' '),
          originalEnd: item.end_dt?.replace('T', ' '),
          allDay: true,
          display: 'list-item',
          schedule_type: 'ANNUAL',
          color: CATEGORY_COLORS['ANNUAL'],
        }));

        const holidayEvents = holidays.map(h => ({
          ...h,
          start: h.start,
          allDay: true, 
          display: 'list-item', 
          color: '#EF4444',
        }));
        
        const allEvents = [...scheduleEvents, ...vacEvents, ...holidayEvents];
        calendarEventsRef.current = allEvents;
        setCalendarEvents(allEvents);
      }).catch(err => console.error('로드 실패:', err))
        .finally(() => hideLoading());;
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

    const filtered = calendarEventsRef.current.filter(e => {
      const eStartDay = e.start?.split(' ')[0];
      const eEndDay = e.originalEnd?.split(' ')[0];
      
      if (eEndDay && eEndDay !== eStartDay) {
        // 다일 이벤트: 시작일과 종료일 사이 포함 여부 확인
        return info.dateStr >= eStartDay && info.dateStr <= eEndDay;
      }
      return eStartDay === info.dateStr;
    });

    setSelectedDate(info.dateStr);
    setSelectedSchedules(filtered);
    if (setDayModal) {
      setDayModal({ open: true, date: info.dateStr, schedules: filtered });
    }
  };

  const handleEventClick = (info) => {
    // FullCalendar event object에서 날짜만 추출
    const clickedDate = info.event.startStr.split('T')[0];

    const filtered = calendarEventsRef.current.filter(e => {
      const eStartDay = e.start?.split(' ')[0];
      const eEndDay = e.originalEnd?.split(' ')[0];
      
      if (eEndDay && eEndDay !== eStartDay) {
        return clickedDate >= eStartDay && clickedDate <= eEndDay;
      }
      return eStartDay === clickedDate;
    });

    setSelectedDate(clickedDate);
    setSelectedSchedules(filtered);
    if (setDayModal) {
      setDayModal({ open: true, date: clickedDate, schedules: filtered });
    }
  };

  return {
    selectedDate,
    selectedSchedules,
    calendarEvents,
    handleDateClick,
    handleEventClick,
  };
};

export default useCalendar;
