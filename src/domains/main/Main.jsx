import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Main = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  const formatDate = (date) => date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  const year = 2026;
  const month = 4;
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const days = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const notices = [
    { type: "공지", title: "5월 정기 보안 점검 안내", date: "2026.05.28", isNotice: true },
    { type: "일반", title: "사내 워크샵 일정 공지", date: "2026.05.27", isNotice: false },
    { type: "공지", title: "신규 프로젝트 킥오프 미팅", date: "2026.05.26", isNotice: true },
  ];

  const schedules = [
    { title: "전사 주간 회의", info: "10:00 · 회의실 A", done: false },
    { title: "인사팀 면접 진행", info: "14:00 · 회의실 B", done: false },
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
    <div className="w-full h-auto lg:h-full flex flex-col p-4 box-border lg:overflow-hidden bg-slate-50">
      {/* PC에서만 부모 스크롤 차단 */}
      <style>{`
        @media (min-width: 1024px) {
          main.flex-1 { overflow: hidden !important; }
        }
      `}</style>

      {/* 헤더 영역 */}
      <div className="mb-4 px-1 shrink-0">
        <h1 className="text-xl font-bold text-indigo-950">대시보드</h1>
        <p className="text-[11px] text-gray-400">{formatDate(new Date())} · 오늘도 좋은 하루 되세요 👋</p>
      </div>

      {/* 메인 레이아웃: 좌측(8)과 우측(4) 영역을 분리하여 PC에서 독립된 기둥으로 정렬 */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-5 min-h-0">
        
        {/* ==================== LEFT COLUMN (8칸) ==================== */}
        <div className="lg:col-span-8 flex flex-col gap-5 h-full min-h-0 order-1">
          
          {/* 상단: 근태 관리 및 빠른 실행 개별 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-8 gap-5 shrink-0">
            {/* Box 1: 근태 관리 */}
            <div className="md:col-span-3 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between min-h-[160px] lg:h-[180px]">
              <h3 className="text-xs font-extrabold text-indigo-950">근태 관리</h3>
              <p className="text-2xl font-extrabold text-indigo-950 leading-tight">{formatTime(currentTime)}</p>
              <div className="flex gap-2 w-full mt-2">
                <button className="flex-1 py-2 rounded-xl bg-[#3530B8] text-white font-bold text-xs hover:bg-[#2a2496] transition-colors">출근</button>
                <button className="flex-1 py-2 rounded-xl bg-white border border-gray-200 text-gray-400 font-bold text-xs hover:bg-gray-50">퇴근</button>
              </div>
            </div>

            {/* Box 2: 빠른 실행 (3x2) */}
            <div className="md:col-span-5 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex flex-col min-h-[180px] lg:h-[180px]">
              <h3 className="text-xs font-extrabold text-indigo-950 mb-2">빠른 실행</h3>
              <div className="grid grid-cols-3 grid-rows-2 gap-2 flex-1">
                {quickActions.map((action, idx) => (
                  <button key={idx} className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all">
                    <span className="text-xl mb-0.5">{action.icon}</span>
                    <span className="text-[11px] font-bold text-gray-700">{action.title}</span>
                  </                  button>
                ))}
              </div>
            </div>
          </div>

          {/* 하단: 달력 및 일정 */}
          <div className="flex-1 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm min-h-[400px] lg:min-h-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {/* 달력 */}
              <div className="flex flex-col h-full overflow-hidden">
                <h3 className="text-xs font-extrabold text-indigo-950 mb-3">달력</h3>
                <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-bold text-gray-400 mb-2">
                  {dayNames.map((d, i) => <div key={i}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center text-base font-bold text-gray-700 flex-1 content-start">
                  {days.map((day, idx) => (
                    <div key={idx} className="aspect-square flex items-center justify-center">
                      {day && (
                        <span className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer hover:bg-slate-100 transition-colors ${day === 28 ? 'bg-[#3530B8] text-white' : ''}`}>
                          {day}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {/* 일정 */}
              <div className="flex flex-col border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-5 h-full overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-extrabold text-indigo-950">오늘의 일정</h3>
                  <button onClick={() => navigate('/calendar')} className="text-[10px] text-gray-400 font-bold hover:text-indigo-950">일정보기</button>
                </div>
                <div className="space-y-2.5 overflow-y-auto h-full pr-1">
                  {schedules.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                      <div className="w-1 h-8 bg-[#3530B8] rounded-full shrink-0"></div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[15px] font-bold text-gray-800 truncate">{s.title}</span>
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
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col min-h-[250px] lg:flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-extrabold text-indigo-950">사내게시판</h3>
              <button onClick={() => navigate('/board')} className="text-[10px] text-gray-400 font-bold hover:text-indigo-950">전체보기</button>
            </div>
            <div className="space-y-1 overflow-y-auto pr-1 flex-1">
              {notices.map((notice, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${notice.isNotice ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                      {notice.type}
                    </span>
                    <span className="font-bold text-sm text-gray-700 truncate">{notice.title}</span>
                  </div>
                  <span className="text-gray-400 text-[10px] shrink-0 ml-2">{notice.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Box 5: AI 챗봇 */}
          <div className="bg-indigo-950 p-5 rounded-3xl shadow-lg flex flex-col justify-between text-white relative overflow-hidden min-h-[250px] lg:flex-1">
            <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="shrink-0 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="p-1.5 bg-white/20 rounded-xl text-lg">🤖</span>
                <h3 className="text-sm font-bold">Orbit AI</h3>
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