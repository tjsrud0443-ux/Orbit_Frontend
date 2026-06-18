import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileSignature, faDoorOpen, faFileCirclePlus, faDiagramProject, faClipboard, faBox, faBookmark } from '@fortawesome/free-solid-svg-icons';

import { IMAGES } from '../../images/images'; 

import usePublicCalendar from '../schedules/publicCalendar';
import { checkIn_api, checkOut_api, getAttendanceStatus, getNoticeList } from './mainApi';
import { getBoardList } from '../board/boardApi';
import useUserStore from '../../store/userStore';
import Calendar from '../../components/common/Calendar';

import DraftModal from './DraftModal';
import ProjectModal from './ProjectModal';
import CheckoutCorrectionModal from './CheckoutCorrectionModal';
import OvertimeRequestModal from './OvertimeRequestModal';

import { alertSuccess, alertError, alertConfirm } from '../../utils/alert';

const Main = () => {
  const navigate = useNavigate();
  const user = useUserStore(state => state.user);
  const [currentTime, setCurrentTime] = useState(new Date());

  //빠른실행탭 모달 연결을 위한 상태변수
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);

  const [checkIn, setCheckIn] = useState(null);   // 출근 시간
  const [checkOut, setCheckOut] = useState(null); // 퇴근 시간
  const [attendanceSeq, setAttendanceSeq] = useState(null);

  const [boardPosts, setBoardPosts] = useState([]);

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

  // 근태 정보 및 게시판 초기 로드
  useEffect(() => {
    if (user && user.id) {
      getAttendanceStatus()
        .then(resp => {
          if (resp.data) {
            // 서버에서 받은 시간이 있다면 상태 업데이트
            if (resp.data.check_in) setCheckIn(new Date(resp.data.check_in));
            if (resp.data.check_out) setCheckOut(new Date(resp.data.check_out));
            if (resp.data.attendance_seq) setAttendanceSeq(resp.data.attendance_seq); 
          }
        })
        .catch(err => {
          console.error('근태 정보 로드 실패:', err);
        });

      // 게시판 목록 가져오기 (최신 5개)
      getNoticeList().then(resp => {
          setBoardPosts(resp.data|| []);
        })
        .catch(err => {
          console.error('게시판 목록 로드 실패:', err);
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
        alertSuccess('출근 완료', '출근 처리가 완료되었습니다.');
      })
      .catch(err => {
        console.error('출근 처리 실패:', err);
        alertError('처리 실패', '출근 처리에 실패했습니다.');
      });
  };

  // 퇴근 핸들러
  const handleCheckOut = async () => {
    if (!checkIn || checkOut) return; // 출근 전이거나 이미 퇴근한 경우 무시

    const result = await alertConfirm('퇴근 확인', '퇴근 처리하시겠습니까?');
    if (!result.isConfirmed) return;

    try {
      await checkOut_api();
      const now = new Date();
      setCheckOut(now);
      await alertSuccess('퇴근 완료', '오늘 하루도 고생하셨습니다.');
    } catch (err) {
      console.error('퇴근 처리 실패:', err);
      await alertError('처리 실패', '퇴근 처리에 실패했습니다.');
    }
  };

const formatStampTime = (date) =>
  date.toLocaleTimeString('ko-KR', 
    { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
 //calendar
 const { calendarEvents, selectedDate, setSelectedDate, selectedSchedules, handleDateClick, isCalendarLoading } = usePublicCalendar();

  // 매 시간 달이 바뀌었는지 체크하여 캘린더 자동 업데이트
  useEffect(() => {
    const checkMonth = () => {
      const now = new Date();
      if (!selectedDate || new Date(selectedDate).getMonth() !== now.getMonth() || new Date(selectedDate).getFullYear() !== now.getFullYear()) {
         const newDate = new Date(now.getFullYear(), now.getMonth(), 1);
         setSelectedDate(newDate.toISOString().split('T')[0]);
      }
    };
    checkMonth();
    const interval = setInterval(checkMonth, 3600000); 
    return () => clearInterval(interval);
  }, [selectedDate, setSelectedDate]);

  // 현재 시간 및 날짜
  const formatTime = (date) => date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const formatDate = (date) => date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

const quickActions = [
  { title: "기안 작성", icon: faFileSignature,
    bgColor: "white", borderColor: "#F0F0F0", iconBgColor: "#FFF4E5", color: "#f89e04",
    onClick: () => setIsDraftModalOpen(true)
  },
  { title: "회의실 예약", icon: faDoorOpen,
    bgColor: "white", borderColor: "#F0F0F0", iconBgColor: "#EFF6FF", color: "#2c7af7",
    onClick: () => navigate('/meetingRooms')
  },
  { title: "내 북마크 문서", icon: faBookmark,
    bgColor: "white", borderColor: "#F0F0F0", iconBgColor: "#ECFDF5", color: "#09af78",
    onClick: () => navigate('/documents?tab=즐겨찾기')
  },
  { title: "프로젝트 생성", icon: faDiagramProject,
    bgColor: "white", borderColor: "#F0F0F0", iconBgColor: "#FFF1F2", color: "#f62f32",
    onClick: () => setIsProjectModalOpen(true)
  },
  { title: "회의록 작성", icon: faClipboard,
    bgColor: "white", borderColor: "#F0F0F0", iconBgColor: "#F5F3FF", color: "#702de3",
    onClick: () => navigate('/meetingMinutes')
  },
  { title: "비품 신청", icon: faBox,
    bgColor: "white", borderColor: "#F0F0F0", iconBgColor: "#FFF0F9", color: "#e2328a",
    onClick: () => navigate('/supply')
  },
];
  return (
    <div className="w-full h-auto lg:h-full flex flex-col p-4 lg:px-7 box-border lg:overflow-hidden bg-white">
      {/* 빠른실행 모달로 바로가기 */}
      {isDraftModalOpen && <DraftModal onClose={() => setIsDraftModalOpen(false)} />}
      {isProjectModalOpen && <ProjectModal onClose={() => setIsProjectModalOpen(false)} />}
      {isCorrectionModalOpen && (
        <CheckoutCorrectionModal 
          onClose={() => setIsCorrectionModalOpen(false)} 
          checkOutTime={checkOut ? formatStampTime(checkOut) : null}
          attendanceSeq={attendanceSeq}
        />
      )}
      {isOvertimeModalOpen && <OvertimeRequestModal onClose={() => setIsOvertimeModalOpen(false)} />}
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
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-s font-extrabold text-indigo-950 self-start">출퇴근</h3>
                <div className="flex gap-2">
                  <button onClick={() => setIsCorrectionModalOpen(true)} className="text-[0.625rem] text-gray-400 font-bold hover:text-indigo-950">퇴근정정</button>
                  <button onClick={() => setIsOvertimeModalOpen(true)} className="text-[0.625rem] text-gray-400 font-bold hover:text-indigo-950">연장근무</button>
                </div>
              </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3 gap-2 flex-1">
                {quickActions.map((action, idx) => (
                  <button key={idx}
                   onClick={action.onClick || undefined}
                   onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F0F4FF'}
  onMouseLeave={e => e.currentTarget.style.backgroundColor = action.bgColor}
                    style={{ backgroundColor: action.bgColor, borderColor: action.borderColor }}
                    className="flex flex-row items-center justify-start gap-2.5 px-3 py-2 border rounded-2xl transition-all overflow-hidden">
                    <div style={{ backgroundColor: action.iconBgColor }} className="p-2 ml-0.5 rounded-xl shrink-0">
                      <FontAwesomeIcon icon={action.icon} style={{ color: action.color }} className="text-xl sm:text-2xl" />
                    </div>
                    <span className="text-[0.75rem] sm:text-[0.85rem] font-semibold truncate" style={{ color: action.textColor}}>{action.title}</span>
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
                  <div className="flex-1 overflow-hidden main-calendar">
                    <style>{`
                      .main-calendar .mb-4 button {
                        display: none !important;
                      }
                      .main-calendar .grid.grid-cols-7:last-child > div {
                        height: 3rem !important;
                      }
                      .main-calendar .grid.grid-cols-7:last-child > div > div {
                        position: absolute !important;
                        bottom: 4px !important;
                        left: 0 !important;
                        right: 0 !important;
                        margin-top: 0 !important;
                      }
                    `}</style>
                        {isCalendarLoading ? (
      // 스켈레톤
      <div className="animate-pulse p-2">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array(35).fill(0).map((_, i) => (
            <div key={i} className="h-7 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    ) : (
      // 실제 캘린더
      <Calendar 
        isStatic={true}
        value={selectedDate}
        events={calendarEvents}
        onChange={handleDateClick}
      />
    )}
                  </div>
              </div>
              {/* 일정 */}
              <div className="flex flex-col border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-5 h-full overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-s font-extrabold text-indigo-950">전사 일정 및 공휴일</h3>
                  <button onClick={() => navigate('/calendar')} className="text-[0.625rem] text-gray-400 font-bold hover:text-indigo-950">상세보기</button>
                </div>
                <div className="space-y-2.5 overflow-y-auto max-h-[300px] md:max-h-none h-full pr-1 custom-scrollbar">
                  <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
                  `}</style>
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-s font-extrabold text-indigo-950">사내게시판</h3>
              <button onClick={() => navigate('/board')} className="text-[0.625rem] text-gray-400 font-bold hover:text-indigo-950">전체보기</button>
            </div>
            <div className="space-y-1 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
              `}</style>
              {boardPosts.length > 0 ? (
                boardPosts.map((post) => (
                  <div 
                    key={post.post_seq} 
                    onClick={() => navigate(`/boardDetail/${post.post_seq}`)}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[0.5625rem] font-bold shrink-0 
                        ${['공지', '경조', '생일', '승진', '부서 이동'].includes(post.category?.trim()) 
                          ? 'bg-red-50 text-red-500' 
                          : 'bg-blue-50 text-blue-500'}`}
                      >
                        {post.category || '일반'}
                      </span>
                      <span className="font-bold text-sm text-gray-700 truncate group-hover:text-indigo-600 transition-colors">
                        {post.title}
                      </span>
                    </div>
                    <span className="text-gray-400 text-[0.625rem] shrink-0 ml-2">{post.created_at?.slice(0, 10)}</span>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-gray-400">게시글이 없습니다.</p>
                </div>
              )}
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
                className="relative z-20 w-1/2 md:w-2/3 lg:w-3/5 py-3.5 bg-white text-indigo-950 font-bold text-sm rounded-xl shadow-md active:scale-[0.98] transition-all"
              >
                AI 채팅 시작하기
              </button>
              <img 
                src={IMAGES.MAIN_AI1} 
                className="absolute -bottom-4 md:-bottom-2 lg:-bottom-2 -right-2 w-24 h-24 md:w-32 md:h-32 lg:w-44 lg:h-44 object-contain opacity-80 lg:opacity-100 transition-all duration-300" 
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