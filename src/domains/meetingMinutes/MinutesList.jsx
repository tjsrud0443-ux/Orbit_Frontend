import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Calendar from '../../components/common/Calendar';
import Pagination from '../../components/common/Pagination';
import useEmployeeStore from '../../store/useEmployeeStore';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';
import { maxios } from '../../api/axiosConfig';
import { delMinutes, getMinutesDetail, getMinutesList, insertMinutes, upMinutes } from './meetingMinutesApi';
import useLoadingStore from '../../store/useLoadingStore';
import TimePicker from '../../components/common/TimePicker';

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
  const [activeDetail, setActiveDetail] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMinutes, setEditMinutes] = useState(null);
  const { user } = useUserStore();
  const token = useAuthStore(state => state.token);

  const active = minutesList.find((m) => m.minute_seq === activeId);

  // ── 주최자 검색 전용 상태/ref ──────────────────────────────
  const [hostQuery, setHostQuery] = useState('');
  const [showHostResults, setShowHostResults] = useState(false);
  const hostInputRef = useRef(null);
  const hostDropdownRef = useRef(null);
  const [hostDropdownPos, setHostDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const { allEmployees, fetchEmployees } = useEmployeeStore();
  
  const updateHostDropdownPos = useCallback(() => {
    if (hostInputRef.current) {
      const rect = hostInputRef.current.getBoundingClientRect();
      setHostDropdownPos({ top: rect.bottom, left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    if (showHostResults) {
      updateHostDropdownPos();
      window.addEventListener('resize', updateHostDropdownPos);
      window.addEventListener('scroll', updateHostDropdownPos, true);
    }
    return () => {
      window.removeEventListener('resize', updateHostDropdownPos);
      window.removeEventListener('scroll', updateHostDropdownPos, true);
    };
  }, [showHostResults, updateHostDropdownPos]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isInsideInput = hostInputRef.current?.contains(e.target);
      const isInsideDropdown = hostDropdownRef.current?.contains(e.target);
      if (!isInsideInput && !isInsideDropdown) {
        setShowHostResults(false);
        setHostQuery('');
      }
    };
    if (showHostResults) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHostResults]);

  const filteredHostEmployees = (allEmployees || []).filter(emp => {
    if (!hostQuery.trim()) return true;
        const name = emp?.name || '';
        const deptName = emp?.deptName || emp?.dept_name || '';
        const rankName = emp?.rankName || emp?.rank_name || '';
        const q = hostQuery.toLowerCase();
        return name.toLowerCase().includes(q) || deptName.toLowerCase().includes(q) || rankName.toLowerCase().includes(q);
      });

  // 주최자 드롭다운 렌더 (작성용)
  const renderHostDropdown = (onSelect) => {
    if (!showHostResults) return null;
    return createPortal(
      <div
        ref={hostDropdownRef}
        className="fixed z-[9999] bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar"
        style={{ top: `${hostDropdownPos.top + 4}px`, left: `${hostDropdownPos.left}px`, width: `${hostDropdownPos.width}px` }}
      >
        {filteredHostEmployees.length > 0 ? (
          filteredHostEmployees.map(emp => (
            <div
              key={emp.users_seq || emp.id}
              onClick={() => onSelect(emp)}
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
      </div>,
      document.body
    );
  };

  // 주최자 선택 입력 UI (작성/수정 공통으로 사용)
  const HostSelector = ({ hostObj, onSelect, onClear, error }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider block">주최자</label>
      <div className={`flex items-center gap-2 p-1.5 bg-white border rounded-2xl transition-all
        ${error ? 'border-red-400 ring-4 ring-red-100 shadow-[0_0_15px_rgba(248,113,113,0.15)]' : 'border-gray-300 focus-within:ring-2 focus-within:ring-indigo-100'}`}>
        <div className="flex flex-wrap gap-2 flex-1 items-center px-2">
          {hostObj ? (
            <div className="flex items-center gap-1.5 bg-white border border-indigo-100 px-2.5 py-1 rounded-full text-[11px] font-bold text-indigo-700 shadow-sm">
              <span>{hostObj.name}</span>
              <button onClick={onClear} className="text-indigo-300 hover:text-indigo-500 transition-colors">✕</button>
            </div>
          ) : (
            <input
              ref={hostInputRef}
              type="text"
              placeholder="주최자 검색..."
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs font-bold text-gray-700 p-1"
              value={hostQuery}
              onClick={() => { setShowHostResults(true); updateHostDropdownPos(); }}
              onChange={(e) => { setHostQuery(e.target.value); setShowHostResults(true); updateHostDropdownPos(); }}
              onFocus={() => { setShowHostResults(true); updateHostDropdownPos(); }}
            />
          )}
        </div>
      </div>
      {error && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">주최자를 선택해주세요.</p>}
      {renderHostDropdown(onSelect)}
    </div>
  );

  // 수정 핸들러
  const handleToggleEdit = () => {
    setIsEditing(true);
    setErrors(prev => ({...prev, time_order: false}));
  
    setEditMinutes({
      ...activeDetail,
      start_time: formatTime(activeDetail.start_time),
      end_time: formatTime(activeDetail.end_time),
      // host 객체: attendees에서 host_users_id 매칭해서 세팅
      hostObj: 
        (activeDetail.attendees || []).find(a => a.users_id === activeDetail.host_users_id) ||
        (allEmployees || []).find(emp => emp.id === activeDetail.host_users_id) ||
        null,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditMinutes(null);
    setHostInAttendeesWarning(false);
  };

  const handleCompleteEdit = () => {
    if (!editMinutes.title?.trim()) { alert('회의 제목을 입력해주세요.'); return; }
    if (!editMinutes.meeting_dt) { alert('회의 일자를 선택해주세요.'); return; }
    if (!editMinutes.start_time) { alert('시작 시간을 입력해주세요.'); return; }
    if (!editMinutes.end_time) { alert('종료 시간을 입력해주세요.'); return; }

    const [sH, sM] = editMinutes.start_time.split(':').map(Number);
    const [eH, eM] = editMinutes.end_time.split(':').map(Number);
    if (sH * 60 + sM >= eH * 60 + eM) { setErrors(prev => ({ ...prev, time_order: true })); return; }
    if (!editMinutes.attendees || editMinutes.attendees.length === 0) { setErrors(prev => ({ ...prev, attendees: true })); return; }
    if (!editMinutes.hostObj) { setErrors(prev => ({ ...prev, host: true })); return; }
    if (!editMinutes.main_content?.trim()) { setErrors(prev => ({ ...prev, main_content: true })); return; }

    const minuteData = {
      minute_seq: editMinutes.minute_seq,
      title: editMinutes.title,
      meeting_dt: editMinutes.meeting_dt,
      start_time: `${editMinutes.meeting_dt}T${editMinutes.start_time}:00`,
      end_time: `${editMinutes.meeting_dt}T${editMinutes.end_time}:00`,
      main_content: editMinutes.main_content,
      decisions: editMinutes.decisions,
      todos: editMinutes.todos,
      host_users_id: editMinutes.hostObj?.id,
      attendees: editMinutes.attendees
      .filter(emp => (emp.users_id || emp.id) !== (editMinutes.hostObj?.id || editMinutes.hostObj?.users_id))
      .map(emp => ({ users_id: emp.users_id || emp.id }))
    };

    showLoading();
    upMinutes(minuteData).then(() => {
      hideLoading();
      alert('수정되었습니다.');
      setIsEditing(false);
      setEditMinutes(null);
      fetchMinutesList();
      handleSelectMinutes(editMinutes.minute_seq, true);
    }).catch((error) => {
      hideLoading();
      console.error('수정 실패:', error);
      alert('수정에 실패했습니다.');
    });
  };

  // 작성 폼 상태
  const [newMinutes, setNewMinutes] = useState({
    title: '', meeting_dt: '', start_time: '', end_time: '',
    main_content: '', decisions: '', todos: '',
    users_id: user?.users_id || '',
    host_users_id: '',
    hostObj: null,  // 주최자 객체 (UI용)
    attendees: []
  });

  const [errors, setErrors] = useState({
    title: false, meeting_dt: false, start_time: false, end_time: false,
    time_order: false, main_content: false, attendees: false, host: false
  });

  //주최자 유효성 검사
  const [hostInAttendeesWarning, setHostInAttendeesWarning] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);
  const calendarRef = useRef(null);
  const editCalendarRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const attendeeInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchEmployees();
    fetchMinutesList();
  }, [fetchEmployees]);

  const fetchMinutesList = () => {
    showLoading();
    getMinutesList().then((resp) => {
    setMinutesList(resp.data);
    hideLoading();
    }).catch((error) => {
      hideLoading();
      console.error('회의록 목록 조회 실패:', error);
    });
  };

  const filteredMinutes = Array.isArray(minutesList) ? minutesList.filter(item => {
    const title = item?.title || '';
    const meetingDt = item?.meeting_dt || '';
    const matchesSearch = title.toLowerCase().includes(searchKeyword.toLowerCase()) || meetingDt.includes(searchKeyword);
    const isAuthor = item?.users_id === user?.id;
    const isAttendee = (item?.attendees || []).some(a => a.users_id === user?.id);
    const isHost = item?.host_users_id === user?.id;
    return matchesSearch && (isAuthor || isAttendee || isHost);
  }).map(item => ({
    ...item,
    badgeType: (() => {
      const isAuthor = item?.users_id === user?.id;
      const isHost = item?.host_users_id === user?.id;
      if (isAuthor && isHost) return 'author_host';
      if (isAuthor) return 'author';
      if (isHost) return 'host';
      return 'attendee';
    })()
  })) : [];

  const totalCount = filteredMinutes.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const paginatedMinutes = filteredMinutes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  const handlePageChange = (event, value) => setCurrentPage(value);
  const handleSearchChange = (e) => { setSearchKeyword(e.target.value); setCurrentPage(1); };

  const handleSave = () => {
    const newErrors = {
      title: !newMinutes.title,
      meeting_dt: !newMinutes.meeting_dt,
      start_time: !newMinutes.start_time,
      end_time: !newMinutes.end_time,
      time_order: false,
      main_content: !newMinutes.main_content,
      attendees: newMinutes.attendees.length === 0,
      host: !newMinutes.hostObj,
    };

    if (newMinutes.start_time && newMinutes.end_time) {
      const [sH, sM] = newMinutes.start_time.split(':').map(Number);
      const [eH, eM] = newMinutes.end_time.split(':').map(Number);
      if (sH * 60 + sM >= eH * 60 + eM) newErrors.time_order = true;
    }
    setErrors(newErrors);
    if (Object.values(newErrors).some(e => e)) return;

    const payload = {
      title: newMinutes.title,
      meeting_dt: newMinutes.meeting_dt,
      start_time: `${newMinutes.meeting_dt}T${newMinutes.start_time}:00`,
      end_time: `${newMinutes.meeting_dt}T${newMinutes.end_time}:00`,
      main_content: newMinutes.main_content,
      decisions: newMinutes.decisions,
      todos: newMinutes.todos,
      host_users_id: newMinutes.hostObj?.id, 
      attendees: newMinutes.attendees
        .filter(emp => (emp.users_id || emp.id) !== newMinutes.hostObj?.id)
        .map(emp => ({ users_id: emp.id }))
    };

    showLoading("meeting");
    insertMinutes(payload).then(() => {
      setIsCreating(false);
      setActiveId(null);
      hideLoading();
      fetchMinutesList();
      alert('회의록이 저장되었습니다.');
    }).catch((error) => {
      hideLoading();
      console.error('회의록 저장 실패:', error);
      alert('저장에 실패했습니다.');
    });
  };

  const updateDropdownPos = useCallback(() => {
    if (attendeeInputRef.current) {
      const rect = attendeeInputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom, left: rect.left, width: rect.width });
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
      const hostId = newMinutes.hostObj?.id || editMinutes?.hostObj?.id;
      if (emp.id === hostId) return false;
        const name = emp?.name || '';
        const deptName = emp?.deptName || emp?.dept_name || '';
        const rankName = emp?.rankName || emp?.rank_name || '';
        const query = searchQuery.toLowerCase();
        return name.toLowerCase().includes(query) || deptName.toLowerCase().includes(query) || rankName.toLowerCase().includes(query);
      })
    : [];

  const handleAddAttendee = (emp) => {
    const isDuplicate = newMinutes.attendees.some(a => {
      const aId = String(a.users_seq || a.users_id || a.id || '');
      const empId = String(emp.users_seq || emp.users_id || emp.id || '');
      return aId === empId && empId !== '';
    });
    if (isDuplicate) { alert('이미 추가된 참석자입니다.'); return; }
    setNewMinutes({ ...newMinutes, attendees: [...newMinutes.attendees, emp] });
    setErrors(prev => ({ ...prev, attendees: false }));
    setSearchQuery('');
    setShowResults(false);
  };

  const handleRemoveAttendee = (idx) => {
    setNewMinutes(prev => ({ ...prev, attendees: prev.attendees.filter((_, i) => i !== idx) }));
  };

  const renderAttendeeDropdown = () => {
    if (!showResults) return null;
    return createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[9999] bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar"
        style={{ top: `${dropdownPos.top + 4}px`, left: `${dropdownPos.left}px`, width: `${dropdownPos.width}px` }}
      >
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(emp => (
            <div key={emp.users_seq || emp.id} onClick={() => handleAddAttendee(emp)}
              className="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0">
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
      </div>,
      document.body
    );
  };

  const renderAttendeeDropdownForEdit = () => {
    if (!showResults) return null;
    return createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[9999] bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar"
        style={{ top: `${dropdownPos.top + 4}px`, left: `${dropdownPos.left}px`, width: `${dropdownPos.width}px` }}
      >
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(emp => (
            <div key={emp.users_seq || emp.id}
              onClick={() => {
                const empId = emp.users_id || emp.id;
                const isDuplicate = editMinutes.attendees.some(a => 
                  (a.users_id || a.id) === empId || (a.id || a.users_id) === empId
                );
                if (!isDuplicate) {
                  setEditMinutes({...editMinutes, attendees: [...editMinutes.attendees, emp]});
                  setErrors(prev => ({...prev, attendees: false}));
                } else { alert('이미 추가된 참석자입니다.'); }
                setSearchQuery('');
                setShowResults(false);
              }}
              className="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0">
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
      </div>,
      document.body
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) setIsCalendarOpen(false);
      if (editCalendarRef.current && !editCalendarRef.current.contains(event.target)) setIsEditCalendarOpen(false);
    };
    if (isCalendarOpen || isEditCalendarOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen, isEditCalendarOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideInput = attendeeInputRef.current?.contains(event.target);
      const isInsideDropdown = dropdownRef.current?.contains(event.target);
      if (!isInsideInput && !isInsideDropdown) { setShowResults(false); setSearchQuery(''); }
    };
    if (showResults) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showResults]);

  const handleOpenCreate = () => {
    setActiveId(null);
    setNewMinutes({
      title: '', meeting_dt: '', start_time: '', end_time: '',
      main_content: '', decisions: '', todos: '',
      users_id: user?.users_id || '',
      host_users_id: '', hostObj: null, attendees: []
    });
    setErrors({ title: false, meeting_dt: false, start_time: false, end_time: false, time_order: false, main_content: false, attendees: false, host: false });
    setIsCreating(true);
  };

  const handleClosePanel = () => {
    setActiveId(null); 
    setActiveDetail(null); 
    setIsCreating(false); 
    setIsEditing(false);
    setEditMinutes(null);
    setHostInAttendeesWarning(false);
  };

  const handleSelectMinutes = (id, skipEditCheck = false) => {
    if (!skipEditCheck && isEditing) {
      if (!window.confirm('수정 중인 내용이 있습니다. 취소하고 이동하시겠습니까?')) return;
      handleCancelEdit();
    }
    setIsCreating(false);
    setActiveId(id);
    getMinutesDetail(id).then(resp => {
      setActiveDetail(resp.data);
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const timeMatch = timeStr.match(/(\d{2}:\d{2})/);
    if (timeMatch) return timeMatch[1];
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) { return timeStr; }
  };

  return (
    <div className="w-full h-screen lg:h-full flex flex-col p-6 md:p-8 lg:px-10 box-border bg-white font-sans overflow-hidden">
      <style>{`
        @media (min-width: 64rem) { main.flex-1 { overflow: hidden !important; } }
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #E5E7EB; 
          border: 3px solid transparent;
          background-clip: padding-box;
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: #D1D5DB; 
          border: 3px solid transparent;
          background-clip: padding-box;
        }
      `}</style>

      <div className="mb-4 px-0 py-1 shrink-0 flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-2xl font-bold text-gray-900 mb-1">회의록</h1>
          <p className="text-[0.85rem] text-gray-500 font-medium">회의 내용을 기록하고 참여자와 공유하세요</p>
        </div>
        <div className="flex flex-col items-end">
          <button onClick={handleOpenCreate} className="md:hidden bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all text-xl font-bold">+</button>
          <button onClick={handleOpenCreate} className="hidden md:block bg-indigo-600 text-white text-[0.75rem] font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 mb-1">
            + 회의록 작성
          </button>
        </div>
      </div>

      <div className={`flex-1 relative flex px-0 overflow-hidden min-h-0 ${(activeId || isCreating) ? 'gap-0 lg:gap-6' : 'gap-0'}`}>
        {/* 목록 섹션 */}
        <div className={`transition-all duration-500 ease-in-out bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full
          ${(activeId || isCreating) ? 'w-0 opacity-0 invisible lg:w-[55%] lg:opacity-100 lg:visible' : 'w-full opacity-100 visible flex-1'}`}>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:px-8 border-b border-gray-50 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-s font-extrabold text-indigo-950">회의 목록</h3>
              <span className="bg-indigo-50 text-indigo-600 text-[0.7rem] font-bold px-2.5 py-1 rounded-full">총 {totalCount}건</span>
            </div>
            <div className="relative group w-full md:w-64">
              <input type="text" placeholder="제목, 일시로 검색" value={searchKeyword} onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all placeholder:text-gray-300 text-xs text-gray-700 shadow-sm" />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-2 custom-scrollbar">
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-12 py-3 bg-white border-b border-gray-100 shrink-0">
              <div className="md:col-span-5 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">회의 제목</div>
              <div className="md:col-span-4 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">일시</div>
              <div className="md:col-span-3 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider text-center">참여자</div>
            </div>

            {/* 스크롤 div에서 컬럼 헤더 제거 */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-2 custom-scrollbar">
              <div className="divide-y divide-gray-50">
                {paginatedMinutes.length > 0 ? (
                  paginatedMinutes.map((item) => (
                    <div key={item.minute_seq} onClick={() => handleSelectMinutes(item.minute_seq)}
                      className={`cursor-pointer hover:bg-indigo-50/50 transition-colors group px-4 py-5 md:py-4 flex flex-col md:grid md:grid-cols-12 md:items-center gap-3 md:gap-4 ${activeId === item.minute_seq ? 'bg-indigo-50/50' : ''}`}>
                      <div className="md:col-span-5 flex items-center gap-2 min-w-0">
                        <span className={`text-sm font-bold group-hover:text-indigo-600 transition-colors ${activeId === item.minute_seq ? 'text-indigo-600' : 'text-gray-700'} truncate`}>{item.title}</span>
                        {item.badgeType === 'author_host' && (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">주최자</span>
                        )}
                        {item.badgeType === 'host' && (
                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">주최자</span>
                        )}
                        {item.badgeType === 'attendee' && (
                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">참석자</span>
                        )}
                      </div>
                      <div className="md:col-span-4 text-xs text-gray-500 font-medium">
                        <span className="md:hidden text-gray-400 mr-2 font-bold uppercase text-[10px]">일시</span>
                        {item.meeting_dt} | {formatTime(item.start_time)} – {formatTime(item.end_time)}
                      </div>
                      <div className="md:col-span-3 flex justify-start md:justify-center">
                        <div className="md:hidden text-gray-400 mr-4 font-bold uppercase text-[10px] self-center">참여자</div>
                        <ParticipantStack attendees={item.attendees} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-gray-400 text-sm font-bold">회의록이 없습니다.</div>
                )}
              </div>
            </div>       
          </div>

          <div className="border-t border-gray-50 bg-white py-2 shrink-0">
            <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} />
          </div>
        </div>

        {/* 상세/작성 섹션 */}
        <div className={`transition-all duration-500 ease-in-out bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full
          ${(activeId || isCreating) ? 'flex-1 lg:w-[45%] lg:flex-none translate-x-0 opacity-100 visible' : 'w-0 lg:w-0 translate-x-full opacity-0 invisible'}`}>

          {/* ── 상세 보기 ── */}
          {activeDetail && !isCreating && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="py-6 md:py-8 px-6 md:px-8 border-b border-gray-50 shrink-0 flex justify-between items-start">
                {isEditing ? (
                  <div className="w-full space-y-4">
                    <div className="space-y-1">
                      <input type="text" value={editMinutes.title}
                        maxLength={60}
                        onChange={(e) => setEditMinutes({...editMinutes, title: e.target.value})}
                        className="w-full text-xl md:text-2xl font-bold text-indigo-950 border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition-all" />
                      <div className="flex justify-end px-1">
                        <span className={`text-[10px] font-bold ${editMinutes.title.length >= 60 ? 'text-red-400' : 'text-gray-300'}`}>{editMinutes.title.length}/60</span>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="relative flex-1 md:w-auto">
                        <button 
                          onClick={() => setIsEditCalendarOpen(!isEditCalendarOpen)}
                          className={`w-full border rounded-xl p-2.5 text-sm text-left font-bold transition-all flex justify-between items-center ${errors.meeting_dt ? 'border-red-400 ring-4 ring-red-100 text-red-400' : 'border-gray-300 text-gray-700 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300'}`}
                        >
                          {editMinutes.meeting_dt || '날짜 선택'}
                        </button>
                        {isEditCalendarOpen && (
                          <div ref={editCalendarRef} className="absolute top-full left-0 w-full z-40 [&>div]:top-0 [&>div]:bottom-auto [&>div]:mt-1 [&>div]:mb-0">
                            <Calendar 
                              value={editMinutes.meeting_dt}
                              onChange={(date) => { setEditMinutes({...editMinutes, meeting_dt: date}); setErrors(prev => ({...prev, meeting_dt: false})); }}
                              onClose={() => setIsEditCalendarOpen(false)} 
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                           <TimePicker
                              value={editMinutes.start_time}
                              hasError={errors.time_order}
                              onChange={(val) => {
                                setEditMinutes({...editMinutes, start_time: val});
                                setErrors(prev => ({...prev, time_order: false}));
                              }}
                            />
                            <TimePicker
                              value={editMinutes.end_time}
                              hasError={errors.time_order}
                              onChange={(val) => {
                                setEditMinutes({...editMinutes, end_time: val});
                                setErrors(prev => ({...prev, time_order: false}));
                              }}
                            />
                        </div>
                      </div>
                    </div>
                    {errors.time_order && <p className="text-[11px] text-red-500 font-bold ml-1">{"종료 시간은 시작 시간보다 \n이후여야 합니다."}</p>}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl md:text-2xl font-bold text-indigo-950">{activeDetail.title}</h2>
                      {activeDetail.host_users_id === user?.id ? (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">주최자</span>
                      ) : activeDetail.users_id !== user?.id && (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">참석자</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-medium">
                      {activeDetail.meeting_dt} | {formatTime(activeDetail.start_time)} – {formatTime(activeDetail.end_time)}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button onClick={handleClosePanel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-0 custom-scrollbar">
                <div className="max-w-3xl space-y-4">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 작성자 */}
                    <div className="min-w-0">
                      <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">작성자</h4>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const author = (allEmployees || []).find(emp => emp.id === activeDetail.users_id);
                          return author ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm border-2 border-white overflow-hidden bg-slate-100">
                                {author.sysname && author.sysname !== 'system' && token ? (
                                  <img src={`http://localhost/file/profile/view?sysname=${author.sysname}&token=${token}`} alt={author.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: author.color || '#6366F1' }}>
                                    {author.name ? author.name.slice(0, 1) : '?'}
                                  </div>
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-gray-600">{author.name}</span>
                            </div>
                          ) : <span className="text-sm text-gray-400">-</span>;
                        })()}
                      </div>
                    </div>

                    {/* 주최자 */}
                    <div className="min-w-0">
                      <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">주최자</h4>
                      {isEditing ? (
                        <div className="flex flex-col gap-1.5">
                          <div className={`flex items-center gap-2 p-1.5 bg-white border rounded-2xl transition-all
                            ${errors.host ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-300 focus-within:ring-2 focus-within:ring-indigo-100'}`}>
                            <div className="flex flex-wrap gap-2 flex-1 items-center px-2">
                              {editMinutes.hostObj ? (
                                <div className="flex items-center gap-1.5 bg-white border border-indigo-100 px-2.5 py-1 rounded-full text-[11px] font-bold text-indigo-700 shadow-sm">
                                  <span>{editMinutes.hostObj.name}</span>
                                  <button onClick={() => {setEditMinutes({...editMinutes, hostObj: null}); setHostInAttendeesWarning(false);}} className="text-indigo-300 hover:text-indigo-500 transition-colors">✕</button>
                                </div>
                              ) : (
                                <input
                                  ref={hostInputRef}
                                  type="text"
                                  placeholder="검색"
                                  className="w-full bg-transparent border-none outline-none text-xs font-bold text-gray-700 p-1"
                                  value={hostQuery}
                                  onClick={() => { setShowHostResults(true); updateHostDropdownPos(); }}
                                  onChange={(e) => { setHostQuery(e.target.value); setShowHostResults(true); updateHostDropdownPos(); }}
                                  onFocus={() => { setShowHostResults(true); updateHostDropdownPos(); }}
                                />
                              )}
                            </div>
                          </div>
                          {errors.host && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">필수 선택</p>}
                          {renderHostDropdown((emp) => {
                            const empId = emp.users_id || emp.id;
                            const isAlreadyAttendee = (editMinutes.attendees || []).some(
                              a => (a.users_id || a.id) === empId
                            );
                            setHostInAttendeesWarning(isAlreadyAttendee);
                            setEditMinutes({...editMinutes, hostObj: emp});
                            setErrors(prev => ({...prev, host: false}));
                            setHostQuery('');
                            setShowHostResults(false);
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {activeDetail.host_users_id ? (() => {
                            const hostPerson =  (activeDetail.attendees || []).find(a => a.users_id === activeDetail.host_users_id) ||
                                                (allEmployees || []).find(emp => emp.id === activeDetail.host_users_id);
                            return hostPerson ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm border-2 border-white overflow-hidden bg-slate-100">
                                  {hostPerson.sysname  && hostPerson.sysname !== 'system' && token ? (
                                     <img src={`http://localhost/file/profile/view?sysname=${hostPerson.sysname}&token=${token}`} alt={hostPerson.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: hostPerson.color || '#6366F1' }}>
                                      {hostPerson.name ? hostPerson.name.slice(0, 1) : '?'}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[11px] font-bold text-gray-600">{hostPerson.name}</span>
                              </div>
                            ) : null;
                          })() : <span className="text-sm text-gray-400">-</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 참석자 */}
                  <div className="min-w-0">
                    <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">참석자</h4>
                    {isEditing ? (
                      <div className="relative">
                        <div className={`flex items-center gap-2 p-1.5 bg-white border rounded-2xl transition-all ${errors.attendees ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300 focus-within:ring-2 focus-within:ring-indigo-100'}`}>
                          <div className="flex flex-wrap gap-2 flex-1 items-center px-2">
                            {editMinutes.attendees.map((emp, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 bg-white border border-indigo-100 px-2.5 py-1 rounded-full text-[11px] font-bold text-indigo-700 shadow-sm">
                                <span>{emp.name}</span>
                                <button onClick={() => setEditMinutes({...editMinutes, attendees: editMinutes.attendees.filter((_, i) => i !== idx)})} className="text-indigo-300 hover:text-indigo-500 transition-colors">✕</button>
                              </div>
                            ))}
                            <input ref={attendeeInputRef} type="text" placeholder={editMinutes.attendees.length === 0 ? "검색" : ""}
                              className="w-full bg-transparent border-none outline-none text-xs font-bold text-gray-700 p-1"
                              value={searchQuery}
                              onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); updateDropdownPos(); }}
                              onFocus={() => { setShowResults(true); updateDropdownPos(); }} />
                          </div>
                        </div>
                        {errors.attendees && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">필수 입력</p>}
                        {renderAttendeeDropdownForEdit()}
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        {(activeDetail.attendees || []).map((a, i) => (
                          <div key={i} className="flex flex-col items-center gap-1.5">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm border-2 border-white overflow-hidden bg-slate-100">
                              {a.sysname && token ? (
                                <img src={`http://localhost/file/profile/view?sysname=${a.sysname}&token=${token}`} alt={a.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: a.color || '#6366F1' }}>
                                  {a.name ? a.name.slice(0, 1) : '?'}
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-gray-600">{a.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {isEditing && hostInAttendeesWarning && (
                    <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold px-3 py-2 rounded-xl">
                      <span>주최자는 참석자 명단에 포함될 수 없습니다. 저장 시 참석자 목록에서 자동으로 제외됩니다.</span>
                    </div>
                  )}

                  {/* 주요 내용 */}
                  <div>
                    <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">주요 내용</h4>
                    {isEditing ? (
                      <>
                        <textarea rows="5" value={editMinutes.main_content}
                          maxLength={2000}
                          onChange={(e) => { setEditMinutes({...editMinutes, main_content: e.target.value}); if(e.target.value) setErrors(prev => ({...prev, main_content: false})); }}
                          className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm text-gray-900 resize-none focus:outline-none focus:ring-4 transition-all custom-scrollbar ${errors.main_content ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-300 focus:ring-indigo-100 focus:border-indigo-300'}`} />
                        <div className="flex justify-end mt-1">
                          <span className={`text-[10px] font-bold ${editMinutes.main_content.length >= 2000 ? 'text-red-400' : 'text-gray-300'}`}>{editMinutes.main_content.length}/2000</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[0.9rem] text-gray-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-4 rounded-2xl border border-slate-100">{activeDetail.main_content}</div>
                    )}
                    {isEditing && errors.main_content && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">회의 내용을 입력해주세요.</p>}
                  </div>

                  {/* 결정 사항 */}
                  <div>
                    <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">결정 사항</h4>
                    {isEditing ? (
                      <>
                        <textarea rows="3" value={editMinutes.decisions} 
                          maxLength={1000}
                          onChange={(e) => setEditMinutes({...editMinutes, decisions: e.target.value})}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 resize-none focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition-all custom-scrollbar" />
                        <div className="flex justify-end mt-1">
                          <span className={`text-[10px] font-bold ${(editMinutes.decisions?.length || 0) >= 1000 ? 'text-red-400' : 'text-gray-300'}`}>{editMinutes.decisions?.length || 0}/1000</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[0.85rem] font-bold text-gray-700 whitespace-pre-wrap bg-slate-50/50 p-4 rounded-2xl border border-slate-100">{activeDetail.decisions}</div>
                    )}
                  </div>

                  {/* 할 일 */}
                  <div>
                    <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">할 일</h4>
                    {isEditing ? (
                      <>
                        <textarea rows="3" value={editMinutes.todos} 
                          maxLength={300}
                          onChange={(e) => setEditMinutes({...editMinutes, todos: e.target.value})}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 resize-none focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition-all custom-scrollbar" />
                        <div className="flex justify-end mt-1">
                          <span className={`text-[10px] font-bold ${(editMinutes.todos?.length || 0) >= 300 ? 'text-red-400' : 'text-gray-300'}`}>{editMinutes.todos?.length || 0}/300</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[0.9rem] text-gray-700 whitespace-pre-wrap bg-slate-50/50 p-4 rounded-2xl border border-slate-100">{activeDetail.todos}</div>
                    )}
                  </div>

                  {/* 수정/삭제 버튼 */}
                  {activeDetail.users_id === user?.id && (
                    <div className="pt-8 flex gap-3">
                      {isEditing ? (
                        <>
                          <button onClick={handleCompleteEdit} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all">완료</button>
                          <button onClick={handleCancelEdit} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all">취소</button>
                        </>
                      ) : (
                        <>
                          <button onClick={handleToggleEdit} className="flex-1 py-3 bg-white border border-indigo-200 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all">수정</button>
                          <button
                            onClick={() => {
                              if (window.confirm("정말 이 회의록을 삭제하시겠습니까?")) {
                                showLoading();
                                delMinutes(activeDetail.minute_seq).then(() => {
                                  hideLoading();
                                  alert('삭제되었습니다.');
                                  handleClosePanel();
                                  fetchMinutesList();
                                }).catch((error) => {
                                  hideLoading();
                                  console.error('삭제 실패:', error);
                                  alert('삭제에 실패했습니다.');
                                });
                              }
                            }}
                            className="flex-1 py-3 bg-white border border-red-200 text-red-500 font-bold rounded-2xl hover:bg-red-50 transition-all">삭제</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 작성 폼 ── */}
          {isCreating && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="py-6 md:py-8 px-6 md:px-8 border-b border-gray-50 shrink-0 flex justify-between items-start">
                <h2 className="text-xl md:text-2xl font-bold text-indigo-950 mb-1">회의록 작성</h2>
                <button onClick={handleClosePanel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-0 custom-scrollbar">
                <div className="max-w-3xl space-y-6">

                  {/* 제목 */}
                  <div>
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">회의 제목</label>
                    <input type="text" placeholder="회의 제목을 입력하세요" value={newMinutes.title}
                      maxLength={60}
                      onChange={(e) => { setNewMinutes({...newMinutes, title: e.target.value}); if(e.target.value) setErrors(prev => ({...prev, title: false})); }}
                      className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm focus:outline-none focus:ring-4 transition-all font-bold text-gray-700 ${errors.title ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-300 focus:ring-indigo-100'}`} />
                    <div className="flex justify-end mt-1">
                      <span className={`text-[10px] font-bold ${newMinutes.title.length >= 60 ? 'text-red-400' : 'text-gray-300'}`}>{newMinutes.title.length}/60</span>
                    </div>
                    {errors.title && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">회의 제목을 입력해주세요.</p>}
                  </div>

                  {/* 일시 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">회의 일자</label>
                      <button onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm text-left font-bold transition-all flex justify-between items-center ${errors.meeting_dt ? 'border-red-400 ring-4 ring-red-100 text-red-400' : 'border-gray-300 text-gray-600'}`}>
                        {newMinutes.meeting_dt || '날짜 선택'}
                      </button>
                      {errors.meeting_dt && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">날짜를 선택해주세요.</p>}
                      {isCalendarOpen && (
                        <div ref={calendarRef} className="absolute top-full left-0 w-full z-40 [&>div]:top-0 [&>div]:bottom-auto [&>div]:mt-1 [&>div]:mb-0">
                          <Calendar value={newMinutes.meeting_dt}
                            onChange={(date) => { setNewMinutes({...newMinutes, meeting_dt: date}); setErrors(prev => ({...prev, meeting_dt: false})); }}
                            onClose={() => setIsCalendarOpen(false)} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">시작 시간</label> 
                      <TimePicker
                        value={newMinutes.start_time}
                        hasError={errors.start_time || errors.time_order}
                        onChange={(val) => {
                          setNewMinutes({...newMinutes, start_time: val});
                          setErrors(prev => ({...prev, start_time: false, time_order: false}));
                        }}
                      />
                      {errors.start_time && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">시작 시간을 입력해주세요.</p>}
                    </div>
                    <div>
                      <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">종료 시간</label>
                        <TimePicker
                          value={newMinutes.end_time}
                          hasError={errors.end_time || errors.time_order}
                          onChange={(val) => {
                            setNewMinutes({...newMinutes, end_time: val});
                            setErrors(prev => ({...prev, end_time: false, time_order: false}));
                          }}
                        />
                      {errors.end_time && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">종료 시간을 입력해주세요.</p>}
                      {errors.time_order && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1 whitespace-pre-wrap">{"종료 시간은 시작 시간보다 \n이후여야 합니다."}</p>}
                    </div>
                  </div>

                  {/* 주최자 */}
                  <div>
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">주최자</label>
                    <div className="flex flex-col gap-1.5">
                      <div className={`flex items-center gap-2 p-1.5 bg-white border rounded-2xl transition-all
                        ${errors.host ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-300 focus-within:ring-2 focus-within:ring-indigo-100'}`}>
                        <div className="flex flex-wrap gap-2 flex-1 items-center px-2">
                          {newMinutes.hostObj ? (
                            <div className="flex items-center gap-1.5 bg-white border border-indigo-100 px-2.5 py-1 rounded-full text-[11px] font-bold text-indigo-700 shadow-sm">
                              <span>{newMinutes.hostObj.name}</span>
                              <button onClick={() => setNewMinutes({...newMinutes, hostObj: null, host_users_id: ''})} className="text-indigo-300 hover:text-indigo-500 transition-colors">✕</button>
                            </div>
                          ) : (
                            <input
                              ref={hostInputRef}
                              type="text"
                              placeholder="검색"
                              className="w-full bg-transparent border-none outline-none text-xs font-bold text-gray-700 p-1"
                              value={hostQuery}
                              onClick={() => { setShowHostResults(true); updateHostDropdownPos(); }}
                              onChange={(e) => { setHostQuery(e.target.value); setShowHostResults(true); updateHostDropdownPos(); }}
                              onFocus={() => { setShowHostResults(true); updateHostDropdownPos(); }}
                            />
                          )}
                        </div>
                      </div>
                      {errors.host && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">필수 선택</p>}
                      {renderHostDropdown((emp) => {
                        setNewMinutes({...newMinutes, hostObj: emp, host_users_id: emp.id});
                        setErrors(prev => ({...prev, host: false}));
                        setHostQuery('');
                        setShowHostResults(false);
                      })}
                    </div>
                  </div>


                  {/* 참석자 */}
                  <div className="space-y-3">
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">참석자</label>
                    <div className="relative">
                      <div className={`flex items-center gap-2 p-1.5 bg-white border rounded-2xl transition-all ${errors.attendees ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-300 focus-within:ring-2 focus-within:ring-indigo-100'}`}>
                        <div className="flex flex-wrap gap-2 flex-1 items-center px-2">
                          {newMinutes.attendees.map((emp, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-white border border-indigo-100 px-2.5 py-1 rounded-full text-[11px] font-bold text-indigo-700 shadow-sm">
                              <span>{emp.name}</span>
                              <button onClick={() => handleRemoveAttendee(idx)} className="text-indigo-300 hover:text-indigo-500 transition-colors">✕</button>
                            </div>
                          ))}
                          <input ref={attendeeInputRef} type="text" placeholder={newMinutes.attendees.length === 0 ? "검색" : ""}
                            className="w-full bg-transparent border-none outline-none text-xs font-bold text-gray-700 p-1"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); updateDropdownPos(); }}
                            onFocus={() => { setShowResults(true); updateDropdownPos(); }} />
                        </div>
                      </div>
                      {errors.attendees && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">필수 입력</p>}
                      {renderAttendeeDropdown()}
                    </div>
                  </div>

                  {/* 주요 내용 */}
                  <div>
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">주요 내용</label>
                    <textarea rows="5" placeholder="회의 내용을 상세히 입력하세요" value={newMinutes.main_content}
                      maxLength={2000}
                      onChange={(e) => { setNewMinutes({...newMinutes, main_content: e.target.value}); if(e.target.value) setErrors(prev => ({...prev, main_content: false})); }}
                      className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm focus:outline-none focus:ring-4 transition-all font-medium text-gray-700 resize-none custom-scrollbar ${errors.main_content ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-300 focus:ring-indigo-100'}`} />
                    <div className="flex justify-end mt-1">
                      <span className={`text-[10px] font-bold ${newMinutes.main_content.length >= 2000 ? 'text-red-400' : 'text-gray-300'}`}>{newMinutes.main_content.length}/2000</span>
                    </div>
                    {errors.main_content && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">회의 내용을 입력해주세요.</p>}
                  </div>

                  {/* 결정 사항 */}
                  <div>
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">결정 사항</label>
                    <textarea rows="3" placeholder="주요 결정 사항을 입력하세요" value={newMinutes.decisions}
                      maxLength={1000}
                      onChange={(e) => setNewMinutes({...newMinutes, decisions: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-gray-600 resize-none custom-scrollbar" />
                    <div className="flex justify-end mt-1">
                      <span className={`text-[10px] font-bold ${(newMinutes.decisions?.length || 0) >= 1000 ? 'text-red-400' : 'text-gray-300'}`}>{newMinutes.decisions?.length || 0}/1000</span>
                    </div>
                  </div>

                  {/* 할 일 */}
                  <div>
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">할 일</label>
                    <textarea rows="3" placeholder="후속 조치 사항을 입력하세요" value={newMinutes.todos}
                      maxLength={300}
                      onChange={(e) => setNewMinutes({...newMinutes, todos: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-gray-600 resize-none custom-scrollbar" />
                    <div className="flex justify-end mt-1">
                      <span className={`text-[10px] font-bold ${(newMinutes.todos?.length || 0) >= 300 ? 'text-red-400' : 'text-gray-300'}`}>{newMinutes.todos?.length || 0}/300</span>
                    </div>
                  </div>

                  <div className="pt-12 pb-10">
                    <button onClick={handleSave} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all">
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
