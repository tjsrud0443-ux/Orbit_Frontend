import React, { useState, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { fetchHolidays } from '../../api/holidayApi';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

const PERSONAL_EVENTS = [
  { id: 'p1', title: '팀 주간 회의', start: '2026-05-04', category: 'meeting', color: '#7C3AED' },
  { id: 'p2', title: '연차', start: '2026-05-07', end: '2026-05-08', category: 'leave', color: '#10B981' },
];

const generateCompanyEvents = (years) => {
  const events = [];
  years.forEach(year => {
    events.push({ id: `c-town-${year}-02`, title: '타운홀 미팅 (12:00~14:00)', start: `${year}-02-15T12:00:00`, end: `${year}-02-15T14:00:00`, category: 'company', color: '#EF4444' });
    events.push({ id: `c-town-${year}-07`, title: '타운홀 미팅 (12:00~14:00)', start: `${year}-07-15T12:00:00`, end: `${year}-07-15T14:00:00`, category: 'company', color: '#EF4444' });
    events.push({ id: `c-work-${year}-04`, title: '전사 워크숍 (1박 2일)', start: `${year}-04-16`, end: `${year}-04-18`, category: 'team', color: '#0EA5E9' });
    events.push({ id: `c-work-${year}-09`, title: '전사 워크숍 (1박 2일)', start: `${year}-09-17`, end: `${year}-09-19`, category: 'team', color: '#0EA5E9' });
    events.push({ id: `c-survey-${year}-05`, title: '임직원 만족도 조사', start: `${year}-05-10`, category: 'company', color: '#EF4444' });
    events.push({ id: `c-health-${year}-05`, title: '건강 챌린지 시작', start: `${year}-05-01`, category: 'team', color: '#0EA5E9' });
    events.push({ id: `c-survey-${year}-11`, title: '임직원 만족도 조사', start: `${year}-11-10`, category: 'company', color: '#EF4444' });
    events.push({ id: `c-health-${year}-11`, title: '건강 챌린지 시작', start: `${year}-11-01`, category: 'team', color: '#0EA5E9' });
    events.push({ id: `c-found-${year}`, title: '창립기념일 (휴무)', start: `${year}-07-06`, category: 'holiday', color: '#F59E0B' });
    events.push({ id: `c-award-${year}`, title: '연간 시상식', start: `${year}-12-24T15:00:00`, category: 'company', color: '#EC4899' });
  });
  return events;
};

const COMPANY_EVENTS = generateCompanyEvents([2026, 2027, 2028]);

const PERSONAL_FILTERS = [
  { key: 'personal', label: '내 일정',     color: '#3530B8' },
  { key: 'leave',    label: '연차 / 휴가', color: '#10B981' },
  { key: 'project',  label: '프로젝트',    color: '#6366F1' },
  { key: 'meeting',  label: '회의',        color: '#7C3AED' },
];

const COMPANY_FILTERS = [
  { key: 'company',     label: '회사 전체 일정', color: '#EF4444' },
  { key: 'team',        label: '부서/팀 일정',   color: '#0EA5E9' },
  { key: 'holiday',     label: '공휴일',         color: '#F59E0B' },
  { key: 'anniversary', label: '기념일',         color: '#EC4899' },
];

const COMPANY_CATEGORIES = ['company', 'team', 'holiday', 'anniversary'];

const Calendar = () => {
  const calendarRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [currentTitle, setCurrentTitle] = useState('');
  const [personalChecked, setPersonalChecked] = useState(Object.fromEntries(PERSONAL_FILTERS.map(f => [f.key, true])));
  const [companyChecked, setCompanyChecked]   = useState(Object.fromEntries(COMPANY_FILTERS.map(f => [f.key, true])));
  const [personalEvents, setPersonalEvents] = useState(PERSONAL_EVENTS);
  const [companyEvents, setCompanyEvents]   = useState(COMPANY_EVENTS);

  const [modal, setModal] = useState({ open: false, date: '' });
  const [form, setForm]   = useState({ id: '', title: '', category: 'personal', date: '', endDate: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, event: null });

  const loadedYears = useRef(new Set());
  const loadHolidaysForYear = useCallback(async (year) => {
    if (loadedYears.current.has(year)) return;
    loadedYears.current.add(year);
    try {
      const holidays = await fetchHolidays(year);
      if (holidays?.length > 0) {
        setCompanyEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          return [...prev, ...holidays.filter(h => !existingIds.has(h.id))];
        });
      }
    } catch (err) { console.error(`${year}년 공휴일 로드 실패:`, err); }
  }, []);

  const getApi = () => calendarRef.current?.getApi();

  const updateTitle = useCallback(() => {
    setTimeout(() => {
      const api = getApi();
      if (api) {
        const d = api.getDate();
        const year = d.getFullYear();
        setCurrentTitle(`${year}년 ${d.getMonth() + 1}월`);
        loadHolidaysForYear(year);
        loadHolidaysForYear(year + 1);
      }
    }, 0);
  }, [loadHolidaysForYear]);

  const filteredEvents = activeTab === 'personal'
    ? personalEvents.filter(e => personalChecked[e.category])
    : companyEvents.filter(e => companyChecked[e.category]);

  const handleDateClick = (info) => {
    setIsEditing(false);
    setForm({ id: '', title: '', category: activeTab === 'personal' ? 'personal' : 'company', date: info.dateStr, endDate: '', description: '' });
    setModal({ open: true, date: info.dateStr });
  };

  const handleEventClick = (info) => {
    setDetailModal({ open: true, event: info.event });
  };

  const handleEditStart = () => {
    const event = detailModal.event;
    setIsEditing(true);
    setForm({
      id: event.id,
      title: event.title,
      category: event.extendedProps.category || 'personal',
      date: event.startStr.split('T')[0],
      endDate: event.endStr ? event.endStr.split('T')[0] : '',
      description: event.extendedProps.description || '',
    });
    setDetailModal({ open: false, event: null });
    setModal({ open: true, date: event.startStr });
  };

  const handleSaveEvent = () => {
    if (!form.title.trim()) return;
    const isPersonalCategory = PERSONAL_FILTERS.some(f => f.key === form.category);
    const filter = [...PERSONAL_FILTERS, ...COMPANY_FILTERS].find(f => f.key === form.category);
    const eventData = {
      id: isEditing ? form.id : `u${Date.now()}`,
      title: form.title,
      start: form.date,
      end: form.endDate || undefined,
      extendedProps: { category: form.category, description: form.description },
      category: form.category,
      color: filter?.color ?? '#3530B8',
    };
    const updater = (prev) => isEditing
      ? prev.map(e => e.id === form.id ? eventData : e)
      : [...prev, eventData];
    if (isPersonalCategory) setPersonalEvents(updater);
    else                    setCompanyEvents(updater);
    setModal({ open: false, date: '' });
  };

  const handleDeleteEvent = (id) => {
    setPersonalEvents(prev => prev.filter(e => e.id !== id));
    setCompanyEvents(prev => prev.filter(e => e.id !== id));
    setModal({ open: false, date: '' });
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans antialiased text-gray-800 overflow-hidden relative">

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 flex flex-col gap-4 overflow-y-scroll">
          <div className="px-1">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">캘린더</h1>
            <p className="text-xs text-slate-500 mt-0.5">일정을 한눈에 확인하세요.</p>
          </div>

          <div className="flex gap-1 border-b border-slate-200 px-1">
            {[{ key: 'personal', label: '개인 캘린더' }, { key: 'company', label: '공용 캘린더' }].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-all whitespace-nowrap border border-b-0
                  ${activeTab === tab.key ? 'bg-[#3530B8] text-white border-[#3530B8]' : 'bg-white text-slate-500 border-slate-200'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => { getApi()?.today(); updateTitle(); }}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg text-[11px] font-medium bg-white hover:bg-[#DDE8FF] transition-colors">오늘</button>
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button onClick={() => { getApi()?.prev(); updateTitle(); }}
                      className="px-1.5 py-1 border-r border-slate-200 hover:bg-[#DDE8FF] text-[11px]">&lt;</button>
                    <button onClick={() => { getApi()?.next(); updateTitle(); }}
                      className="px-1.5 py-1 hover:bg-[#DDE8FF] text-[11px]">&gt;</button>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 ml-1">{currentTitle}</h2>
                </div>
                <button onClick={() => {
                  const t = new Date().toISOString().split('T')[0];
                  setForm({ id: '', title: '', category: activeTab === 'personal' ? 'personal' : 'company', date: t, endDate: '', description: '' });
                  setIsEditing(false);
                  setModal({ open: true, date: t });
                }} className="px-3 py-1.5 bg-[#3530B8] text-white rounded-lg text-[11px] font-semibold">+ 일정 추가</button>
              </div>

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
                  datesSet={updateTitle}
                />
              </div>
            </div>

            <aside className="w-full lg:w-56 shrink-0 flex flex-col gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex-1 space-y-4">
                <FilterSection title="개인 캘린더" filters={PERSONAL_FILTERS} checked={personalChecked} onChange={(k, v) => setPersonalChecked(p => ({ ...p, [k]: v }))} />
                <FilterSection title="회사 공용 캘린더" filters={COMPANY_FILTERS} checked={companyChecked} onChange={(k, v) => setCompanyChecked(p => ({ ...p, [k]: v }))} />
              </div>
            </aside>
          </div>
        </main>
      </div>

      {modal.open && (
        <ModalOverlay onClose={() => setModal({ open: false, date: '' })}>
          <h3 className="text-sm font-bold text-slate-800 mb-4">{isEditing ? '일정 수정' : '새 일정 추가'}</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="일정 제목" className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs mb-3 focus:outline-none focus:ring-1 focus:ring-[#3530B8]" />
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs mb-3">
            <optgroup label="개인">{PERSONAL_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}</optgroup>
            <optgroup label="공용">{COMPANY_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}</optgroup>
          </select>
          <div className="flex gap-2 mb-3">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs" />
            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs" />
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="일정 설명을 입력하세요" className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs h-20 resize-none mb-4 focus:outline-none focus:ring-1 focus:ring-[#3530B8]" />
          <div className="flex gap-2 justify-end">
            {isEditing ? (
              <>
                <button onClick={() => handleDeleteEvent(form.id)} className="px-4 py-1.5 text-xs text-red-500 font-semibold border border-red-200 rounded-lg hover:bg-red-50">삭제</button>
                <button onClick={handleSaveEvent} className="px-4 py-1.5 text-xs bg-[#3530B8] text-white rounded-lg font-semibold">완료</button>
              </>
            ) : (
              <>
                <button onClick={() => setModal({ open: false, date: '' })} className="px-4 py-1.5 text-xs text-slate-500 font-semibold border border-slate-200 rounded-lg hover:bg-slate-50">취소</button>
                <button onClick={handleSaveEvent} className="px-4 py-1.5 text-xs bg-[#3530B8] text-white rounded-lg font-semibold">저장</button>
              </>
            )}
          </div>
        </ModalOverlay>
      )}

      {detailModal.open && detailModal.event && (
        <ModalOverlay onClose={() => setDetailModal({ open: false, event: null })}>
          <h3 className="text-sm font-bold mb-4">일정 상세</h3>
          <div className="p-3 mb-4 rounded-lg bg-[#3530B8] text-white text-xs font-semibold">{detailModal.event.title}</div>
          <div className="space-y-2 mb-5 text-xs text-slate-600">
            <p><span className="font-semibold">시작:</span> {detailModal.event.startStr.split('T')[0]}</p>
            {detailModal.event.end && (
              <p><span className="font-semibold">종료:</span> {detailModal.event.endStr.split('T')[0]}</p>
            )}
            {detailModal.event.extendedProps?.description && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 mb-1">설명</p>
                <p className="text-slate-700 whitespace-pre-wrap">{detailModal.event.extendedProps.description}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDetailModal({ open: false, event: null })} className="px-4 py-1.5 text-xs border rounded-lg text-slate-500 font-semibold hover:bg-slate-50">닫기</button>
            {!COMPANY_CATEGORIES.includes(detailModal.event.extendedProps?.category) && (
              <button onClick={handleEditStart} className="px-4 py-1.5 text-xs bg-[#3530B8] text-white rounded-lg font-semibold">수정</button>
            )}
          </div>
          {COMPANY_CATEGORIES.includes(detailModal.event.extendedProps?.category) && (
            <p className="mt-2 text-[10px] text-slate-400 text-right">* 공용 일정은 수정할 수 없습니다.</p>
          )}
        </ModalOverlay>
      )}
    </div>
  );
};

const FilterSection = ({ title, filters, checked, onChange }) => (
  <div>
    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">{title}</h3>
    <div className="space-y-2">
      {filters.map(item => (
        <label key={item.key} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={checked[item.key] ?? true} onChange={e => onChange(item.key, e.target.checked)} className="w-3 h-3 accent-[#3530B8]" />
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </label>
      ))}
    </div>
  </div>
);

const ModalOverlay = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4">{children}</div>
  </div>
);

export default Calendar;