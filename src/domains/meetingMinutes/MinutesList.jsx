import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Calendar from '../../components/common/Calendar';
import Pagination from '../../components/common/Pagination';
import useEmployeeStore from '../../store/useEmployeeStore';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';
import { maxios } from '../../api/axiosConfig';
import { getMinutesList, insertMinutes } from './meetingMinutesApi';

// 참여자 프로필 스택 컴포넌트
const ParticipantStack = ({ attendees = [] }) => {
  const token = useAuthStore(state => state.token);
  const displayLimit = 3;
  const displayAttendees = (attendees || []).slice(0, displayLimit);
  const remainingCount = (attendees || []).length > displayLimit ? (attendees || []).length - displayLimit : 0;

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center -space-x-2">
        {displayAttendees.map((user, index) => (
          <div
            key={index}
            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shadow-sm overflow-hidden relative group"
            title={user.name}
          >
          {user?.sysname && token ? (
            <img
              src={`http://localhost/file/profile/view?sysname=${user.sysname}&token=${token}`}
              alt={user?.name || "프로필"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-[10px] md:text-[11px] font-bold text-white uppercase"
              style={{ backgroundColor: user?.color || '#6366F1' }}
            >
              {user?.name ? user.name.slice(0, 1) : '?'}
            </div>
          )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center shadow-sm z-10">
            <span className="text-[9px] md:text-[10px] font-bold text-indigo-600">+{remainingCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const MinutesList = () => {
  const [minutesList, setMinutesList] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useUserStore();
  const token = useAuthStore(state => state.token);

  const active = minutesList.find((m) => m.minute_seq === activeId);

  // 작성 폼 상태
  const [newMinutes, setNewMinutes] = useState({
    title: '',
    meeting_dt: '',
    start_time: '',
    end_time: '',
    main_content: '',
    decisions: '',
    todos: '',
    users_id: user?.users_id || '',
    attendees: []
  });

  // 에러 상태 추가
  const [errors, setErrors] = useState({
    title: false,
    meeting_dt: false,
    start_time: false,
    end_time: false,
    main_content: false
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  // 참석자 선택 관련 상태
  const { allEmployees, fetchEmployees } = useEmployeeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const attendeeInputRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  // 검색 및 페이지네이션 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchEmployees();
    fetchMinutesList(); // 주석 해제: 조회 로직 활성화
  }, [fetchEmployees]);

  const fetchMinutesList = () => {
    getMinutesList().then((resp) => {
      setMinutesList(resp.data);
    })
    .catch((error) => {
      console.error('회의록 목록 조회 실패:', error);
    });
  };

  // 검색 필터링 로직
  /*백엔드에서 데이터가 리스트로 잘 오면 정상적으로 검색 필터를 돌리고, 
  혹시라도 에러 객체나 엉뚱한 데이터가 오더라도 에러 내지 말고 그냥 빈 목록([])을 보여줘 */
  const filteredMinutes = Array.isArray(minutesList) ? minutesList.filter(item => {
    const title = item?.title || '';
      // 백엔드 DTO 변수명이 meetingDt인지 meeting_dt인지 확인 후 통일
      const meetingDt = item?.meetingDt || item?.meeting_dt || '';      
      return title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
             meetingDt.includes(searchKeyword);
  }):[];

  // 페이지네이션 처리
  const totalCount = filteredMinutes.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const paginatedMinutes = filteredMinutes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
    setCurrentPage(1); // 검색 시 1페이지로 리셋
  };

  const handleSave = () => {
    // 유효성 검사
    const newErrors = {
      title: !newMinutes.title,
      meeting_dt: !newMinutes.meeting_dt,
      start_time: !newMinutes.start_time,
      end_time: !newMinutes.end_time,
      main_content: !newMinutes.main_content
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error)) {
      return;
    }

    const payload = {
      title: newMinutes.title,
      meeting_dt: newMinutes.meeting_dt,
      start_time: `${newMinutes.meeting_dt}T${newMinutes.start_time}:00`,
      end_time: `${newMinutes.meeting_dt}T${newMinutes.end_time}:00`,
      main_content: newMinutes.main_content,
      decisions: newMinutes.decisions,
      todos: newMinutes.todos,
      attendees: newMinutes.attendees
    };

  insertMinutes(payload) .then(() => {
      // 서버 저장에 성공했을 때 실행할 로직들을 이 안에 모아둡니다.
      alert('회의록이 저장되었습니다.');
      setIsCreating(false);
      fetchMinutesList(); 
    }).catch((error) => {
      console.error('회의록 저장 실패:', error);
      alert('저장에 실패했습니다.');
    });
  };

  // 드롭다운 위치 계산
  const updateDropdownPos = useCallback(() => {
    if (attendeeInputRef.current) {
      const rect = attendeeInputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  }, []);

  useEffect(() => {
    if (showResults) {
      updateDropdownPos();
      window.addEventListener('resize', updateDropdownPos);
      window.addEventListener('scroll', updateDropdownPos, true);
    }
    return () => {
      window.removeEventListener('resize', updateDropdownPos);
      window.removeEventListener('scroll', updateDropdownPos, true);
    };
  }, [showResults, updateDropdownPos]);

    const filteredEmployees = searchQuery && searchQuery.trim() !== ''
      ? allEmployees.filter(emp => {
          const name = emp?.name || '';
          const deptName = emp?.deptName || emp?.dept_name || '';
          const rankName = emp?.rankName || emp?.rank_name || '';
          const query = searchQuery.toLowerCase();
          
          return name.toLowerCase().includes(query) || 
                 deptName.toLowerCase().includes(query) || 
                 rankName.toLowerCase().includes(query);
        }) 
      : [];

    const handleAddAttendee = (emp) => {
      console.log(emp);
      const attendeeId = emp.users_seq || emp.users_id || emp.id;
      
      if (newMinutes.attendees.some(a => (a.users_seq || a.users_id || a.id) === attendeeId)) {
        alert('이미 추가된 참석자입니다.');
        return;
      }
      setNewMinutes({ ...newMinutes, attendees: [...newMinutes.attendees, emp] });
      setSearchQuery('');
      setShowResults(false);
    };

  const handleRemoveAttendee = (idx) => {
    setNewMinutes(prev => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== idx)
    }));
  };
  const renderAttendeeDropdown = () => {
    if (!showResults || !searchQuery) return null;

    const dropdown = (
      <div 
        className="fixed z-[9999] bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar"
        style={{ 
          top: `${dropdownPos.top + 4}px`, 
          left: `${dropdownPos.left}px`, 
          width: `${dropdownPos.width}px` 
        }}
      >
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(emp => (
            <div 
              key={emp.users_seq || emp.id} 
              onClick={() => handleAddAttendee(emp)}
              className="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-700">{emp.name}</span>
                <span className="text-[10px] text-gray-400">{emp.dept_name}</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{emp.rank_name}</span>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-xs text-gray-400">검색 결과가 없습니다.</div>
        )}
      </div>
    );

    return createPortal(dropdown, document.body);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const handleOpenCreate = () => {
    setActiveId(null);
    setNewMinutes({
      title: '',
      meeting_dt: '',
      start_time: '',
      end_time: '',
      main_content: '',
      decisions: '',
      todos: '',
      users_id: user?.users_id || '',
      attendees: []
    });
    setErrors({
      title: false,
      meeting_dt: false,
      start_time: false,
      end_time: false,
      main_content: false
    });
    setIsCreating(true);
  };

  const handleClosePanel = () => {
    setActiveId(null);
    setIsCreating(false);
  };

  const handleSelectMinutes = (id) => {
    setIsCreating(false);
    setActiveId(id);
  };

  // 날짜/시간 포맷팅 함수
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr; // 파싱 실패 시 원본 반환
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="w-full h-auto lg:h-full flex flex-col p-4 md:p-6 lg:p-7 box-border bg-white font-sans overflow-hidden">
      <style>{`
        @media (min-width: 64rem) {
          main.flex-1 { overflow: hidden !important; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
      `}</style>

      <div className="mb-4 px-3 py-1 shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-2xl font-bold text-gray-900 mb-1">회의록</h1>
          <p className="text-[0.85rem] text-gray-500 font-medium">회의 내용을 기록하고 참여자와 공유하세요</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-indigo-600 text-white text-[0.75rem] font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 mb-1"
        >
          + 회의록 작성
        </button>
      </div>

      <div className="flex-1 relative flex gap-0 lg:gap-6 px-8 overflow-hidden min-h-0">
        {/* 목록 섹션 */}
        <div className={`transition-all duration-500 ease-in-out bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full
          ${(activeId || isCreating) ? 'w-0 opacity-0 invisible lg:w-auto lg:flex-1 lg:opacity-100 lg:visible' : 'w-full opacity-100 visible flex-1'}`}>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:px-8 border-b border-gray-50 bg-gray-50/10 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-s font-extrabold text-indigo-950">회의 목록</h3>
              <span className="bg-indigo-50 text-indigo-600 text-[0.7rem] font-bold px-2.5 py-1 rounded-full">
                총 {totalCount}건
              </span>
            </div>
            
            <div className="relative group w-full md:w-64">
              <input 
                type="text" 
                placeholder="제목, 일시로 검색"
                value={searchKeyword}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl 
                focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all placeholder:text-gray-300 text-xs text-gray-700 shadow-sm"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-2 custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="sticky top-0 bg-white z-10">
                  <th className="py-4 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100">회의 제목</th>
                  <th className="py-4 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100">일시</th>
                  <th className="py-4 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-center">참여자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedMinutes.length > 0 ? (
                  paginatedMinutes.map((item) => (
                    <tr 
                      key={item.minute_seq} 
                      onClick={() => handleSelectMinutes(item.minute_seq)}
                      className={`cursor-pointer hover:bg-indigo-50/50 transition-colors group ${activeId === item.minute_seq ? 'bg-indigo-50/50' : ''}`}
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold group-hover:text-indigo-600 transition-colors ${activeId === item.minute_seq ? 'text-indigo-600' : 'text-gray-700'} truncate max-w-[120px] md:max-w-none`}>
                            {item.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                        {item.meeting_dt} {formatTime(item.startTime)}
                      </td>
                      <td className="py-4 text-center">
                        <ParticipantStack attendees={item.attendees} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-20 text-center text-gray-400 text-sm font-bold">
                      회의록이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-50 bg-white py-2 shrink-0">
            <Pagination 
              count={totalPages} 
              page={currentPage} 
              onChange={handlePageChange} 
            />
          </div>
        </div>

        {/* 상세/작성 섹션 */}
        <div className={`transition-all duration-500 ease-in-out bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full
          ${(activeId || isCreating) 
            ? 'flex-1 lg:max-w-[55%] translate-x-0 opacity-100 visible' 
            : 'w-0 translate-x-full opacity-0 invisible absolute right-0 inset-y-0 lg:relative lg:translate-x-0 lg:w-0'}`}>
          
          {active && !isCreating && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="py-6 md:py-8 px-5 md:px-6 border-b border-gray-50 shrink-0 flex justify-between items-start">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-indigo-950 mb-1">{active.title}</h2>
                  <p className="text-sm text-gray-500 font-medium">
                    {active.meeting_dt} | {formatTime(active.startTime)} – {formatTime(active.endTime)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleClosePanel}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-0 custom-scrollbar">
                <div className="max-w-3xl space-y-8 mt-6">
                  {/* 참석자 */}
                  <div>
                    <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">참석자</h4>
                    <div className="flex flex-wrap items-center gap-3">
                      {(active.attendees || []).map((a, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div 
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm border-2 border-white"
                            style={{ backgroundColor: a.color || '#6366F1' }}
                          >
                            {a.name ? a.name.slice(0, 1) : '?'}
                          </div>
                          <span className="text-[10px] font-bold text-gray-500">{a.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 주요 내용 (CLOB - 줄바꿈 처리) */}
                  <div>
                    <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">주요 내용</h4>
                    <div className="text-[0.9rem] text-gray-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      {active.mainContent}
                    </div>
                  </div>

                  {/* 결정 사항 */}
                  <div>
                    <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">결정 사항</h4>
                    <div className="text-[0.85rem] font-bold text-gray-700 whitespace-pre-wrap bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
                      {active.decisions}
                    </div>
                  </div>

                  {/* 할 일 */}
                  <div>
                    <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">할 일</h4>
                    <div className="text-[0.9rem] text-gray-700 whitespace-pre-wrap bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                      {active.todos}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isCreating && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="py-6 md:py-8 px-5 md:px-6 border-b border-gray-50 shrink-0 flex justify-between items-start">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-indigo-950 mb-1">회의록 작성</h2>
                </div>
                <button 
                  onClick={handleClosePanel}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-0 custom-scrollbar">
                <div className="max-w-3xl space-y-6 mt-6">
                  {/* 제목 */}
                  <div>
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">회의 제목</label>
                    <input 
                      type="text" 
                      placeholder="회의 제목을 입력하세요"
                      value={newMinutes.title}
                      onChange={(e) => {
                        setNewMinutes({...newMinutes, title: e.target.value});
                        if(e.target.value) setErrors(prev => ({...prev, title: false}));
                      }}
                      className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm focus:outline-none focus:ring-4 transition-all font-bold text-gray-700 
                        ${errors.title ? 'border-red-400 ring-4 ring-red-100 shadow-[0_0_15px_rgba(248,113,113,0.15)]' : 'border-gray-300 focus:ring-indigo-100'}`}
                    />
                    {errors.title && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">회의 제목을 입력해주세요.</p>}
                  </div>

                  {/* 일시 및 시간 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">회의 일자</label>
                      <button 
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm text-left font-bold transition-all flex justify-between items-center
                          ${errors.meeting_dt ? 'border-red-400 ring-4 ring-red-100 shadow-[0_0_15px_rgba(248,113,113,0.15)] text-red-400' : 'border-gray-300 text-gray-600'}`}
                      >
                        {newMinutes.meeting_dt || '날짜 선택'}
                      </button>
                      {errors.meeting_dt && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">날짜를 선택해주세요.</p>}
                      {isCalendarOpen && (
                        <div ref={calendarRef} className="absolute z-30 w-full top-full mt-1">
                          <Calendar 
                            value={newMinutes.meeting_dt} 
                            onChange={(date) => {
                              setNewMinutes({...newMinutes, meeting_dt: date});
                              setErrors(prev => ({...prev, meeting_dt: false}));
                            }} 
                            onClose={() => setIsCalendarOpen(false)} 
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">시작 시간</label>
                      <input 
                        type="time" 
                        value={newMinutes.start_time}
                        onChange={(e) => {
                          setNewMinutes({...newMinutes, start_time: e.target.value});
                          if(e.target.value) setErrors(prev => ({...prev, start_time: false}));
                        }}
                        className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm focus:outline-none focus:ring-4 transition-all font-bold 
                          ${errors.start_time ? 'border-red-400 ring-4 ring-red-100 shadow-[0_0_15px_rgba(248,113,113,0.15)] text-red-400' : 'border-gray-300 text-gray-600 focus:ring-indigo-100'}`}
                      />
                      {errors.start_time && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">시작 시간을 입력해주세요.</p>}
                    </div>
                    <div>
                      <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">종료 시간</label>
                      <input 
                        type="time" 
                        value={newMinutes.end_time}
                        onChange={(e) => {
                          setNewMinutes({...newMinutes, end_time: e.target.value});
                          if(e.target.value) setErrors(prev => ({...prev, end_time: false}));
                        }}
                        className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm focus:outline-none focus:ring-4 transition-all font-bold 
                          ${errors.end_time ? 'border-red-400 ring-4 ring-red-100 shadow-[0_0_15px_rgba(248,113,113,0.15)] text-red-400' : 'border-gray-300 text-gray-600 focus:ring-indigo-100'}`}
                      />
                      {errors.end_time && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">종료 시간을 입력해주세요.</p>}
                    </div>
                  </div>

                  {/* 참석자 (UI 유지) */}
                  <div className="space-y-3">
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">참석자</label>
                    <div className="relative">
                      <div className="flex items-center gap-2 p-1.5 bg-white border border-gray-300 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        <div className="flex flex-wrap gap-2 flex-1 items-center px-2">
                          {newMinutes.attendees.map((emp, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-white border border-indigo-100 px-2.5 py-1 rounded-full text-[11px] font-bold text-indigo-700 shadow-sm animate-in zoom-in-95">
                              <span>{emp.name}</span>
                              <button onClick={() => handleRemoveAttendee(idx)} className="text-indigo-300 hover:text-indigo-500 transition-colors">✕</button>
                            </div>
                          ))}
                          <input 
                            ref={attendeeInputRef}
                            type="text" 
                            placeholder={newMinutes.attendees.length === 0 ? "참석자 검색..." : ""}
                            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs font-bold text-gray-700 p-1"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowResults(true);
                              updateDropdownPos();
                            }}
                            onFocus={() => {
                              setShowResults(true);
                              updateDropdownPos();
                            }}
                          />
                        </div>
                      </div>
                      {renderAttendeeDropdown()}
                    </div>
                  </div>

                  {/* 주요 내용 (MAIN_CONTENT) */}
                  <div>
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">주요 내용</label>
                    <textarea 
                      rows="5"
                      placeholder="회의 내용을 상세히 입력하세요"
                      value={newMinutes.main_content}
                      onChange={(e) => {
                        setNewMinutes({...newMinutes, main_content: e.target.value});
                        if(e.target.value) setErrors(prev => ({...prev, main_content: false}));
                      }}
                      className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm focus:outline-none focus:ring-4 transition-all font-medium text-gray-700 resize-none
                        ${errors.main_content ? 'border-red-400 ring-4 ring-red-100 shadow-[0_0_15px_rgba(248,113,113,0.15)]' : 'border-gray-300 focus:ring-indigo-100'}`}
                    ></textarea>
                    {errors.main_content && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">회의 내용을 입력해주세요.</p>}
                  </div>

                  {/* 결정 사항 (DECISIONS) */}
                  <div>
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">결정 사항</label>
                    <textarea 
                      rows="3"
                      placeholder="주요 결정 사항을 입력하세요"
                      value={newMinutes.decisions}
                      onChange={(e) => setNewMinutes({...newMinutes, decisions: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-gray-600 resize-none"
                    ></textarea>
                  </div>

                  {/* 할 일 (TODOS) */}
                  <div>
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">할 일</label>
                    <textarea 
                      rows="3"
                      placeholder="후속 조치 사항을 입력하세요"
                      value={newMinutes.todos}
                      onChange={(e) => setNewMinutes({...newMinutes, todos: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-gray-600 resize-none"
                    ></textarea>
                  </div>

                  <div className="pt-12 pb-10">
                    <button 
                      onClick={handleSave}
                      className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all"
                    >
                      저장하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinutesList;
