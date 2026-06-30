import React, { useState, useEffect, useRef, useCallback } from 'react';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { fetchHolidays } from '../../api/holidayApi';
import { getSchedules, createSchedule, deleteSchedule, updateSchedule, getApprovedVacations } from './schedulesApi';
import useLoadingStore from '../../store/useLoadingStore';
import useUserStore from '../../store/userStore';
import useCalendarStore from '../../store/useCalendarStore';
import { alertSuccess, alertError, alertConfirm } from '../../utils/alert';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
// 현재 연도 기준 -5년 ~ +5년, 총 11년치

const MiniCalendar = () => {
  const [date, setDate] = useState(new Date());
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= lastDate ? day : null;
  });

  return (
    <div className="text-xs h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={() => setDate(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">&lt;</button>
        <span className="font-bold text-slate-800">{year}년 {month + 1}월</span>
        <button onClick={() => setDate(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">&gt;</button>
      </div>
      <div className="grid grid-cols-7 text-center text-[0.625rem] text-slate-400 mb-2 font-medium">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 text-center text-[0.6875rem] flex-1 content-between">
        {days.map((day, i) => (
          <div key={i} className="flex items-center justify-center py-1">
            <span className={`w-7 h-7 flex items-center justify-center rounded-full transition-all
              ${day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                ? 'bg-[#3530B8] text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 cursor-pointer'}
              ${!day ? 'invisible' : ''}`}>
              {day || ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MonthlyEvents = ({ events, currentTitle, title = "이달의 주요 일정" }) => {
  const match = currentTitle.match(/(\d+)년\s+(\d+)월/);
  if (!match) return null;
  const year = parseInt(match[1]);
  const month = parseInt(match[2]);

  const monthlyEvents = events.filter(e => {
    if (!e.start) return false;
    const datePart = e.start.split('T')[0];
    const [y, m] = datePart.split('-').map(Number);
    return y === year && m === month;
  }).sort((a, b) => new Date(a.start) - new Date(b.start));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 shrink-0">{title}</h3>
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
        {monthlyEvents.length > 0 ? (
          monthlyEvents.map(e => (
            <div key={e.id} className="flex gap-3 items-start p-1.5 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="text-[0.625rem] font-bold text-[#3530B8] bg-[#F0F4FF] px-1.5 py-1 rounded shrink-0 min-w-[2.125rem] text-center group-hover:bg-[#3530B8] group-hover:text-white transition-colors">
                {Number(e.start.split('T')[0].split('-')[2])}일
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.6875rem] font-semibold text-slate-800 truncate">{e.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color || '#3530B8' }} />
                  <p className="text-[0.625rem] text-slate-400 capitalize">{e.category}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-8 text-center">
            <p className="text-[0.6875rem] text-slate-400">등록된 일정이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/*체크박스 */
const PERSONAL_FILTERS = [
  { key: 'PERSONAL', label: '내 일정', color: '#3530B8' },
  { key: 'ANNUAL', label: '연차 / 휴가', color: '#67adef' },
  { key: 'PROJECT', label: '프로젝트', color: '#8c8eef' },
  { key: 'MEETING', label: '회의', color: '#ff9fd2' },
  { key: 'holiday', label: '공휴일', color: '#EF4444' },
];

const COMPANY_FILTERS = [
  { key: 'COMPANY', label: '회사 전체 일정', color: '#F59E0B' },
  { key: 'TEAM', label: '부서/팀 일정', color: '#0EA5E9' },
  { key: 'holiday', label: '공휴일', color: '#EF4444' },
  { key: 'ANNIVERSARY', label: '기념일', color: '#EC4899' },
  { key: 'PERSONAL',  label: '내 일정', color: '#3530B8' },
];

const COMPANY_CATEGORIES = ['COMPANY', 'TEAM', 'holiday', 'ANNIVERSARY'];

const Calendar = () => {
  const calendarStore = useCalendarStore();
  const user = useUserStore(state => state.user);
  const isHrAdmin = user?.auth_group === 'ROLE_HR_ADMIN';

  const calendarRef = useRef(null);
  // 화면이 모바일인지 여부 (캘린더 height 분기용)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [dateError, setDateError] = useState('');
  //(커스텀 달력 상태)
  const [openCalendar, setOpenCalendar] = useState(null); // 'start' | 'end' | null
  const [viewDate, setViewDate] = useState(new Date());
  const calendarYear = viewDate.getFullYear();
  const calendarMonth = viewDate.getMonth();

  const getCustomCalendarDays = () => {
    const startOfMonth = new Date(calendarYear, calendarMonth, 1);
    const endOfMonth = new Date(calendarYear, calendarMonth + 1, 0);
    const startDayOfWeek = startOfMonth.getDay();
    const totalDays = endOfMonth.getDate();
    const daysArr = [];
    for (let i = 0; i < startDayOfWeek; i++) daysArr.push(null);
    for (let i = 1; i <= totalDays; i++) daysArr.push(i);
    return daysArr;
  };

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 1024);//1024 미만이면 모바일 처리
      // 추가: 리사이즈 시 캘린더 크기 재계산
       // 즉시 한 번
      const api = getApi();
      if (api) api.updateSize();
      // 렌더링 후 한 번 더
      setTimeout(() => {
        const api = getApi();
        if (api) api.updateSize();
      }, 300)
    };
    window.addEventListener('resize', handler);// 창을 늘리거나 줄일 때마다 자동으로 호출
    return () => window.removeEventListener('resize', handler);// 페이지 이동시 이벤트 제거해서 메모리 누수 방지
  }, []);
  // '개인 캘린더' / '공용 캘린더' 탭 선택 상태
  const [activeTab, setActiveTab] = useState('personal');
  // 헤더에 표시되는 "2026년 5월" 텍스트
  const [currentTitle, setCurrentTitle] = useState('');
  // 개인 체크박스 on/off 상태 { personal: true, leave: true }
  const [personalChecked, setPersonalChecked] = useState(Object.fromEntries(PERSONAL_FILTERS.map(f => [f.key, true])));
  // 회사 체크박스 on/off 상태
  const [companyChecked, setCompanyChecked] = useState(Object.fromEntries(COMPANY_FILTERS.map(f => [f.key, true])));
  // 개인 일정 목록
  const [personalEvents, setPersonalEvents] = useState([]);
  // 회사 일정 목록 (공휴일도 여기 합쳐짐)
  const [companyEvents, setCompanyEvents] = useState([]);
  // 일정 추가/수정 모달 열림 여부 + 날짜
  const [modal, setModal] = useState({ open: false, date: '' });
  // 모달 안 입력값들(제목, 카테고리, 날짜 등)
  const [form, setForm] = useState({ schedule_seq: '', title: '', schedule_type: 'personal', start_dt: '', end_dt: '', sked_reason: '', is_public: 0 , show_in_company: 0});
  // 지금 모달이 추가 모드인지 수정 모드인지
  const [isEditing, setIsEditing] = useState(false);
  const [isPermissionOpen, setIsPermissionOpen] = useState(false); // Add this line
  // 일정 클릭 시 상세 보기 모달
  const [detailModal, setDetailModal] = useState({ open: false, event: null });

  // 하루 일정 보기 패널 상태
  const [showDaily, setShowDaily] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [selectedDayLabel, setSelectedDayLabel] = useState('');
  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  // showDaily 상태 변경 시 캘린더 크기 재계산
  useEffect(() => {
    const timer = setTimeout(() => {
      const api = getApi();
      if (api) {
        api.updateSize();
      }
    }, 300); // transition duration과 일치
    return () => clearTimeout(timer);
  }, [showDaily, isMobile]);


  useEffect(() => {
    showLoading();
    //일정 출력
    Promise.all([getSchedules(),getApprovedVacations()]).then(([schedResp, vacResp]) => {
      const allEvents = schedResp.data.map(item => {
        const filter = [...PERSONAL_FILTERS, ...COMPANY_FILTERS].find(f => f.key === item.schedule_type);
        const isMeeting = item.schedule_type === 'MEETING';

        const startDate = item.start_dt?.split(/[T ]/)[0];
        const endDate = item.end_dt?.split(/[T ]/)[0];
        const startTime = item.start_dt?.split(/[T ]/)[1]?.slice(0, 8); // 'HH:mm:ss'
        const endTime = item.end_dt?.split(/[T ]/)[1]?.slice(0, 8);
        const isSameDay = startDate === endDate;

        // FullCalendar의 end date는 exclusive하므로, 
        // 기간 일정일 때만 종료일에 1일을 더해줌
        let displayEnd = undefined;
        if (endDate && !isSameDay) {
          const d = new Date(endDate);
          d.setDate(d.getDate() + 1);
          displayEnd = d.toISOString().split('T')[0];
        }

        return {
          id: item.schedule_seq.toString(),
          title: item.title,
          start: isMeeting && startTime ? `${startDate}T${startTime}` : startDate,
          end: isMeeting && endTime ? `${endDate}T${endTime}` : displayEnd,
          allDay: isMeeting ? false : !isSameDay, // 하루면 false(점), 이틀 이상이면 true(바)
          order: isMeeting ? 2 : (isSameDay ? 1 : 0),
          extendedProps: {
            category: item.schedule_type,
            description: item.sked_reason,
            is_public: item.is_public,
            show_in_company: item.show_in_company,
            actualEnd: endDate, // 화면 표시용 실제 종료일
            actualEndTime: endTime,
          },
          category: item.schedule_type,
          color: filter?.color ?? '#3530B8',
        };
      });

      // 연차 매핑
      const vacEvents = vacResp.data.map(item => {        
        const filter = PERSONAL_FILTERS.find(f => f.key === 'ANNUAL');
        const startDate = item.start_dt?.split(/[T ]/)[0];
        const endDate = item.end_dt?.split(/[T ]/)[0];
        const isSameDay = startDate === endDate;
        let displayEnd = undefined;
        if (endDate && !isSameDay) {
          const d = new Date(endDate);
          d.setDate(d.getDate() + 1);
          displayEnd = d.toISOString().split('T')[0];
        }       
        return {
          id: `vac_${item.schedule_seq}`,  // SCHEDULES seq와 충돌 방지
          title: item.title,
          start: startDate,
          end: displayEnd,
          allDay: !isSameDay,
          extendedProps: {
            category: 'ANNUAL',
            description: item.sked_reason,
            is_public: 0,
            actualEnd: endDate,
          },
          category: 'ANNUAL',
          color: filter?.color ?? '#10B981',
        };
      });
        //.some()은 배열에서 조건에 맞는 게 하나라도 있으면 true를 반환
        // allEvents에서 개인 카테고리인 것만 골라내기
        const pEvents = allEvents.filter(e => PERSONAL_FILTERS.some(f => f.key === e.category));
        // allEvents에서 회사 카테고리인 것만 골라내기
        const cEvents = allEvents.filter(e => COMPANY_FILTERS.some(f => f.key === e.category));
        // 개인 일정 중 "공용 캘린더에도 표시" 체크된 것
        const sharedPersonalEvents = pEvents.filter(e => e.extendedProps.show_in_company === 1);
        setPersonalEvents(prev => {
          // 기존 Mock 데이터(ID가 숫자가 아닌 것)와 공휴일은 유지하고, 서버 데이터만 교체
          const persistentEvents = prev.filter(e => 
            //vac은 수정삭제 안됨
            (isNaN(Number(e.id)) && !e.id.startsWith('vac_')) || e.category === 'holiday');
          return [...persistentEvents, ...pEvents, ...vacEvents];
        });

        setCompanyEvents(prev => {
          // 기존 Mock 데이터(ID가 숫자가 아닌 것)와 공휴일은 유지하고, 서버 데이터만 교체
          const persistentEvents = prev.filter(e => isNaN(Number(e.id)) || e.category === 'holiday');
          return [...persistentEvents, ...cEvents, ...sharedPersonalEvents];
        });
      })
      .catch(err => console.error('일정 로드 실패:', err))
      .finally(() => hideLoading());
  }, []);


  useEffect(() => {
    const handleClickOutside = () => setOpenCalendar(null);
    if (openCalendar) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openCalendar]);

  // API에서 공휴일 가져와서 companyEvents에 추가
  const loadHolidaysForYear = useCallback(async (year) => {
    try {
      const holidays = await fetchHolidays(year);//해당 연도 공휴일 1년치
      if (holidays?.length > 0) {
        const addHolidays = (prev) => {
          const existingIds = new Set(prev.map(e => e.id));//기존 이벤트 id 목록
          const mappedHolidays = holidays.map(h => ({
            ...h,
            allDay: true,
            display: 'list-item'
          }));
          return [...prev, ...mappedHolidays.filter(h => !existingIds.has(h.id))];
        };
        setCompanyEvents(addHolidays);  // 기존
        setPersonalEvents(addHolidays); // 추가
      }
    } catch (err) {
      console.error(`${year}년 공휴일 로드 실패:`, err);
    } 
  }, []);

  const getApi = () => calendarRef.current?.getApi();
  // 캘린더 날짜 바뀔 때 2026년 5월 텍스트 업데이트
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
//카테고리가 PERSONAL이라 companyChecked 필터에 안 걸리니, 공유된 일정은 별도로 통과
  const filteredEvents = activeTab === 'personal'
    ? personalEvents.filter(e => personalChecked[e.category])
    : companyEvents.filter(e => {
      // 공유된 개인 일정은 PERSONAL 체크박스로 제어
      if (e.extendedProps?.show_in_company === 1) {
        return companyChecked['PERSONAL'] ?? true;
      }
      return companyChecked[e.category] ?? true;
    });

  // 날짜 클릭 → 추가 모달 열기
  const handleDateClick = (info) => {
    if (activeTab === 'company') return;
    setIsEditing(false);
    setForm({
      schedule_seq: '',
      title: '',
      schedule_type: 'PERSONAL',
      start_dt: info.dateStr,
      end_dt: '',
      sked_reason: '',
      is_public: 0,
      show_in_company: 0 
    });
    setModal({ open: true, date: info.dateStr });
  };
  // 이벤트 클릭 → 상세 모달 열기
  const handleEventClick = (info) => {
    setShowDaily(false);
    setDetailModal({ open: true, event: info.event });
  };
  // 상세 모달에서 수정 버튼 → 수정 모달로 전환
  const handleEditStart = () => {
    const event = detailModal.event;
    setIsEditing(true);
    setForm({
      schedule_seq: event.id,
      title: event.title,
      schedule_type: event.extendedProps.category || 'personal',
      start_dt: event.startStr?.split('T')[0],
      end_dt:(event.extendedProps.actualEnd || event.startStr)?.split(/[T ]/)[0],
      sked_reason: event.extendedProps.description || '',
      is_public: event.extendedProps.is_public || 0,
      show_in_company: event.extendedProps.show_in_company || 0,
    });
    setDetailModal({ open: false, event: null });
    setModal({ open: true, date: event.startStr });
  };
  // 모달에서 저장/완료 → 이벤트 추가 또는 수정
  const handleSaveEvent = () => {
    const isValid = form.title.trim() && form.start_dt && form.end_dt && (form.start_dt <= form.end_dt);
    if (!isValid) return;

    const isPersonalCategory = activeTab === 'personal';
    const filter = [...PERSONAL_FILTERS, ...COMPANY_FILTERS].find(f => f.key === form.schedule_type);

    // 백엔드 전송용 데이터 (DTO 형식)
    const payload = {
      title: form.title,
      schedule_type: form.schedule_type,
      start_dt: form.start_dt ? `${form.start_dt} 00:00:00` : null,
      end_dt: form.end_dt ? `${form.end_dt} 00:00:00` : null,
      sked_reason: form.sked_reason || '',
      is_public: isPersonalCategory ? 0 : 1,
      show_in_company: isPersonalCategory ? form.show_in_company : 0,
    };

    //시작일과 끝일 같냐(당일이냐)
    const isSameDay = form.start_dt === form.end_dt;
    let displayEnd = undefined;
    if (form.end_dt && !isSameDay) {
      const d = new Date(form.end_dt);
      d.setDate(d.getDate() + 1);
      displayEnd = d.toISOString().split('T')[0];//시간 자르기
    }

    const eventData = {
      id: isEditing ? form.schedule_seq : `u${Date.now()}`,
      title: form.title,
      start: form.start_dt,
      end: displayEnd,
      allDay: !isSameDay,
      extendedProps: {
        category: form.schedule_type,
        description: form.sked_reason,
        is_public: form.is_public,
        show_in_company: form.show_in_company,
        actualEnd: form.end_dt
      },
      category: form.schedule_type,
      color: filter?.color ?? '#3530B8',
    };

    const updater = (prev) => isEditing
      ? prev.map(e => e.id === form.schedule_seq ? eventData : e)
      : [...prev, eventData];

if (isEditing) {
  showLoading();
  updateSchedule(form.schedule_seq, payload)
    .then(() => {
      if (isPersonalCategory) {
        setPersonalEvents(updater);
        if (form.show_in_company === 1) {
          setCompanyEvents(prev => {
            const exists = prev.some(e => e.id === form.schedule_seq);
            return exists 
              ? prev.map(e => e.id === form.schedule_seq ? eventData : e)
              : [...prev, eventData];
          });
           calendarStore.setEvents([]);
        } else {
          setCompanyEvents(prev => prev.filter(e => e.id !== form.schedule_seq));
        }
      } else {
        setCompanyEvents(updater);
        calendarStore.setEvents([]);
      }
      setModal({ open: false, date: '' });
      hideLoading();
      alertSuccess('일정 수정 완료', '일정이 성공적으로 수정되었습니다.');
    })
    .catch(err => {
      console.error('일정 수정 실패:', err);
      hideLoading();
      alertError('일정 수정 실패', '일정 수정 중 오류가 발생했습니다.');
    });
} else {
  showLoading();
  createSchedule(payload)
    .then((resp) => {
      const realSeq = resp.data.schedule_seq.toString();
      const realEventData = { ...eventData, id: realSeq };
      if (isPersonalCategory) {
        setPersonalEvents(prev => [...prev, realEventData]);
        if (form.show_in_company === 1) {
          setCompanyEvents(prev => [...prev, realEventData]);
          calendarStore.setEvents([]);
        }
      } else {
        setCompanyEvents(prev => [...prev, realEventData]);
        calendarStore.setEvents([]);
      }
      setModal({ open: false, date: '' });
      hideLoading();
      alertSuccess('일정 추가 완료', '새 일정이 성공적으로 추가되었습니다.');
    })
    .catch(err => {
      console.error('일정 추가 실패:', err);
      hideLoading();
      alertError('일정 추가 실패', '일정 추가 중 오류가 발생했습니다.');
    });
  }
}

  // 폼 유효성 검사 (모든 필드 입력 및 날짜 순서 확인)
  const isFormValid = form.title.trim() && form.start_dt && form.end_dt && (form.start_dt <= form.end_dt);
  // 이벤트 삭제
  const handleDeleteEvent = async (id) => {
    const result = await alertConfirm('일정 삭제', '정말로 이 일정을 삭제하시겠습니까?');
    if (!result.isConfirmed) return;

    // 공용 데이터(숫자 아닌 seq)는 API 호출 안 함
    if (isNaN(Number(id))) {
      setPersonalEvents(prev => prev.filter(e => e.id !== id));
      setCompanyEvents(prev => prev.filter(e => e.id !== id));
      setModal({ open: false, date: '' });
      alertSuccess('일정 삭제 완료', '일정이 성공적으로 삭제되었습니다.');
      return;
    }
    showLoading();
    deleteSchedule(id)
      .then(() => {
        setPersonalEvents(prev => prev.filter(e => e.id !== id));
        setCompanyEvents(prev => prev.filter(e => e.id !== id));
         calendarStore.setEvents([]);
        setModal({ open: false, date: '' });
        hideLoading();
        alertSuccess('일정 삭제 완료', '일정이 성공적으로 삭제되었습니다.');
      })
      .catch(err => {
        console.error('일정 삭제 실패:', err);
        hideLoading();
        alertError('일정 삭제 실패', '일정 삭제 중 오류가 발생했습니다.');
      });
  };

  // --- [Calendar 컴포넌트 내부 맨 밑바닥에 배치할 함수] ---
  function renderInlineCalendar(type) {
    const currentTargetDate = type === 'start' ? form.start_dt : form.end_dt;
    const positionClass = type === 'start' ? 'left-0' : 'right-0';
    const calendarDays = getCustomCalendarDays();

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute z-[100] w-[11.5rem] top-full mt-1 ${positionClass} bg-white border border-gray-100 rounded-xl shadow-2xl p-2.5 animate-in fade-in slide-in-from-top-2 duration-200`}
      >
        {/* 달력 헤더 */}
        <div className="flex items-center justify-between mb-2 px-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); setViewDate(new Date(calendarYear, calendarMonth - 1, 1)); }}
            className="p-1 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-[#3530B8] transition-colors"
          >
            &lt;
          </button>
          <div className="text-[0.6875rem] font-bold text-gray-900">{calendarYear}년 {calendarMonth + 1}월</div>
          <button
            onClick={(e) => { e.stopPropagation(); setViewDate(new Date(calendarYear, calendarMonth + 1, 1)); }}
            className="p-1 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-[#3530B8] transition-colors"
          >
            &gt;
          </button>
        </div>

        {/* 요일 표시 */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['일', '월', '화', '수', '목', '금', '토'].map(d => (
            <div key={d} className="text-[0.5625rem] font-bold text-gray-400 text-center py-0.5">{d}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((d, i) => {
            const isSelected = d && currentTargetDate === `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            return (
              <div
                key={i}
                onClick={() => {
                  if (!d) return;
                  const formattedDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                  if (type === 'end' && form.start_dt && formattedDate < form.start_dt) {
                    setDateError('종료일은 시작일보다 앞일 수 없습니다.');
                    return;
                  }

                  if (type === 'start' && form.end_dt && formattedDate > form.end_dt) {
                    setForm(prev => ({ ...prev, start_dt: formattedDate, end_dt: '' }));
                    setDateError('');
                    setOpenCalendar(null);
                    return;
                  }

                  setDateError('');
                  setForm(prev => ({ ...prev, [type === 'start' ? 'start_dt' : 'end_dt']: formattedDate }));
                  setOpenCalendar(null);
                }}
                className={`text-[0.625rem] font-medium text-center py-1 rounded-lg transition-all
                  ${!d ? 'invisible' : 'cursor-pointer'}
                  ${d && !isSelected ? 'hover:bg-[#F0F4FF] hover:text-[#3530B8] text-slate-600' : ''}
                  ${isSelected ? 'bg-[#3530B8] text-white font-bold' : ''}
                `}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  // --- [renderInlineCalendar 끝] ---

  return (
    <>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 0.25rem;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #E5E7EB;
            border-radius: 0.625rem;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #D1D5DB;
          }
            /* 1. 팝업창 전체 테두리 및 그림자 (모달 느낌으로 변경) */
          .fc-popover {
            border: 0.0625rem solid #E2E8F0 !important; /* slate-200 */
            border-radius: 1rem !important;       /* 부드러운 라운딩 */
            box-shadow: 0 1.25rem 1.5625rem -0.3125rem rgb(0 0 0 / 0.1), 0 0.5rem 0.625rem -0.375rem rgb(0 0 0 / 0.1) !important; /* 서브 모달급 입체감 */
            background: #ffffff !important;
            overflow: hidden;
            animation: popoverFade 0.2s ease-out; /* 부드러운 등장 애니메이션 */
          }

          /* 2. 팝업창 헤더 (날짜 표시 구역) */
          .fc-popover-header {
            background: #F8FAFC !important;       /* slate-50 */
            padding: 0.75rem 1rem !important;
            border-b: 0.0625rem solid #F1F5F9 !important;
            display: flex;
            flex-direction: row-reverse;          /* 제목과 닫기 버튼 위치 밸런스 */
            justify-content: space-between;
            items-center: center;
          }

          /* 헤더 날짜 텍스트 */
          .fc-popover-title {
            font-size: 0.8125rem !important;
            font-weight: 700 !important;
            color: #1E293B !important;            /* slate-800 */
          }
            /* "+1 more" 텍스트 링크 버튼 자체 디자인 */
          .fc-daygrid-more-link {
            font-size: 0.625rem !important;
            font-weight: 700 !important;
            color: #3530B8 !important;            /* 우리 시그니처 블루 색상 */
            background-color: #F0F4FF !important; /* 연한 블루 배경 */
            padding: 0.125rem 0.375rem !important;
            border-radius: 0.375rem !important;
            transition: all 0.2s;
            margin-top: 0.125rem;
            display: inline-block;
          }
          @media (min-width: 1024px) {

            .fc .fc-daygrid-day-frame {
             min-height: 0!important;
            }
            .fc .fc-scroller {
              overflow: hidden !important;
            }
            .fc .fc-scroller-harness {
              overflow: hidden !important;
            }
              /* 마지막 행 잘림 방지 */
            .fc-daygrid-body-unbalanced .fc-daygrid-body-natural {
              overflow: hidden !important;
            }
            .fc .fc-daygrid-day-frame {
              min-height: 5rem !important; /* 원하는 기본 높이값, 직접 조정 가능 */
            }
          }   
        `}
      </style>
      <div className="flex-1 p-4 flex flex-col gap-4 min-h-0 h-full bg-white overflow-y-auto lg:overflow-hidden">
        <div className="px-1">
          <h1 className="text-xl font-bold text-slate-900 leading-tight">캘린더</h1>
          <p className="text-xs text-slate-500 mt-0.5">일정을 한눈에 확인하세요.</p>
        </div>

        <div className="flex gap-1 border-b border-slate-200 px-1">
          {[{ key: 'personal', label: '개인 캘린더' },
          { key: 'company', label: '공용 캘린더' }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-all whitespace-nowrap border border-b-0
                  ${activeTab === tab.key ? 'bg-[#3530B8] text-white border-[#3530B8]' : 'bg-white text-slate-500 border-slate-200'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-2 lg:flex-1 lg:min-h-0 lg:items-stretch lg:overflow-hidden">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col min-w-0 min-h-0 transition-all duration-300 lg:flex-1 lg:shrink ">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => { getApi()?.today(); updateTitle(); }}
                  className="px-2.5 py-1 border border-slate-200 rounded-lg text-[0.6875rem] font-medium bg-white hover:bg-[#DDE8FF] transition-colors">오늘</button>
                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button onClick={() => { getApi()?.prev(); updateTitle(); }}
                    className="px-1.5 py-1 border-r border-slate-200 hover:bg-[#DDE8FF] text-[0.6875rem]">&lt;</button>
                  <button onClick={() => { getApi()?.next(); updateTitle(); }}
                    className="px-1.5 py-1 hover:bg-[#DDE8FF] text-[0.6875rem]">&gt;</button>
                </div>
                <h2 className="text-sm font-bold text-slate-800 ml-1">{currentTitle}</h2>
              </div>
              {(activeTab === 'personal' || (activeTab === 'company' && isHrAdmin)) && (
                <button onClick={() => {
                  const t = new Date().toISOString().split('T')[0];
                  setForm({
                    schedule_seq: '',
                    title: '',
                    schedule_type: activeTab === 'company' ? 'COMPANY' : 'PERSONAL',
                    start_dt: t,
                    end_dt: '',
                    sked_reason: '',
                    is_public: activeTab === 'company' ? 1 : 0,
                    show_in_company: 0 
                  });
                  setIsEditing(false);
                  setModal({ open: true, date: t });
                }} className="px-3 py-1.5 bg-[#3530B8] text-white rounded-lg text-[0.6875rem] font-semibold">+ 일정 추가</button>
              )}
            </div>

            <div className="calendar-container flex-1 min-h-0" style={{
              height: isMobile ? 'auto' : '100%',
              overflow: isMobile ? 'visible' : 'auto'
            }}>
                <style>{`
                @media (max-width: 1024px) {
                  .fc-daygrid-body,
                  .fc-scrollgrid-sync-table {
                    height: auto !important;
                  }
                  /* 추가: 캘린더 전체 높이 강제 해제 */
                  .fc, .fc-view-harness {
                    height: auto !important;
                    min-height: unset !important;
                  }
                  /* 점 이벤트 컨테이너 크기 최소화 */
                  .fc-daygrid-event.fc-daygrid-dot-event {
                    padding: 0 !important;
                  }
                  .fc-daygrid-dot-event .fc-event-title {
                    display: none !important;
                  }
                  .fc-daygrid-more-link {
                    font-size: 0.55rem !important;
                    overflow: hidden !important;
                    max-width: 2rem !important;
                    white-space: nowrap !important;
                    text-overflow: clip !important;
                  }
                }
              `}</style>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale="ko"
                headerToolbar={false}
                stickyHeaderDates={false}  // 헤더 고정 해제 - 스크롤하면 같이 올라감     
                eventOrder="order,-duration,start,title"        
                dayMaxEvents={isMobile ? 1 : 2}
                moreLinkContent={(args) => isMobile ? `+${args.num}` : `+${args.num} more`}
                aspectRatio={isMobile ? 0.8 : undefined}
                height={isMobile ? 'auto' : '100%'}
                expandRows={false} 
                //fixedWeekCount={true}
                fixedWeekCount={false}
                selectable={activeTab === 'personal'}
                events={filteredEvents}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                datesSet={updateTitle}
                displayEventTime={false} // 이벤트 
                // 시간 표시 숨기기
                moreLinkClick={(arg) => {
                  setSelectedDayEvents(arg.allSegs.map(seg => seg.event));
                  setSelectedDayLabel(`${arg.date.getMonth() + 1}월 ${arg.date.getDate()}일`);
                  setShowDaily(true);
                  return 'none'; // 기본 팝업 방지
                }}
              />
            </div>
          </div>

          <aside className={`w-full shrink-0 flex flex-col lg:flex-row-reverse gap-4 lg:gap-2 transition-all duration-300 ${showDaily ? 'lg:w-[32.5rem]' : 'lg:w-64'}`}>
            <div className="w-full lg:w-64 flex flex-col gap-4 lg:gap-2 shrink-0">
              {activeTab === 'personal' ? (
                <>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm lg:flex-1 lg:min-h-0 lg:overflow-hidden max-h-64 lg:max-h-none custom-scrollbar">
                    <MonthlyEvents
                      events={personalEvents.filter(e => e.category !== 'holiday')}
                      currentTitle={currentTitle}
                      title="이달의 내 일정"
                    />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm lg:flex-1 lg:min-h-0 overflow-y-auto mb-4 lg:mb-0">
                    <FilterSection title="개인 캘린더" filters={PERSONAL_FILTERS} checked={personalChecked} onChange={(k, v) => setPersonalChecked(p => ({ ...p, [k]: v }))} />
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm lg:flex-1 lg:min-h-0 lg:overflow-hidden max-h-64 lg:max-h-none custom-scrollbar">
                    <MonthlyEvents events={companyEvents} currentTitle={currentTitle} title="이달의 전사 일정 및 공휴일" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm lg:flex-1 lg:min-h-0 overflow-y-auto mb-4 lg:mb-0">
                    <FilterSection title="회사 공용 캘린더" filters={COMPANY_FILTERS} checked={companyChecked} onChange={(k, v) => setCompanyChecked(p => ({ ...p, [k]: v }))} />
                  </div>
                </>
              )}
            </div>
            <div className={`hidden lg:block bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-hidden transition-all duration-300 ${showDaily ? 'w-64 opacity-100' : 'w-0 opacity-0 p-0 border-0 m-0'}`}>
              {showDaily && (
                <DailyEvents
                  events={selectedDayEvents}
                  title={selectedDayLabel}
                  onClose={() => setShowDaily(false)}
                  onEventClick={handleEventClick}
                />
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* 모바일용 하루 일정 모달 */}
      {isMobile && showDaily && (
        <ModalOverlay onClose={() => setShowDaily(false)}>
          <div style={{ maxHeight: 'calc(80vh - 3rem)', display: 'flex', flexDirection: 'column' }}>
        {/* 헤더 고정 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 shrink-0">
          <h3 className="text-sm font-bold text-slate-800">{selectedDayLabel} 일정</h3>
          <button onClick={() => setShowDaily(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* 스크롤 영역 */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
          <DailyEvents
            events={selectedDayEvents}
            title={selectedDayLabel}
            onClose={() => setShowDaily(false)}
            onEventClick={handleEventClick}
          />
          </div>
          </div>
        </ModalOverlay>
      )}

      {modal.open && (
        <ModalOverlay 
          onClose={() => setModal({ open: false, date: '' })}
          overflow="overflow-visible"
        >
          <h3 className="text-sm font-bold text-slate-800 mb-4">{isEditing ? '일정 수정' : '새 일정 추가'}</h3>
          {/* 제목 */}
          <div className="mb-3">
            <input
              value={form.title}
              onChange={e => {
                if (e.target.value.length <= 66) setForm(f => ({ ...f, title: e.target.value }));
              }}
              placeholder="일정 제목"
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#3530B8]"
            />
            <p className={`text-right text-[0.625rem] mt-0.5 ${form.title.length >= 60 ? 'text-red-400' : 'text-slate-400'}`}>
              {form.title.length}/66
            </p>
          </div>
          {activeTab === 'company' && isHrAdmin ? (
            <div className="relative mb-3 z-20">
              <div
                onClick={() => setIsPermissionOpen(!isPermissionOpen)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs flex justify-between items-center cursor-pointer bg-white hover:border-[#3530B8] transition-colors"
              >
                <span>{COMPANY_FILTERS.find(f => f.key === form.schedule_type)?.label || '카테고리 선택'}</span>
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {isPermissionOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {COMPANY_FILTERS.filter(f => f.key !== 'holiday').map(f => (
                    <div
                      key={f.key}
                      onClick={() => { setForm(prev => ({ ...prev, schedule_type: f.key })); setIsPermissionOpen(false); }}
                      className="px-3 py-2 text-xs hover:bg-[#F0F4FF] cursor-pointer transition-colors flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                      {f.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          {/* 👇 추가: 개인 일정일 때만 노출되는 공유 토글 */}
          {activeTab === 'personal' && (
            <label className="flex items-center gap-2 -mt-3 mb-3 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_in_company === 1}
                onChange={e => setForm(f => ({ ...f, show_in_company: e.target.checked ? 1 : 0 }))}
                className="w-4 h-4 accent-[#3530B8]"
              />
              공용 캘린더에도 표시
            </label>
          )}

          {/* 날짜 선택 영역 (커스텀 달력 팝업 적용) */}
          <div className="flex gap-2 mb-3 overflow-visible relative z-10">

            {/* [시작일 커스텀 달력] */}
            <div className="flex-1 relative">
              <div
                onClick={(e) => { e.stopPropagation(); setOpenCalendar(openCalendar === 'start' ? null : 'start'); }}
                className={`w-full border rounded-lg px-3 py-1.5 text-xs bg-white text-slate-700 flex justify-between items-center cursor-pointer transition-all ${openCalendar === 'start' ? 'border-[#3530B8]' : 'border-slate-300'}`}
              >
                <span className={!form.start_dt ? 'text-slate-400' : 'text-slate-700'}>
                  {form.start_dt || '시작일'}
                </span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              {openCalendar === 'start' && renderInlineCalendar('start')}
            </div>
            {/* [종료일 커스텀 달력] */}
            <div className="flex-1 relative">
              <div
                onClick={(e) => { e.stopPropagation(); setOpenCalendar(openCalendar === 'end' ? null : 'end'); }}
                className={`w-full border rounded-lg px-3 py-1.5 text-xs bg-white text-slate-700 flex justify-between items-center cursor-pointer transition-all ${openCalendar === 'end' ? 'border-[#3530B8]' : 'border-slate-300'}`}
              >
                <span className={!form.end_dt ? 'text-slate-400' : 'text-slate-700'}>
                  {form.end_dt || '종료일'}
                </span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {openCalendar === 'end' && renderInlineCalendar('end')}
            </div>
          </div>
          {dateError && (
            <p className="text-red-500 text-[0.625rem] font-semibold -mt-2 mb-3">{dateError}</p>
          )}
          {/* 설명 */}
          <div className="mb-4">
            <textarea
              value={form.sked_reason}
              onChange={e => {
                if (e.target.value.length <= 100) setForm(f => ({ ...f, sked_reason: e.target.value }));
              }}
              placeholder="일정 설명을 입력하세요"
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs h-20 resize-none focus:outline-none focus:ring-1 focus:ring-[#3530B8] custom-scrollbar pr-3"
            />
            <p className={`text-right text-[0.625rem] mt-0.5 ${form.sked_reason.length >= 90 ? 'text-red-400' : 'text-slate-400'}`}>
              {form.sked_reason.length}/100
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            {isEditing ? (
              <>
                <button onClick={() => handleDeleteEvent(form.schedule_seq)} className="px-4 py-1.5 text-xs text-red-500 font-semibold border border-red-200 rounded-lg hover:bg-red-50">삭제</button>
                <button
                  onClick={handleSaveEvent}
                  disabled={!isFormValid}
                  className={`px-4 py-1.5 text-xs rounded-lg font-semibold transition-colors ${isFormValid ? 'bg-[#3530B8] text-white hover:bg-[#2a2696]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  완료
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setModal({ open: false, date: '' })} className="px-4 py-1.5 text-xs text-slate-500 font-semibold border border-slate-200 rounded-lg hover:bg-slate-50">취소</button>
                <button
                  onClick={handleSaveEvent}
                  disabled={!isFormValid}
                  className={`px-4 py-1.5 text-xs rounded-lg font-semibold transition-colors ${isFormValid ? 'bg-[#3530B8] text-white hover:bg-[#2a2696]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  저장
                </button>
              </>
            )}
          </div>
        </ModalOverlay>
      )}

      {detailModal.open && detailModal.event && (
        <ModalOverlay onClose={() => setDetailModal({ open: false, event: null })}>
          <h3 className="text-sm font-bold mb-4">일정 상세</h3>
          <div className="p-3 mb-4 rounded-lg bg-[#3530B8] text-white text-xs font-semibold break-words"
            style={{ backgroundColor: detailModal.event.backgroundColor || detailModal.event.extendedProps?.color || '#3530B8' }}>{detailModal.event.title}</div>
          <div className="space-y-2 mb-5 text-xs text-slate-600">
            <p><span className="font-semibold">시작:</span> {detailModal.event.startStr.split('T')[0]}</p>

            {/* 회의일 때 시간 표시 */}
            {detailModal.event.extendedProps?.category === 'MEETING' && detailModal.event.startStr.includes('T') && (
              <p><span className="font-semibold">시간:</span> {detailModal.event.startStr.split('T')[1]?.slice(0, 5)}
                {detailModal.event.extendedProps?.actualEndTime && ` ~ ${detailModal.event.extendedProps.actualEndTime.slice(0, 5)}`}
              </p>
            )}

            {detailModal.event.extendedProps?.actualEnd && detailModal.event.startStr.split('T')[0] !== detailModal.event.extendedProps.actualEnd && (
              <p><span className="font-semibold">종료:</span> {detailModal.event.extendedProps.actualEnd}</p>
            )}
            {detailModal.event.extendedProps?.description && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[0.625rem] text-slate-400 mb-1">설명</p>
                <div className="max-h-40 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
                  <p className="text-slate-700 whitespace-pre-wrap break-words">{detailModal.event.extendedProps.description}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDetailModal({ open: false, event: null })} className="px-4 py-1.5 text-xs border rounded-lg text-slate-500 font-semibold hover:bg-slate-50">닫기</button>
            {detailModal.event.extendedProps?.category !== 'ANNUAL' &&
            detailModal.event.extendedProps?.category !== 'PROJECT' &&
            detailModal.event.extendedProps?.category !== 'MEETING' &&
            detailModal.event.extendedProps?.category !== 'holiday' &&
            !(activeTab === 'company' &&                              // ✅ 공용 탭에서
              detailModal.event.extendedProps?.category === 'PERSONAL' &&  // ✅ 개인 일정이고
              detailModal.event.extendedProps?.show_in_company === 1) &&   // ✅ 공유된 것이면 수정 불가
              
            (!COMPANY_CATEGORIES.includes(detailModal.event.extendedProps?.category) || isHrAdmin) && (
              <button onClick={handleEditStart} className="px-4 py-1.5 text-xs bg-[#3530B8] text-white rounded-lg font-semibold">수정</button>
            )}
          </div>
          {/* 공용일정에서 수정 불가 */}
            {activeTab === 'company' &&
            detailModal.event.extendedProps?.category === 'PERSONAL' &&
            detailModal.event.extendedProps?.show_in_company === 1 && (
              <p className="mt-2 text-[0.625rem] text-slate-400 text-right">
                * 공유된 개인 일정은 개인 캘린더에서 수정할 수 있습니다.
              </p>
            )}
          {detailModal.event.extendedProps?.category === 'ANNUAL' && (
            <p className="mt-2 text-[0.625rem] text-slate-400 text-right">* 연차/휴가는 결재 문서를 통해 관리됩니다.</p>
          )}
          {(detailModal.event.extendedProps?.category === 'PROJECT' || detailModal.event.extendedProps?.category === 'MEETING') && (
            <p className="mt-2 text-[0.625rem] text-slate-400 text-right">* 프로젝트 및 회의 일정은 수정할 수 없습니다.</p>
          )}
          {detailModal.event.extendedProps?.category === 'holiday' && (
            <p className="mt-2 text-[0.625rem] text-slate-400 text-right">* 공휴일은 수정할 수 없습니다.</p>
          )}
          {COMPANY_CATEGORIES.includes(detailModal.event.extendedProps?.category) && 
          detailModal.event.extendedProps?.category !== 'holiday' && 
          !isHrAdmin &&
          !(detailModal.event.extendedProps?.category === 'PERSONAL' &&   // ✅ 이 조건 추가
            detailModal.event.extendedProps?.show_in_company === 1) && (
            <p className="mt-2 text-[0.625rem] text-slate-400 text-right">* 공용 일정은 수정할 수 없습니다.</p>
          )}
        </ModalOverlay>
      )}
    </>
  );
};

const DailyEvents = ({ events, title, onClose, onEventClick }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="hidden lg:flex items-center justify-between border-b border-slate-100 pb-2 mb-3 shrink-0">
        <h3 className="text-sm font-bold text-slate-800">{title} 일정</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
        {events.length > 0 ? (
          events.map(e => (
            <div
              key={e.id}
              onClick={() => onEventClick({ event: e })}
              className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer border border-transparent hover:border-slate-100"
            >
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: e.backgroundColor || e.color || '#3530B8' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[0.6875rem] font-semibold text-slate-800 truncate">{e.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.backgroundColor || e.color || '#3530B8' }} />
                  <p className="text-[0.625rem] text-slate-400 capitalize">{e.extendedProps?.category || '일정'}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-8 text-center">
            <p className="text-[0.6875rem] text-slate-400">등록된 일정이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FilterSection = ({ title, filters, checked, onChange }) => (
  <div>
    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">{title}</h3>
    <div className="space-y-3">
      {filters.map(item => (
        <label key={item.key} className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={checked[item.key] ?? true} onChange={e => onChange(item.key, e.target.checked)} className="w-4 h-4 accent-[#3530B8]" />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </label>
      ))}
    </div>
  </div>
);

const ModalOverlay = ({ children, onClose, overflow = "overflow-y-auto overflow-x-hidden" }) => {
  const mouseDownTarget = useRef(null); 
  return(
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onMouseDown={(e) => { mouseDownTarget.current = e.target; }} // ✅ 추가
      onClick={(e) => {
        // ✅ mousedown과 click 모두 overlay여야 닫힘
        if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
          onClose();
        }
      }}
    >
    <div className={`bg-white rounded-2xl p-6 w-full max-w-sm mx-4 max-h-[80vh] ${overflow}`}>
      {children}
    </div>
  </div>
);}



export default Calendar;