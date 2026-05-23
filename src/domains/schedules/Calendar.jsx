import React, { useState, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Link, useLocation } from 'react-router-dom';

/* ───────────────────────────────────────────
   샘플 이벤트 데이터
   
─────────────────────────────────────────── */
const PERSONAL_EVENTS = [
  { id: 'p1', title: '팀 주간 회의',       start: '2026-05-04', category: 'meeting',  color: '#7C3AED' },
  { id: 'p2', title: '연차',               start: '2026-05-07', end: '2026-05-08', category: 'leave',   color: '#10B981' },
  { id: 'p3', title: '프로젝트 킥오프',    start: '2026-05-11', category: 'project', color: '#6366F1' },
  { id: 'p4', title: '디자인 리뷰',        start: '2026-05-14', category: 'meeting',  color: '#7C3AED' },
  { id: 'p5', title: '스프린트 회의',      start: '2026-05-18', category: 'meeting',  color: '#7C3AED' },
  { id: 'p6', title: '내 일정 메모',       start: '2026-05-20', category: 'personal', color: '#3530B8' },
  { id: 'p7', title: '정기 1on1',          start: '2026-05-23', category: 'meeting',  color: '#7C3AED' },
  { id: 'p8', title: '프로젝트 마감',      start: '2026-05-27', category: 'project', color: '#6366F1' },
  { id: 'p9', title: '반차',               start: '2026-05-29', category: 'leave',   color: '#10B981' },
];
/*타운홀미팅-2월, 7월 점심시간대 2시간 소요
전사 워크숍-4월,9월 1박2일
임직원 만족도 조사, 건강 챌린지 - 5월,11월
창립기념일(휴무) - 7월6일
연간 시상식 - 12월*/
const COMPANY_EVENTS = [
  { id: 'c1', title: '어린이날',           start: '2026-05-05', category: 'holiday',     color: '#F59E0B' },
  { id: 'c2', title: '전사 타운홀',        start: '2026-05-12', category: 'company',     color: '#EF4444' },
  { id: 'c3', title: '개발팀 MT',          start: '2026-05-16', end: '2026-05-17', category: 'team', color: '#0EA5E9' },
  { id: 'c4', title: '창립기념일',         start: '2026-05-20', category: 'anniversary', color: '#EC4899' },
  { id: 'c5', title: '부처님오신날',       start: '2026-05-24', category: 'holiday',     color: '#F59E0B' },
  { id: 'c6', title: '개발팀 스프린트',    start: '2026-05-26', category: 'team',        color: '#0EA5E9' },
];

/* 카테고리 → label/color 매핑 */
const PERSONAL_FILTERS = [
  { key: 'personal', label: '내 일정',      color: '#3530B8' },
  { key: 'leave',    label: '연차 / 휴가',  color: '#10B981' },
  { key: 'project',  label: '프로젝트',     color: '#6366F1' },
  { key: 'meeting',  label: '회의',         color: '#7C3AED' },
];

const COMPANY_FILTERS = [
  { key: 'company',     label: '회사 전체 일정', color: '#EF4444' },
  { key: 'team',        label: '개발팀 일정',    color: '#0EA5E9' },
  { key: 'holiday',     label: '공휴일',         color: '#F59E0B' },
  { key: 'anniversary', label: '기념일',         color: '#EC4899' },
];

/* ───────────────────────────────────────────
   메인 컴포넌트
─────────────────────────────────────────── */
const Calendar = () => {
  const location = useLocation();
  const calendarRef = useRef(null);

  /* 탭 상태 */
  const [activeTab, setActiveTab] = useState('personal');

  /* 현재 표시 중인 년/월 텍스트 */
  const [currentTitle, setCurrentTitle] = useState('');

  /* 필터 체크 상태 (개인) */
  const [personalChecked, setPersonalChecked] = useState(
    Object.fromEntries(PERSONAL_FILTERS.map(f => [f.key, true]))
  );

  /* 필터 체크 상태 (공용) */
  const [companyChecked, setCompanyChecked] = useState(
    Object.fromEntries(COMPANY_FILTERS.map(f => [f.key, true]))
  );

  /* 이벤트 목록 (추가/삭제 가능) */
  const [personalEvents, setPersonalEvents] = useState(PERSONAL_EVENTS);
  const [companyEvents, setCompanyEvents]   = useState(COMPANY_EVENTS);

  /* 일정 추가 모달 */
  const [modal, setModal] = useState({ open: false, date: '' });
  const [form, setForm]   = useState({ title: '', category: 'personal', date: '', endDate: '' });

  /* 이벤트 상세 모달 */
  const [detailModal, setDetailModal] = useState({ open: false, event: null });

  /* ── 달력 API 헬퍼 ── */
  const getApi = () => calendarRef.current?.getApi();

  const handlePrev  = () => { getApi()?.prev();  updateTitle(); };
  const handleNext  = () => { getApi()?.next();  updateTitle(); };
  const handleToday = () => { getApi()?.today(); updateTitle(); };

  const updateTitle = useCallback(() => {
    setTimeout(() => {
      const api = getApi();
      if (api) {
        const d = api.getDate();
        setCurrentTitle(`${d.getFullYear()}년 ${d.getMonth() + 1}월`);
      }
    }, 0);
  }, []);

  /* FullCalendar 마운트 시 초기 타이틀 설정 */
  const handleCalendarReady = () => {
    updateTitle();
  };

  /* ── 필터링된 이벤트 계산 ── */
  // 개인 탭: 개인 이벤트만 / 공용 탭: 공용 이벤트만
  const filteredEvents = activeTab === 'personal'
    ? personalEvents.filter(e => personalChecked[e.category])
    : companyEvents.filter(e => companyChecked[e.category]);

  /* ── 날짜 클릭 → 일정 추가 모달 열기 ── */
  const handleDateClick = (info) => {
    setForm({ title: '', category: activeTab === 'personal' ? 'personal' : 'company', date: info.dateStr, endDate: '' });
    setModal({ open: true, date: info.dateStr });
  };

  /* ── 이벤트 클릭 → 상세 모달 ── */
  const handleEventClick = (info) => {
    setDetailModal({ open: true, event: info.event });
  };

  /* ── 이벤트 드래그 이동 ── */
  const handleEventDrop = (info) => {
    const { id, startStr } = info.event;
    const updater = (list) =>
      list.map(e => e.id === id ? { ...e, start: startStr } : e);
    setPersonalEvents(prev => updater(prev));
    setCompanyEvents(prev => updater(prev));
  };

  /* ── 일정 저장 ── */
  const handleSaveEvent = () => {
    if (!form.title.trim()) return;
    const isPersonal = PERSONAL_FILTERS.some(f => f.key === form.category);
    const filter = [...PERSONAL_FILTERS, ...COMPANY_FILTERS].find(f => f.key === form.category);
    const newEvent = {
      id: `u${Date.now()}`,
      title: form.title,
      start: form.date,
      end: form.endDate || undefined,
      category: form.category,
      color: filter?.color ?? '#3530B8',
    };
    if (isPersonal) setPersonalEvents(prev => [...prev, newEvent]);
    else            setCompanyEvents(prev => [...prev, newEvent]);
    setModal({ open: false, date: '' });
  };

  /* ── 일정 삭제 ── */
  const handleDeleteEvent = (id) => {
    setPersonalEvents(prev => prev.filter(e => e.id !== id));
    setCompanyEvents(prev => prev.filter(e => e.id !== id));
    setDetailModal({ open: false, event: null });
  };

  /* ── 사이드바 메뉴 ── */
  const menuItems = [
    { name: '홈',         path: '/home' },
    { name: '조직도',     path: '/departments' },
    { name: '전자 결재',  path: '/approval' },
    { name: '프로젝트 관리', path: '/projects' },
    { name: '자료실',     path: '/documents' },
    { name: '캘린더',     path: '/calendar' },
    { name: '회의록',     path: '/meetingMinutes' },
    { name: '회의실 예약', path: '/meetingRooms' },
    { name: '비품 신청',  path: '/supply' },
    { name: '사내 게시판', path: '/board' },
    { name: 'AI 챗봇',   path: '/aiChat' },
  ];

  /* ── 렌더 ── */
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans antialiased text-gray-800 overflow-hidden">

      {/* ═══════ 좌측 사이드바 ═══════ */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col justify-between p-3 shrink-0 h-full">
        <div className="flex flex-col h-full overflow-hidden">

          {/* 로고 */}
          <div className="flex items-center gap-2 px-2 py-2 mb-4">
            <div className="w-6 h-6 bg-[#3530B8] rounded-md flex items-center justify-center font-black text-white text-xs">
              M
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Orbit</span>
          </div>

          {/* 메뉴 */}
          <nav className="space-y-0.5 flex-1 overflow-y-auto pr-1">
            {menuItems.map((item, idx) => {
              const isCurrent = location.pathname === item.path;
              return (
                <Link
                  key={idx}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${isCurrent
                      ? 'bg-[#DDE8FF] text-[#3530B8] font-semibold'
                      : 'text-slate-600 hover:bg-[#DDE8FF] hover:text-[#3530B8]'
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 로그아웃 */}
          <div className="mt-2 pt-3 border-t border-slate-100 shrink-0">
            <button className="flex items-center justify-center gap-2 w-full px-2 py-1.5 text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors cursor-pointer border border-slate-200 rounded-lg bg-white">
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════ 우측 메인 영역 ═══════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* 메인 바디 */}
        <main className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">

          {/* 타이틀 + 프로필 */}
          <div className="flex justify-between items-center px-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">캘린더</h1>
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-800 block">김민준</span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">개발팀</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-300">
                👤
              </div>
            </div>
          </div>

          {/* ── 탭 메뉴 ── */}
          <div className="flex gap-1 border-b border-slate-200 px-1 mt-2">
            {[
              { key: 'personal', label: '개인 캘린더' },
              { key: 'company',  label: '공용 캘린더' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-all
                  ${activeTab === tab.key
                    ? 'bg-[#3530B8] text-white shadow-sm'
                    : 'bg-white text-slate-500 hover:text-slate-800 border border-b-0 border-slate-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── 달력 + 필터 ── */}
          <div className="flex flex-col lg:flex-row gap-4 flex-1">

            {/* 메인 달력 */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col min-w-0">

              {/* 커스텀 툴바 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToday}
                    className="px-3 py-1 border border-slate-300 rounded text-xs font-medium bg-white hover:bg-slate-50 transition-colors"
                  >
                    오늘
                  </button>
                  <div className="flex border border-slate-300 rounded overflow-hidden bg-white">
                    <button
                      onClick={handlePrev}
                      className="px-2 py-1 border-r border-slate-300 hover:bg-slate-50 text-xs transition-colors"
                    >
                      &lt;
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-2 py-1 hover:bg-slate-50 text-xs transition-colors"
                    >
                      &gt;
                    </button>
                  </div>
                  <h2 className="text-base font-bold text-slate-800 ml-1">{currentTitle}</h2>
                </div>

                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setForm({ title: '', category: activeTab === 'personal' ? 'personal' : 'company', date: today, endDate: '' });
                    setModal({ open: true, date: today });
                  }}
                  className="px-4 py-1.5 border border-[#3530B8] bg-[#3530B8] text-white rounded text-xs font-semibold shadow-sm hover:bg-[#2824a0] transition-colors"
                >
                  + 일정 추가
                </button>
              </div>

              {/* FullCalendar */}
              <div className="calendar-container flex-1">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale="ko"
                  headerToolbar={false}
                  height="auto"
                  editable={true}
                  selectable={true}
                  events={filteredEvents}
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  eventDrop={handleEventDrop}
                  datesSet={updateTitle}
                  viewDidMount={handleCalendarReady}
                />
              </div>
            </div>

            {/* 필터 패널 */}
            <aside className="w-full lg:w-56 shrink-0 flex flex-col gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-5 flex-1">

                {/* 개인 캘린더 필터 */}
                <FilterSection
                  title="개인 캘린더"
                  filters={PERSONAL_FILTERS}
                  checked={personalChecked}
                  onChange={(key, val) => setPersonalChecked(prev => ({ ...prev, [key]: val }))}
                />

                {/* 공용 캘린더 필터 */}
                <FilterSection
                  title="회사 공용 캘린더"
                  filters={COMPANY_FILTERS}
                  checked={companyChecked}
                  onChange={(key, val) => setCompanyChecked(prev => ({ ...prev, [key]: val }))}
                />

              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* ═══════ 일정 추가 모달 ═══════ */}
      {modal.open && (
        <ModalOverlay onClose={() => setModal({ open: false, date: '' })}>
          <h3 className="text-sm font-bold text-slate-800 mb-4">새 일정 추가</h3>

          <label className="block text-xs text-slate-500 mb-1">제목</label>
          <input
            autoFocus
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSaveEvent()}
            placeholder="일정 제목 입력"
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs mb-3 focus:outline-none focus:ring-2 focus:ring-[#3530B8]"
          />

          <label className="block text-xs text-slate-500 mb-1">카테고리</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs mb-3 focus:outline-none focus:ring-2 focus:ring-[#3530B8]"
          >
            <optgroup label="개인 캘린더">
              {PERSONAL_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </optgroup>
            <optgroup label="공용 캘린더">
              {COMPANY_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </optgroup>
          </select>

          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">시작일</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#3530B8]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">종료일 (선택)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#3530B8]"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setModal({ open: false, date: '' })}
              className="px-4 py-1.5 text-xs font-medium text-slate-500 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              취소
            </button>
            <button
              onClick={handleSaveEvent}
              disabled={!form.title.trim()}
              className="px-4 py-1.5 text-xs font-semibold bg-[#3530B8] text-white rounded-lg hover:bg-[#2824a0] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              저장
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ═══════ 이벤트 상세 모달 ═══════ */}
      {detailModal.open && detailModal.event && (
        <ModalOverlay onClose={() => setDetailModal({ open: false, event: null })}>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">일정 상세</h3>
          </div>

          <div
            className="w-full rounded-lg p-3 mb-4 text-white text-xs font-semibold"
            style={{ backgroundColor: detailModal.event.backgroundColor || '#3530B8' }}
          >
            {detailModal.event.title}
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 mb-5">
            <div><span className="font-semibold text-slate-700">시작:</span> {detailModal.event.startStr}</div>
            {detailModal.event.endStr && (
              <div><span className="font-semibold text-slate-700">종료:</span> {detailModal.event.endStr}</div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setDetailModal({ open: false, event: null })}
              className="px-4 py-1.5 text-xs font-medium text-slate-500 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              닫기
            </button>
            <button
              onClick={() => handleDeleteEvent(detailModal.event.id)}
              className="px-4 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              삭제
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

/* ───────────────────────────────────────────
   서브 컴포넌트: FilterSection
─────────────────────────────────────────── */
const FilterSection = ({ title, filters, checked, onChange }) => (
  <div>
    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">{title}</h3>
    <div className="space-y-2">
      {filters.map(item => (
        <label key={item.key} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-slate-900">
          <input
            type="checkbox"
            checked={checked[item.key] ?? true}
            onChange={e => onChange(item.key, e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300"
            style={{ accentColor: item.color }}
          />
          {/* 색상 점 */}
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </label>
      ))}
    </div>
  </div>
);

/* ───────────────────────────────────────────
   서브 컴포넌트: ModalOverlay
─────────────────────────────────────────── */
const ModalOverlay = ({ children, onClose }) => (
  <div
    className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
      {children}
    </div>
  </div>
);

export default Calendar;
