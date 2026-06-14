import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnuualSummary, getCntMonth, getCntWeek, getProfileInfo, getMySupplyRequest, getAllMyMeetRsvn, getMyQuestions } from '../mypage/mypageApi';
import useUserStore from '../../store/userStore';
import useAuthStore from '../../store/authStore';

import usePersonalCalendar from '../schedules/personalCalendar';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

const MyPage = () => {
  const token = useAuthStore(state=>state.token);
  const user = useUserStore(state => state.user);

  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('비품');
  const [dayModal, setDayModal] = useState({ open: false, date: '', schedules: [] });
  const [profileData,setProfileData]=useState();
  const [supplyRequests, setSupplyRequests] = useState([]);
  const [roomReservations, setRoomReservations] = useState([]);
  const [adminInquiries, setAdminInquiries] = useState([]);

  const tabs = ['비품', '회의실', '관리자 문의'];
  const { calendarEvents, selectedDate, selectedSchedules } = usePersonalCalendar();
  
  const requestData = {
    '비품': supplyRequests.slice(0, 4).map(req => ({
      title: req.items?.[0]?.supply_name
               ? req.items[0].supply_name.length > 14
                 ? req.items[0].supply_name.slice(0, 14) + '…'
                 : req.items[0].supply_name
               : '품목 없음',
      date: req.req_date,
      status: req.status === 'APPROVED' ? '승인'
            : req.status === 'PENDING'  ? '대기'
            : '반려',
    })),
    '회의실': roomReservations.slice(0, 4).map(res => ({
      title: res.title,
      date: res.start_dt?.split(' ')[0],
      status: res.room_name
    })),
    '관리자 문의': adminInquiries.slice(0, 4).map(qna => ({
      title: qna.question,
      date: qna.created_at,
      status: qna.status === 'ANSWERED' ? '승인' : '대기'
    })),
  };

  useEffect(()=>{
    getProfileInfo().then(resp=> setProfileData(resp.data))
    .catch(err=>console.log("내정보 불러오기 실패",err));

    getMySupplyRequest()
      .then(resp => setSupplyRequests(resp.data))
      .catch(err => console.log("비품 신청 내역 불러오기 실패", err));

    getAllMyMeetRsvn()
      .then(resp => setRoomReservations(resp.data))
      .catch(err => console.log("회의실 예약 내역 불러오기 실패", err));

    getMyQuestions()
      .then(resp => setAdminInquiries(resp.data))
      .catch(err => console.log("관리자 문의 내역 불러오기 실패", err));
  },[]);

  // const handleDateClick = (info) => {
  //   const filtered = calendarEvents.filter(e => e.date === info.dateStr || e.start === info.dateStr);
  //   setDayModal({ open: true, date: info.dateStr, schedules: filtered });
  // };
const handleDateClick = (info) => {
  const filtered = calendarEvents.filter(e => {
    const endDate = e.originalEnd || e.end;
    if (endDate) {
      return info.dateStr >= e.start && info.dateStr <= endDate;
    }
    return e.start === info.dateStr;
  });
  setDayModal({ open: true, date: info.dateStr, schedules: filtered });
};
  const statusStyle = (status) => {
    if (status === '승인') return { background: '#F0FDF4', color: '#10B981', border: '1px solid #DCFCE7' };
    if (status === '대기') return { background: '#FFF9F0', color: '#FF9800', border: '1px solid #FEF3C7' };
    if (status === '처리중') return { background: '#F0F4FF', color: '#3530B8', border: '1px solid #DDE8FF' };
    return { background: '#FFF0F0', color: '#FF4D4F', border: '1px solid #FEE2E2' };
  };

  const [monthSummary, setMonthSummary] = useState({
    workDays: 0,
    totalHours: 0,
    lateCnt: 0,
    usedLeave: 0,
  });

  useEffect(() => {
  getCntMonth()
    .then(resp => setMonthSummary(prev => ({
       ...prev, 
          lateCnt: resp.data.late_cnt ?? 0,
          workDays: resp.data.work_days ?? 0,
          totalHours: resp.data.total_hours ?? 0,
          usedLeave: resp.data.vac_cnt ?? 0
      })))
    .catch(err => console.log(err));
}, []);

  const attendanceSummary = [
    { label: '근무일수', value: `${monthSummary.workDays}일` },
    { label: '총 근무시간', value: `${monthSummary.totalHours}시간` },
    { label: '지각', value: `${monthSummary.lateCnt}회` },
    { label: '이번달 연차', value: `${monthSummary.usedLeave}일` },
  ];

  const [weekSummary, setWeekSummary] = useState({
    workDays: 0,
    lateCnt: 0,
    usedLeave: 0,
    overtime_hours:0
  });

  useEffect(() => {
  getCntWeek()
    .then(resp => setWeekSummary(prev => ({
       ...prev, 
      lateCnt: resp.data.late_cnt ?? 0,
      workDays: resp.data.work_days ?? 0,
      overtimeHours: resp.data.overtime_hours ?? 0,
      usedLeave: resp.data.vac_cnt ?? 0
      })))
    .catch(err => console.log(err));
}, []);

const weeklyAttendance = [
  { label: '근무일수', value: `${weekSummary.workDays}일`, text: '#0bbf4d', bg: '#f0fdf4', border: '#c9fcda' },
  { label: '지각', value: `${weekSummary.lateCnt}회`, text: '#ef4444', bg: '#fef2f2', border: '#fee2e2' },
  { label: '연차', value: `${weekSummary.usedLeave}일`, text: '#f59e0b', bg: '#fffbeb', border: '#fef3c7' },
  { label: '연장근무', value: `${weekSummary.overtimeHours}시간`, text: '#3b82f6', bg: '#eff6ff', border: '#dbeafe' },
];
  const [leaveData, setLeaveData] = useState({total_days: 0, used_days: 0, remaining_days: 0 });

  useEffect(()=>{
    getAnuualSummary().then(resp=>{
      setLeaveData(resp.data)
    }).catch(err=>console.log("연차 불러오기 실패",err));
  })
  const donutData = {
    labels: ['잔여', '사용'],
    datasets: [{
      data: [leaveData.remaining_days, leaveData.used_days],
      backgroundColor: ['#d9d9fe', '#3F51B5'],
      borderWidth: 1,
      borderColor: [ '#d9d9fe','#3F51B5',],
    }]// '#757de8', leaveData.total_days,
  };

  return (
    <div className="mypage-container" style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '1.5rem 1.75rem', boxSizing: 'border-box', background: 'white' }}>
      <style>{`
        .mypage-container::-webkit-scrollbar {
          width: 5px;
        }
        .mypage-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .mypage-container::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .mypage-container::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
      {/* 헤더 */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.25rem' }}>마이페이지</h1>
        <p style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: '500' }}>내 정보와 업무 현황을 확인하세요</p>
      </div>

      {/* 메인 2열 그리드 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* 왼쪽 컬럼: (내 정보 + 연차 현황) + 개인 캘린더 */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* 상단: 내 정보와 연차 현황 가로 배치 (모바일 세로) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 내 정보 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col min-h-[12rem]">
              <h3 className="text-[0.8rem] font-extrabold text-slate-900 mb-3">내 정보</h3>
              <div className="flex items-center gap-4 mb-4 flex-1">
                <div className="w-14 h-14 rounded-full bg-slate-50 border-2 border-slate-100 overflow-hidden shrink-0">
                  {user?.sysname && token ? (
                  <img
                    src={`http://localhost/file/profile/view?sysname=${user?.sysname}&token=${token}`}
                    alt={profileData?.name}
                    className="w-full h-full object-cover"
                  />
                  ):(
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[#3530B8]">김</div>
                  )}
                </div>
                <div className="grid grid-cols-[3rem_1fr] gap-x-2 gap-y-0.5 text-xs">
                  {[
                    ['이름', profileData?.name || ''],
                    ['직급', profileData?.rank_name || ''],
                    ['부서', profileData?.dept_name || ''],
                    ['사번', profileData?.users_seq || ''],
                    ['입사일', profileData?.hire_date?.split(' ')[0] || ''],
                  ].map(([label, val]) => (
                    <React.Fragment key={label}>
                      <span className="text-slate-400 font-bold">{label}</span>
                      <span className="text-slate-800 font-semibold">{val}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <button
                onClick={() => navigate('/mypage/edit')}
                className="w-full py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                정보 수정
              </button>
            </div>

            {/* 연차 현황 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col min-h-[12rem]">
              <h3 className="text-[0.8rem] font-extrabold text-slate-900 mb-3">연차 현황</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
               <div className="relative w-32 h-32 shrink-0">
                  <Doughnut
                    data={donutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '65%',
                      plugins: { legend: { display: false } }
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[0.6rem] color-[#8a95a5] font-bold">총 연차</span>
                    <span className="text-sm text-slate-900 font-extrabold">{leaveData.total_days}일</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  {[  
                    // { label: '연차', value: `${leaveData.total_days}일`, color:  '#7b83ee'},
                    { label: '잔여', value: `${leaveData.remaining_days}일`, color:'#d9d9fe'},
                    { label: '사용', value: `${leaveData.used_days}일`, color: '#3F51B5'},
                    
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between sm:justify-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-xs text-slate-500 font-bold">{label}</span>
                      </div>
                      <span className="text-xs text-slate-900 font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 개인 캘린더 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm h-[32rem]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[0.8rem] font-extrabold text-slate-900">개인 캘린더</h3>
              <button onClick={() => navigate('/calendar')} className="text-[0.65rem] text-slate-400 font-bold hover:text-[#3530B8]">상세보기 →</button>
            </div>          
             <style>{`
                  .main-calendar .fc-theme-standard td,
                  .main-calendar .fc-theme-standard th { border-color: #F1F5F9 !important; }
                  .main-calendar .fc-theme-standard .fc-scrollgrid { border-color: #F1F5F9 !important; }
                  .main-calendar .fc-col-header-cell-cushion { font-size: 0.65rem !important; font-weight: 700 !important; color: #94A3B8 !important; padding: 4px 0 !important; }
                  .main-calendar .fc-daygrid-day-number { font-size: 0.7rem !important; color: #475569 !important; padding: 2px 6px !important; }
                  .main-calendar .fc-day-today { background-color: #FFFBEB !important; }
                  .main-calendar .fc-day-today .fc-daygrid-day-number { 
                    background-color:  transparent !important; color: #475569 !important; 
                    border-radius: 50% !important; 
                    width: 1.6rem !important; height: 1.6rem !important; 
                    display: flex !important; 
                    align-items: center !important; justify-content: center !important; 
                    line-height: 1 !important; padding: 0 !important; 
                  }
                  .main-calendar .fc-toolbar-title { font-size: 0.8rem !important; font-weight: 700 !important; color: #1E293B !important; }
                  .main-calendar .fc-button { background: white !important; border: 1px solid #E2E8F0 !important; color: #64748B !important; font-size: 0.6rem !important; padding: 0.15rem 0.35rem !important; box-shadow: none !important; }
                  .main-calendar .fc-button:hover { background: #EEF2FF !important; color: #3530B8 !important; }
                  .main-calendar .fc-today-button { display: none !important; }
                  .main-calendar .fc-daygrid-event .fc-event-title { display: none !important; }
                  .main-calendar .fc-scroller { overflow: hidden !important; }
                  .main-calendar .fc-daygrid-more-link { pointer-events: none !important; cursor: default !important; }
                  .main-calendar .fc-daygrid-event-dot {
                    border-width: 3px !important;
                  }
                  .main-calendar .fc-daygrid-day-number {
                    height: 1.6rem !important;
                    display: flex !important;
                    align-items: center !important;
                  }
                `}</style>
                <div className="h-[27rem] overflow-hidden main-calendar">
                  <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale="ko"
                    headerToolbar={{ left: '', center: 'title', right: '' }}
                    height="100%"           
                    dayMaxEvents={1}
                    fixedWeekCount={false}//당 월 만큼 줄 조절
                    moreLinkClick={() => 'none'}
                    events={calendarEvents}
                    dateClick={handleDateClick}
                  />
                </div>
          </div>
        </div>

        {/* 오른쪽 컬럼: 요약 + 신청내역 + 근태 */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* 이번 달 요약 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h3 className="text-[0.8rem] font-extrabold text-slate-900 mb-4">이번 달 요약</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {attendanceSummary.map(({ label, value }) => (
                <div key={label} className="rounded-2xl p-3 text-center border transition-all " style={{ background: '#F0F4FF', borderColor: '#DDE8FF' }}>
                  <p className="text-[0.65rem] text-slate-500 font-bold mb-1.5">{label}</p>
                  <p className="text-lg font-extrabold text-[#3530B8]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 신청 내역 - 높이 대폭 확장 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex-1 min-h-[20rem]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[0.8rem] font-extrabold text-slate-900">신청 내역</h3>
              <button 
                onClick={() => {
                  if (activeTab === '관리자 문의') navigate('/qnaHistory');
                  if (activeTab === '회의실') navigate('/roomHistory');
                  if (activeTab === '비품') navigate('/supplyHistory');
                }}
                className="text-[0.65rem] text-slate-400 font-bold hover:text-[#3530B8]"
              >
                {activeTab} 신청 내역 →
              </button>
            </div>

            {/* 탭 */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-xl text-[0.7rem] font-extrabold whitespace-nowrap transition-all
                    ${activeTab === tab ? 'bg-[#3530B8] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* 목록 */}
            <div className="flex flex-col gap-2">
              {(requestData[activeTab] || []).map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 px-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 mb-0.5 truncate">{item.title}</p>
                    <p className="text-[0.65rem] text-slate-400 font-semibold">{item.date}</p>
                  </div>
                  {item.status && (
                    <span 
                      className="text-[0.65rem] font-extrabold px-2.5 py-1 rounded-lg shrink-0" 
                      style={activeTab === '회의실' ? { background: '#F0F4FF', color: '#3530B8', border: '1px solid #DDE8FF' } : statusStyle(item.status)}
                    >
                      {item.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 근태 현황 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h3 className="text-[0.8rem] font-extrabold text-slate-900 mb-1">근태 현황</h3>
            <p className="text-[0.6rem] text-slate-400 font-bold mb-3">이번 주 근태</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {weeklyAttendance.map(({ label, value, text, bg, border }) => (
                <div key={label} className="rounded-2xl p-3 text-center transition-all  border" style={{ background: bg, borderColor: border }}>
                  <p className="text-[0.65rem] font-bold mb-1" style={{ color: text }}>{label}</p>
                  <p className="text-base font-extrabold" style={{ color: text }}>{value}</p>
                </div>
              ))}
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
