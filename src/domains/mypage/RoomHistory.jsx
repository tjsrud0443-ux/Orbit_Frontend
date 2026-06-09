import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, startOfDay, parse, isBefore } from 'date-fns';
import { createPortal } from 'react-dom';
import Pagination from '../../components/common/Pagination';
import Calendar from '../../components/common/Calendar';
import useEmployeeStore from '../../store/useEmployeeStore';
import useUserStore from '../../store/userStore';
import useAuthStore from '../../store/authStore';
import { getAllMyMeetRsvn, getAllRooms, getMeetRsvnDetail, getOccupiedTimes, updateMeetRsvn } from './mypageApi';
import useLoadingStore from '../../store/useLoadingStore';

const RoomHistory = () => {
  const { allEmployees, fetchEmployees } = useEmployeeStore();
  const { user } = useUserStore();
  const token = useAuthStore(state => state.token);
  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  const [reservations, setReservations] = useState([]);
  const getTime = (dt) => dt?.slice(11, 16);
  const getDate = (dt) => dt?.slice(0, 10);

  const [meetingRooms, setMeetingRooms] = useState([]);
  const [occupiedTimes, setOccupiedTimes] = useState([]);

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const count = Math.ceil(reservations.length / itemsPerPage);

  // Detail view state
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Edit mode state
  const [editingReservation, setEditingReservation] = useState(null);
  const [editForm, setEditForm] = useState({
    room_seq: '',
    room_name: '',
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    attendees: []
  });

  // Calendar visibility
  const [showCalendar, setShowCalendar] = useState(false);

  // Attendee search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const inputRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const loadRsvn = () => {
    getAllMyMeetRsvn().then(resp => {
      setReservations(resp.data);
    }).catch(err => console.error("목록 로드 실패:", err));
  };

  useEffect(() => {
    showLoading();
    loadRsvn();
    hideLoading();
  }, []);

  useEffect(() => {
    getAllRooms().then(resp => {
      setMeetingRooms(resp.data);
    })
  })

  useEffect(() => {
    if(!editForm.room_seq || !editForm.date) return;

    getOccupiedTimes(editForm.room_seq, editForm.date, editingReservation?.rsvn_seq).then(resp => {
      setOccupiedTimes(resp.data);
    })
  }, [editForm.room_seq, editForm.date]);

  const isStartOccupied = (time) => {
    return occupiedTimes.some(range => time >= range.startTime && time < range.endTime);
  };
  const isEndOccupied = (time) => {
    return occupiedTimes.some(range => time > range.startTime && time <= range.endTime);
  }

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSelectReservation = async (res) => {
    setEditingReservation(null);
    setSelectedReservation(null);
    showLoading();
    try {
      const resp = await getMeetRsvnDetail(res.rsvn_seq);
      setSelectedReservation(resp.data[0]);
    } catch (err) {
      console.error('예약 상세 조회 실패: ', err);
    }
    hideLoading();
  }

  const handleEditClick = async (res) => {
    setSelectedReservation(null);
    showLoading();
    try {
      const resp = await getMeetRsvnDetail(res.rsvn_seq);
      const detail = resp.data[0];
      setEditingReservation(detail);
      setEditForm({
        ...detail,
        date: getDate(detail.start_dt),
        startTime: getTime(detail.start_dt),
        endTime: getTime(detail.end_dt),
        attendees: detail.attendees ?? []
      });
    } catch (err) {
      console.error('예약 상세 조회 실패', err);
    }
    hideLoading();
  };

  const handleCancelReservation = (id) => {
    if (window.confirm('예약을 취소하시겠습니까?')) {
      setReservations(reservations.filter(r => r.id !== id));
      if (editingReservation?.id === id) {
        setEditingReservation(null);
      }
      if (selectedReservation?.id === id) {
        setSelectedReservation(null);
      }
    }
  };

  const handleUpdateSubmit = () => {
    if (isTimeInvalid) return;
    setReservations(reservations.map(r => r.rsvn_seq === editForm.rsvn_seq ? editForm : r));

    const originAttendees = editingReservation.attendees ?? [];
    const currentAttendees = editForm.attendees;

    const removedAttendees = originAttendees.filter(
      origin => !currentAttendees.some(current => current.users_id === origin.users_id)
    );

    const addedAttendees = currentAttendees.filter(
      current => !originAttendees.some(origin => origin.users_id === (current.users_id ?? current.id))
    ).map(a => ({ users_id: a.users_id ?? a.id }));

    const updateData = {
      ...editForm,
      start_dt: `${editForm.date} ${editForm.startTime}:00`,
      end_dt: `${editForm.date} ${editForm.endTime}:00`,
      removedAttendees,
      addedAttendees
    };

    updateMeetRsvn(updateData).then(() => {
      loadRsvn();
      setEditingReservation(null);
      alert('수정이 완료되었습니다.');
    });
  };

  const isPastTime = (time, dateStr) => {
    if (!dateStr) return false;
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    if (dateStr < todayStr) return true;
    if (dateStr > todayStr) return false;
    const currentTimeStr = format(now, 'HH:mm');
    return time <= currentTimeStr;
  };

  const isTimeInvalid = editForm.startTime >= editForm.endTime;

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  const updateDropdownPos = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  }, []);

  useEffect(() => {
    if (showSearchResults) {
      updateDropdownPos();
      window.addEventListener('resize', updateDropdownPos);
      window.addEventListener('scroll', updateDropdownPos, true);
    }
    return () => {
      window.removeEventListener('resize', updateDropdownPos);
      window.removeEventListener('scroll', updateDropdownPos, true);
    };
  }, [showSearchResults, updateDropdownPos]);

  const filteredEmployees = searchQuery 
    ? allEmployees.filter(emp => {
        if (emp.users_seq === user?.users_seq) return false;
        const name = emp?.name || '';
        const deptName = emp?.dept_name || '';
        return name.includes(searchQuery) || deptName.includes(searchQuery);
      }) 
    : [];

  const handleAddAttendee = (emp) => {
    if (editForm.attendees.some(a => a.users_seq === emp.users_seq)) {
      alert('이미 추가된 참석자입니다.');
      return;
    }
    setEditForm({ ...editForm, attendees: [...editForm.attendees, emp] });
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleRemoveAttendee = (idx) => {
    const newAttendees = [...editForm.attendees];
    newAttendees.splice(idx, 1);
    setEditForm({ ...editForm, attendees: newAttendees });
  };

  const renderDropdown = () => {
    if (!showSearchResults || !searchQuery) return null;

    return createPortal(
      <div 
        className="fixed z-[9999] bg-white border border-gray-100 rounded-xl shadow-2xl max-h-48 overflow-y-auto"
        style={{ 
          top: `${dropdownPos.top + 4}px`, 
          left: `${dropdownPos.left}px`, 
          width: `${dropdownPos.width}px` 
        }}
      >
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(emp => (
            <div 
              key={emp.users_seq} 
              onClick={() => handleAddAttendee(emp)}
              className="p-3 hover:bg-[#F0F4FF] cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-700">{emp.name}</span>
                <span className="text-[10px] text-gray-400">{emp.dept_name}</span>
              </div>
              <span className="text-[10px] font-bold text-[#3530B8] bg-[#F0F4FF] px-2 py-0.5 rounded-full">{emp.rank_name}</span>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-xs text-gray-400">검색 결과가 없습니다.</div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div className={`h-full flex flex-col ${editingReservation || selectedReservation ? 'p-0 md:p-8' : 'p-6 md:p-8'} font-sans overflow-hidden bg-[#FFFFFF]`}>
      
      {/* Header Section */}
      <div className={`mb-6 flex-shrink-0 ${editingReservation || selectedReservation ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">회의실 신청 내역</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
          나의 회의실 예약 목록을 확인하고 관리할 수 있습니다.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        
        {/* List Section */}
        <div className={`flex flex-col bg-white rounded-[2rem] border border-[#F0F4FF] shadow-sm overflow-hidden transition-all duration-500 min-h-0 ${editingReservation || selectedReservation ? 'hidden md:flex md:flex-[0.6]' : 'flex-1'}`}>
          <div className="hidden md:grid grid-cols-[1fr_1.8fr_1.2fr_1.2fr_0.8fr] px-6 py-4 border-b border-gray-50 text-[0.6875rem] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">
            <div className="pl-4">회의실명</div>
            <div>회의명</div>
            <div className="pl-4">예약일</div>
            <div className="pl-3">예약 시간</div>
            <div className="text-center">관리</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {reservations.length > 0 ? (
              reservations.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((res) => (
                <div 
                  key={res.rsvn_seq}
                  onClick={() => {handleSelectReservation(res); setSelectedReservation(res);}}
                  className={`flex md:grid md:grid-cols-[1fr_1.8fr_1.2fr_1.2fr_0.8fr] px-4 md:px-6 py-4 items-center border-b border-gray-50/50 hover:bg-[#F8FAFF] transition-colors cursor-pointer ${editingReservation?.rsvn_seq === res.rsvn_seq || selectedReservation?.rsvn_seq === res.rsvn_seq ? 'bg-[#F0F4FF]' : ''}`}
                >
                  {/* Mobile & PC Info */}
                  <div className="flex-1 md:block text-xs md:text-sm font-bold text-gray-700 truncate pl-4">{res.room_name}</div>
                  <div className="hidden md:block text-xs text-gray-600 truncate">{res.title}</div>
                  <div className="hidden md:block text-xs text-gray-500 truncate">{getDate(res.start_dt)}</div>
                  <div className="hidden md:block text-xs text-gray-500 truncate">{`${getTime(res.start_dt)} ~ ${getTime(res.end_dt)}`}</div>

                  {/* Mobile Info Overlay (for smaller screens) */}
                  <div className="md:hidden flex-1 min-w-0 mx-2">
                    <div className="text-[10px] text-gray-400 truncate">{res.title}</div>
                    <div className="text-[10px] text-gray-500">{getDate(res.start_dt)} | {getTime(res.start_dt)}~{getTime(res.end_dt)}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex justify-center gap-2">
                    {new Date(res.start_dt) > new Date() && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditClick(res); }}
                          className="px-2.5 py-1.5 text-[0.625rem] md:text-xs font-bold text-[#3530B8] bg-[#F0F4FF] rounded-lg hover:bg-[#3530B8] hover:text-white transition-all"
                        >
                          수정
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCancelReservation(res.rsvn_seq); }}
                          className="px-2.5 py-1.5 text-[0.625rem] md:text-xs font-bold text-red-500 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                        >
                          취소
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-bold">예약 내역이 없습니다.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-50 flex-shrink-0">
            <Pagination count={count} page={page} onChange={handlePageChange} />
          </div>
        </div>

        {/* Edit Detail Section */}
        {editingReservation && (
          <div className={`flex flex-col bg-white rounded-none md:rounded-[2rem] border-0 md:border border-[#F0F4FF] shadow-sm overflow-hidden min-h-0 animate-in slide-in-from-right duration-500 flex-1 md:flex-[0.4]`}>
            <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">예약 정보 수정</h2>
              <button onClick={() => setEditingReservation(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
              {/* Room & Meeting Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[0.6875rem] font-bold text-gray-600 mb-1.5 ml-1">회의실 선택</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all"
                    value={editForm.room_seq}
                    onChange={(e) => {
                      const selected = meetingRooms.find(m => m.room_seq === Number(e.target.value));
                      setEditForm({ ...editForm, room_seq: selected.room_seq, room_name: selected.room_name });
                    }}
                  >
                    {meetingRooms.map(room => (
                      <option key={room.room_seq} value={room.room_seq}>{room.room_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[0.6875rem] font-bold text-gray-600 mb-1.5 ml-1">회의명</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-[#3530B8] transition-all"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-[0.6875rem] font-bold text-gray-600 mb-1.5 ml-1">예약일</label>
                  <div 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium cursor-pointer flex justify-between items-center"
                  >
                    <span className={!editForm.date ? 'text-gray-400' : 'text-gray-800'}>{editForm.date || '날짜를 선택하세요'}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  {showCalendar && (
                    <Calendar 
                      value={editForm.date} 
                      onChange={(date) => {
                        if (isBefore(parse(date, 'yyyy-MM-dd', new Date()), startOfDay(new Date()))) {
                          alert('오늘 이전 날짜는 선택할 수 없습니다.');
                          return;
                        }
                        setEditForm({ ...editForm, date });
                        setShowCalendar(false);
                      }} 
                      onClose={() => setShowCalendar(false)} 
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.6875rem] font-bold text-gray-600 mb-1.5 ml-1">시작 시간</label>
                    <select 
                      className={`w-full px-4 py-2.5 bg-gray-50 border ${isTimeInvalid ? 'border-red-500' : 'border-gray-100'} rounded-xl text-xs font-medium focus:outline-none`}
                      value={editForm.startTime}
                      onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                    >
                      {timeSlots.map(time => {
                        const isOccupied = isStartOccupied(time);
                        const isPast = isPastTime(time, editForm.date);
                        const isDisabled = isOccupied || isPast;
                        return (
                          <option key={time} value={time} disabled={isDisabled} style={isDisabled ? { color: '#ccc' } : {}}>
                            {time} {isOccupied ? '(예약됨)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.6875rem] font-bold text-gray-600 mb-1.5 ml-1">종료 시간</label>
                    <select 
                      className={`w-full px-4 py-2.5 bg-gray-50 border ${isTimeInvalid ? 'border-red-500' : 'border-gray-100'} rounded-xl text-xs font-medium focus:outline-none`}
                      value={editForm.endTime}
                      onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                    >
                      {timeSlots.map(time => {
                        const isOccupied = isEndOccupied(time);
                        const isPast = isPastTime(time, editForm.date);
                        const isDisabled = isOccupied || isPast;
                        return (
                          <option key={time} value={time} disabled={isDisabled} style={isDisabled ? { color: '#ccc' } : {}}>
                            {time} {isOccupied ? '(예약됨)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                {isTimeInvalid && (
                  <p className="text-[10px] text-red-500 font-bold ml-1">종료 시간은 시작 시간보다 늦어야 합니다.</p>
                )}
              </div>

              {/* Attendees */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">참석자 설정</h3>
                <div className="relative">
                  <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="이름/부서로 검색"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#3530B8] transition-all"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                  />
                  {renderDropdown()}
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.attendees.map((attendee, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-[#F8FAFF] border border-[#F0F4FF] px-3 py-1.5 rounded-full text-[10px] font-bold text-[#3530B8] shadow-sm animate-in zoom-in-95">
                      <span>{attendee.name}</span>
                      <button onClick={() => handleRemoveAttendee(idx)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-50 flex gap-3 flex-shrink-0 bg-white">
              <button 
                onClick={() => setEditingReservation(null)}
                className="flex-1 py-4 border-2 border-gray-100 text-gray-400 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-all text-center"
              >
                취소
              </button>
              <button 
                onClick={handleUpdateSubmit}
                className="flex-[2] py-4 bg-[#3530B8] text-white text-sm font-bold rounded-2xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all text-center"
              >
                수정 완료
              </button>
            </div>
          </div>
        )}

        {/* Detail View Section */}
        {selectedReservation && (
          <div className={`flex flex-col bg-white rounded-none md:rounded-[2rem] border-0 md:border border-[#F0F4FF] shadow-sm overflow-hidden animate-in slide-in-from-right duration-500 flex-1 md:flex-[0.4] md:h-fit self-start`}>
            <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">예약 내용 상세</h2>
              <button onClick={() => setSelectedReservation(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6 custom-scrollbar space-y-6">
              {/* Meeting Info Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">회의 정보</h3>
                <div className="bg-[#F8FAFF] rounded-2xl p-5 space-y-4">
                  {[
                    { label: '회의실명', value: selectedReservation.room_name },
                    { label: '회의명', value: selectedReservation.title },
                    { label: '예약일', value: getDate(selectedReservation.start_dt) },
                    { label: '예약 시간', value: `${getTime(selectedReservation.start_dt)} ~ ${getTime(selectedReservation.end_dt)}` }
                  ].map((info, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-gray-100/50 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs font-medium text-gray-500">{info.label}</span>
                      <span className="text-xs font-bold text-gray-800">{info.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendees Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">참석자 ({selectedReservation.attendees?.length || 0}명)</h3>
                <div className="grid grid-cols-8 gap-2">
                  {selectedReservation.attendees?.map((attendee, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white border-2 border-gray-50 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                        {attendee.sysname ? (
                          <img 
                            src={`http://localhost/file/profile/view?sysname=${attendee.sysname}&token=${token}`} 
                            className="w-full h-full object-cover" 
                            alt="Profile"
                          />
                        ) : (
                          <svg className="w-6 h-6 text-gray-200" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 truncate w-full text-center">{attendee.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 0.25rem; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 0.625rem; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
    </div>
  );
};

export default RoomHistory;
