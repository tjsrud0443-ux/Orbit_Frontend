import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileSignature, faDoorOpen, faFileCirclePlus, faDiagramProject, faClipboard, faBox } from '@fortawesome/free-solid-svg-icons';

import { IMAGES } from '../../images/images'; 

import usePublicCalendar from '../schedules/publicCalendar';
import { checkIn_api, checkOut_api, getAttendanceStatus } from './mainApi';
import useUserStore from '../../store/userStore';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import DraftModal from './DraftModal';
import ProjectModal from './ProjectModal';

const Main = () => {
  const navigate = useNavigate();
  const user = useUserStore(state => state.user);
  const [currentTime, setCurrentTime] = useState(new Date());

  //빠른실행탭 모달 연결을 위한 상태변수
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const [checkIn, setCheckIn] = useState(null);   // 출근 시간
  const [checkOut, setCheckOut] = useState(null); // 퇴근 시간


  // 자정 리셋 useEffect 추가
  useEffect(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // 오늘 자정
    const msUntilMidnight = midnight - now;

    const resetTimer = setTimeout(() => {
      setCheckIn(null);
      setCheckOut(null);
    }, msUntilMidnight);

    return () => clearTimeout(resetTimer);
  }, []);

  // 근태 정보 초기 로드
  useEffect(() => {
    if (user && user.id) {
      getAttendanceStatus()
        .then(resp => {
          if (resp.data) {
            // 서버에서 받은 시간이 있다면 상태 업데이트
            if (resp.data.check_in) setCheckIn(new Date(resp.data.check_in));
            if (resp.data.check_out) setCheckOut(new Date(resp.data.check_out));
          }
        })
        .catch(err => {
          console.error('근태 정보 로드 실패:', err);
        });
    }
  }, [user]);

  // 출근 핸들러
  const handleCheckIn = () => {
    if (checkIn) return; // 이미 출근한 경우 무시

    checkIn_api()
      .then(() => {
        const now = new Date();
        setCheckIn(now);
        alert('출근 처리가 완료되었습니다.');
      })
      .catch(err => {
        console.error('출근 처리 실패:', err);
        alert('출근 처리에 실패했습니다.');
      });
  };

  // 퇴근 핸들러
  const handleCheckOut = () => {
    if (!checkIn || checkOut) return; // 출근 전이거나 이미 퇴근한 경우 무시

    if (!window.confirm('퇴근 처리하시겠습니까?')) return;

    checkOut_api()
      .then(() => {
        const now = new Date();
        setCheckOut(now);
        alert('퇴근 처리가 완료되었습니다.');
      })
      .catch(err => {
        console.error('퇴근 처리 실패:', err);
        alert('퇴근 처리에 실패했습니다.');
      });
  };

const formatStampTime = (date) =>
  date.toLocaleTimeString('ko-KR', 
    { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
 //calendar
 const { calendarEvents, selectedDate, selectedSchedules, handleDateClick } = usePublicCalendar();
  // 현재 시간 및 날짜
  const formatTime = (date) => date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const formatDate = (date) => date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  const notices = [
    { type: "공지", title: "5월 정기 보안 점검 안내", date: "2026.05.28", isNotice: true },
    { type: "일반", title: "사내 워크샵 일정 공지", date: "2026.05.27", isNotice: false },
    { type: "공지", title: "신규 프로젝트 킥오프 미팅", date: "2026.05.26", isNotice: true },
  ];

const quickActions = [
  { title: "기안 작성", icon: faFileSignature,
    bgColor: "white", borderColor: "#F0F0F0", iconBgColor: "#FFF4E5", color: "#f89e04",
    onClick: () => setIsDraftModalOpen(true)
  },
  { title: "회의실 예약", icon: faDoorOpen,
    bgColor: "white", borderColor: "#F0F0F0", iconBgColor: "#EFF6FF", color: "#2c7af7"
  },
  { title: "새 문서 등록", icon: faFileCirclePlus,
    bgColor: "white", borderColor: "#F0F0F0", iconBgColor: "#ECFDF5", color: "#09af78"
  },
  { title: "프로젝트 생성", icon: faDiagramProject,
    bgColor: "white", borderColor: "#F0F0F0", iconBgColor: "#FFF1F2", color: "#f62f32",
    onClick: () => setIsProjectModalOpen(true)
  },
  { title: "회의록 작성", icon: faClipboard,
    bgColor: "white", borderColor: "#F0F0F0", iconBgColor: "#F5F3FF", color: "#702de3"
  },
  { title: "비품 신청", icon: faBox,
    bgColor: "white", borderColor: "#F0F0F0", iconBgColor: "#FFF0F9", color: "#e2328a"
  },
];
  return (
    <div className="w-full h-auto lg:h-full flex flex-col p-4 lg:px-7 box-border lg:overflow-hidden bg-white">
      {/* 빠른실행 모달로 바로가기 */}
      {isDraftModalOpen && <DraftModal onClose={() => setIsDraftModalOpen(false)} />}
      {isProjectModalOpen && <ProjectModal onClose={() => setIsProjectModalOpen(false)} />}
      {/* PC에서만 부모 스크롤 차단 */}
      <style>{`
        @media (min-width: 64rem) {
          main.flex-1 { overflow: hidden !important; }
        }
      `}</style>

      {/* 헤더 영역 */}
      <div className="mb-4 px-3 py-3 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{user?.name || '사용자'}님!</h1>
        <p className="text-[0.85rem] text-gray-500 font-medium">{formatDate(new Date())} · 오늘도 좋은 하루 되세요</p>
      </div>

      {/* 메인 레이아웃: 좌측(8)과 우측(4) 영역을 분리하여 PC에서 독립된 기둥으로 정렬 */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-0">
        
        {/* ==================== LEFT COLUMN (8칸) ==================== */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-0 order-1">
          
          {/* 상단: 근태 관리 및 빠른 실행 개별 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-8 gap-6 shrink-0">
            {/* Box 1: 근태 관리 */}
            <div className="md:col-span-3 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm 
            flex flex-col min-h-[16.25rem] lg:h-[16.25rem]">
              <h3 className="text-s font-extrabold text-indigo-950 self-start">출퇴근</h3>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-gray-500 mb-1">현재 시간</span>
                  <p className="text-4xl font-extrabold text-indigo-950 leading-tight">{formatTime(currentTime)}</p>
                </div>
                {/* 출퇴근 시간 표시 */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleCheckIn}
                  disabled={!!checkIn}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors
                    ${checkIn
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-500 cursor-not-allowed'
                      : 'bg-[#3530B8] text-white hover:bg-[#2a2496]'
                    }`}
                >
                  출근
                </button>

                <button
                  onClick={handleCheckOut}
                  disabled={!checkIn || !!checkOut}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors
                    ${checkOut
                      ? 'bg-rose-50 border border-rose-200 text-rose-400 cursor-not-allowed'
                      : !checkIn
                        ? 'bg-white border border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  퇴근
                </button>
              </div>

              {/* 시간 표시 */}
              <div className="flex gap-2 w-full mt-4 mb-3">
                <span className="flex-1 text-center text-xs text-emerald-500 font-bold">
                  {checkIn ? formatStampTime(checkIn) : '-'}
                </span>
                <span className="flex-1 text-center text-xs text-rose-400 font-bold">
                  {checkOut ? formatStampTime(checkOut) : '-'}
                </span>
              </div>
          </div>

            {/* Box 2: 빠른 실행 (3x2) */}
            <div className="md:col-span-5 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex flex-col min-h-[16.25rem] lg:h-[16.25rem]">
              <h3 className="text-s font-extrabold text-indigo-950 mb-2">빠른 실행</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                {quickActions.map((action, idx) => (
                  <button key={idx}
                   onClick={action.onClick || undefined}
                   onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F0F4FF'}
  onMouseLeave={e => e.currentTarget.style.backgroundColor = action.bgColor}
                    style={{ backgroundColor: action.bgColor, borderColor: action.borderColor }}
                    className="flex flex-row items-center justify-start gap-2.5 px-3 py-2 border rounded-2xl transition-all">
                    <div style={{ backgroundColor: action.iconBgColor }} className="p-2.5 ml-1 rounded-xl">
                      <FontAwesomeIcon icon={action.icon} style={{ color: action.color }} className="text-2xl" />
                    </div>
                    <span className="text-[0.85rem] font-semibold" style={{ color: action.textColor}}>{action.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 하단: 달력 및 일정 */}
          <div className="flex-1 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm min-h-[13rem] lg:min-h-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {/* 달력 */}
              <div className="flex flex-col h-full overflow-hidden">
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
                      padding: 2px 0 !important;
                    }

                    /* 날짜 숫자 */
                    .main-calendar .fc-daygrid-day-number {
                      font-size: 0.6rem !important;
                      color: #475569 !important;
                      padding: 2px 4px !important;
                    }
                    /* 오늘 날짜 배경 */
                    .main-calendar .fc-day-today {
                      background-color: #FFFBEB !important;
                    }
                    .main-calendar .fc-day-today .fc-daygrid-day-number {
                      background-color:  transparent !important;
                      color: #475569 !important;
                      border-radius: 50% !important;
                      width: 1.3rem !important;      
                      height: 1.3rem !important;    
                      display: flex !important;
                      align-items: center !important;
                      justify-content: center !important;
                      line-height: 1 !important;     
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
                    .main-calendar .fc-scroller::-webkit-scrollbar {
                      width: 3px;
                    }
                    .main-calendar .fc-scroller::-webkit-scrollbar-track {
                      background: transparent;
                    }
                    .main-calendar .fc-scroller::-webkit-scrollbar-thumb {
                      background-color: #E2E8F0;
                      border-radius: 999px;
                    }
                      /* 이벤트 텍스트 숨기고 점만 표시 */
                    .main-calendar .fc-daygrid-event .fc-event-title {
                      display: none !important;
                    }
                    /* 이벤트 점 hover/cursor 제거 */
                    .main-calendar .fc-daygrid-event {
                      pointer-events: none !important;
                      cursor: default !important;
                    }
                      /* +N more 호버 효과 제거 */
                    .main-calendar .fc-daygrid-more-link {
                      pointer-events: none !important;
                      cursor: default !important;
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
                      dayMaxEvents={1}  // true시 셀 높이에 맞춰 자동으로 "+N개" 표시
                      moreLinkClick={() => 'none'} //클릭 막기
                      fixedWeekCount={false}//당 월 만큼 줄 조절
                      events={calendarEvents}
                      //한 칸 클릭
                      dateClick={handleDateClick}
                    />
                  </div>
              </div>
              {/* 일정 */}
              <div className="flex flex-col border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-5 h-full overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-s font-extrabold text-indigo-950">전사 일정 및 공휴일</h3>
                  <button onClick={() => navigate('/calendar')} className="text-[0.625rem] text-gray-400 font-bold hover:text-indigo-950">상세보기</button>
                </div>
                <div className="space-y-2.5 overflow-y-auto h-full pr-1">
                  {selectedSchedules.length > 0 ? (selectedSchedules.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                      <div className="w-1 h-8 bg-[#3530B8] rounded-full shrink-0" style={{ backgroundColor: s.color || '#3530B8' }}></div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[0.9375rem] font-bold text-gray-800 truncate">{s.title}</span>
                        <span className="text-xs text-gray-400 truncate">{s.info}</span>
                      </div>
                    </div>
                  ))
                ):(
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs text-gray-400">오늘의 일정이 없습니다.</p>
                  </div>
                )}
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
                 <div className="bg-[#F0F4FF] p-5 rounded-3xl shadow-lg flex flex-col justify-between text-[#1a1756] relative overflow-hidden min-h-[15.625rem] lg:flex-1">
            <div className="absolute top-[-1.25rem] right-[-1.25rem] w-20 h-20 bg-white/10 rounded-full blur-3xl"></div>
            <div className="shrink-0 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="p-1 bg-white/20 rounded-xl text-lg">🤖</span>
                <h3 className="text-lg font-extrabold">Orbit AI</h3>
              </div>
              <p className="text-xl lg:text-2xl font-semibold leading-tight mb-2">무엇을 도와드릴까요?</p>
              <p className="text-[0.75rem] font-semibold lg:text-s text-[#3530B8]">궁금한 업무 정보를 물어보세요.</p>
            </div>
            <div className="mt-auto relative z-10">         
              <button
                onClick={() => navigate('/aiChat')}
                className="relative z-20 w-1/2 lg:w-full py-3.5 bg-white text-indigo-950 font-bold text-sm rounded-xl shadow-md active:scale-[0.98] transition-all"
              >
                AI 채팅 시작하기
              </button>
              <img 
                src={IMAGES.MAIN_AI1} 
                className="absolute -bottom-4 lg:bottom-14 -right-2 w-28 h-28 lg:w-55 lg:h-55 object-contain opacity-80 lg:opacity-100" 
                alt="" 
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Main;