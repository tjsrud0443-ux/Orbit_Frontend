import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format, addDays, subDays, startOfDay, parse, addMinutes, isBefore, isWeekend } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserFriends, faChevronLeft, faChevronRight, faCalendarCheck, faClock, faUser, faSearch, faTimes, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { createPortal } from 'react-dom';
import Calendar from '../../components/common/Calendar';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';
import useEmployeeStore from '../../store/useEmployeeStore';
import useLoadingStore from '../../store/useLoadingStore';
import { createReservation, getAllRooms, getReservations } from './meetingRoomsApi';
import { alertWarning, alertSuccess, alertError } from '../../utils/alert';

const MeetingRooms = () => {
  const { user } = useUserStore();
  const token = useAuthStore(state => state.token);
  const { allEmployees, fetchEmployees } = useEmployeeStore();
  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);
  
  const [rooms, setRooms] = useState([]);
  
  const colorPalette = [ '#1ac20b13', '#e3eeff88', '#ffc5d652', '#e0c5ff50', '#ffcd292f'];
  const getColor = (seq) => colorPalette[seq % colorPalette.length];

  const getTime = (dt) => dt.slice(11, 16);
  const getDate = (dt) => dt.slice(0, 10);

  const [events, setEvents] = useState([]);
  const [selectedRoomSeq, setSelectedRoomSeq] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showFormCalendar, setShowFormCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [showStartTimeDropdown, setShowStartTimeDropdown] = useState(false);
  const [showEndTimeDropdown, setShowEndTimeDropdown] = useState(false);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const [showValidation, setShowValidation] = useState(false);
  const searchInputRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowFormCalendar(false);
      }
    };

    if (showFormCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFormCalendar]);

  const [form, setForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    name: '',
    attendees: []
  });

  const selectedRoom = useMemo(() => rooms.find(r => r.room_seq === selectedRoomSeq), [rooms, selectedRoomSeq]);

  const dayEvents = useMemo(() => 
    events.filter(e => 
      e.room_seq === selectedRoomSeq && getDate(e.start_dt) === format(currentDate, 'yyyy-MM-dd')
    ),
    [events, selectedRoomSeq, currentDate]
  );

  const panelEvents = useMemo(() => 
    events.filter(e => 
      e.room_seq === selectedRoomSeq && getDate(e.start_dt) === form.date
    ),
    [events, selectedRoomSeq, form.date]
  );

  const loadRooms = () => {
    showLoading();
    getAllRooms().then(resp => {
      setRooms(resp.data);
    }).catch(err => console.error("회의실 목록 로드 실패:", err))
      .finally(() => {
        hideLoading();
      })
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    getReservations(format(currentDate, 'yyyy-MM-dd'), selectedRoomSeq).then(resp => {
      setEvents(resp.data);
    }).catch(err => console.error("회의 예약 일정 로드 실패: ", err));
  }, [currentDate, selectedRoomSeq]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const timeSlots = [];
  for (let i = 9; i <= 18; i++) {
    timeSlots.push(`${String(i).padStart(2, '0')}:00`);
    if (i < 18) timeSlots.push(`${String(i).padStart(2, '0')}:30`);
  }

  const handlePrevDay = () => {
    const newDate = subDays(currentDate, 1);
    setCurrentDate(newDate);
    setForm(prev => ({...prev, date: format(newDate, 'yyyy-MM-dd')}));
  }
  const handleNextDay = () => {
    const newDate = addDays(currentDate, 1);
    setCurrentDate(newDate);
    setForm(prev => ({...prev, date: format(newDate, 'yyyy-MM-dd')}));
  }
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setForm(prev => ({...prev, date: format(today, 'yyyy-MM-dd')}));
  }

  const isTimeOccupied = (time) => {
    return dayEvents.some(event => {
      return time >= getTime(event.start_dt) && time < getTime(event.end_dt);
    });
  };

  const isPastTime = (time, dateStr) => {
    if (dateStr !== format(new Date(), 'yyyy-MM-dd')) return false;
    const now = format(new Date(), 'HH:mm');
    return time < now;
  };

  const handleTimelineClick = async (time) => {
    if (isWeekend(currentDate)) {
      await alertWarning('예약 불가', '주말에는 회의실을 예약할 수 없습니다.');
      return;
    }
    if (isTimeOccupied(time)) return;
    if (isPastTime(time, format(currentDate, 'yyyy-MM-dd'))) {
      await alertWarning('예약 불가', '이미 지난 시간에는 예약할 수 없습니다.');
      return;
    }
    if (isBefore(startOfDay(currentDate), startOfDay(new Date()))) {
      await alertWarning('예약 불가', '오늘 이전 날짜에는 예약할 수 없습니다.');
      return;
    }

    const nextEvent = dayEvents
      .filter(e => getTime(e.start_dt) > time)
      .sort((a, b) => getTime(a.start_dt).localeCompare(getTime(b.start_dt)))[0];

    const defaultEnd = format(addMinutes(parse(time, 'HH:mm', new Date()), 60), 'HH:mm');

    let endTime = nextEvent && defaultEnd > getTime(nextEvent.start_dt)
      ? getTime(nextEvent.start_dt)
      : defaultEnd;

    if (endTime > '18:00') {
      endTime = '18:00';
    }

    setForm({
      ...form,
      date: format(currentDate, 'yyyy-MM-dd'),
      startTime: time,
      endTime: endTime,
      title: '',
      attendees: []
    });
    setShowValidation(false);
    setIsPanelOpen(true);
  };

  const handleQuickSelect = async (hours) => {
    const start = parse(form.startTime, 'HH:mm', new Date());
    const end = addMinutes(start, hours * 60);
    const endStr = format(end, 'HH:mm');
    
    const hasOverlap = panelEvents.some(event => {
      const eStart = getTime(event.start_dt);
      const eEnd = getTime(event.end_dt);
      return (form.startTime < eEnd && endStr > eStart);
    });

    if (!hasOverlap && endStr <= '18:00') {
      setForm({ ...form, endTime: endStr });
    } else {
      await alertWarning('예약 불가', '해당 시간에 이미 예약이 존재하거나 운영 시간을 벗어납니다.');
    }
  };

  const updatePos = (ref) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (showSearchResults || showStartTimeDropdown || showEndTimeDropdown) {
      const currentRef = showSearchResults ? searchInputRef : 
                         showStartTimeDropdown ? startTimeRef : 
                         endTimeRef;
      
      const update = () => {
        if (currentRef.current) {
          const rect = currentRef.current.getBoundingClientRect();
          setDropdownPos({
            top: rect.bottom,
            left: rect.left,
            width: rect.width
          });
        }
      };

      update();
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
      return () => {
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
      };
    }
  }, [showSearchResults, showStartTimeDropdown, showEndTimeDropdown]);

  const filteredEmployees = searchQuery 
    ? allEmployees.filter(emp => {
        const name = emp?.name || '';
        const deptName = emp?.dept_name || '';
        const isMe = emp.id === user?.id;
        return !isMe && (name.includes(searchQuery) || deptName.includes(searchQuery));
      }) 
    : [];

  const handleAddAttendee = (emp) => {
    if (form.attendees.some(a => a.users_seq === emp.users_seq)) {
      setSearchQuery('');
      setShowSearchResults(false);
      alertWarning('중복 입력', '이미 추가된 참석자입니다.');
      return;
    }
    setForm({ ...form, attendees: [...form.attendees, emp] });
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleRemoveAttendee = (users_seq) => {
    setForm({ ...form, attendees: form.attendees.filter(a => a.users_seq !== users_seq) });
  };

  const handleReserve = async () => {
    setShowValidation(true);
    if (!form.title.trim() || form.title.length > 20) {
      return;
    }
    if (form.attendees.length > (selectedRoom?.max_people || 0)) {
      return;
    }
    if (!form.date) {
      await alertWarning('정보 미입력', '예약일을 선택해주세요.');
      return;
    }
    if (isWeekend(parse(form.date, 'yyyy-MM-dd', new Date()))) {
      await alertWarning('예약 불가', '주말에는 회의실을 예약할 수 없습니다.');
      return;
    }
    if (isBefore(parse(form.date, 'yyyy-MM-dd', new Date()), startOfDay(new Date()))) {
      return;
    }
    if (!form.startTime) {
      alert('시작 시간을 선택해주세요.');
      await alertWarning('정보 미입력', '시작 시간을 선택해주세요.');
      return;
    }
    if (!form.endTime) {
      alert('종료 시간을 선택해주세요.');
      await alertWarning('정보 미입력', '종료 시간을 선택해주세요.');
      return;
    }
    if (form.startTime >= form.endTime) {
      return;
    }

    const hasConflict = panelEvents.some(event => {
      const eStart = getTime(event.start_dt);
      const eEnd = getTime(event.end_dt);
      return form.startTime < eEnd && form.endTime > eStart;
    });

    if (hasConflict) {
      await alertWarning('예약 불가', '해당 시간에 이미 예약이 존재합니다.');
      return;
    }

    const newEvent = {
      room_seq: selectedRoomSeq,
      title: form.title,
      start_dt: `${form.date} ${form.startTime}:00`,
      end_dt: `${form.date} ${form.endTime}:00`,
      attendees: form.attendees.map(a => ({ users_id: a.id }))
    };

    try {
      await createReservation(newEvent);
      const resp = await getReservations(format(currentDate, 'yyyy-MM-dd'), selectedRoomSeq);
      setEvents(resp.data);
      setIsPanelOpen(false);
      setShowValidation(false);
      await alertSuccess('예약 완료', '회의실 예약이 완료되었습니다.<br>캘린더에서 일정을 확인하세요.');
    } catch(error) {
      if (error.response?.data?.message === 'CONFLICT') {
        await alertError('예약 실패', '다른 사용자가 방금 동 시간대에 예약했습니다.<br>예약 현황을 다시 확인해주세요.');
        const resp = await getReservations(format(currentDate, 'yyyy-MM-dd'), selectedRoomSeq);
        setEvents(resp.data);
      } else {
        console.error('회의실 예약 실패: ', error);
        await alertError('예약 실패', '회의실 예약에 실패했습니다.');
      }
    }
  };

  const isDateInvalid = form.date && isBefore(parse(form.date, 'yyyy-MM-dd', new Date()), startOfDay(new Date()));
  const isTitleInvalid = (showValidation && !form.title.trim()) || form.title.length > 20;
  const isAttendeeLimitExceeded = form.attendees.length > (selectedRoom?.max_people || 0);
  const isTimeInvalid = form.startTime >= form.endTime;

  return (
    <div className={`h-full flex flex-col ${isPanelOpen ? 'p-0 md:p-8' : 'p-6 md:p-8'} bg-[#FFFFFF] overflow-hidden font-sans`}>
      
      <div className={`mb-6 flex-shrink-0 ${isPanelOpen ? 'hidden md:block' : 'block'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#3530B8] rounded-full"></div>
              회의실 예약
            </h1>
            <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
              회의실의 예약 현황을 확인하고 예약할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        <div className={`flex flex-col min-h-0 overflow-hidden transition-all duration-500 ${isPanelOpen ? 'hidden md:flex md:flex-[0.6]' : 'flex-1'}`}>
          <div className="flex-shrink-0 mb-6 flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {rooms.map(room => (
              <div 
                key={room.room_seq}
                onClick={() => setSelectedRoomSeq(room.room_seq)}
                className={`flex-shrink-0 ${isPanelOpen ? 'w-32 md:w-48' : 'w-36 md:w-60'} bg-white rounded-2xl md:rounded-3xl border transition-all duration-500 cursor-pointer group overflow-hidden
                  ${selectedRoomSeq === room.room_seq 
                    ? 'border-[#3530B8] ring-4 ring-[#3530B8]/10 shadow-xl shadow-[#3530B8]/10' 
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}
              >
                <div className={`transition-all duration-500 ${isPanelOpen ? 'h-16 md:h-28' : 'h-20 md:h-32'} bg-gray-100 flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  {room.sysname ? (
                    <img 
                      src={`http://api.sukong.shop/file/profile/view?sysname=${room.sysname}&token=${token}`}
                      alt={room.room_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUserFriends} className="text-gray-300 text-2xl md:text-4xl" />
                  )}
                </div>
                <div className="p-2 md:p-4 relative">
                  <h3 className="text-[11px] md:text-base font-bold text-gray-900 mb-0.5 group-hover:text-[#3530B8] transition-colors truncate pr-6 md:pr-10">{room.room_name}</h3>
                  <div className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[11px] text-gray-400 font-medium">
                    <FontAwesomeIcon icon={faUserFriends} className="text-gray-300" />
                    최대 {room.max_people}명
                  </div>
                  <div className="absolute right-2 bottom-2 md:right-4 md:top-10 md:bottom-auto bg-[#F0F4FF] px-1.5 py-0.5 rounded-md text-[8px] md:text-[10px] font-bold text-[#3530B8] shadow-sm">
                    {room.room_floor}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 bg-white rounded-[2rem] border border-[#F0F4FF] shadow-sm p-4 md:p-8 flex flex-col min-h-0 overflow-hidden">
            <div className="flex flex-row md:items-center justify-between mb-4 md:mb-8 flex-shrink-0 gap-4">
              <h2 className="text-sm md:text-base font-bold text-gray-900 hidden md:flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="text-[#3530B8]" />
                {selectedRoom?.room_name} 예약 현황
              </h2>
              
              <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                <div className="flex items-center gap-1 bg-gray-50 p-0.5 md:p-1 rounded-xl border border-gray-100">
                  <button onClick={handlePrevDay} className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-400 transition-all cursor-pointer">
                    <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
                  </button>
                  <button onClick={handleToday} className="px-2 md:px-3 py-1 text-[10px] font-bold text-[#3530B8] hover:bg-white hover:shadow-sm rounded-lg transition-all cursor-pointer whitespace-nowrap">
                    오늘
                  </button>
                  <button onClick={handleNextDay} className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-400 transition-all cursor-pointer">
                    <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                  </button>
                </div>
                <div className="text-[10px] md:text-sm font-bold text-gray-800 flex items-center gap-1 md:gap-2 whitespace-nowrap">
                  <FontAwesomeIcon icon={faCalendarCheck} className="text-[#3530B8]" />
                  {format(currentDate, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2 md:pb-6">
              <div className="min-w-[1000px] h-full flex flex-col relative pt-8 md:pt-10">
                <div className="absolute top-0 left-0 right-0 flex border-b border-gray-50 pb-2">
                  {timeSlots.map((time, idx) => (
                    <div key={idx} className="flex-1 text-[9px] md:text-[10px] font-bold text-gray-400 text-center">
                      {time}
                    </div>
                  ))}
                </div>

                <div className="flex-1 flex relative bg-gray-50/30 rounded-2xl overflow-hidden border border-gray-50">
                  {timeSlots.map((time, idx) => {
                    const isOccupied = isTimeOccupied(time);
                    const isPast = isPastTime(time, format(currentDate, 'yyyy-MM-dd'));
                    const isEndTime = time >= '18:00';
                    const isWeekendDay = isWeekend(currentDate);
                    const isDisabled = isOccupied || isEndTime || isWeekendDay;

                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          if (isDisabled) return;
                          handleTimelineClick(time);
                        }}
                        className={`flex-1 border-r border-gray-100/50 transition-all 
                          ${isDisabled ? 'bg-transparent cursor-default' : 
                            isPast ? 'cursor-pointer' : 
                            'hover:bg-[#F0F4FF]/50 cursor-pointer'}`}
                      />
                    );
                  })}

                  {dayEvents.map(event => {
                    const startIndex = timeSlots.indexOf(getTime(event.start_dt));
                    const endIndex = timeSlots.indexOf(getTime(event.end_dt));
                    const width = ((endIndex - startIndex) / timeSlots.length) * 100;
                    const left = (startIndex / timeSlots.length) * 100;

                    return (
                      <div 
                        key={event.rsvn_seq}
                        className="absolute top-2 md:top-10 bottom-2 md:bottom-10 bg-[#3530B8] rounded-xl shadow-lg shadow-gray-400/25 p-2 md:p-4 flex flex-col justify-center border-l-4 border-white/20 overflow-hidden"
                        style={{ left: `${left}%`, width: `${width}%`, zIndex: 10 , backgroundColor: getColor(event.rsvn_seq) }}
                      >
                        <div className="text-black text-[10px] md:text-xs font-bold truncate mb-0.5">{event.title}</div>
                        <div className="text-black/80 text-[8px] md:text-[10px] font-medium truncate">
                          {getTime(event.start_dt)} - {getTime(event.end_dt)} | {event.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isPanelOpen && (
          <div className={`flex flex-col bg-white rounded-none md:rounded-[2rem] border-0 md:border border-[#F0F4FF] shadow-sm overflow-hidden min-h-0 animate-in slide-in-from-right duration-500 flex-1 md:flex-[0.4]`}>
             <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900">신규 회의 예약</h2>
                <button onClick={() => { setIsPanelOpen(false); setShowFormCalendar(false); setShowValidation(false); }} className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">회의명</label>
                    <input 
                      type="text" 
                      placeholder="회의명을 입력하세요"
                      className={`w-full px-5 py-3.5 bg-gray-50 border ${isTitleInvalid ? 'border-red-500' : 'border-gray-100'} rounded-2xl focus:bg-white focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all text-sm font-bold text-gray-700`}
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                    {isTitleInvalid && (
                      <p className="text-[10px] text-red-500 font-bold ml-1">
                        {form.title.length > 20 ? "20자까지만 입력 가능합니다." : "회의명을 입력해주세요."}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">회의실명</label>
                      <div className="px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-500">
                        {selectedRoom?.room_name}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">예약자</label>
                      <div className="px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-500 flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-gray-300" />
                        {user?.id || '사용자'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-[#3530B8] uppercase ml-1 tracking-widest">날짜 및 시간 설정</h3>
                  
                  <div className="space-y-1.5 relative" ref={calendarRef}>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">예약일</label>
                    <div 
                      onClick={() => setShowFormCalendar(!showFormCalendar)}
                      className={`w-full px-5 py-3.5 bg-gray-50 border ${isDateInvalid ? 'border-red-500' : 'border-gray-100'} rounded-2xl text-sm font-bold text-gray-700 flex items-center justify-between cursor-pointer hover:border-[#3530B8] transition-all`}
                    >
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                        {form.date}
                      </div>
                      <FontAwesomeIcon icon={faChevronRight} className={`text-[10px] text-gray-300 transition-transform ${showFormCalendar ? 'rotate-90' : ''}`} />
                    </div>
                    {isDateInvalid && (
                      <p className="text-[10px] text-red-500 font-bold ml-1">오늘 이 전 날짜는 선택 불가합니다.</p>
                    )}
                    {showFormCalendar && (
                      <div className="absolute bottom-5 left-0 right-4 z-50 p-4">
                        <Calendar 
                          value={form.date} 
                          onChange={(date) => 
                            { setForm({ ...form, date }); 
                              setShowFormCalendar(false); 
                              setCurrentDate(parse(date, 'yyyy-MM-dd', new Date()));
                            }} 
                          onClose={() => setShowFormCalendar(false)} 
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">시작 시간</label>
                      <div 
                        ref={startTimeRef}
                        onClick={() => setShowStartTimeDropdown(!showStartTimeDropdown)}
                        className={`w-full px-5 py-3.5 bg-gray-50 border ${isTimeInvalid ? 'border-red-500' : 'border-gray-100'} rounded-2xl text-sm font-bold text-gray-700 flex items-center justify-between cursor-pointer hover:border-[#3530B8] transition-all`}
                      >
                         {form.startTime}
                         <FontAwesomeIcon icon={faChevronRight} className={`text-[10px] text-gray-300 transition-transform ${showStartTimeDropdown ? 'rotate-90' : ''}`} />
                      </div>
                      {showStartTimeDropdown && createPortal(
                        <>
                          <div className="fixed inset-0 z-[9998]" onClick={() => setShowStartTimeDropdown(false)} />
                          <div 
                            className="fixed z-[9999] bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95"
                            style={{ top: `${dropdownPos.top + 8}px`, left: `${dropdownPos.left}px`, width: `${dropdownPos.width}px` }}
                          >
                            {timeSlots.filter(t => t <= '17:30').map(time => {
                              const isOccupied = panelEvents.some(e =>
                                time >= getTime(e.start_dt) && time < getTime(e.end_dt)
                              );
                              const isPast = isPastTime(time, form.date);
                              const isDisabled = isOccupied || isPast;
                              return (
                                <div 
                                  key={time} 
                                  onClick={() => {
                                    if (isDisabled) return;
                                    setForm({ ...form, startTime: time });
                                    setShowStartTimeDropdown(false);
                                  }}
                                  className={`p-4 hover:bg-[#F0F4FF] cursor-pointer text-xs font-bold border-b border-gray-50 last:border-0 ${form.startTime === time ? 'bg-[#F0F4FF]' : ''} ${isDisabled ? 'text-gray-300 cursor-default' : 'text-gray-700'}`}
                                >
                                  {time} {isOccupied ? '(예약됨)' : ''}
                                </div>
                              );
                            })}
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">종료 시간</label>
                      <div 
                        ref={endTimeRef}
                        onClick={() => setShowEndTimeDropdown(!showEndTimeDropdown)}
                        className={`w-full px-5 py-3.5 bg-gray-50 border ${isTimeInvalid ? 'border-red-500' : 'border-gray-100'} rounded-2xl text-sm font-bold text-gray-700 flex items-center justify-between cursor-pointer hover:border-[#3530B8] transition-all`}
                      >
                         {form.endTime}
                         <FontAwesomeIcon icon={faChevronRight} className={`text-[10px] text-gray-300 transition-transform ${showEndTimeDropdown ? 'rotate-90' : ''}`} />
                      </div>
                      {showEndTimeDropdown && createPortal(
                        <>
                          <div className="fixed inset-0 z-[9998]" onClick={() => setShowEndTimeDropdown(false)} />
                          <div 
                            className="fixed z-[9999] bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95"
                            style={{ top: `${dropdownPos.top + 8}px`, left: `${dropdownPos.left}px`, width: `${dropdownPos.width}px` }}
                          >
                            {timeSlots.concat('18:30').filter(t => t >= '09:30' && t <= '18:00').map(time => {
                              const isBeforeStart = time <= form.startTime;
                              const hasOverlap = panelEvents.some(event => {
                                return (form.startTime < getTime(event.end_dt) && time > getTime(event.start_dt));
                              });
                              const isPast = isPastTime(time, form.date);
                              const isDisabled = isBeforeStart || hasOverlap || isPast;

                              return (
                                <div 
                                  key={time} 
                                  onClick={() => {
                                    if (isDisabled) return;
                                    setForm({ ...form, endTime: time });
                                    setShowEndTimeDropdown(false);
                                  }}
                                  className={`p-4 hover:bg-[#F0F4FF] cursor-pointer text-xs font-bold border-b border-gray-50 last:border-0 ${form.endTime === time ? 'bg-[#F0F4FF]' : ''} ${isDisabled ? 'text-gray-300 cursor-default' : 'text-gray-700'}`}
                                >
                                  {time}
                                </div>
                              );
                            })}
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                  </div>
                  {isTimeInvalid && (
                    <p className="text-[10px] text-red-500 font-bold ml-1">종료 시간은 시작 시간보다 늦어야 합니다.</p>
                  )}

                  <div className="flex gap-2">
                    {[1, 1.5, 2].map(h => {
                      const start = parse(form.startTime, 'HH:mm', new Date());
                      const end = addMinutes(start, h * 60);
                      const endStr = format(end, 'HH:mm');
                      const hasOverlap = panelEvents.some(event => {
                        return (form.startTime < getTime(event.end_dt) && endStr > getTime(event.start_dt));
                      });
                      const isInvalid = hasOverlap || endStr > '18:00';

                      return (
                        <button 
                          key={h}
                          onClick={() => handleQuickSelect(h)}
                          disabled={isInvalid}
                          className={`flex-1 py-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer
                            ${isInvalid 
                              ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                              : 'bg-white text-gray-500 border-gray-100 hover:border-[#3530B8] hover:text-[#3530B8]'}`}
                        >
                          {h}시간
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">참석자 선택</h3>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                      <FontAwesomeIcon icon={faSearch} className="text-xs" />
                    </div>
                    <input 
                      ref={searchInputRef}
                      type="text" 
                      placeholder="이름 또는 부서 검색"
                      className={`w-full pl-12 pr-5 py-3.5 bg-white border ${isAttendeeLimitExceeded ? 'border-red-500' : 'border-gray-200'} rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-[#3530B8] transition-all`}
                      value={searchQuery}
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        setShowSearchResults(true);
                        updatePos(searchInputRef);
                      }}
                      onFocus={() => {
                        setShowSearchResults(true);
                        updatePos(searchInputRef);
                      }}
                    />
                    
                    {showSearchResults && searchQuery && createPortal(
                      <div 
                        className="fixed z-[9999] bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95"
                        style={{ top: `${dropdownPos.top + 8}px`, left: `${dropdownPos.left}px`, width: `${dropdownPos.width}px` }}
                      >
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map(emp => (
                            <div 
                              key={emp.users_seq} 
                              onClick={() => handleAddAttendee(emp)}
                              className="p-4 hover:bg-[#F0F4FF] cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-700">{emp.name}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{emp.dept_name}</span>
                              </div>
                              <span className="text-[10px] font-bold text-[#3530B8] bg-[#F0F4FF] px-2.5 py-1 rounded-full">{emp.rank_name}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-xs text-gray-400 font-medium">검색 결과가 없습니다.</div>
                        )}
                      </div>,
                      document.body
                    )}
                    {showSearchResults && searchQuery && (
                      <div className="fixed inset-0 z-[9998]" onClick={() => setShowSearchResults(false)} />
                    )}
                  </div>
                  {isAttendeeLimitExceeded && (
                    <p className="text-[10px] text-red-500 font-bold ml-1">해당 회의실의 최대 인원수는 {selectedRoom?.max_people}명입니다.</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {form.attendees.map(attendee => (
                      <div key={attendee.users_seq} className="flex items-center gap-2 bg-[#F8FAFF] border border-[#F0F4FF] pl-3 pr-2 py-2 rounded-full text-[10px] font-bold text-[#3530B8] animate-in zoom-in-95 shadow-sm">
                        <span>{attendee.name}</span>
                        <button onClick={() => handleRemoveAttendee(attendee.users_seq)} className="w-4 h-4 rounded-full hover:bg-[#3530B8] hover:text-white transition-all flex items-center justify-center cursor-pointer">
                          <FontAwesomeIcon icon={faTimes} className="text-[8px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
             </div>

             <div className="p-8 border-t border-gray-50 flex gap-4 bg-white flex-shrink-0">
                <button 
                  onClick={() => { setIsPanelOpen(false); setShowFormCalendar(false); setShowValidation(false); }}
                  className="flex-1 py-4 border-2 border-gray-100 text-gray-400 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  취소
                </button>
                <button 
                  onClick={handleReserve}
                  className="flex-[2] py-4 bg-[#3530B8] text-white text-sm font-bold rounded-2xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  예약하기
                </button>
             </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
    </div>
  );
};

export default MeetingRooms;
