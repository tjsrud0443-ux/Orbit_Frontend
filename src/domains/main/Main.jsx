import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchHolidays } from '../../api/holidayApi';
import { getSchedules } from '../schedules/schedulesApi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const Main = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  //calendar
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const CATEGORY_COLORS = {
    personal: '#3530B8',
    leave:    '#10B981',
    project:  '#6366F1',
    meeting:  '#ff75bf',
    holiday:  '#EF4444',
  };

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 현재 시간 및 날짜
  const formatTime = (date) => date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const formatDate = (date) => date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  const notices = [
    { type: "공지", title: "5월 정기 보안 점검 안내", date: "2026.05.28", isNotice: true },
    { type: "일반", title: "사내 워크샵 일정 공지", date: "2026.05.27", isNotice: false },
    { type: "공지", title: "신규 프로젝트 킥오프 미팅", date: "2026.05.26", isNotice: true },
  ];

  const quickActions = [
    { title: "전자결재", icon: "📝" },
    { title: "일정 추가", icon: "📅" },
    { title: "회의실", icon: "💬" },
    { title: "비품 신청", icon: "🗑️" },
    { title: "업무 보고", icon: "📊" },
    { title: "연차 신청", icon: "🏖️" },
  ];

  return (
    <div className="w-full h-auto lg:h-full flex flex-col p-4 lg:px-7 box-border lg:overflow-hidden bg-white">
      {/* PC에서만 부모 스크롤 차단 */}
      <style>{`
        @media (min-width: 64rem) {
          main.flex-1 { overflow: hidden !important; }
        }
      `}</style>

      {/* 헤더 영역 */}
      <div className="mb-4 px-3 py-3 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">000님!</h1>
        <p className="text-[0.85rem] text-gray-500 font-medium">{formatDate(new Date())} · 오늘도 좋은 하루 되세요 👋</p>
      </div>

      {/* 메인 레이아웃: 좌측(8)과 우측(4) 영역을 분리하여 PC에서 독립된 기둥으로 정렬 */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-0">
        
        {/* ==================== LEFT COLUMN (8칸) ==================== */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-0 order-1">
          
          {/* 상단: 근태 관리 및 빠른 실행 개별 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-8 gap-6 shrink-0">
            {/* Box 1: 근태 관리 */}
            <div className="md:col-span-3 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm 
            flex flex-col justify-between min-h-[12.25rem] lg:h-[13.25rem]">
              <h3 className="text-s font-extrabold text-indigo-950">근태 관리</h3>
              <p className="text-2xl font-extrabold text-indigo-950 leading-tight">{formatTime(currentTime)}</p>
              <div className="flex gap-2 w-full mt-2">
                <button className="flex-1 py-2 rounded-xl bg-[#3530B8] text-white font-bold text-xs hover:bg-[#2a2496] transition-colors">출근</button>
                <button className="flex-1 py-2 rounded-xl bg-white border border-gray-200 text-gray-400 font-bold text-xs hover:bg-gray-50">퇴근</button>
              </div>
            </div>

            {/* Box 2: 빠른 실행 (3x2) */}
            <div className="md:col-span-5 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex flex-col min-h-[13.25rem] lg:h-[13.25rem]">
              <h3 className="text-s font-extrabold text-indigo-950 mb-2">빠른 실행</h3>
              <div className="grid grid-cols-3 grid-rows-2 gap-2 flex-1">
                {quickActions.map((action, idx) => (
                  <button key={idx} className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all">
                    <span className="text-xl mb-0.5">{action.icon}</span>
                    <span className="text-[0.6875rem] font-bold text-gray-700">{action.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 하단: 달력 및 일정 */}
          <div className="flex-1 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm min-h-[20rem] lg:min-h-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {/* 달력 */}
              <div className="flex flex-col h-full overflow-hidden">
                {/* <h3 className="text-s font-extrabold text-indigo-950 mb-3 ml">달력</h3> */}
                 <style>{`
                    /* 테두리 및 전체 */
                    .main-calendar .fc-theme-standard td,
                    .main-calendar .fc-theme-standard th {
                      border-color: #F1F5F9 !important;
                    }
                    .main-calendar .fc-theme-standard .fc-scrollgrid {
                      border-color: #F1F5F9 !important;
                    }

                    /* 요일 헤더 */
                    .main-calendar .fc-col-header-cell-cushion {
                      font-size: 0.65rem !important;
                      font-weight: 700 !important;
                      color: #94A3B8 !important;
                      padding: 4px 0 !important;
                    }

                    /* 날짜 숫자 */
                    .main-calendar .fc-daygrid-day-number {
                      font-size: 0.7rem !important;
                      color: #475569 !important;
                      padding: 2px 6px !important;
                    }

                    /* 오늘 날짜 배경 */
                    .main-calendar .fc-day-today {
                      background-color: #FFFBEB !important;
                    }
                    .main-calendar .fc-day-today .fc-daygrid-day-number {
                      background-color:  transparent !important;
                      color: #475569 !important;
                      border-radius: 50% !important;
                      width: 1.6rem !important;      /* ← 키움 */
                      height: 1.6rem !important;     /* ← 키움 */
                      display: flex !important;
                      align-items: center !important;
                      justify-content: center !important;
                      line-height: 1 !important;     /* ← 추가 */
                      padding: 0 !important;         /* ← padding 제거 */
                    }

                    /* 툴바 */
                    .main-calendar .fc-toolbar-title {
                      font-size: 0.8rem !important;
                      font-weight: 700 !important;
                      color: #1E293B !important;
                    }
                    .main-calendar .fc-button {
                      background: white !important;
                      border: 1px solid #E2E8F0 !important;
                      color: #64748B !important;
                      font-size: 0.6rem !important;
                      padding: 0.15rem 0.35rem !important;
                      box-shadow: none !important;
                    }
                    .main-calendar .fc-button:hover {
                      background: #EEF2FF !important;
                      color: #3530B8 !important;
                    }
                    .main-calendar .fc-today-button {
                      display: none !important;
                    }
                    // /* 이벤트 점 */
                    // .main-calendar .fc-daygrid-event-dot {
                    //   border-color: #3530B8 !important;
                    // }
                    /* 이벤트 점 hover/cursor 제거 */
                    .main-calendar .fc-daygrid-event {
                      pointer-events: none !important;
                      cursor: default !important;
                    }
                    /* 스크롤 제거 */
                    .main-calendar .fc-scroller {
                      overflow: hidden !important;
                    }
                  `}</style>
                  <div className="flex-1 overflow-hidden main-calendar">
                    <FullCalendar
                      plugins={[dayGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      locale="ko"
                      headerToolbar={{
                        left: '',
                        center: 'title',
                        right: ''
                      }}
                      height="100%"
                      eventDisplay="list-item"   // ← 점으로 표시
                      events={calendarEvents}
                      dateClick={(info) => {
                        const filtered = calendarEvents.filter(e => e.date === info.dateStr);
                        setSelectedDate(info.dateStr);
                        setSelectedSchedules(filtered);
                      }}
                    />
                  </div>
              </div>
              {/* 일정 */}
              <div className="flex flex-col border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-5 h-full overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-s font-extrabold text-indigo-950">오늘의 일정</h3>
                  <button onClick={() => navigate('/calendar')} className="text-[0.625rem] text-gray-400 font-bold hover:text-indigo-950">일정보기</button>
                </div>
                <div className="space-y-2.5 overflow-y-auto h-full pr-1">
                  {(selectedSchedules.length > 0 ? selectedSchedules : []).map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                      <div className="w-1 h-8 bg-[#3530B8] rounded-full shrink-0"></div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[0.9375rem] font-bold text-gray-800 truncate">{s.title}</span>
                        <span className="text-xs text-gray-400 truncate">{s.info}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ==================== RIGHT COLUMN (4칸) ==================== */}
        {/* PC 화면에서 윗 라인에 딱 맞춰 붙도록 독립된 기둥으로 설정 */}
        <div className="lg:col-span-4 flex flex-col gap-5 h-full min-h-0 order-2">
          
          {/* Box 3: 사내게시판 */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col min-h-[15.625rem] lg:flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-s font-extrabold text-indigo-950">사내게시판</h3>
              <button onClick={() => navigate('/board')} className="text-[0.625rem] text-gray-400 font-bold hover:text-indigo-950">전체보기</button>
            </div>
            <div className="space-y-1 overflow-y-auto pr-1 flex-1">
              {notices.map((notice, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-[0.5625rem] font-bold shrink-0 ${notice.isNotice ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                      {notice.type}
                    </span>
                    <span className="font-bold text-sm text-gray-700 truncate">{notice.title}</span>
                  </div>
                  <span className="text-gray-400 text-[0.625rem] shrink-0 ml-2">{notice.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Box 5: AI 챗봇 */}
          <div className="bg-indigo-950 p-5 rounded-3xl shadow-lg flex flex-col justify-between text-white relative overflow-hidden min-h-[15.625rem] lg:flex-1">
            <div className="absolute top-[-1.25rem] right-[-1.25rem] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="shrink-0 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="p-1.5 bg-white/20 rounded-xl text-lg">🤖</span>
                <h3 className="text-s font-bold">Orbit AI</h3>
              </div>
              <p className="text-xl font-bold leading-tight mb-2">무엇을 도와드릴까요?</p>
              <p className="text-xs text-indigo-200">궁금한 업무 정보를 물어보세요.</p>
            </div>
            <div className="mt-auto relative z-10">
              <button className="w-full py-3.5 bg-white text-indigo-950 font-bold text-sm rounded-xl shadow-md active:scale-[0.98] transition-all">
                AI 채팅 시작하기
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Main;