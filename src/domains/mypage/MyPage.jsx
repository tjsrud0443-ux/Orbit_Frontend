import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../store/userStore';

import usePersonalCalendar from '../schedules/personalCalendar';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const MyPage = () => {
  const navigate = useNavigate();
  const user = useUserStore(state => state.user);
  const [activeTab, setActiveTab] = useState('비품');
  const [dayModal, setDayModal] = useState({ open: false, date: '', schedules: [] });

  const tabs = ['비품', '회의실', '관리자 문의'];

  const { calendarEvents, selectedDate, selectedSchedules } = usePersonalCalendar();
  const requestData = {
    '비품': [
      { title: '비품 신청', date: '2024-05-15', status: '승인' },
      { title: '비품 신청', date: '2024-05-15', status: '승인' },
    ],
    '회의실': [
      { title: '회의실 예약', date: '2024-05-20', status: '대기' },
    ],
    '관리자 문의': [
      { title: '문의 접수', date: '2024-05-18', status: '처리중' },
    ],
  };

  const handleDateClick = (info) => {
    const filtered = calendarEvents.filter(e => e.date === info.dateStr || e.start === info.dateStr);
    setDayModal({ open: true, date: info.dateStr, schedules: filtered });
  };

  const statusStyle = (status) => {
    if (status === '승인') return { background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
    if (status === '대기') return { background: '#FFF7ED', color: '#D97706', border: '1px solid #FDE68A' };
    if (status === '처리중') return { background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' };
    return { background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' };
  };

  const attendanceSummary = [
    { label: '근무일수', value: '20일' },
    { label: '총 근무시간', value: '160시간' },
    { label: '지각', value: '1회' },
    { label: '연차 사용', value: '1일' },
  ];

  const weeklyAttendance = [
    { label: '정상', value: '4일', color: '#3530B8' },
    { label: '지각', value: '1회', color: '#F59E0B' },
    { label: '조퇴', value: '0회', color: '#10B981' },
    { label: '외출', value: '0회', color: '#6366F1' },
    { label: '연장근무', value: '2시간', color: '#EC4899' },
  ];

  const leaveTotal = 15;
  const leaveUsed = 1;
  const leaveRemain = leaveTotal - leaveUsed - 0.5;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const usedAngle = (leaveUsed / leaveTotal) * circumference;
  const remainAngle = (leaveRemain / leaveTotal) * circumference;

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '1.5rem 1.75rem', boxSizing: 'border-box', background: 'white' }}>

      {/* 헤더 */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.25rem' }}>마이페이지</h1>
        <p style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: '500' }}>내 정보와 업무 현황을 확인하세요</p>
      </div>

      {/* 메인 2열 그리드 레이아웃 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
        
        {/* 왼쪽 컬럼: 내 정보 + 개인 캘린더 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 내 정보 */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '1.5rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem' }}>내 정보</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F0F4FF', border: '2px solid #E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '700', color: '#3530B8', flexShrink: 0 }}>
                {user?.name?.charAt(0) || '김'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '3rem 1fr', gap: '0.2rem 0.5rem', fontSize: '0.78rem' }}>
                {[
                  ['이름', user?.name || '김민준'],
                  ['직급', user?.position || '대리'],
                  ['부서', user?.department || '개발팀'],
                  ['사번', user?.empNo || '10101'],
                  ['입사일', user?.joinDate || '2023.03.02'],
                ].map(([label, val]) => (
                  <React.Fragment key={label}>
                    <span style={{ color: '#94A3B8', fontWeight: '600' }}>{label}</span>
                    <span style={{ color: '#1E293B', fontWeight: '500' }}>{val}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate('/mypage/edit')}
              style={{ width: '100%', padding: '0.3rem', background: 'white', border: '1px solid #E2E8F0', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
            >
              정보 수정
            </button>
          </div>

          {/* 개인 캘린더 */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '1.5rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: '30rem'  }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <button onClick={() => navigate('/calendar')} style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>상세보기 →</button>
            </div>
           
             <style>{`
                      .main-calendar .fc-theme-standard td,
                      .main-calendar .fc-theme-standard th { border-color: #F1F5F9 !important; }
                      .main-calendar .fc-theme-standard .fc-scrollgrid { border-color: #F1F5F9 !important; }
                      .main-calendar .fc-col-header-cell-cushion { font-size: 0.65rem !important; font-weight: 700 !important; color: #94A3B8 !important; padding: 4px 0 !important; }
                      .main-calendar .fc-daygrid-day-number { font-size: 0.7rem !important; color: #475569 !important; padding: 2px 6px !important; }
                      .main-calendar .fc-day-today { background-color: #FFFBEB !important; }
                      .main-calendar .fc-day-today .fc-daygrid-day-number { background-color:  transparent !important; color: #475569 !important; border-radius: 50% !important; width: 1.6rem !important; height: 1.6rem !important; display: flex !important; align-items: center !important; justify-content: center !important; line-height: 1 !important; padding: 0 !important; }
                      .main-calendar .fc-toolbar-title { font-size: 0.8rem !important; font-weight: 700 !important; color: #1E293B !important; }
                      .main-calendar .fc-button { background: white !important; border: 1px solid #E2E8F0 !important; color: #64748B !important; font-size: 0.6rem !important; padding: 0.15rem 0.35rem !important; box-shadow: none !important; }
                      .main-calendar .fc-button:hover { background: #EEF2FF !important; color: #3530B8 !important; }
                      .main-calendar .fc-today-button { display: none !important; }
                      .main-calendar .fc-daygrid-event .fc-event-title { display: none !important; }
                      .main-calendar .fc-daygrid-event { pointer-events: none !important; cursor: default !important; }
                      .main-calendar .fc-scroller { overflow: hidden !important; }
                      .main-calendar .fc-daygrid-more-link { pointer-events: none !important; cursor: default !important; }
                  `}</style>
                <div style={{ height: '26rem', overflow: 'hidden' }} className="main-calendar">
                  <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale="ko"
                    headerToolbar={{ left: '', center: 'title', right: '' }}
                    height="100%"
                    eventDisplay="list-item"
                    dayMaxEvents={1}
                    moreLinkClick={() => 'none'}
                    events={calendarEvents}
                    dateClick={handleDateClick}
                  />
                </div>
          </div>
        </div>

        {/* 오른쪽 컬럼: 요약 + 신청내역 + 근태 + 연차 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 이번 달 요약 */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '1.5rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem' }}>이번 달 요약</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              {attendanceSummary.map(({ label, value }) => (
                <div key={label} style={{ background: '#F8FAFC', borderRadius: '0.75rem', padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: '600', marginBottom: '0.35rem' }}>{label}</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 신청 내역 */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '1.5rem', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',minHeight: '14rem'  }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0F172A' }}>신청 내역</h3>
              <button style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>
                {activeTab} 신청 내역 →
              </button>
            </div>

            {/* 탭 */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.25rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', border: 'none',
                    background: activeTab === tab ? '#3530B8' : '#F1F5F9',
                    color: activeTab === tab ? 'white' : '#64748B',
                  }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {(requestData[activeTab] || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #F1F5F9' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.1rem' }}>{item.title}</p>
                    <p style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{item.date}</p>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '0.4rem', ...statusStyle(item.status) }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 근태 현황 */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '1.5rem', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.2rem' }}>근태 현황</h3>
            <p style={{ fontSize: '0.5rem', color: '#94A3B8', fontWeight: '600', marginBottom: '0.5rem' }}>이번 주 근태</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {weeklyAttendance.map(({ label, value, color }) => (
                <div key={label} style={{ background: '#F8FAFC', borderRadius: '0.75rem', padding: '0.4rem 0.3rem', textAlign: 'center', borderTop: `3px solid ${color}` }}>
                  <p style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: '600', marginBottom: '0.2rem' }}>{label}</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 연차 현황 */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '1.5rem', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.75rem' }}>연차 현황</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {/* 도넛 차트 */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg width="110" height="110" viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="14" />
                  <circle cx="65" cy="65" r={radius} fill="none" stroke="#3530B8" strokeWidth="14"
                    strokeDasharray={`${usedAngle} ${circumference}`}
                    strokeDashoffset={circumference * 0.25}
                    strokeLinecap="round" />
                  <circle cx="65" cy="65" r={radius} fill="none" stroke="#10B981" strokeWidth="14"
                    strokeDasharray={`${remainAngle} ${circumference}`}
                    strokeDashoffset={circumference * 0.25 - usedAngle}
                    strokeLinecap="round" />
                  <text x="65" y="60" textAnchor="middle" fontSize="9" fill="#94A3B8" fontWeight="600">총 연차</text>
                  <text x="65" y="76" textAnchor="middle" fontSize="16" fill="#0F172A" fontWeight="800">{leaveTotal}일</text>
                </svg>
              </div>
              {/* 범례 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  { label: '연차', value: `${leaveTotal}일`, color: '#3530B8' },
                  { label: '사용', value: `${leaveUsed}일`, color: '#10B981' },
                  { label: '반차', value: '0.5일', color: '#6366F1' },
                  { label: '잔여', value: `${leaveRemain}일`, color: '#E2E8F0' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600', minWidth: '2rem' }}>{label}</span>
                    <span style={{ fontSize: '0.72rem', color: '#0F172A', fontWeight: '700' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>        
        </div>
      </div>
       {dayModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setDayModal({ open: false, date: '', schedules: [] })}>
          <div style={{ background: 'white', borderRadius: '1.25rem', padding: '1.25rem', width: '20rem', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A' }}>{dayModal.date} 일정</h3>
              <button onClick={() => setDayModal({ open: false, date: '', schedules: [] })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>✕</button>
            </div>
            {dayModal.schedules.length > 0 ? dayModal.schedules.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', background: '#F8FAFC', borderRadius: '0.75rem', marginBottom: '0.4rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color || '#3530B8', flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#1E293B' }}>{s.title}</span>
              </div>
            )) : (
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', padding: '1rem 0' }}>일정이 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
