import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Calendar from '../../components/common/Calendar';
import Pagination from '../../components/common/Pagination';
import useEmployeeStore from '../../store/useEmployeeStore';
import useAuthStore from '../../store/authStore';

const minutesData = [
  {
    id: 1,
    title: '프로젝트 킥오프 회의',
    date: '2024-05-10 10:00',
    status: '진행완료',
    detail: {
      timeRange: '2024-05-10 10:00 – 11:30',
      attendees: [
        { name: '김', color: '#3B82F6', sysname: null },
        { name: '이', color: '#8b5cf6', sysname: null },
        { name: '박', color: '#10b981', sysname: null },
      ],
      extra: 2,
      contents: ['프로젝트 일정 및 목표 공유', '팀 역할 분담 논의', '주요 마일스톤 확인'],
      decisions: ['킥오프 일정: 2024-05-15 확정', '주간 스탠드업 매주 월요일 10시', '개발 스택: React + Node.js'],
      todos: [
        { text: '프로젝트 일정표 작성', assignee: '김민준' },
        { text: '개발 환경 세팅', assignee: '이서연' },
      ],
    },
  },
  {
    id: 2,
    title: 'UI/UX 디자인 리뷰 회의',
    date: '2024-05-08 14:00',
    status: '진행완료',
    detail: {
      timeRange: '2024-05-08 14:00 – 15:30',
      attendees: [
        { name: '김', color: '#3B82F6', sysname: null },
        { name: '이', color: '#8b5cf6', sysname: null },
        { name: '박', color: '#10b981', sysname: null },
      ],
      extra: 2,
      contents: ['에딩 필터 및 타이포그래피 확칭', '대시보드 레이아웃 구조 검토', '모바일 반응형 디자인 방향 논의'],
      decisions: ['메인 컬러: #3882F6로 확정', '폰트: Pretendard 사용', '모바일 우선 디자인 적용'],
      todos: [
        { text: '디자인 시스템 가이드 작성', assignee: '이서연' },
        { text: '대시보드 시안 업데이트', assignee: '김진혼' },
      ],
    },
  },
  {
    id: 3,
    title: 'API 설계 논의',
    date: '2024-05-06 11:00',
    status: '진행완료',
    detail: {
      timeRange: '2024-05-06 11:00 – 12:00',
      attendees: [
        { name: '박', color: '#10b981', sysname: null },
        { name: '최', color: '#f59e0b', sysname: null },
      ],
      extra: 0,
      contents: ['REST API 엔드포인트 설계', '인증 방식 결정', '응답 포맷 표준화'],
      decisions: ['JWT 인증 방식 채택', 'API 버전 관리: /v1/ prefix', '응답 포맷: JSON 통일'],
      todos: [
        { text: 'API 명세서 초안 작성', assignee: '박준호' },
      ],
    },
  },
  {
    id: 4,
    title: '데이터베이스 설계 회의',
    date: '2024-05-03 15:00',
    status: '진행완료',
    detail: {
      timeRange: '2024-05-03 15:00 – 16:30',
      attendees: [
        { name: '최', color: '#f59e0b', sysname: null },
        { name: '김', color: '#3B82F6', sysname: null },
      ],
      extra: 1,
      contents: ['ERD 초안 검토', '테이블 구조 최적화', '인덱싱 전략 논의'],
      decisions: ['PostgreSQL 사용 확정', '소프트 딜리트 방식 적용', '감사 로그 테이블 추가'],
      todos: [
        { text: 'ERD 최종본 작성', assignee: '최민수' },
        { text: '마이그레이션 스크립트 준비', assignee: '김진혼' },
      ],
    },
  },
  {
    id: 5,
    title: '배포 컨택 회의',
    date: '2024-05-01 16:00',
    status: '진행완료',
    detail: {
      timeRange: '2024-05-01 16:00 – 17:00',
      attendees: [
        { name: '김', color: '#3B82F6', sysname: null },
        { name: '이', color: '#8b5cf6', sysname: null },
      ],
      extra: 0,
      contents: ['배포 환경 설정 논의', 'CI/CD 파이프라인 구성', '도메인 및 서버 결정'],
      decisions: ['AWS EC2 배포 확정', 'GitHub Actions CI/CD 적용', '도메인: project.example.com'],
      todos: [
        { text: '서버 초기 세팅', assignee: '이서연' },
      ],
    },
  },
];

// 참여자 프로필 스택 컴포넌트 (ApprovalMyPage 참고)
const ParticipantStack = ({ attendees, extra }) => {
  const token = useAuthStore(state => state.token);
  const displayLimit = 3;
  const displayAttendees = attendees.slice(0, displayLimit);
  const remainingCount = (attendees.length > displayLimit ? attendees.length - displayLimit : 0) + (extra || 0);

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center -space-x-2">
        {displayAttendees.map((user, index) => (
          <div
            key={index}
            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shadow-sm overflow-hidden relative group"
            title={user.name}
          >
            {user.sysname ? (
              <img 
                src={`http://localhost/file/profile/view?sysname=${user.sysname}&token=${token}`}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-[10px] md:text-[11px] font-bold text-white uppercase"
                style={{ backgroundColor: user.color || '#6366F1' }}
              >
                {user.name.slice(0, 1)}
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
  const [activeId, setActiveId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const active = minutesData.find((m) => m.id === activeId);

  // 작성 폼 상태
  const [newMinutes, setNewMinutes] = useState({
    title: '',
    date: '',
    timeRange: '',
    attendees: [],
    contents: [''],
    decisions: [''],
    todos: [{ text: '', assignee: '' }]
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
  }, [fetchEmployees]);

  // 검색 필터링 로직
  const filteredMinutes = minutesData.filter(item => 
    item.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    item.date.includes(searchKeyword) ||
    item.status.includes(searchKeyword)
  );

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

  // 검색 쿼리에 따른 필터링
  const filteredEmployees = searchQuery 
    ? allEmployees.filter(emp => {
        const name = emp?.name || '';
        const deptName = emp?.dept_name || '';
        return name.includes(searchQuery) || deptName.includes(searchQuery);
      }) 
    : [];

  const handleAddAttendee = (emp) => {
    if (newMinutes.attendees.some(a => a.users_seq === emp.users_seq)) {
      alert('이미 추가된 참석자입니다.');
      return;
    }
    setNewMinutes({
      ...newMinutes,
      attendees: [...newMinutes.attendees, emp]
    });
    setSearchQuery('');
    setShowResults(false);
  };

  const handleRemoveAttendee = (idx) => {
    setNewMinutes(prev => {
      const nextAttendees = [...prev.attendees];
      nextAttendees.splice(idx, 1);
      return { ...prev, attendees: nextAttendees };
    });
  };

  // 할 일 항목 추가/수정/삭제 로직
  const handleTodoChange = (idx, field, value) => {
    setNewMinutes(prev => {
      const nextTodos = [...prev.todos];
      nextTodos[idx] = { ...nextTodos[idx], [field]: value };
      return { ...prev, todos: nextTodos };
    });
  };

  const handleAddTodo = () => {
    setNewMinutes(prev => ({
      ...prev,
      todos: [...prev.todos, { text: '', assignee: '' }]
    }));
  };

  const handleTodoKeyDown = (e, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (idx === newMinutes.todos.length - 1) {
        if (!newMinutes.todos[idx].text.trim()) return;
        handleAddTodo();
      }
    }
  };

  const handleRemoveTodo = (idx) => {
    setNewMinutes(prev => {
      if (prev.todos.length === 1) {
        return { ...prev, todos: [{ text: '', assignee: '' }] };
      }
      return { ...prev, todos: prev.todos.filter((_, i) => i !== idx) };
    });
  };

  // 주요 내용/결정 사항 동적 관리
  const handleListChange = (field, idx, value) => {
    setNewMinutes(prev => {
      const nextList = [...prev[field]];
      nextList[idx] = value;
      return { ...prev, [field]: nextList };
    });
  };

  const handleAddListItem = (field) => {
    setNewMinutes(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const handleListKeyDown = (e, field, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (idx === newMinutes[field].length - 1) {
        if (!newMinutes[field][idx].trim()) return;
        handleAddListItem(field);
      }
    }
  };

  const handleRemoveListItem = (field, idx) => {
    setNewMinutes(prev => {
      if (prev[field].length === 1) {
        return { ...prev, [field]: [''] };
      }
      return { ...prev, [field]: prev[field].filter((_, i) => i !== idx) };
    });
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

  // 달력 외부 클릭 시 닫기 로직
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

  return (
    <div className="w-full h-auto lg:h-full flex flex-col p-4 md:p-6 lg:p-7 box-border bg-white font-sans overflow-hidden">
      {/* PC에서만 부모 스크롤 차단 및 스크롤바 스타일 */}
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

      {/* 헤더 영역 */}
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

      {/* 메인 콘텐츠 영역: 슬라이드 효과를 위해 relative 및 flex-row 유지 */}
      <div className="flex-1 relative flex gap-0 lg:gap-6 px-8 overflow-hidden min-h-0">

        {/* 목록 섹션: 모바일에서는 사라지고 데스크탑에서는 유연하게 줄어듦 */}
        <div className={`transition-all duration-500 ease-in-out bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full
          ${(activeId || isCreating) ? 'w-0 opacity-0 invisible lg:w-auto lg:flex-1 lg:opacity-100 lg:visible' : 'w-full opacity-100 visible flex-1'}`}>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:px-8 border-b border-gray-50 bg-gray-50/10 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-s font-extrabold text-indigo-950">회의 목록</h3>
              <span className="bg-indigo-50 text-indigo-600 text-[0.7rem] font-bold px-2.5 py-1 rounded-full">
                총 {totalCount}건
              </span>
            </div>
            
            {/* 검색창 (AdminUsers 스타일 참고) */}
            <div className="relative group w-full md:w-64">
              <input 
                type="text" 
                placeholder="제목, 일시, 상태로 검색"
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
                      key={item.id} 
                      onClick={() => handleSelectMinutes(item.id)}
                      className={`cursor-pointer hover:bg-indigo-50/50 transition-colors group ${activeId === item.id ? 'bg-indigo-50/50' : ''}`}
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold group-hover:text-indigo-600 transition-colors ${activeId === item.id ? 'text-indigo-600' : 'text-gray-700'} truncate max-w-[120px] md:max-w-none`}>
                            {item.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-xs text-gray-500 font-medium whitespace-nowrap">{item.date}</td>
                      <td className="py-4 text-center">
                        <ParticipantStack attendees={item.detail.attendees} extra={item.detail.extra} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-20 text-center text-gray-400 text-sm font-bold">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 영역 */}
          <div className="border-t border-gray-50 bg-white py-2 shrink-0">
            <Pagination 
              count={totalPages} 
              page={currentPage} 
              onChange={handlePageChange} 
            />
          </div>
        </div>

        {/* 상세/작성 섹션: 오른쪽에서 왼쪽으로 슬라이드인 */}
        <div className={`transition-all duration-500 ease-in-out bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full
          ${(activeId || isCreating) 
            ? 'flex-1 lg:max-w-[55%] translate-x-0 opacity-100 visible' 
            : 'w-0 translate-x-full opacity-0 invisible absolute right-0 inset-y-0 lg:relative lg:translate-x-0 lg:w-0'}`}>
          
          {/* 상세 모드 */}
          {active && !isCreating && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* 상세 헤더 (닫기 버튼 포함) */}
              <div className="py-6 md:py-8 px-5 md:px-6 border-b border-gray-50 shrink-0 flex justify-between items-start">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-indigo-950 mb-1">{active.title}</h2>
                  <p className="text-sm text-gray-500 font-medium">{active.detail.timeRange}</p>
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

              {/* 상세 스크롤 영역 */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-0 custom-scrollbar">
                <div className="max-w-3xl space-y-8 mt-6">
                  {/* 참석자 */}
                  <div>
                    <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">참석자</h4>
                    <div className="flex flex-wrap items-center gap-3">
                      {active.detail.attendees.map((a, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div 
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm border-2 border-white"
                            style={{ backgroundColor: a.color || '#6366F1' }}
                          >
                            {a.name.slice(0, 1)}
                          </div>
                          <span className="text-[10px] font-bold text-gray-500">{a.name}</span>
                        </div>
                      ))}
                      {active.detail.extra > 0 && (
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[0.7rem] font-bold text-gray-500 border-2 border-white">
                          +{active.detail.extra}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 주요 내용 */}
                  <div>
                    <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">주요 내용</h4>
                    <ul className="space-y-3">
                      {active.detail.contents.map((c, i) => (
                        <li key={i} className="flex items-start gap-3 text-[0.9rem] text-gray-700 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 결정 사항 */}
                  <div>
                    <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">결정 사항</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {active.detail.decisions.map((d, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[0.7rem] font-bold shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-[0.85rem] font-bold text-gray-700">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 할 일 */}
                  <div>
                    <h4 className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4">할 일</h4>
                    <div className="space-y-2">
                      {active.detail.todos.map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-md border-2 border-indigo-100 flex items-center justify-center" />
                            <span className="text-[0.9rem] text-gray-700 font-medium">{t.text}</span>
                          </div>
                          <span className="text-[0.7rem] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                            {t.assignee}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 작성 모드 */}
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
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-gray-700"
                    />
                  </div>

                  {/* 일시 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">회의 일자</label>
                      <button 
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm text-left font-bold text-gray-600 flex justify-between items-center"
                      >
                        {newMinutes.date || '날짜 선택'}
                      </button>
                      {isCalendarOpen && (
                        <div ref={calendarRef} className="absolute z-30 w-full top-full mt-1">
                          <Calendar 
                            value={newMinutes.date} 
                            onChange={(date) => setNewMinutes({...newMinutes, date})} 
                            onClose={() => setIsCalendarOpen(false)} 
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">회의 시간</label>
                      <input 
                        type="text" 
                        placeholder="예: 10:00 - 11:30"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-gray-600"
                      />
                    </div>
                  </div>

                  {/* 참석자 */}
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
                            placeholder={newMinutes.attendees.length === 0 ? "이름/부서로 검색하여 참석자를 추가하세요" : ""}
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
                      {showResults && searchQuery && (
                        <div className="fixed inset-0 z-[9998]" onClick={() => setShowResults(false)}></div>
                      )}
                    </div>
                  </div>

                  {/* 주요 내용 */}
                  <div>
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">주요 내용</label>
                    <div className="space-y-2">
                      {newMinutes.contents.map((content, idx) => (
                        <div key={idx} className="flex gap-2 group">
                          <textarea 
                            rows="1"
                            value={content}
                            onChange={(e) => handleListChange('contents', idx, e.target.value)}
                            onKeyDown={(e) => handleListKeyDown(e, 'contents', idx)}
                            placeholder="주요 회의 내용을 입력하세요"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-gray-700 resize-none"
                          ></textarea>
                          {newMinutes.contents.length > 1 && (
                            <button 
                              onClick={() => handleRemoveListItem('contents', idx)}
                              className="px-3 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 결정 사항 */}
                  <div>
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">결정 사항</label>
                    <div className="space-y-2">
                      {newMinutes.decisions.map((decision, idx) => (
                        <div key={idx} className="flex gap-2 group">
                          <input 
                            type="text" 
                            value={decision}
                            onChange={(e) => handleListChange('decisions', idx, e.target.value)}
                            onKeyDown={(e) => handleListKeyDown(e, 'decisions', idx)}
                            placeholder="결정된 사항을 입력하세요" 
                            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                          />
                          {newMinutes.decisions.length > 1 && (
                            <button 
                              onClick={() => handleRemoveListItem('decisions', idx)}
                              className="px-3 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 할 일 */}
                  <div>
                    <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">할 일</label>
                    <div className="space-y-2">
                      {newMinutes.todos.map((todo, idx) => (
                        <div key={idx} className="flex gap-2 items-center group">
                          <button 
                            type="button"
                            onClick={handleAddTodo}
                            className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors shrink-0"
                          >
                            <span className="text-lg font-bold">+</span>
                          </button>
                          <input 
                            type="text" 
                            value={todo.text}
                            onChange={(e) => handleTodoChange(idx, 'text', e.target.value)}
                            onKeyDown={(e) => handleTodoKeyDown(e, idx)}
                            placeholder="할 일 입력" 
                            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                          />
                          {newMinutes.todos.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => handleRemoveTodo(idx)}
                              className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 px-2"
                            >✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-12 pb-10">
                    <button 
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

