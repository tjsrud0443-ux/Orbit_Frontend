import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faUser, faChevronDown, faCircle, faCalendarAlt, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import Calendar from '../../components/common/Calendar';

// 초기 Mock 데이터
const INITIAL_TASKS = [
  { id: 1, title: '디자인 시스템 가이드 작성', assignee: '나 (관리자)', startDate: '2026-05-28', endDate: '2026-06-05', status: 'TODO', priority: 'High', desc: '그룹웨어 디자인 시스템 문서화 및 가이드 배포' },
  { id: 2, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 3, title: 'API 문서 정비', assignee: '나 (관리자)', startDate: '2026-05-30', endDate: '2026-06-15', status: 'DONE', priority: 'Low', desc: 'Swagger 문서 최신화 및 예외 처리 가이드 추가' },
  { id: 4, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 5, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 6, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 7, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 8, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 9, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 10, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 11, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 12, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 13, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 14, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 15, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },

];

const PROJECT_MEMBERS = [
  { id: 0, name: '나 (관리자)', avatar: 'https://i.pravatar.cc/150?u=admin' },
  { id: 1, name: '김철수', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: '이영희', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: '박지성', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, name: '최민수', avatar: 'https://i.pravatar.cc/150?u=4' },
];

const Kanban = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalTask, setDetailModalTask] = useState(null);
  const [activeTab, setActiveTab] = useState('TODO'); // 모바일 탭 상태

  // 외부 클릭 감지를 위한 Ref
  const inlineFormRef = useRef(null);
  const detailTitleRef = useRef(null);
  const lastFocusedTaskId = useRef(null);

  // 캘린더 및 드롭다운 오픈 상태
  const [openCalendar, setOpenCalendar] = useState(null); // 'start' | 'end' | 'detailEnd' | 'inlineStart-...' | 'inlineEnd-...'
  const [openDropdown, setOpenDropdown] = useState(null); // 'globalStatus' | 'globalPriority' | 'inlinePriority-...' | 'detailStatus' | 'detailPriority'

  // 신규 Task 생성을 위한 폼 상태
  const [newGlobalTask, setNewGlobalTask] = useState({
    title: '', assignee: '나 (관리자)', priority: 'Medium', status: 'TODO', startDate: new Date().toISOString().split('T')[0], endDate: '', desc: ''
  });

  // 인라인 폼 상태
  const [inlineForm, setInlineForm] = useState({ status: null, title: '', assignee: '나 (관리자)', priority: 'Medium', startDate: new Date().toISOString().split('T')[0], endDate: '' });
  const [errors, setErrors] = useState({});

  // 상세 모달 오픈 시 제목 포커스 (최초 1회만)
  useEffect(() => {
    if (detailModalTask && detailTitleRef.current && lastFocusedTaskId.current !== detailModalTask.id) {
      detailTitleRef.current.focus();
      lastFocusedTaskId.current = detailModalTask.id;
    } else if (!detailModalTask) {
      lastFocusedTaskId.current = null;
    }
  }, [detailModalTask]);

  // 외부 클릭 감지 로직
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 1. 인라인 폼 외부 클릭 시 초기화
      if (inlineFormRef.current && !inlineFormRef.current.contains(event.target)) {
        setInlineForm({ status: null, title: '', assignee: '나 (관리자)', priority: 'Medium', startDate: new Date().toISOString().split('T')[0], endDate: '' });
        setErrors({});
      }

      // 2. 드롭다운/캘린더 외부 클릭 시 닫기 처리
      // 드롭다운이나 캘린더 컨테이너(.relative) 외부를 클릭했을 때만 닫히도록 함
      // 단, 달력 내부의 클릭은 무시하지 않도록 .relative 내부인지 확인
      if (!event.target.closest('.relative')) {
        setOpenDropdown(null);
        setOpenCalendar(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 드래그 앤 드롭 로직
  const onDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id);
  };

  const onDrop = (e, status) => {
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  // 날짜 포맷 (MM/DD)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  // 우선순위 스타일 설정
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High': return 'bg-[#FF4D4F] text-white';
      case 'Medium': return 'bg-[#FF9800] text-white';
      case 'Low': return 'bg-[#10B981] text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  // 우선순위 가중치 (정렬용)
  const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };

  // 핸들러: 전역 생성
  const handleGlobalCreate = () => {
    const newErrors = {};
    if (!newGlobalTask.title) newErrors.globalTitle = '제목을 입력해주세요.';
    if (!newGlobalTask.endDate) newErrors.globalEndDate = '마감일을 선택해주세요.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const task = {
      ...newGlobalTask,
      id: Date.now(),
    };
    setTasks([...tasks, task]);
    setIsModalOpen(false);
    setNewGlobalTask({ title: '', assignee: '나 (관리자)', priority: 'Medium', status: 'TODO', startDate: new Date().toISOString().split('T')[0], endDate: '', desc: '' });
    setErrors({});
  };

  // 핸들러: 인라인 생성
  const handleInlineCreate = (status) => {
    const newErrors = {};
    if (!inlineForm.title) newErrors[`inlineTitle-${status}`] = '제목을 입력해주세요.';
    if (!inlineForm.endDate) newErrors[`inlineEndDate-${status}`] = '마감일을 선택해주세요.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const task = {
      id: Date.now(),
      title: inlineForm.title,
      assignee: inlineForm.assignee,
      priority: inlineForm.priority,
      status: status,
      startDate: inlineForm.startDate,
      endDate: inlineForm.endDate,
      desc: ''
    };
    setTasks([...tasks, task]);
    setInlineForm({ status: null, title: '', assignee: '나 (관리자)', priority: 'Medium', startDate: new Date().toISOString().split('T')[0], endDate: '' });
    setErrors({});
  };

  // 핸들러: 상세 수정 저장
  const handleUpdateTask = () => {
    setTasks(prev => prev.map(t => t.id === detailModalTask.id ? detailModalTask : t));
    setDetailModalTask(null);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* 1. 데스크탑 뷰 (기존 코드 유지) */}
      <div className="hidden lg:flex flex-col h-full overflow-hidden">
        {/* 1. 상단 프로젝트 헤더 */}
        <header className="flex justify-between items-center px-10 py-8 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/projects')}
              className="w-10 h-10 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
            </button>
            <h1 className="text-2xl font-black text-[#1a1c3d] tracking-tight">Orbit 그룹웨어 고도화</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
              {PROJECT_MEMBERS.map(m => (
                <div key={m.id} className="w-9 h-9 rounded-full border-2 border-white overflow-hidden shadow-sm hover:z-10 transition-all cursor-pointer">
                  <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm cursor-pointer">
                +2
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#3530B8] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-[#2a2594] transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} /> Task 생성
            </button>
          </div>
        </header>

        {/* 2. 칸반 보드 영역 */}
        <main className="flex-1 overflow-x-auto p-6 xl:p-10 custom-scrollbar flex lg:justify-center bg-white">
          <div className="flex gap-6 xl:gap-10 2xl:gap-[100px] h-full min-w-fit max-w-full lg:justify-center">
            {['TODO', 'DOING', 'DONE'].map(status => {
              const columnTasks = tasks
                .filter(t => t.status === status)
                .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
              const dotColor = status === 'TODO' ? 'text-[#3530B8]' : status === 'DOING' ? 'text-amber-500' : 'text-emerald-500';
              const columnBg = status === 'TODO' ? 'bg-[#F1F5F9]' : status === 'DOING' ? 'bg-[#FFF7ED]' : status === 'DONE' ? 'bg-[#F0FDF4]' : 'bg-white';

              return (
                <div
                  key={status}
                  className={`flex-1 max-w-[440px] min-w-[280px] xl:min-w-[320px] 2xl:min-w-[380px] rounded-none p-6 flex flex-col ${columnBg} border border-slate-200/60 transition-all duration-300`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, status)}
                >
                  <div className="flex items-center justify-between mb-6 px-2">
                    <div className="flex items-center gap-2.5">
                      <FontAwesomeIcon icon={faCircle} className={`text-[8px] ${dotColor}`} />
                      <h2 className="text-base font-black text-[#1a1c3d]">{status}</h2>
                      <span className="bg-white px-2 py-0.5 rounded-lg text-[15px] font-bold text-slate-400 border border-slate-100 shadow-sm">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-3">
                    {columnTasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task)}
                        onClick={() => setDetailModalTask(task)}
                        className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100/80 hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100 transition-all cursor-pointer"
                      >
                        <h3 className="font-bold text-base text-[#1a1c3d] mb-4 leading-relaxed group-hover:text-[#3530B8] transition-colors">{task.title}</h3>
                        <div className="flex items-end justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] overflow-hidden border border-white shrink-0">
                              <img src={`https://i.pravatar.cc/150?u=${task.assignee}`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 leading-none">{task.assignee}</span>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-sm font-black px-2 py-0.5 rounded-full ${getPriorityStyle(task.priority)} leading-none`}>
                              {task.priority}
                            </span>
                            <span className="text-xs font-medium text-slate-400 font-mono tracking-tight leading-none">{formatDate(task.endDate)}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {inlineForm.status === status ? (
                      <div 
                        ref={inlineFormRef} 
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          // 폼 내부 클릭 시, 달력/드롭다운 영역(.relative) 외부라면 닫기 처리
                          if (!e.target.closest('.relative')) {
                            setOpenCalendar(null);
                            setOpenDropdown(null);
                          }
                        }}
                        className="bg-white rounded-2xl p-5 shadow-xl border-2 border-[#3530B8]/20 space-y-4 animate-in fade-in zoom-in duration-200"
                      >
                        <input
                          autoFocus
                          placeholder="Task 제목"
                          className={`w-full text-base font-bold outline-none placeholder:text-slate-300 transition-all ${errors[`inlineTitle-${status}`] ? 'border-2 border-red-500 p-2 rounded-xl mb-2' : 'border-none p-0'}`}
                          value={inlineForm.title}
                          onChange={(e) => {
                            setInlineForm({ ...inlineForm, title: e.target.value });
                            if (errors[`inlineTitle-${status}`]) setErrors(prev => ({ ...prev, [`inlineTitle-${status}`]: null }));
                          }}
                        />
                        {errors[`inlineTitle-${status}`] && <p className="text-[10px] text-red-500 font-bold mt-[-8px] ml-1">{errors[`inlineTitle-${status}`]}</p>}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-50 rounded-lg p-2 text-sm font-bold text-slate-400 flex items-center gap-1.5 border border-transparent">
                            <FontAwesomeIcon icon={faUser} className="text-sm" /> {inlineForm.assignee}
                          </div>
                          <div className="relative">
                            <div
                              onClick={() => setOpenDropdown(openDropdown === `inlinePriority-${status}` ? null : `inlinePriority-${status}`)}
                              className="bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer border border-transparent text-slate-500"
                            >
                              {inlineForm.priority || "우선순위"}
                              <FontAwesomeIcon icon={faChevronDown} className="text-sm text-slate-400" />
                            </div>
                            {openDropdown === `inlinePriority-${status}` && (
                              <div className="absolute top-full left-0 z-[120] mt-1 w-full bg-white border border-slate-100 rounded-lg shadow-lg overflow-hidden">
                                {['High', 'Medium', 'Low'].map(p => (
                                  <div
                                    key={p}
                                    onClick={() => { setInlineForm({ ...inlineForm, priority: p }); setOpenDropdown(null); }}
                                    className="px-3 py-2 text-sm text-slate-400 font-bold hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer"
                                  >
                                    {p}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 인라인 시작일/마감일 선택 */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <div
                              onClick={() => setOpenCalendar(openCalendar === `inlineStart-${status}` ? null : `inlineStart-${status}`)}
                              className={`bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer ${inlineForm.startDate ? 'text-black' : 'text-[#9CA3AF]'}`}
                            >
                              {inlineForm.startDate || "시작일"}
                              <FontAwesomeIcon icon={faCalendarAlt} className="text-sm text-slate-400" />
                            </div>
                            {openCalendar === `inlineStart-${status}` && (
                              <div className="absolute top-full left-0 z-[120] mt-1 w-[240px] transform origin-top-left scale-90">
                                <Calendar 
                                  value={inlineForm.startDate} 
                                  minDate={new Date().toISOString().split('T')[0]}
                                  onChange={(date) => {
                                    const today = new Date().toISOString().split('T')[0];
                                    if (date < today) { 
                                      setErrors(prev => ({ ...prev, [`inlineStartDate-${status}`]: '시작일은 오늘 이후의 날짜만 선택할 수 있습니다.' }));
                                      return; 
                                    }
                                    setErrors(prev => ({ ...prev, [`inlineStartDate-${status}`]: null }));
                                    setInlineForm(prev => ({ ...prev, startDate: date, endDate: prev.endDate && prev.endDate < date ? date : prev.endDate }));
                                    setOpenCalendar(null);
                                  }}
                                  onClose={() => setOpenCalendar(null)}
                                />
                              </div>
                            )}
                            {errors[`inlineStartDate-${status}`] && <p className="text-[9px] text-red-500 font-bold mt-1 ml-1">{errors[`inlineStartDate-${status}`]}</p>}
                            </div>
                            <div className="relative">
                            <div 
                              onClick={() => setOpenCalendar(openCalendar === `inlineEnd-${status}` ? null : `inlineEnd-${status}`)}
                              className={`bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer ${inlineForm.endDate ? 'text-black' : 'text-[#9CA3AF]'} ${errors[`inlineEndDate-${status}`] ? 'border border-red-500' : ''}`}
                            >
                              {inlineForm.endDate || "마감일"}
                              <FontAwesomeIcon icon={faCalendarAlt} className="text-sm text-slate-400" />
                            </div>
                            {openCalendar === `inlineEnd-${status}` && (
                              <div className="absolute top-full right-0 z-[120] mt-1 w-[240px] transform origin-top-right scale-90">
                                <Calendar 
                                  value={inlineForm.endDate} 
                                  minDate={inlineForm.startDate || new Date().toISOString().split('T')[0]}
                                  onChange={(date) => {
                                    if (inlineForm.startDate && date < inlineForm.startDate) { 
                                      setErrors(prev => ({ ...prev, [`inlineEndDate-${status}`]: '종료일은 시작일보다 이전일 수 없습니다.' }));
                                      return; 
                                    }
                                    setErrors(prev => ({ ...prev, [`inlineEndDate-${status}`]: null }));
                                    setInlineForm(prev => ({ ...prev, endDate: date }));
                                    setOpenCalendar(null);
                                  }}
                                  onClose={() => setOpenCalendar(null)}
                                />
                              </div>
                            )}
                            {errors[`inlineEndDate-${status}`] && <p className="text-[9px] text-red-500 font-bold mt-1 ml-1">{errors[`inlineEndDate-${status}`]}</p>}
                            </div>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => handleInlineCreate(status)} className="flex-1 bg-[#3530B8] text-white py-2 rounded-xl text-xs font-bold">추가</button>
                          <button onClick={() => { setInlineForm({ status: null, title: '', assignee: '나 (관리자)', priority: 'Medium', startDate: new Date().toISOString().split('T')[0], endDate: '' }); setErrors({}); }} className="flex-1 bg-slate-100 text-slate-400 py-2 rounded-xl text-xs font-bold">취소</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setInlineForm({ ...inlineForm, status })}
                        className="w-full py-4 border-2 border-dashed border-slate-400/50 rounded-2xl text-slate-500 hover:text-[#3530B8] hover:border-[#3530B8]/30 hover:bg-white transition-all flex items-center justify-center gap-2 group"
                      >
                        <FontAwesomeIcon icon={faPlus} className="text-xs group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold">Task 추가</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* 2. 모바일 뷰 (신규 구현) */}
      <div className="flex lg:hidden flex-col h-full bg-white overflow-hidden px-6 py-8">
        {/* 타이틀 */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate('/projects')}
            className="w-8 h-8 bg-white rounded-lg shadow-sm border border-slate-50 flex items-center justify-center active:bg-slate-50 transition-all cursor-pointer"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-slate-300 text-xs" />
          </button>
          <h1 className="text-xl font-black text-[#1a1c3d]">Orbit 그룹웨어 고도화</h1>
        </div>
        
        {/* 참여자 & Task 생성 버튼 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex -space-x-2">
            {PROJECT_MEMBERS.slice(0, 4).map(m => (
              <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm">
                <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[9px] font-bold text-slate-400 shadow-sm">
              +2
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#3530B8] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#2a2594] transition-all shadow-md flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={faPlus} /> Task 생성
          </button>
        </div>

        {/* TODO, DOING, DONE (탭) */}
        <div className="flex bg-slate-50 p-1 rounded-2xl mb-6">
          {['TODO', 'DOING', 'DONE'].map(status => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer ${
                activeTab === status 
                  ? 'bg-[#3530B8] text-white shadow-md' 
                  : 'text-slate-400 hover:bg-[#F0F4FF] hover:text-[#3530B8]'
              }`}
            >
              {status} <span className={`ml-1 ${activeTab === status ? 'text-white/60' : 'opacity-50'}`}>{tasks.filter(t => t.status === status).length}</span>
            </button>
          ))}
        </div>

        {/* Task 리스트 & Task 추가 버튼 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-10">
          {tasks
            .filter(t => t.status === activeTab)
            .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority])
            .map(task => (
            <div
              key={task.id}
              onClick={() => setDetailModalTask(task)}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
            >
              <h3 className="font-bold text-sm text-[#1a1c3d] mb-4 leading-relaxed">{task.title}</h3>
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] overflow-hidden border border-white shrink-0">
                    <img src={`https://i.pravatar.cc/150?u=${task.assignee}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 leading-none">{task.assignee}</span>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${getPriorityStyle(task.priority)} leading-none`}>
                    {task.priority}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 font-mono tracking-tight leading-none">{formatDate(task.endDate)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* 인라인 추가 (모바일용 - 데스크탑과 동일한 로직 적용) */}
          {inlineForm.status === activeTab ? (
            <div 
              ref={inlineFormRef} 
              onMouseDown={(e) => {
                e.stopPropagation();
                if (!e.target.closest('.relative')) {
                  setOpenCalendar(null);
                  setOpenDropdown(null);
                }
              }}
              className="bg-white rounded-2xl p-5 shadow-xl border-2 border-[#3530B8]/20 space-y-4 animate-in fade-in zoom-in duration-200"
            >
              <input
                autoFocus
                placeholder="Task 제목"
                className={`w-full text-base font-bold outline-none placeholder:text-slate-300 transition-all ${errors[`inlineTitle-${activeTab}`] ? 'border-2 border-red-500 p-2 rounded-xl mb-2' : 'border-none p-0'}`}
                value={inlineForm.title}
                onChange={(e) => {
                  setInlineForm({ ...inlineForm, title: e.target.value });
                  if (errors[`inlineTitle-${activeTab}`]) setErrors(prev => ({ ...prev, [`inlineTitle-${activeTab}`]: null }));
                }}
              />
              {errors[`inlineTitle-${activeTab}`] && <p className="text-[10px] text-red-500 font-bold mt-[-8px] ml-1">{errors[`inlineTitle-${activeTab}`]}</p>}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg p-2 text-sm font-bold text-slate-400 flex items-center gap-1.5 border border-transparent">
                  <FontAwesomeIcon icon={faUser} className="text-sm" /> {inlineForm.assignee}
                </div>
                <div className="relative">
                  <div
                    onClick={() => setOpenDropdown(openDropdown === `inlinePriority-${activeTab}` ? null : `inlinePriority-${activeTab}`)}
                    className="bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer border border-transparent text-slate-500"
                  >
                    {inlineForm.priority || "우선순위"}
                    <FontAwesomeIcon icon={faChevronDown} className="text-sm text-slate-400" />
                  </div>
                  {openDropdown === `inlinePriority-${activeTab}` && (
                    <div className="absolute top-full left-0 z-[120] mt-1 w-full bg-white border border-slate-100 rounded-lg shadow-lg overflow-hidden">
                      {['High', 'Medium', 'Low'].map(p => (
                        <div
                          key={p}
                          onClick={() => { setInlineForm({ ...inlineForm, priority: p }); setOpenDropdown(null); }}
                          className="px-3 py-2 text-sm text-slate-400 font-bold hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer"
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 인라인 시작일/마감일 선택 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <div
                    onClick={() => setOpenCalendar(openCalendar === `inlineStart-${activeTab}` ? null : `inlineStart-${activeTab}`)}
                    className={`bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer ${inlineForm.startDate ? 'text-black' : 'text-[#9CA3AF]'}`}
                  >
                    {inlineForm.startDate || "시작일"}
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-sm text-slate-400" />
                  </div>
                  {openCalendar === `inlineStart-${activeTab}` && (
                    <div className="absolute top-full left-0 z-[120] mt-1 w-[240px] transform origin-top-left scale-90">
                      <Calendar 
                        value={inlineForm.startDate} 
                        minDate={new Date().toISOString().split('T')[0]}
                        onChange={(date) => {
                          const today = new Date().toISOString().split('T')[0];
                          if (date < today) { 
                            setErrors(prev => ({ ...prev, [`inlineStartDate-${activeTab}`]: '시작일은 오늘 이후의 날짜만 선택할 수 있습니다.' }));
                            return; 
                          }
                          setErrors(prev => ({ ...prev, [`inlineStartDate-${activeTab}`]: null }));
                          setInlineForm(prev => ({ ...prev, startDate: date, endDate: prev.endDate && prev.endDate < date ? date : prev.endDate }));
                          setOpenCalendar(null);
                        }}
                        onClose={() => setOpenCalendar(null)}
                      />
                    </div>
                  )}
                  {errors[`inlineStartDate-${activeTab}`] && <p className="text-[9px] text-red-500 font-bold mt-1">{errors[`inlineStartDate-${activeTab}`]}</p>}
                </div>
                <div className="relative">
                  <div 
                    onClick={() => setOpenCalendar(openCalendar === `inlineEnd-${activeTab}` ? null : `inlineEnd-${activeTab}`)}
                    className={`bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer ${inlineForm.endDate ? 'text-black' : 'text-[#9CA3AF]'} ${errors[`inlineEndDate-${activeTab}`] ? 'border border-red-500' : ''}`}
                  >
                    {inlineForm.endDate || "마감일"}
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-sm text-slate-400" />
                  </div>
                  {openCalendar === `inlineEnd-${activeTab}` && (
                    <div className="absolute top-full right-0 z-[120] mt-1 w-[240px] transform origin-top-right scale-90">
                      <Calendar 
                        value={inlineForm.endDate} 
                        minDate={inlineForm.startDate || new Date().toISOString().split('T')[0]}
                        onChange={(date) => {
                          if (inlineForm.startDate && date < inlineForm.startDate) { 
                            setErrors(prev => ({ ...prev, [`inlineEndDate-${activeTab}`]: '종료일은 시작일보다 이전일 수 없습니다.' }));
                            return; 
                          }
                          setErrors(prev => ({ ...prev, [`inlineEndDate-${activeTab}`]: null }));
                          setInlineForm(prev => ({ ...prev, endDate: date }));
                          setOpenCalendar(null);
                        }}
                        onClose={() => setOpenCalendar(null)}
                      />
                    </div>
                  )}
                  {errors[`inlineEndDate-${activeTab}`] && <p className="text-[9px] text-red-500 font-bold mt-1">{errors[`inlineEndDate-${activeTab}`]}</p>}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleInlineCreate(activeTab)} className="flex-1 bg-[#3530B8] text-white py-2 rounded-xl text-xs font-bold">추가</button>
                <button onClick={() => { setInlineForm({ status: null, title: '', assignee: '나 (관리자)', priority: 'Medium', startDate: new Date().toISOString().split('T')[0], endDate: '' }); setErrors({}); }} className="flex-1 bg-slate-100 text-slate-400 py-2 rounded-xl text-xs font-bold">취소</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setInlineForm({ ...inlineForm, status: activeTab })}
              className="w-full py-4 border-2 border-dashed border-slate-300/50 rounded-2xl text-slate-400 flex items-center justify-center gap-2 group active:bg-slate-50 transition-all cursor-pointer"
            >
              <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
              <span className="text-xs font-bold">Task 추가</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. 상단 'Task 생성' 팝업 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1a1c3d]/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300 p-8">
          <div className="bg-white w-full max-w-[500px] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-[#1a1c3d]">새 Task 생성</h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setNewGlobalTask({ title: '', assignee: '나 (관리자)', priority: 'Medium', status: 'TODO', startDate: new Date().toISOString().split('T')[0], endDate: '', desc: '' });
                  setErrors({});
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="space-y-6">
              {/* 1. 제목 */}
              <div>
                <input
                  className={`w-full text-2xl font-black text-[#1a1c3d] focus:ring-0 outline-none placeholder:font-semibold transition-all ${errors.globalTitle ? 'border-2 border-red-500 p-2 rounded-xl' : 'border-none p-0'}`}
                  placeholder="제목을 입력하세요."
                  value={newGlobalTask.title}
                  onChange={e => {
                    setNewGlobalTask({ ...newGlobalTask, title: e.target.value });
                    if (errors.globalTitle) setErrors(prev => ({ ...prev, globalTitle: null }));
                  }}
                />
                {errors.globalTitle && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.globalTitle}</p>}
              </div>

              {/* 2. 담당자 */}
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">담당자</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] text-[#3530B8] font-bold border border-white">
                    {newGlobalTask.assignee.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-slate-600">{newGlobalTask.assignee}</span>
                </div>
              </div>

              {/* 3. 상태 / 우선순위 (한 줄) */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1.5 relative">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">상태</p>
                  <div
                    onClick={() => setOpenDropdown(openDropdown === 'globalStatus' ? null : 'globalStatus')}
                    className="text-sm font-bold text-[#3530B8] bg-transparent border-none p-0 outline-none cursor-pointer flex items-center gap-1.5"
                  >
                    {newGlobalTask.status}
                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-slate-400" />
                  </div>
                  {openDropdown === 'globalStatus' && (
                    <div className="absolute top-full left-0 z-[110] mt-1 w-32 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                      {['TODO', 'DOING', 'DONE'].map(s => (
                        <div
                          key={s}
                          onClick={() => { setNewGlobalTask({ ...newGlobalTask, status: s }); setOpenDropdown(null); }}
                          className="px-6 py-4 text-xs font-bold text-slate-700 hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer transition-colors"
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 relative">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">우선순위</p>
                  <div
                    onClick={() => setOpenDropdown(openDropdown === 'globalPriority' ? null : 'globalPriority')}
                    className="text-sm font-bold text-[#3530B8] bg-transparent border-none p-0 outline-none cursor-pointer flex items-center gap-1.5"
                  >
                    {newGlobalTask.priority}
                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-slate-400" />
                  </div>
                  {openDropdown === 'globalPriority' && (
                    <div className="absolute top-full left-0 z-[110] mt-1 w-32 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                      {['High', 'Medium', 'Low'].map(p => (
                        <div
                          key={p}
                          onClick={() => { setNewGlobalTask({ ...newGlobalTask, priority: p }); setOpenDropdown(null); }}
                          className="px-6 py-4 text-sm font-bold text-slate-600 hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer transition-colors"
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. 시작일 / 마감일 (한 줄) */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2 relative">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">시작일</p>
                  <div
                    onClick={() => setOpenCalendar(openCalendar === 'start' ? null : 'start')}
                    className={`bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer ${newGlobalTask.startDate ? 'text-black' : 'text-[#9CA3AF]'}`}
                  >
                    {newGlobalTask.startDate || "날짜 선택"}
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[10px]" />
                  </div>
                  {openCalendar === 'start' && (
                    <div className="absolute top-full left-0 z-[110] mt-2 w-[280px]">
                      <Calendar
                        value={newGlobalTask.startDate}
                        minDate={new Date().toISOString().split('T')[0]}
                        onChange={(date) => {
                          const today = new Date().toISOString().split('T')[0];
                          if (date < today) { 
                            setErrors(prev => ({ ...prev, globalStartDate: '시작일은 오늘 이후의 날짜만 선택할 수 있습니다.' }));
                            return; 
                          }
                          setErrors(prev => ({ ...prev, globalStartDate: null }));
                          setNewGlobalTask(prev => ({ ...prev, startDate: date, endDate: prev.endDate && prev.endDate < date ? date : prev.endDate }));
                          setOpenCalendar(null);
                        }}
                        onClose={() => setOpenCalendar(null)}
                      />
                    </div>
                  )}
                  {errors.globalStartDate && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.globalStartDate}</p>}
                </div>
                <div className="space-y-2 relative">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">마감일</p>
                  <div
                    onClick={() => setOpenCalendar(openCalendar === 'end' ? null : 'end')}
                    className={`bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer ${newGlobalTask.endDate ? 'text-black' : 'text-[#9CA3AF]'} ${errors.globalEndDate ? 'border border-red-500' : ''}`}
                  >
                    {newGlobalTask.endDate || "날짜 선택"}
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[10px]" />
                  </div>
                  {openCalendar === 'end' && (
                    <div className="absolute top-full right-0 z-[110] mt-2 w-[280px]">
                      <Calendar
                        value={newGlobalTask.endDate}
                        minDate={newGlobalTask.startDate || new Date().toISOString().split('T')[0]}
                        onChange={(date) => {
                          if (newGlobalTask.startDate && date < newGlobalTask.startDate) { 
                            setErrors(prev => ({ ...prev, globalEndDate: '종료일은 시작일보다 이전일 수 없습니다.' }));
                            return; 
                          }
                          setErrors(prev => ({ ...prev, globalEndDate: null }));
                          setNewGlobalTask(prev => ({ ...prev, endDate: date }));
                          setOpenCalendar(null);
                        }}
                        onClose={() => setOpenCalendar(null)}
                      />
                    </div>
                  )}
                  {errors.globalEndDate && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.globalEndDate}</p>}
                </div>
              </div>

              {/* 5. 설명 */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">상세 내용</p>
                <textarea
                  rows={3}
                  className="w-full bg-slate-50/50 border-none rounded-2xl p-4 text-base leading-relaxed text-slate-600 outline-none resize-none font-medium"
                  placeholder="상세한 설명을 적어주세요..."
                  value={newGlobalTask.desc}
                  onChange={e => setNewGlobalTask({ ...newGlobalTask, desc: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setNewGlobalTask({ title: '', assignee: '나 (관리자)', priority: 'Medium', status: 'TODO', startDate: new Date().toISOString().split('T')[0], endDate: '', desc: '' });
                  setErrors({});
                }} 
                className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
              >
                취소
              </button>
              <button onClick={handleGlobalCreate} className="flex-1 bg-[#3530B8] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#2a2594] transition-all shadow-lg shadow-indigo-100">추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Task 상세/수정 팝업 모달 */}
      {detailModalTask && (
        <div className="fixed inset-0 bg-[#1a1c3d]/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300 p-8">
          <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-300">
            {/* 우선순위 배지 (최상단) */}
            <div className="flex justify-between items-center mb-6">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getPriorityStyle(detailModalTask.priority)}`}>
                {detailModalTask.priority}
              </span>
              <button onClick={() => setDetailModalTask(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><FontAwesomeIcon icon={faTimes} /></button>
            </div>

            <div className="space-y-6">
              {/* 제목 */}
              <div>
                <input 
                  ref={detailTitleRef}
                  className="w-full text-2xl font-black text-[#1a1c3d] border-none p-0 focus:ring-0 outline-none"
                  value={detailModalTask.title}
                  onChange={e => setDetailModalTask({...detailModalTask, title: e.target.value})}
                />
              </div>

              {/* 담당자 */}
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">담당자</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] text-[#3530B8] font-bold border border-white">
                    {detailModalTask.assignee.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-slate-600">{detailModalTask.assignee}</span>
                </div>
              </div>

              {/* 현재 상태, 우선순위 (한 줄) */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1.5 relative">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">현재 상태</p>
                  <div 
                    onClick={() => setOpenDropdown(openDropdown === 'detailStatus' ? null : 'detailStatus')}
                    className="text-sm font-bold text-[#3530B8] bg-transparent border-none p-0 outline-none cursor-pointer flex items-center gap-1.5"
                  >
                    {detailModalTask.status}
                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-slate-400" />
                  </div>
                  {openDropdown === 'detailStatus' && (
                    <div className="absolute top-full left-0 z-[110] mt-1 w-32 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                      {['TODO', 'DOING', 'DONE'].map(s => (
                        <div 
                          key={s}
                          onClick={() => { setDetailModalTask({...detailModalTask, status: s}); setOpenDropdown(null); }}
                          className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer transition-colors"
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 relative">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">우선순위</p>
                  <div 
                    onClick={() => setOpenDropdown(openDropdown === 'detailPriority' ? null : 'detailPriority')}
                    className="text-sm font-bold text-[#3530B8] bg-transparent border-none p-0 outline-none cursor-pointer flex items-center gap-1.5"
                  >
                    {detailModalTask.priority}
                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-slate-400" />
                  </div>
                  {openDropdown === 'detailPriority' && (
                    <div className="absolute top-full left-0 z-[110] mt-1 w-32 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                      {['High', 'Medium', 'Low'].map(p => (
                        <div 
                          key={p}
                          onClick={() => { setDetailModalTask({...detailModalTask, priority: p}); setOpenDropdown(null); }}
                          className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer transition-colors"
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 시작일, 마감일 (한 줄) */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">시작일</p>
                  <div className="text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg flex items-center h-[32px]">
                    {detailModalTask.startDate}
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">마감일</p>
                  <div 
                    onClick={() => setOpenCalendar(openCalendar === 'detailEnd' ? null : 'detailEnd')}
                    className="text-sm font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg cursor-pointer flex justify-between items-center min-w-[150px] h-[32px]"
                  >
                    {detailModalTask.endDate}
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[10px]" />
                  </div>
                  {openCalendar === 'detailEnd' && (
                    <div className="absolute top-full right-0 z-[110] mt-2 w-[280px]">
                      <Calendar 
                        value={detailModalTask.endDate} 
                        minDate={detailModalTask.startDate}
                        onChange={(date) => {
                          if (detailModalTask.startDate && date < detailModalTask.startDate) { alert('종료일은 시작일보다 이전일 수 없습니다.'); return; }
                          setDetailModalTask(prev => ({ ...prev, endDate: date }));
                          setOpenCalendar(null);
                        }}
                        onClose={() => setOpenCalendar(null)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 상세 내용 */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">상세 내용</p>
                <textarea 
                  rows={4} 
                  className="w-full bg-slate-50/50 border-none rounded-2xl p-5 text-base leading-relaxed text-slate-600 outline-none resize-none"
                  value={detailModalTask.desc}
                  onChange={e => setDetailModalTask({...detailModalTask, desc: e.target.value})}
                />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-4 mt-10">
              <button onClick={() => setDetailModalTask(null)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-sm">취소</button>
              <button onClick={handleUpdateTask} className="flex-1 bg-[#3530B8] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100">저장</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E0; }
      `}</style>
    </div>
  );
};

export default Kanban;
