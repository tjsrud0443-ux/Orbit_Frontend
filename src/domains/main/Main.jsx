import React, { useState,useEffect,useRef } from 'react';

const Main = () => {
  const [currentTime] = useState(new Date());

  const formatTime = (date) => {
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  };

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthNames = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const dayNames = ["일","월","화","수","목","금","토"];

  const images = [1, 2, 3, 4, 5];

  const notices = [
    { type: "공지", title: "5월 정기 보안 점검 안내", date: "2026.05.28" },
    { type: "일반", title: "사내 워크샵 일정 공지", date: "2026.05.27" },
    { type: "일반", title: "복지포인트 사용 기한 안내", date: "2026.05.26" },
  ];

  const schedules = [
    { title: "전사 주간 회의", time: "10:00", done: false },
    { title: "인사팀 면접 진행", time: "14:00", done: false },
    { title: "월간 보고서 제출", time: "18:00", done: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans text-gray-900">
      {/* 상단 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-indigo-950">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">{formatDate(today)} · 오늘도 좋은 하루 되세요 👋</p>
      </div>

      {/* 대시보드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* [1] 좌측: 출퇴근 카드 (span 2 rows) */}
        <div className="lg:row-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-6">
          <div className="w-24 h-24 rounded-full border-4 border-gray-100 flex items-center justify-center">
             <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="26" stroke="#3530B8" strokeWidth="2.5" fill="none"/>
              <line x1="28" y1="28" x2="28" y2="12" stroke="#3530B8" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="28" y1="28" x2="40" y2="34" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="28" cy="28" r="3" fill="#3530B8"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-950">{formatTime(currentTime)}</p>
            <p className="text-xs text-gray-400 mt-1">현재 시각</p>
          </div>
          <div className="flex gap-2 w-full">
            <button className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm">출근</button>
            <button className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm">퇴근</button>
          </div>
        </div>

        {/* [2] 빠른 실행 (3/4 width) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">빠른 실행</h2>
          <div className="flex gap-4">
            <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold">아이콘</div>
            <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold">아이콘</div>
          </div>
        </div>

        {/* [3] 통합 컨테이너: 달력 + 전체 일정 (우측 하단) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-100 bg-white p-6 rounded-3xl shadow-sm">
          
          {/* 달력 섹션 */}
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 mb-4">달력</h3>
            <div className="flex-1 bg-gray-50 rounded-2xl p-4">
              <div className="text-center text-sm text-gray-500">Calendar Component</div>
            </div>
          </div>

          {/* 전체 일정 섹션 */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-900">전체 일정</h3>
              <button className="text-gray-400 hover:text-indigo-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="flex-1 space-y-3">
              {schedules.map((s, i) => (
                <label key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input type="checkbox" checked={s.done} className="w-5 h-5 accent-indigo-600 rounded" readOnly />
                  <span className={`text-sm ${s.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{s.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {/* 기존 레이아웃 끝 */}
      </div>

      {/* [4] 하단 섹션: 사내게시판(70%) + AI 챗봇(30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mt-6">
        {/* 사내 게시판 */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">사내 게시판</h2>
          <div className="space-y-3">
            {notices.map((n, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{n.type}</span>
                <span className="text-sm text-gray-700 flex-1">{n.title}</span>
                <span className="text-xs text-gray-400">{n.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI 챗봇 카드 */}
        <div className="lg:col-span-3 bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-3xl shadow-sm text-white flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold mb-2">AI 어시스턴트</h3>
            <p className="text-xs text-indigo-100 leading-relaxed">궁금한 사항을 챗봇에게 빠르게 물어보세요</p>
          </div>
          <button className="w-full py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm mt-4">챗봇 바로가기</button>
        </div>
      </div>
    </div>
  );
};


export default Main;
