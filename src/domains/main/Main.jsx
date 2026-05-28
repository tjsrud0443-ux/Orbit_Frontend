import React, { useState, useEffect } from 'react';

const Main = () => {
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
  ];

  const schedules = [
    { title: "전사 주간 회의", info: "10:00 · 회의실 A", done: false },
    { title: "인사팀 면접 진행", info: "14:00 · 회의실 B", done: false },
  ];

  const quickActions = [
    { title: "전자결재 작성", icon: "📝" },
    { title: "일정 추가", icon: "📅" },
    { title: "회의실 예약", icon: "💬" },
    { title: "비품 신청", icon: "🗑️" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans text-gray-900 flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-indigo-950">대시보드</h1>
        <p className="text-sm text-gray-400 mt-0.5">{formatDate(new Date())} · 오늘도 좋은 하루 되세요 👋</p>
      </div>

      {/* [메인 대분할 그리드 시스템 - 좌(70%) : 우(30%)] */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 flex-1 items-stretch">
        
        {/* ==========================================
            좌측: 달력 + 전체 일정 (70%)
           ========================================== */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
            {/* 달력 */}
            <div className="flex flex-col border-r border-gray-100 md:pr-4">
              <h3 className="text-xs font-extrabold text-indigo-950 mb-3">달력</h3>
              <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] font-bold text-gray-400 mb-2">
                {dayNames.map((d, i) => <div key={i}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-y-1.5 text-center text-[11px] font-bold text-gray-700 flex-1 content-start">
                {days.map((day, idx) => (
                  <div key={idx} className="h-6 flex items-center justify-center">
                    {day && <span className={`w-5 h-5 flex items-center justify-center rounded-full ${day === 28 ? 'bg-[#3530B8] text-white' : ''}`}>{day}</span>}
                  </div>
                ))}
              </div>
            </div>
            {/* 일정 */}
            <div className="flex flex-col md:pl-2">
              <h3 className="text-xs font-extrabold text-indigo-950 mb-3">전체 일정</h3>
              <div className="space-y-2 overflow-y-auto max-h-[300px] flex-1">
                {schedules.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl">
                    <input type="checkbox" checked={s.done} className="w-3.5 h-3.5 accent-[#3530B8]" readOnly />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-800">{s.title}</span>
                      <span className="text-[9px] text-gray-400">{s.info}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            우측: 출퇴근 + 빠른 실행 (30%)
           ========================================== */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* 출퇴근 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-[240px]">
            <p className="text-3xl font-extrabold text-indigo-950">{formatTime(currentTime)}</p>
            <div className="flex gap-3 w-full">
              <button className="flex-1 py-3 rounded-xl bg-[#3530B8] text-white font-bold text-xs">출근</button>
              <button className="flex-1 py-3 rounded-xl bg-white border border-gray-200 text-gray-400 font-bold text-xs">퇴근</button>
            </div>
          </div>
          {/* 빠른 실행 */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between flex-1">
            <h2 className="text-sm font-bold text-indigo-950">빠른 실행</h2>
            <div className="grid grid-cols-2 gap-3 flex-1 items-stretch content-center">
              {quickActions.map((action, idx) => (
                <button key={idx} className="flex flex-col items-center justify-center p-2 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <span className="text-lg mb-1">{action.icon}</span>
                  <span className="text-[10px] font-bold text-gray-700">{action.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Main;
