import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format, addDays, subDays, startOfDay, parse, isWithinInterval, addMinutes, isBefore, isAfter, isEqual } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserFriends, faChevronLeft, faChevronRight, faCalendarCheck, faClock, faUser, faSearch, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { createPortal } from 'react-dom';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';
import useEmployeeStore from '../../store/useEmployeeStore';

const MeetingRooms = () => {
  const { user } = useUserStore();
  const { allEmployees, fetchEmployees } = useEmployeeStore();
  
  // --- Mock Data ---
  // TODO: API로 교체 - getAllRooms()
  const [rooms, setRooms] = useState([
    { room_seq: 1, room_name: '대회의실 A', max_people: 12, room_floor: '12층', sysname: null },
    { room_seq: 2, room_name: '중회의실 B', max_people: 8, room_floor: '12층', sysname: null },
    { room_seq: 3, room_name: '소회의실 C', max_people: 4, room_floor: '11층', sysname: null },
    { room_seq: 4, room_name: '집중협업실 1', max_people: 4, room_floor: '11층', sysname: null },
    { room_seq: 5, room_name: '집중협업실 2', max_people: 4, room_floor: '11층', sysname: null },
  ]);

  // TODO: API로 교체 - getReservations(date, room_seq)
  const [events, setEvents] = useState([
    { id: 1, room_seq: 1, title: '주간 전략 회의', startTime: '10:00', endTime: '11:30', user_name: '김철수' },
    { id: 2, room_seq: 1, title: '디자인 싱킹 워크숍', startTime: '14:00', endTime: '16:00', user_name: '이영희' },
    { id: 3, room_seq: 2, title: '팀 프로젝트 데일리', startTime: '09:30', endTime: '10:30', user_name: '박지민' },
  ]);

  // --- States ---
  const [selectedRoomSeq, setSelectedRoomSeq] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const [form, setForm] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    attendees: []
  });

  const selectedRoom = useMemo(() => rooms.find(r => r.room_seq === selectedRoomSeq), [rooms, selectedRoomSeq]);
  const dayEvents = useMemo(() => events.filter(e => e.room_seq === selectedRoomSeq), [events, selectedRoomSeq]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // --- Helpers ---
  const timeSlots = [];
  for (let i = 9; i <= 18; i++) {
    timeSlots.push(`${String(i).padStart(2, '0')}:00`);
    if (i < 18) timeSlots.push(`${String(i).padStart(2, '0')}:30`);
  }

  const handlePrevDay = () => setCurrentDate(subDays(currentDate, 1));
  const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const isTimeOccupied = (time) => {
    return dayEvents.some(event => {
      return time >= event.startTime && time < event.endTime;
    });
  };

  const handleTimelineClick = (time) => {
    if (isTimeOccupied(time)) return;
    setForm({
      ...form,
      startTime: time,
      endTime: format(addMinutes(parse(time, 'HH:mm', new Date()), 60), 'HH:mm'),
      title: '',
      attendees: []
    });
    setIsPanelOpen(true);
  };

  const handleQuickSelect = (hours) => {
    const start = parse(form.startTime, 'HH:mm', new Date());
    const end = addMinutes(start, hours * 60);
    const endStr = format(end, 'HH:mm');
    
    // Check if new end time causes overlap
    const hasOverlap = dayEvents.some(event => {
      const eStart = event.startTime;
      const eEnd = event.endTime;
      return (form.startTime < eEnd && endStr > eStart);
    });

    if (!hasOverlap && endStr <= '18:00') {
      setForm({ ...form, endTime: endStr });
    } else {
      alert('해당 시간에는 이미 예약이 존재하거나 운영 시간을 벗어납니다.');
    }
  };

  const updateDropdownPos = useCallback(() => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  }, []);

  const filteredEmployees = searchQuery 
    ? allEmployees.filter(emp => {
        const name = emp?.name || '';
        const deptName = emp?.dept_name || '';
        return name.includes(searchQuery) || deptName.includes(searchQuery);
      }) 
    : [];

  const handleAddAttendee = (emp) => {
    if (form.attendees.some(a => a.users_seq === emp.users_seq)) return;
    setForm({ ...form, attendees: [...form.attendees, emp] });
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleRemoveAttendee = (users_seq) => {
    setForm({ ...form, attendees: form.attendees.filter(a => a.users_seq !== users_seq) });
  };

  const handleReserve = () => {
    if (!form.title.trim()) {
      alert('회의 제목을 입력해주세요.');
      return;
    }
    // TODO: API로 교체 - createReservation()
    const newEvent = {
      id: Date.now(),
      room_seq: selectedRoomSeq,
      title: form.title,
      startTime: form.startTime,
      endTime: form.endTime,
      user_name: user?.name || '나'
    };
    setEvents([...events, newEvent]);
    setIsPanelOpen(false);
    alert('예약이 완료되었습니다.');
  };

  return (
    <div className={`h-full flex flex-col ${isPanelOpen ? 'p-0 md:p-8' : 'p-6 md:p-8'} bg-[#FFFFFF] overflow-hidden font-sans`}>
      
      {/* Header Section */}
      <div className={`mb-6 flex-shrink-0 ${isPanelOpen ? 'hidden md:block' : 'block'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#3530B8] rounded-full"></div>
              회의실 예약
            </h1>
            <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
              회의실의 예약 현황을 확인하고 예약할 수 있습니다.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1">
              <button onClick={handlePrevDay} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-400 transition-all cursor-pointer">
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              </button>
              <button onClick={handleToday} className="px-4 py-1.5 text-xs font-bold text-[#3530B8] hover:bg-[#F0F4FF] rounded-xl transition-all cursor-pointer">
                오늘
              </button>
              <button onClick={handleNextDay} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-400 transition-all cursor-pointer">
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>
            </div>
            <div className="h-4 w-[1px] bg-gray-100 mx-1 flex-shrink-0"></div>
            <div className="px-4 text-[0.6875rem] md:text-sm font-bold text-gray-700 flex items-center gap-2 whitespace-nowrap">
              <FontAwesomeIcon icon={faCalendarCheck} className="text-[#3530B8]" />
              {format(currentDate, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        
        {/* Left Section: Cards and Timeline */}
        <div className={`flex flex-col min-h-0 overflow-hidden transition-all duration-500 ${isPanelOpen ? 'hidden md:flex md:flex-[0.6]' : 'flex-1'}`}>
          {/* Room Cards */}
          <div className="flex-shrink-0 mb-6 flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {rooms.map(room => (
              <div 
                key={room.room_seq}
                onClick={() => setSelectedRoomSeq(room.room_seq)}
                className={`flex-shrink-0 w-52 md:w-60 bg-white rounded-3xl border transition-all cursor-pointer group overflow-hidden
                  ${selectedRoomSeq === room.room_seq 
                    ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5 shadow-xl shadow-[#3530B8]/10' 
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}
              >
                <div className="h-28 md:h-32 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <FontAwesomeIcon icon={faUserFriends} className="text-gray-300 text-3xl md:text-4xl" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-bold text-[#3530B8] shadow-sm">
                    {room.room_floor}
                  </div>
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1 group-hover:text-[#3530B8] transition-colors truncate">{room.room_name}</h3>
                  <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-gray-400 font-medium">
                    <FontAwesomeIcon icon={faUserFriends} className="text-gray-300" />
                    최대 {room.max_people}명 수용
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="flex-1 bg-white rounded-[2rem] border border-[#F0F4FF] shadow-sm p-6 md:p-8 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-8 flex-shrink-0">
              <h2 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="text-[#3530B8]" />
                {selectedRoom?.room_name} 예약 현황
              </h2>
              <div className="hidden sm:flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-[#F0F4FF] rounded-sm"></div>
                  <span className="text-[10px] md:text-[11px] font-bold text-gray-400">예약 가능</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-[#3530B8]/10 rounded-sm"></div>
                  <span className="text-[10px] md:text-[11px] font-bold text-gray-400">이미 예약됨</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-6">
              <div className="min-w-[1000px] h-full flex flex-col relative pt-10">
                {/* Time Axis */}
                <div className="absolute top-0 left-0 right-0 flex border-b border-gray-50 pb-2">
                  {timeSlots.map((time, idx) => (
                    <div key={idx} className="flex-1 text-[9px] md:text-[10px] font-bold text-gray-300 text-center">
                      {time}
                    </div>
                  ))}
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 flex relative bg-gray-50/30 rounded-2xl overflow-hidden border border-gray-50">
                  {timeSlots.map((time, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleTimelineClick(time)}
                      className={`flex-1 border-r border-gray-100/50 transition-all cursor-pointer
                        ${isTimeOccupied(time) ? 'bg-transparent cursor-default' : 'hover:bg-[#F0F4FF]/50'}`}
                    />
                  ))}

                  {/* Occupied Slots */}
                  {dayEvents.map(event => {
                    const startIndex = timeSlots.indexOf(event.startTime);
                    const endIndex = timeSlots.indexOf(event.endTime);
                    const width = ((endIndex - startIndex) / timeSlots.length) * 100;
                    const left = (startIndex / timeSlots.length) * 100;

                    return (
                      <div 
                        key={event.id}
                        className="absolute top-2 bottom-2 bg-[#3530B8] rounded-xl shadow-lg shadow-[#3530B8]/20 p-3 md:p-4 flex flex-col justify-center border-l-4 border-white/20 overflow-hidden"
                        style={{ left: `${left}%`, width: `${width}%`, zIndex: 10 }}
                      >
                        <div className="text-white text-[10px] md:text-xs font-bold truncate mb-0.5">{event.title}</div>
                        <div className="text-white/60 text-[9px] md:text-[10px] font-medium truncate">
                          {event.startTime} - {event.endTime} | {event.user_name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Reservation Form (Panel) */}
        {isPanelOpen && (
          <div className={`flex flex-col bg-white rounded-none md:rounded-[2rem] border-0 md:border border-[#F0F4FF] shadow-sm overflow-hidden min-h-0 animate-in slide-in-from-right duration-500 flex-1 md:flex-[0.4]`}>
             <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900">신규 회의 예약</h2>
                <button onClick={() => setIsPanelOpen(false)} className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">회의명</label>
                    <input 
                      type="text" 
                      placeholder="회의명을 입력하세요"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all text-sm font-bold text-gray-700"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                    />
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

                {/* Time Selection */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-[#3530B8] uppercase ml-1 tracking-widest">시간 설정</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">시작 시간</label>
                      <select 
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none"
                        value={form.startTime}
                        onChange={e => setForm({ ...form, startTime: e.target.value })}
                      >
                        {timeSlots.map(time => (
                          <option key={time} value={time} disabled={isTimeOccupied(time)}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">종료 시간</label>
                      <select 
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none"
                        value={form.endTime}
                        onChange={e => setForm({ ...form, endTime: e.target.value })}
                      >
                        {timeSlots.concat('18:30').map(time => {
                          const isBeforeStart = time <= form.startTime;
                          const hasOverlap = dayEvents.some(event => {
                            return (event.startTime >= form.startTime && time > event.startTime);
                          });
                          const isDisabled = isBeforeStart || hasOverlap;

                          return (
                            <option 
                              key={time} 
                              value={time} 
                              disabled={isDisabled}
                              style={isDisabled ? { color: '#ccc', backgroundColor: '#f9f9f9' } : {}}
                            >
                              {time} {hasOverlap ? '(예약 불가)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {[1, 1.5, 2].map(h => {
                      const start = parse(form.startTime, 'HH:mm', new Date());
                      const end = addMinutes(start, h * 60);
                      const endStr = format(end, 'HH:mm');
                      const hasOverlap = dayEvents.some(event => {
                        return (form.startTime < event.endTime && endStr > event.startTime);
                      });
                      const isInvalid = hasOverlap || endStr > '18:30';

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

                {/* Attendee Search */}
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
                      className="w-full pl-12 pr-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-[#3530B8] transition-all"
                      value={searchQuery}
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        setShowSearchResults(true);
                        updateDropdownPos();
                      }}
                      onFocus={() => {
                        setShowSearchResults(true);
                        updateDropdownPos();
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

             {/* Panel Buttons */}
             <div className="p-8 border-t border-gray-50 flex gap-4 bg-white flex-shrink-0">
                <button 
                  onClick={() => setIsPanelOpen(false)}
                  className="flex-1 py-4 border-2 border-gray-100 text-gray-400 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  취소
                </button>
                <button 
                  onClick={handleReserve}
                  className="flex-[2] py-4 bg-[#3530B8] text-white text-sm font-bold rounded-2xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faCheck} className="text-xs" />
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
