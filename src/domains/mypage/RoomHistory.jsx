import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Pagination from '../../components/common/Pagination';
import Calendar from '../../components/common/Calendar';
import useEmployeeStore from '../../store/useEmployeeStore';
import useUserStore from '../../store/userStore';
import { getAllMyMeetRsvn } from './mypageApi';

const RoomHistory = () => {
  const { allEmployees, fetchEmployees } = useEmployeeStore();
  const { user } = useUserStore();

  const [reservations, setReservations] = useState([]);

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const count = Math.ceil(reservations.length / itemsPerPage);

  // Edit mode state
  const [editingReservation, setEditingReservation] = useState(null);
  const [editForm, setEditForm] = useState({
    roomName: '',
    meetingName: '',
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
    loadRsvn();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleEditClick = (reservation) => {
    setEditingReservation(reservation);
    setEditForm({ ...reservation });
  };

  const handleCancelReservation = (id) => {
    if (window.confirm('예약을 취소하시겠습니까?')) {
      setReservations(reservations.filter(r => r.id !== id));
      if (editingReservation?.id === id) {
        setEditingReservation(null);
      }
    }
  };

  const handleUpdateSubmit = () => {
    setReservations(reservations.map(r => r.id === editForm.id ? editForm : r));
    setEditingReservation(null);
    alert('수정이 완료되었습니다.');
  };

  // Time overlap logic (Mock)
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Mock occupied times for the selected room and date
  const occupiedTimes = ['11:00', '15:00']; 

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
    <div className={`h-full flex flex-col ${editingReservation ? 'p-0 md:p-8' : 'p-6 md:p-8'} font-sans overflow-hidden bg-[#FFFFFF]`}>
      
      {/* Header Section */}
      <div className={`mb-6 flex-shrink-0 ${editingReservation ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">회의실 신청 내역</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
          나의 회의실 예약 목록을 확인하고 관리할 수 있습니다.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        
        {/* List Section */}
        <div className={`flex flex-col bg-white rounded-[2rem] border border-[#F0F4FF] shadow-sm overflow-hidden transition-all duration-500 min-h-0 ${editingReservation ? 'hidden md:flex md:flex-[0.6]' : 'flex-1'}`}>
          <div className="hidden md:grid grid-cols-[1fr_1.8fr_1.2fr_1.2fr_0.8fr] px-6 py-4 border-b border-gray-50 text-[0.6875rem] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">
            <div className="pl-6">회의실명</div>
            <div>회의명</div>
            <div className="pl-3">예약일</div>
            <div className="pl-3">예약 시간</div>
            <div className="text-center">관리</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {reservations.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((res) => (
              <div 
                key={res.id}
                className={`flex md:grid md:grid-cols-[1fr_1.8fr_1.2fr_1.2fr_0.8fr] px-4 md:px-6 py-4 items-center border-b border-gray-50/50 hover:bg-[#F8FAFF] transition-colors ${editingReservation?.id === res.id ? 'bg-[#F0F4FF]' : ''}`}
              >
                {/* Mobile & PC Info */}
                <div className="flex-1 md:block text-xs md:text-sm font-bold text-gray-700 truncate pl-4">{res.roomName}</div>
                <div className="hidden md:block text-xs text-gray-600 truncate">{res.meetingName}</div>
                <div className="hidden md:block text-xs text-gray-500 truncate">{res.date}</div>
                <div className="hidden md:block text-xs text-gray-500 truncate">{`${res.startTime} ~ ${res.endTime}`}</div>

                {/* Mobile Info Overlay (for smaller screens) */}
                <div className="md:hidden flex-1 min-w-0 mx-2">
                  <div className="text-[10px] text-gray-400 truncate">{res.meetingName}</div>
                  <div className="text-[10px] text-gray-500">{res.date} | {res.startTime}~{res.endTime}</div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex justify-center gap-2">
                  <button 
                    onClick={() => handleEditClick(res)}
                    className="px-2.5 py-1.5 text-[0.625rem] md:text-xs font-bold text-[#3530B8] bg-[#F0F4FF] rounded-lg hover:bg-[#3530B8] hover:text-white transition-all"
                  >
                    수정
                  </button>
                  <button 
                    onClick={() => handleCancelReservation(res.id)}
                    className="px-2.5 py-1.5 text-[0.625rem] md:text-xs font-bold text-red-500 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                  >
                    취소
                  </button>
                </div>
              </div>
            ))}
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
                    value={editForm.roomName}
                    onChange={(e) => setEditForm({ ...editForm, roomName: e.target.value })}
                  >
                    <option value="대회의실 A">대회의실 A</option>
                    <option value="중회의실 B">중회의실 B</option>
                    <option value="소회의실 C">소회의실 C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[0.6875rem] font-bold text-gray-600 mb-1.5 ml-1">회의명</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-[#3530B8] transition-all"
                    value={editForm.meetingName}
                    onChange={(e) => setEditForm({ ...editForm, meetingName: e.target.value })}
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
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:outline-none"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                    >
                      {timeSlots.map(time => {
                        const isOccupied = occupiedTimes.includes(time);
                        return (
                          <option key={time} value={time} disabled={isOccupied} style={isOccupied ? { color: '#ccc' } : {}}>
                            {time} {isOccupied ? '(예약불가)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.6875rem] font-bold text-gray-600 mb-1.5 ml-1">종료 시간</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:outline-none"
                      value={editForm.endTime}
                      onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
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
