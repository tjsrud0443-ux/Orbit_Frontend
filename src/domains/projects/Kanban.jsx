import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faUser, faChevronDown, faCircle, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import Calendar from '../../components/common/Calendar';

// 초기 Mock 데이터
const INITIAL_TASKS = [
  { id: 1, title: '디자인 시스템 가이드 작성', assignee: '나 (관리자)', startDate: '2026-05-28', endDate: '2026-06-05', status: 'TODO', priority: 'High', desc: '그룹웨어 디자인 시스템 문서화 및 가이드 배포' },
  { id: 2, title: '로그인 페이지 UI 고도화', assignee: '나 (관리자)', startDate: '2026-05-29', endDate: '2026-06-10', status: 'DOING', priority: 'Medium', desc: 'JWT 로그인 처리 및 반응형 스타일링 적용' },
  { id: 3, title: 'API 문서 정비', assignee: '나 (관리자)', startDate: '2026-05-30', endDate: '2026-06-15', status: 'DONE', priority: 'Low', desc: 'Swagger 문서 최신화 및 예외 처리 가이드 추가' },
];

const PROJECT_MEMBERS = [
  { id: 0, name: '나 (관리자)', avatar: 'https://i.pravatar.cc/150?u=admin' },
  { id: 1, name: '김철수', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: '이영희', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: '박지성', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, name: '최민수', avatar: 'https://i.pravatar.cc/150?u=4' },
];

const Kanban = () => {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalTask, setDetailModalTask] = useState(null);

  // 외부 클릭 감지를 위한 Ref
  const inlineFormRef = useRef(null);

  // 캘린더 오픈 상태
  const [openCalendar, setOpenCalendar] = useState(null); // 'start' | 'end' | 'detailEnd' | 'inlineStart-...' | 'inlineEnd-...'

  // 신규 Task 생성을 위한 폼 상태
  const [newGlobalTask, setNewGlobalTask] = useState({
    title: '', assignee: '나 (관리자)', priority: 'Medium', status: 'TODO', startDate: new Date().toISOString().split('T')[0], endDate: '', desc: ''
  });

  // 인라인 폼 상태
  const [inlineForm, setInlineForm] = useState({ status: null, title: '', assignee: '나 (관리자)', priority: 'Medium', startDate: new Date().toISOString().split('T')[0], endDate: '' });

  // 외부 클릭 감지 로직
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inlineFormRef.current && !inlineFormRef.current.contains(event.target)) {
        setInlineForm({ status: null, title: '', assignee: '나 (관리자)', priority: 'Medium', startDate: new Date().toISOString().split('T')[0], endDate: '' });
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

  // 핸들러: 전역 생성
  const handleGlobalCreate = () => {
    if (!newGlobalTask.title) return alert('제목을 입력해주세요.');
    if (!newGlobalTask.endDate) return alert('마감일을 선택해주세요.');
    const task = {
      ...newGlobalTask,
      id: Date.now(),
    };
    setTasks([...tasks, task]);
    setIsModalOpen(false);
    setNewGlobalTask({ title: '', assignee: '나 (관리자)', priority: 'Medium', status: 'TODO', startDate: new Date().toISOString().split('T')[0], endDate: '', desc: '' });
  };

  // 핸들러: 인라인 생성
  const handleInlineCreate = (status) => {
    if (!inlineForm.title) return alert('제목을 입력해주세요.');
    const task = {
      id: Date.now(),
      title: inlineForm.title,
      assignee: inlineForm.assignee,
      priority: inlineForm.priority,
      status: status,
      startDate: inlineForm.startDate,
      endDate: inlineForm.endDate || new Date().toISOString().split('T')[0],
      desc: ''
    };
    setTasks([...tasks, task]);
    setInlineForm({ status: null, title: '', assignee: '나 (관리자)', priority: 'Medium', startDate: new Date().toISOString().split('T')[0], endDate: '' });
  };

  // 핸들러: 상세 수정 저장
  const handleUpdateTask = () => {
    setTasks(prev => prev.map(t => t.id === detailModalTask.id ? detailModalTask : t));
    setDetailModalTask(null);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* 1. 상단 프로젝트 헤더 */}
      <header className="flex justify-between items-center px-10 py-8 bg-white border-b border-slate-100 shrink-0">
        <h1 className="text-2xl font-black text-[#1a1c3d] tracking-tight">Orbit 그룹웨어 고도화</h1>
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
      <main className="flex-1 overflow-x-auto p-10 custom-scrollbar flex justify-center bg-white">
        <div className="flex gap-[25px] h-full min-w-fit max-w-full justify-center">
          {['TODO', 'DOING', 'DONE'].map(status => {
            const columnTasks = tasks.filter(t => t.status === status);
            const dotColor = status === 'TODO' ? 'text-[#3530B8]' : status === 'DOING' ? 'text-amber-500' : 'text-emerald-500';
            const columnBg = status === 'TODO' ? 'bg-[#F1F5F9]' : status === 'DOING' ? 'bg-[#FFF7ED]' : status === 'DONE' ? 'bg-[#F0FDF4]' : 'bg-white';

            return (
              <div 
                key={status} 
                className={`flex-1 max-w-[380px] min-w-[320px] rounded-none p-6 flex flex-col ${columnBg} border border-slate-200/60 transition-all duration-300`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, status)}
              >
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon icon={faCircle} className={`text-[8px] ${dotColor}`} />
                    <h2 className="text-base font-black text-[#1a1c3d]">{status}</h2>
                    <span className="bg-white px-2 py-0.5 rounded-lg text-[11px] font-bold text-slate-400 border border-slate-100 shadow-sm">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
                  {columnTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, task)}
                      onClick={() => setDetailModalTask(task)}
                      className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100/80 hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100 transition-all cursor-pointer"
                    >
                      <h3 className="font-bold text-sm text-[#1a1c3d] mb-4 leading-relaxed group-hover:text-[#3530B8] transition-colors">{task.title}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] overflow-hidden border border-white">
                            <img src={`https://i.pravatar.cc/150?u=${task.assignee}`} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">{task.assignee}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${getPriorityStyle(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 font-mono tracking-tight">{formatDate(task.endDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {inlineForm.status === status ? (
                    <div ref={inlineFormRef} className="bg-white rounded-2xl p-5 shadow-xl border-2 border-[#3530B8]/20 space-y-4 animate-in fade-in zoom-in duration-200">
                      <input
                        autoFocus
                        placeholder="Task 제목"
                        className="w-full text-sm font-bold outline-none placeholder:text-slate-300"
                        value={inlineForm.title}
                        onChange={(e) => setInlineForm({ ...inlineForm, title: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 rounded-lg p-2 text-[10px] font-bold text-slate-400 flex items-center gap-1.5 border border-transparent">
                          <FontAwesomeIcon icon={faUser} className="text-[9px]" /> {inlineForm.assignee}
                        </div>
                        <select 
                          className="bg-slate-50 rounded-lg p-2 text-[11px] outline-none border-none text-slate-600 font-bold"
                          value={inlineForm.priority}
                          onChange={(e) => setInlineForm({...inlineForm, priority: e.target.value})}
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>

                      {/* 인라인 시작일/마감일 선택 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <div 
                            onClick={() => setOpenCalendar(openCalendar === `inlineStart-${status}` ? null : `inlineStart-${status}`)}
                            className="bg-slate-50 rounded-lg p-2 text-[10px] font-bold text-slate-600 flex justify-between items-center cursor-pointer"
                          >
                            {inlineForm.startDate || "시작일"}
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-[9px] text-slate-400" />
                          </div>
                          {openCalendar === `inlineStart-${status}` && (
                            <div className="absolute top-full left-0 z-[120] mt-1 w-[240px] transform origin-top-left scale-90">
                              <Calendar 
                                value={inlineForm.startDate} 
                                onChange={(date) => { setInlineForm({...inlineForm, startDate: date}); setOpenCalendar(null); }}
                                onClose={() => setOpenCalendar(null)}
                              />
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <div 
                            onClick={() => setOpenCalendar(openCalendar === `inlineEnd-${status}` ? null : `inlineEnd-${status}`)}
                            className="bg-slate-50 rounded-lg p-2 text-[10px] font-bold text-slate-600 flex justify-between items-center cursor-pointer"
                          >
                            {inlineForm.endDate || "마감일"}
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-[9px] text-slate-400" />
                          </div>
                          {openCalendar === `inlineEnd-${status}` && (
                            <div className="absolute top-full right-0 z-[120] mt-1 w-[240px] transform origin-top-right scale-90">
                              <Calendar 
                                value={inlineForm.endDate} 
                                onChange={(date) => { setInlineForm({...inlineForm, endDate: date}); setOpenCalendar(null); }}
                                onClose={() => setOpenCalendar(null)}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => handleInlineCreate(status)} className="flex-1 bg-[#3530B8] text-white py-2 rounded-xl text-xs font-bold">추가</button>
                        <button onClick={() => setInlineForm({ status: null, title: '', assignee: '나 (관리자)', priority: 'Medium', startDate: new Date().toISOString().split('T')[0], endDate: '' })} className="flex-1 bg-slate-100 text-slate-400 py-2 rounded-xl text-xs font-bold">취소</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setInlineForm({ ...inlineForm, status })}
                      className="w-full py-4 border-2 border-dashed border-slate-200/50 rounded-2xl text-slate-300 hover:text-[#3530B8] hover:border-[#3530B8]/30 hover:bg-white transition-all flex items-center justify-center gap-2 group"
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

      {/* 3. 상단 'Task 생성' 팝업 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1a1c3d]/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-[#1a1c3d]">새 Task 생성</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><FontAwesomeIcon icon={faTimes} /></button>
            </div>

            <div className="space-y-6">
              {/* 1. 제목 */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">제목</label>
                <input
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#3530B8]/20 transition-all outline-none"
                  placeholder="무엇을 해야 하나요?"
                  value={newGlobalTask.title}
                  onChange={e => setNewGlobalTask({ ...newGlobalTask, title: e.target.value })}
                />
              </div>

              {/* 2. 담당자 (출력 전용) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">담당자</label>
                <div className="w-full bg-slate-100/50 border-none rounded-2xl p-4 text-sm font-bold text-slate-500 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="text-[10px]" /> {newGlobalTask.assignee}
                </div>
              </div>

              {/* 3. 상태 / 우선순위 (한 줄) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">상태</label>
                  <select 
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm outline-none cursor-pointer font-bold text-slate-700"
                    value={newGlobalTask.status}
                    onChange={e => setNewGlobalTask({...newGlobalTask, status: e.target.value})}
                  >
                    <option value="TODO">TODO</option>
                    <option value="DOING">DOING</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">우선순위</label>
                  <select 
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm outline-none cursor-pointer font-bold text-slate-700"
                    value={newGlobalTask.priority}
                    onChange={e => setNewGlobalTask({...newGlobalTask, priority: e.target.value})}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* 4. 시작일 / 마감일 (한 줄) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">시작일</label>
                  <div 
                    onClick={() => setOpenCalendar(openCalendar === 'start' ? null : 'start')}
                    className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-800 flex justify-between items-center cursor-pointer min-w-[150px]"
                  >
                    {newGlobalTask.startDate || "날짜 선택"}
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-xs" />
                  </div>
                  {openCalendar === 'start' && (
                    <div className="absolute top-full left-0 z-[110] mt-2 w-[280px]">
                      <Calendar 
                        value={newGlobalTask.startDate} 
                        onChange={(date) => { setNewGlobalTask({...newGlobalTask, startDate: date}); setOpenCalendar(null); }}
                        onClose={() => setOpenCalendar(null)}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2 relative">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">마감일</label>
                  <div 
                    onClick={() => setOpenCalendar(openCalendar === 'end' ? null : 'end')}
                    className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-800 flex justify-between items-center cursor-pointer min-w-[150px]"
                  >
                    {newGlobalTask.endDate || "날짜 선택"}
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-xs" />
                  </div>
                  {openCalendar === 'end' && (
                    <div className="absolute top-full right-0 z-[110] mt-2 w-[280px]">
                      <Calendar 
                        value={newGlobalTask.endDate} 
                        onChange={(date) => { setNewGlobalTask({...newGlobalTask, endDate: date}); setOpenCalendar(null); }}
                        onClose={() => setOpenCalendar(null)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 5. 설명 */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">설명</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm outline-none resize-none font-medium leading-relaxed"
                  placeholder="상세한 설명을 적어주세요..."
                  value={newGlobalTask.desc}
                  onChange={e => setNewGlobalTask({ ...newGlobalTask, desc: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">취소</button>
              <button onClick={handleGlobalCreate} className="flex-1 bg-[#3530B8] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#2a2594] transition-all shadow-lg shadow-indigo-100">추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Task 상세/수정 팝업 모달 */}
      {detailModalTask && (
        <div className="fixed inset-0 bg-[#1a1c3d]/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-center mb-8">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getPriorityStyle(detailModalTask.priority)}`}>
                {detailModalTask.priority} Priority
              </span>
              <button onClick={() => setDetailModalTask(null)} className="text-slate-400 hover:text-slate-600"><FontAwesomeIcon icon={faTimes} /></button>
            </div>

            <div className="space-y-8">
              <div>
                <input 
                  className="w-full text-2xl font-black text-[#1a1c3d] border-none p-0 focus:ring-0 outline-none"
                  value={detailModalTask.title}
                  onChange={e => setDetailModalTask({...detailModalTask, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-8 py-6 border-y border-slate-50">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">담당자</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] text-[#3530B8] font-bold border border-white">
                      {detailModalTask.assignee.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-slate-600">{detailModalTask.assignee}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">현재 상태</p>
                  <select 
                    className="text-sm font-bold text-[#3530B8] bg-transparent border-none p-0 outline-none cursor-pointer focus:ring-0"
                    value={detailModalTask.status}
                    onChange={e => setDetailModalTask({...detailModalTask, status: e.target.value})}
                  >
                    <option value="TODO">TODO</option>
                    <option value="DOING">DOING</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">시작일</p>
                  <p className="text-sm font-bold text-slate-500 font-mono">{detailModalTask.startDate}</p>
                </div>
                <div className="space-y-2 relative">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">마감일</p>
                  <div 
                    onClick={() => setOpenCalendar(openCalendar === 'detailEnd' ? null : 'detailEnd')}
                    className="text-sm font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg cursor-pointer flex justify-between items-center min-w-[150px]"
                  >
                    {detailModalTask.endDate}
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[10px]" />
                  </div>
                  {openCalendar === 'detailEnd' && (
                    <div className="absolute top-full right-0 z-[110] mt-2 w-[280px]">
                      <Calendar 
                        value={detailModalTask.endDate} 
                        onChange={(date) => { setDetailModalTask({...detailModalTask, endDate: date}); setOpenCalendar(null); }}
                        onClose={() => setOpenCalendar(null)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">상세 내용</p>
                <textarea 
                  rows={4} 
                  className="w-full bg-slate-50/50 border-none rounded-2xl p-5 text-sm leading-relaxed text-slate-600 outline-none resize-none"
                  value={detailModalTask.desc}
                  onChange={e => setDetailModalTask({...detailModalTask, desc: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setDetailModalTask(null)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-sm">취소</button>
              <button onClick={handleUpdateTask} className="flex-1 bg-[#3530B8] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100">확인(저장)</button>
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
