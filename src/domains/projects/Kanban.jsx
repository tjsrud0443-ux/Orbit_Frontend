import React, { useState, useMemo, useEffect, useRef } from 'react';
import { replace, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faUser, faChevronDown, faCircle, faCalendarAlt, faChevronLeft, faEllipsisV, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import Calendar from '../../components/common/Calendar';
import { deleteTask, getKanbanTaskList, getProject, getProjectMembers, insertTask, updateTask, updateTaskStatus } from './projectsApi';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';
import { alertConfirm } from '../../utils/alert';

const Kanban = () => {
  const { projectSeq } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const user = useUserStore(state => state.user);
  const [searchParam] = useSearchParams(); // 알림용
  const taskSeq = searchParam.get("taskSeq");

  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState({});
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalTask, setDetailModalTask] = useState(null);
  const [activeTab, setActiveTab] = useState('TODO'); // 모바일 탭 상태

  // 외부 클릭 감지를 위한 Ref
  const inlineFormRef = useRef(null);
  const detailTitleRef = useRef(null);
  const lastFocusedTaskId = useRef(null);
  const draggingTaskSeqRef = useRef(null);

  // 캘린더 및 드롭다운 오픈 상태
  const [openCalendar, setOpenCalendar] = useState(null); // 'start' | 'end' | 'detailEnd' | 'inlineStart-...' | 'inlineEnd-...'
  const [openDropdown, setOpenDropdown] = useState(null); // 'globalStatus' | 'globalPriority' | 'inlinePriority-...' | 'detailStatus' | 'detailPriority'

  // 신규 Task 생성을 위한 폼 상태
  const [newGlobalTask, setNewGlobalTask] = useState({
    title: '', users_pic_id: '', name: '', sysname: '', priority: 'medium', status: 'TODO', start_date: '', due_date: '', content: ''
  });

  // 인라인 폼 상태
  const [inlineForm, setInlineForm] = useState({ status: null, title: '', users_pic_id: user?.id, name: user?.name, sysname: user?.sysname, priority: 'medium', start_date: '', due_date: '' });
  const [errors, setErrors] = useState({});
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [draggingTask, setDraggingTask] = useState(null);

  // 상세 모달 오픈 시 제목 포커스 (최초 1회만)
  useEffect(() => {
    if (detailModalTask && detailTitleRef.current && lastFocusedTaskId.current !== detailModalTask.task_seq) {
      detailTitleRef.current.focus();
      lastFocusedTaskId.current = detailModalTask.task_seq;
    } else if (!detailModalTask) {
      lastFocusedTaskId.current = null;
    }
  }, [detailModalTask]);

  // 외부 클릭 감지 로직
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 1. 인라인 폼 외부 클릭 시 초기화
      if (inlineFormRef.current && !inlineFormRef.current.contains(event.target)) {
        setInlineForm({ status: null, title: '', users_pic_id: user?.id, name: user?.name, sysname: user?.sysname, priority: 'medium', start_date: project?.start_date?.substring(0, 10), due_date: '' });
        setErrors({});
      }

      // 2. 드롭다운/캘린더 외부 클릭 시 닫기 처리
      // 드롭다운이나 캘린더 컨테이너(.relative) 외부를 클릭했을 때만 닫히도록 함
      // 단, 달력 내부의 클릭은 무시하지 않도록 .relative 내부인지 확인
      if (!event.target.closest('.relative')) {
        setOpenDropdown(null);
        setOpenCalendar(null);
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user, project]);

  // 드래그 앤 드롭 로직
  const onDragStart = (e, task) => {
    e.dataTransfer.setData('taskSeq', task.task_seq);
    e.dataTransfer.effectAllowed = 'move';
    draggingTaskSeqRef.current = task.task_seq;
    setDraggingTask({
      task,
      x: e.clientX,
      y: e.clientY,
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY,
      width: e.currentTarget.offsetWidth,
      height: e.currentTarget.offsetHeight,
    });

    const transparentImage = new Image();
    transparentImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    e.dataTransfer.setDragImage(transparentImage, 0, 0);
  };

  const onDrag = (e) => {
    if (e.clientX === 0 && e.clientY === 0) return;

    setDraggingTask(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : prev);
  };

  const onDrop = (e, status) => {
    e.preventDefault();
    e.stopPropagation();

    const taskSeq = parseInt(e.dataTransfer.getData('taskSeq') || draggingTaskSeqRef.current, 10);

    if (!taskSeq) {
      setDraggingTask(null);
      draggingTaskSeqRef.current = null;
      return;
    }

    setTasks(prev => prev.map(t => t.task_seq === taskSeq ? { ...t, status } : t));
    setDraggingTask(null);
    draggingTaskSeqRef.current = null;

    updateTaskStatus({
      task_seq: taskSeq,
      status: status
    })
  };

  // 핸들러: 삭제
  const handleDeleteTask = async (taskSeq) => {
    const result = await alertConfirm('정말 삭제하시겠습니까?', '삭제 후 복구는 불가합니다.');
    if (!result.isConfirmed) return;
    await deleteTask(taskSeq);
    const resp = await getKanbanTaskList(projectSeq);
    setTasks(resp.data);
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
      case 'high': return 'bg-[#FF4D4F] text-white';
      case 'medium': return 'bg-[#FF9800] text-white';
      case 'low': return 'bg-[#10B981] text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  // 우선순위 가중치 (정렬용)
  const priorityWeight = { 'high': 3, 'medium': 2, 'low': 1 };

  // 핸들러: 전역 생성
  const handleGlobalCreate = () => {

    const newErrors = {};
    if (!newGlobalTask.title) newErrors.globalTitle = '제목을 입력해 주세요.';
    else if (newGlobalTask.title.length > 30) newErrors.globalTitle = '글자수가 초과되었습니다. 30자까지만 입력 가능합니다.';
    if (newGlobalTask.content && newGlobalTask.content.length > 800) newErrors.globalContent = '글자수가 초과되었습니다. 800자까지만 입력 가능합니다.';
    if (!newGlobalTask.users_pic_id) newErrors.globalAssignee = '담당자를 선택해 주세요';
    if (!newGlobalTask.due_date) newErrors.globalEndDate = '마감일을 선택해 주세요.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const params = {
      project_seq: projectSeq,
      title: newGlobalTask.title,
      content: newGlobalTask.content || "",
      status: newGlobalTask.status,
      priority: newGlobalTask.priority,
      users_pic_id: newGlobalTask.users_pic_id,
      start_date: newGlobalTask.start_date,
      due_date: newGlobalTask.due_date
    };

    insertTask(params).then(resp => {
      getKanbanTaskList(projectSeq).then(resp => {
        setTasks(resp.data);
      });
      setIsModalOpen(false);
      setNewGlobalTask({ title: '', users_pic_id: '', name: '', sysname: '', priority: 'medium', status: 'TODO', start_date: project?.start_date?.substring(0, 10), due_date: '', content: '' });
    });
    setErrors({});
  };

  // 핸들러: 인라인 생성
  const handleInlineCreate = (status) => {
    const newErrors = {};
    if (!inlineForm.title) newErrors[`inlineTitle-${status}`] = '제목을 입력해주세요.';
    else if (inlineForm.title.length > 30) newErrors[`inlineTitle-${status}`] = '글자수가 초과되었습니다. 30자까지만 입력 가능합니다.';
    if (!inlineForm.due_date) newErrors[`inlineEndDate-${status}`] = '마감일을 선택해주세요.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const params = {
      project_seq: projectSeq,
      title: inlineForm.title,
      content: "",
      status: status,
      priority: inlineForm.priority,
      users_pic_id: inlineForm.users_pic_id,
      start_date: inlineForm.start_date,
      due_date: inlineForm.due_date
    };

    insertTask(params).then(resp => {
      getKanbanTaskList(projectSeq).then(resp => {
        setTasks(resp.data);
      });
      setInlineForm({
        status: null,
        title: '',
        users_pic_id: user?.id,
        name: user?.name,
        sysname: user?.sysname,
        priority: 'medium',
        start_date: project?.start_date?.substring(0, 10),
        due_date: '',
        content: ''
      });
    });
    setErrors({});
  };

  // 핸들러: 상세 수정 저장
  const handleUpdateTask = () => {
    const newErrors = {};
    if (!detailModalTask.title) newErrors.detailTitle = '제목을 입력해주세요.';
    else if (detailModalTask.title.length > 30) newErrors.detailTitle = '글자수가 초과되었습니다. 30자까지만 입력 가능합니다.';
    if (detailModalTask.content && detailModalTask.content.length > 800) newErrors.detailContent = '글자수가 초과되었습니다. 800자까지만 입력 가능합니다.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const params = {
      task_seq: detailModalTask.task_seq,
      project_seq: projectSeq,
      title: detailModalTask.title,
      content: detailModalTask.content || "",
      status: detailModalTask.status,
      priority: detailModalTask.priority,
      users_pic_id: detailModalTask.users_pic_id,
      start_date: detailModalTask.start_date,
      due_date: detailModalTask.due_date
    };

    updateTask(params).then(resp => {
      getKanbanTaskList(projectSeq).then(resp => {
        setTasks(resp.data);
        setDetailModalTask(null);
      });
    });
  };

  useEffect(() => {

    if (!taskSeq || tasks.length === 0) {
      return;
    }

    getKanbanTaskList(projectSeq).then(resp => {
      setTasks(resp.data);

      const targetTask = resp.data.find(
        t => String(t.task_seq) === String(taskSeq)
      );

      if (targetTask) {
        setDetailModalTask(targetTask);
        navigate(`/kanban/${projectSeq}`, {
          replace: true
        })
      }
    });
  }, [taskSeq, tasks]);

  useEffect(() => {
    if (user) {
      setInlineForm(prev => ({
        ...prev,
        users_pic_id: user.id,
        name: user.name,
        sysname: user.sysname
      }));
    }
  }, [user]);

  useEffect(() => {
    getKanbanTaskList(projectSeq).then(resp => {
      setTasks(resp.data);
    })
  }, [projectSeq]);

  useEffect(() => {
    getProjectMembers(projectSeq).then(resp => {
      setMembers(resp.data);
    });
  }, [projectSeq]);

  useEffect(() => {
    getProject(projectSeq).then(resp => {
      setProject(resp.data);
      setNewGlobalTask(prev => ({
        ...prev,
        start_date: resp.data.start_date?.substring(0, 10)
      }));
      setInlineForm(prev => ({
        ...prev,
        start_date: resp.data.start_date?.substring(0, 10)
      }));
    });
  }, [projectSeq]);

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
            <h1 className="text-2xl font-black text-[#1a1c3d] tracking-tight">{project?.project_name}</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
              {members.filter(member =>
                String(member.users_id) !== String(user?.id)).map((member, index) => (
                  <div key={index} className="w-9 h-9 rounded-full border-2 border-white overflow-hidden shadow-sm hover:z-10 transition-all cursor-pointer">
                    {
                      member?.sysname && 
                        <img src={`https://api.sukong.shop/file/profile/view?sysname=${member?.sysname}&token=${token}`} alt={member?.name} className="w-full h-full object-cover" />
                    }
                  </div>
                ))}
              {members.filter(member =>
                String(member.users_id) !== String(user?.id)).length > 5 && (
                  <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm cursor-pointer">
                    +{members.filter(member =>
                      String(member.users_id) !== String(user?.id)).length - 5}
                  </div>
                )}
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
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
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
                        key={task.task_seq}
                        draggable
                        onDragStart={(e) => onDragStart(e, task)}
                        onDrag={onDrag}
                        onDragEnd={() => {
                          setDraggingTask(null);
                          draggingTaskSeqRef.current = null;
                        }}
                        onClick={() => setDetailModalTask(task)}
                        className={`group bg-white rounded-2xl p-5 shadow-sm border border-slate-100/80 hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100 transition-all cursor-pointer relative ${draggingTask?.task.task_seq === task.task_seq ? 'opacity-0 shadow-none [&+*]:!mt-0' : ''}`}
                        style={draggingTask?.task.task_seq === task.task_seq ? { marginBottom: -draggingTask.height } : undefined}
                      >
                        <div className="flex justify-between items-center mb-4 gap-2">
                          <h3 className="font-bold text-base text-[#1a1c3d] leading-relaxed group-hover:text-[#3530B8] transition-colors flex-1">{task.title}</h3>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === task.task_seq ? null : task.task_seq);
                              }}
                              className="text-slate-300 hover:text-slate-500 flex items-center justify-center transition-colors h-7 w-7 cursor-pointer"
                            >
                              <FontAwesomeIcon icon={faEllipsisV} className="text-xs" />
                            </button>
                            {activeMenuId === task.task_seq && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-24 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in duration-200"
                              >
                                <button
                                  onClick={() => handleDeleteTask(task.task_seq)}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <FontAwesomeIcon icon={faTrashCan} className="mr-2" /> 삭제
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                              {
                                task?.sysname && 
                                  <img
                                    src={`https://api.sukong.shop/file/profile/view?sysname=${task?.sysname}&token=${token}`}
                                    alt={task?.name}
                                    className="w-full h-full object-cover"
                                  />
                              }
                            </div>
                            <span className="text-sm font-bold text-slate-500 leading-none">{task.name}</span>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-sm font-black px-2 py-0.5 rounded-full ${getPriorityStyle(task.priority)} leading-none`}>
                              {task.priority}
                            </span>
                            <span className="text-xs font-medium text-slate-400 font-mono tracking-tight leading-none">{formatDate(task.due_date)}</span>
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
                            const val = e.target.value;
                            setInlineForm({ ...inlineForm, title: val });
                            if (val.length > 30) {
                              setErrors(prev => ({ ...prev, [`inlineTitle-${status}`]: '글자수가 초과되었습니다. 30자까지만 입력 가능합니다.' }));
                            } else {
                              if (errors[`inlineTitle-${status}`]) setErrors(prev => ({ ...prev, [`inlineTitle-${status}`]: null }));
                            }
                          }}
                        />
                        {errors[`inlineTitle-${status}`] && <p className="text-[10px] text-red-500 font-bold mt-[-8px] ml-1">{errors[`inlineTitle-${status}`]}</p>}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-50 rounded-lg p-2 text-sm font-bold text-slate-400 flex items-center gap-1.5 border border-transparent">
                            <FontAwesomeIcon icon={faUser} className="text-sm" /> {inlineForm?.name || '담당자 선택'}
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
                                {['high', 'medium', 'low'].map(p => (
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
                              className={`bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer ${inlineForm.start_date ? 'text-black' : 'text-[#9CA3AF]'}`}
                            >
                              {inlineForm.start_date || "시작일"}
                              <FontAwesomeIcon icon={faCalendarAlt} className="text-sm text-slate-400" />
                            </div>
                            {openCalendar === `inlineStart-${status}` && (
                              <div className={`absolute top-full left-0 z-[120] mt-1 w-[240px] transform origin-top-left scale-90 ${tasks.filter(t => t.status === status).length === 0 ? '[&>div]:top-0 [&>div]:bottom-auto [&>div]:mt-0 [&>div]:mb-0' : ''}`}>
                                <Calendar
                                  value={inlineForm?.start_date}
                                  minDate={project?.start_date?.substring(0, 10)}
                                  maxDate={project?.end_date?.substring(0, 10)}
                                  onChange={(date) => {
                                    const projectStartDate = project?.start_date?.substring(0, 10);
                                    if (date < projectStartDate) {
                                      setErrors(prev => ({ ...prev, [`inlineStartDate-${status}`]: '프로젝트 기간 내에서만 선택 가능합니다.' }));
                                      return;
                                    }
                                    setErrors(prev => ({ ...prev, [`inlineStartDate-${status}`]: null }));
                                    setInlineForm(prev => ({ ...prev, start_date: date, due_date: prev.due_date && prev.due_date < date ? date : prev.due_date }));
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
                              className={`bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer ${inlineForm.due_date ? 'text-black' : 'text-[#9CA3AF]'} ${errors[`inlineEndDate-${status}`] ? 'border border-red-500' : ''}`}
                            >
                              {inlineForm.due_date || "마감일"}
                              <FontAwesomeIcon icon={faCalendarAlt} className="text-sm text-slate-400" />
                            </div>
                            {openCalendar === `inlineEnd-${status}` && (
                              <div className={`absolute top-full right-0 z-[120] mt-1 w-[240px] transform origin-top-right scale-90 ${tasks.filter(t => t.status === status).length === 0 ? '[&>div]:top-0 [&>div]:bottom-auto [&>div]:mt-0 [&>div]:mb-0' : ''}`}>
                                <Calendar
                                  value={inlineForm?.due_date}
                                  minDate={inlineForm?.start_date || project?.start_date?.substring(0, 10)}
                                  maxDate={project?.end_date?.substring(0, 10)}
                                  onChange={(date) => {
                                    const projectStart = project?.start_date?.substring(0, 10);
                                    const projectEnd = project?.end_date?.substring(0, 10);
                                    if (date < projectStart || date > projectEnd) {
                                      setErrors(prev => ({ ...prev, [`inlineEndDate-${status}`]: '프로젝트 기간 내에서만 선택 가능합니다.' }));
                                      return;
                                    }
                                    setErrors(prev => ({ ...prev, [`inlineEndDate-${status}`]: null }));
                                    setInlineForm(prev => ({ ...prev, due_date: date }));
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
                          <button onClick={() => { setInlineForm({ status: null, title: '', users_pic_id: user?.id, name: user?.name, sysname: user?.sysname, priority: 'medium', start_date: project?.start_date?.substring(0, 10), due_date: '' }); setErrors({}); }} className="flex-1 bg-slate-100 text-slate-400 py-2 rounded-xl text-xs font-bold">취소</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setInlineForm({ ...inlineForm, status, users_pic_id: user?.id, name: user?.name, sysname: user?.sysname })}
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
          <h1 className="text-xl font-black text-[#1a1c3d]">{project?.project_name}</h1>
        </div>

        {/* 참여자 & Task 생성 버튼 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex -space-x-2">
            {members.filter(member =>
              String(member.users_id) !== String(user?.id)).map((member, index) => (
                <div key={index} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm hover:z-10 transition-all cursor-pointer">
                  {
                    member?.sysname && 
                     <img src={`https://api.sukong.shop/file/profile/view?sysname=${member?.sysname}&token=${token}`} alt={member?.name} className="w-full h-full object-cover" />
                  }
                </div>
              ))}
            {members.filter(member =>
              String(member.users_id) !== String(user?.id)).length > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm cursor-pointer">
                  +{members.filter(member =>
                    String(member.users_id) !== String(user?.id)).length - 5}
                </div>
              )}
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
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer ${activeTab === status
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
                key={task.task_seq}
                onClick={() => setDetailModalTask(task)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-all relative"
              >
                <div className="flex justify-between items-center mb-4 gap-2">
                  <h3 className="font-bold text-sm text-[#1a1c3d] leading-relaxed flex-1">{task.title}</h3>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === task.task_seq ? null : task.task_seq);
                      }}
                      className="text-slate-300 flex items-center justify-center h-5"
                    >
                      <FontAwesomeIcon icon={faEllipsisV} className="text-xs" />
                    </button>
                    {activeMenuId === task.task_seq && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 w-24 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in duration-200"
                      >
                        <button
                          onClick={() => handleDeleteTask(task.task_seq)}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-red-500"
                        >
                          <FontAwesomeIcon icon={faTrashCan} className="mr-2" /> 삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {
                        task?.sysname && 
                          <img
                            src={`https://api.sukong.shop/file/profile/view?sysname=${task?.sysname}&token=${token}`}
                            alt={task?.name}
                            className="w-full h-full object-cover"
                          />
                      }
                    </div>
                    <span className="text-xs font-bold text-slate-500 leading-none">{task.name}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${getPriorityStyle(task.priority)} leading-none`}>
                      {task.priority}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 font-mono tracking-tight leading-none">{formatDate(task.due_date)}</span>
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
                  const val = e.target.value;
                  setInlineForm({ ...inlineForm, title: val });
                  if (val.length > 30) {
                    setErrors(prev => ({ ...prev, [`inlineTitle-${activeTab}`]: '글자수가 초과되었습니다. 30자까지만 입력 가능합니다.' }));
                  } else {
                    if (errors[`inlineTitle-${activeTab}`]) setErrors(prev => ({ ...prev, [`inlineTitle-${activeTab}`]: null }));
                  }
                }}
              />
              {errors[`inlineTitle-${activeTab}`] && <p className="text-[10px] text-red-500 font-bold mt-[-8px] ml-1">{errors[`inlineTitle-${activeTab}`]}</p>}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg p-2 text-sm font-bold text-slate-400 flex items-center gap-1.5 border border-transparent">
                  <FontAwesomeIcon icon={faUser} className="text-sm" /> {inlineForm?.name || '담당자 선택'}
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
                      {['high', 'medium', 'low'].map(p => (
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
                    className={`bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer ${inlineForm.start_date ? 'text-black' : 'text-[#9CA3AF]'}`}
                  >
                    {inlineForm.start_date || "시작일"}
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-sm text-slate-400" />
                  </div>
                  {openCalendar === `inlineStart-${activeTab}` && (
                    <div className={`absolute top-full left-0 z-[120] mt-1 w-[240px] transform origin-top-left scale-90 ${tasks.filter(t => t.status === activeTab).length === 0 ? '[&>div]:top-0 [&>div]:bottom-auto [&>div]:mt-0 [&>div]:mb-0' : ''}`}>
                      <Calendar
                        value={inlineForm?.start_date}
                        minDate={project?.start_date?.substring(0, 10)}
                        maxDate={project?.end_date?.substring(0, 10)}
                        onChange={(date) => {
                          const projectStartDate = project?.start_date?.substring(0, 10);
                          if (date < projectStartDate) {
                            setErrors(prev => ({ ...prev, [`inlineStartDate-${activeTab}`]: '프로젝트 기간 내에서만 선택 가능합니다.' }));
                            return;
                          }
                          setErrors(prev => ({ ...prev, [`inlineStartDate-${activeTab}`]: null }));
                          setInlineForm(prev => ({ ...prev, start_date: date, due_date: prev.due_date && prev.due_date < date ? date : prev.due_date }));
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
                    className={`bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer ${inlineForm.due_date ? 'text-black' : 'text-[#9CA3AF]'} ${errors[`inlineEndDate-${activeTab}`] ? 'border border-red-500' : ''}`}
                  >
                    {inlineForm.due_date || "마감일"}
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-sm text-slate-400" />
                  </div>
                  {openCalendar === `inlineEnd-${activeTab}` && (
                    <div className={`absolute top-full right-0 z-[120] mt-1 w-[240px] transform origin-top-right scale-90 ${tasks.filter(t => t.status === activeTab).length === 0 ? '[&>div]:top-0 [&>div]:bottom-auto [&>div]:mt-0 [&>div]:mb-0' : ''}`}>
                      <Calendar
                        value={inlineForm.due_date}
                        minDate={inlineForm?.start_date || project?.start_date?.substring(0, 10)}
                        maxDate={project?.end_date?.substring(0, 10)}
                        onChange={(date) => {
                          const projectStart = project?.start_date?.substring(0, 10);
                          const projectEnd = project?.end_date?.substring(0, 10);
                          if (date < projectStart || date > projectEnd) {
                            setErrors(prev => ({ ...prev, [`inlineEndDate-${activeTab}`]: '프로젝트 기간 내에서만 선택 가능합니다.' }));
                            return;
                          }
                          setErrors(prev => ({ ...prev, [`inlineEndDate-${activeTab}`]: null }));
                          setInlineForm(prev => ({ ...prev, due_date: date }));
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
                <button onClick={() => { setInlineForm({ status: null, title: '', users_pic_id: user?.id, name: user?.name, sysname: user?.sysname, priority: 'medium', start_date: project?.start_date?.substring(0, 10), due_date: '' }); setErrors({}); }} className="flex-1 bg-slate-100 text-slate-400 py-2 rounded-xl text-xs font-bold">취소</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setInlineForm({ ...inlineForm, status: activeTab, users_pic_id: user?.id, name: user?.name, sysname: user?.sysname })}
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
          <div className="bg-white w-full max-w-[500px] rounded-[2rem] md:rounded-[2.5rem] shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-300 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-[#1a1c3d]">새 Task 생성</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewGlobalTask({ title: '', users_pic_id: '', name: '', sysname: '', priority: 'medium', status: 'TODO', start_date: project?.start_date?.substring(0, 10), due_date: '', content: '' });
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
                      const val = e.target.value;
                      setNewGlobalTask({ ...newGlobalTask, title: val });
                      if (val.length > 30) {
                        setErrors(prev => ({ ...prev, globalTitle: '글자수가 초과되었습니다. 30자까지만 입력 가능합니다.' }));
                      } else {
                        if (errors.globalTitle) setErrors(prev => ({ ...prev, globalTitle: null }));
                      }
                    }}
                  />
                  {errors.globalTitle && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.globalTitle}</p>}
                </div>

                {/* 2. 담당자 */}
                <div className="space-y-1.5 relative">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">담당자</p>
                  <div
                    onClick={() => setOpenDropdown(
                      openDropdown === 'globalAssignee'
                        ? null
                        : 'globalAssignee'
                    )}
                    className={`flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors ${errors.globalAssignee ? 'border border-red-500' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden border border-white">
                      {newGlobalTask.sysname ? (
                        <img src={`https://api.sukong.shop/file/profile/view?sysname=${newGlobalTask.sysname}&token=${token}`} alt={newGlobalTask.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-[#3530B8] font-bold">{newGlobalTask.name?.charAt(0) || '+'}</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-600">{newGlobalTask.name || '담당자를 선택하세요.'}</span>
                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-slate-400 ml-auto" />
                  </div>
                  {errors.globalAssignee && (
                    <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">
                      {errors.globalAssignee}
                    </p>
                  )}
                  {openDropdown === 'globalAssignee' && (
                    <div className="absolute top-full left-0 z-[110] mt-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-xl animate-in fade-in zoom-in duration-200 custom-scrollbar">
                      {members.map((member, idx) => (
                        <div
                          key={member.employee_seq || idx}
                          onClick={() => {
                            setNewGlobalTask({ ...newGlobalTask, users_pic_id: member.users_id, name: member.name, sysname: member.sysname });
                            if (errors.globalAssignee) {
                              setErrors(prev => ({
                                ...prev, globalAssignee: null
                              }));
                            }
                            setOpenDropdown(null);
                          }}
                          className="px-4 py-3 flex items-center gap-3 hover:bg-[#F0F4FF] cursor-pointer transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-100">
                            {
                              member?.sysname && 
                                <img src={`https://api.sukong.shop/file/profile/view?sysname=${member.sysname}&token=${token}`} alt={member.name} className="w-full h-full object-cover" />
                            }
                          </div>
                          <span className="text-sm font-bold text-slate-600">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                        {['high', 'medium', 'low'].map(p => (
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
                      className={`bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer ${newGlobalTask.start_date ? 'text-black' : 'text-[#9CA3AF]'}`}
                    >
                      {newGlobalTask.start_date || "날짜 선택"}
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[10px]" />
                    </div>
                    {openCalendar === 'start' && (
                      <div className="absolute top-full left-0 z-[110] mt-2 w-[280px] [&>div]:top-0 [&>div]:bottom-auto [&>div]:mt-0 [&>div]:mb-0">
                        <Calendar
                          value={newGlobalTask?.start_date}
                          minDate={project?.start_date?.substring(0, 10)}
                          maxDate={project?.end_date?.substring(0, 10)}
                          onChange={(date) => {
                            const projectStartDate = project?.start_date?.substring(0, 10);
                            if (date < projectStartDate) {
                              setErrors(prev => ({ ...prev, globalStartDate: '프로젝트 기간 내에서만 선택 가능합니다.' }));
                              return;
                            }
                            setErrors(prev => ({ ...prev, globalStartDate: null }));
                            setNewGlobalTask(prev => ({ ...prev, start_date: date, due_date: prev.due_date && prev.due_date < date ? date : prev.due_date }));
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
                      className={`bg-slate-50 rounded-lg p-2 text-sm font-bold flex justify-between items-center cursor-pointer ${newGlobalTask.due_date ? 'text-black' : 'text-[#9CA3AF]'} ${errors.globalEndDate ? 'border border-red-500' : ''}`}
                    >
                      {newGlobalTask.due_date || "날짜 선택"}
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 text-[10px]" />
                    </div>
                    {openCalendar === 'end' && (
                      <div className="absolute top-full right-0 z-[110] mt-2 w-[280px] [&>div]:top-0 [&>div]:bottom-auto [&>div]:mt-0 [&>div]:mb-0">
                        <Calendar
                          value={newGlobalTask.due_date}
                          minDate={newGlobalTask?.start_date || project?.start_date?.substring(0, 10)}
                          maxDate={project?.end_date?.substring(0, 10)}
                          onChange={(date) => {
                            const projectStart = project?.start_date?.substring(0, 10);
                            const projectEnd = project?.end_date?.substring(0, 10);
                            if (date < projectStart || date > projectEnd) {
                              setErrors(prev => ({ ...prev, globalEndDate: '프로젝트 기간 내에서만 선택 가능합니다.' }));
                              return;
                            }
                            setErrors(prev => ({ ...prev, globalEndDate: null }));
                            setNewGlobalTask(prev => ({ ...prev, due_date: date }));
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
                    className={`w-full bg-slate-50/50 rounded-2xl p-4 text-base leading-relaxed text-slate-600 outline-none resize-none font-medium custom-scrollbar transition-all ${errors.globalContent ? 'border-2 border-red-500' : 'border-none'}`}
                    placeholder="상세한 설명을 적어주세요..."
                    value={newGlobalTask.content}
                    onChange={e => {
                      const val = e.target.value;
                      setNewGlobalTask({ ...newGlobalTask, content: val });
                      if (val.length > 800) {
                        setErrors(prev => ({ ...prev, globalContent: '글자수가 초과되었습니다. 800자까지만 입력 가능합니다.' }));
                      } else {
                        if (errors.globalContent) setErrors(prev => ({ ...prev, globalContent: null }));
                      }
                    }}
                  />
                  {errors.globalContent && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.globalContent}</p>}
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewGlobalTask({ title: '', users_pic_id: '', name: '', sysname: '', priority: 'medium', status: 'TODO', start_date: project?.start_date?.substring(0, 10), due_date: '', content: '' });
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
        </div>
      )}

      {/* 4. Task 상세/수정 팝업 모달 */}
      {detailModalTask && (
        <div className="fixed inset-0 bg-[#1a1c3d]/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300 p-8">
          <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-300 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
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
                    className={`w-full text-2xl font-black text-[#1a1c3d] focus:ring-0 outline-none transition-all ${errors.detailTitle ? 'border-2 border-red-500 p-2 rounded-xl' : 'border-none p-0'}`}
                    value={detailModalTask.title}
                    onChange={e => {
                      const val = e.target.value;
                      setDetailModalTask({ ...detailModalTask, title: val });
                      if (val.length > 30) {
                        setErrors(prev => ({ ...prev, detailTitle: '글자수가 초과되었습니다. 30자까지만 입력 가능합니다.' }));
                      } else {
                        if (errors.detailTitle) setErrors(prev => ({ ...prev, detailTitle: null }));
                      }
                    }}
                  />
                  {errors.detailTitle && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.detailTitle}</p>}
                </div>

                {/* 담당자 */}
                <div className="space-y-1.5 relative">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">담당자</p>
                  <div
                    onClick={() => setOpenDropdown(openDropdown === 'detailAssignee' ? null : 'detailAssignee')}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden border border-white">
                      {detailModalTask.sysname ? (
                        <img src={`https://api.sukong.shop/file/profile/view?sysname=${detailModalTask.sysname}&token=${token}`} alt={detailModalTask.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-[#3530B8] font-bold">{detailModalTask.name?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-600">{detailModalTask.name}</span>
                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-slate-400 ml-auto" />
                  </div>
                  {openDropdown === 'detailAssignee' && (
                    <div className="absolute top-full left-0 z-[110] mt-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-xl animate-in fade-in zoom-in duration-200 custom-scrollbar">
                      {members.map((member, idx) => (
                        <div
                          key={member.employee_seq || idx}
                          onClick={() => {
                            setDetailModalTask({ ...detailModalTask, users_pic_id: member.users_id, name: member.name, sysname: member.sysname });
                            setOpenDropdown(null);
                          }}
                          className="px-4 py-3 flex items-center gap-3 hover:bg-[#F0F4FF] cursor-pointer transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-100">
                            {
                              member?.sysname && 
                                <img src={`https://api.sukong.shop/file/profile/view?sysname=${member.sysname}&token=${token}`} alt={member.name} className="w-full h-full object-cover" />
                            }
                          </div>
                          <span className="text-sm font-bold text-slate-600">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                            onClick={() => { setDetailModalTask({ ...detailModalTask, status: s }); setOpenDropdown(null); }}
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
                        {['high', 'medium', 'low'].map(p => (
                          <div
                            key={p}
                            onClick={() => { setDetailModalTask({ ...detailModalTask, priority: p }); setOpenDropdown(null); }}
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
                    <div className="text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg flex items-center h-[32px] whitespace-nowrap max-[430px]:px-2 max-[430px]:text-xs">
                      {detailModalTask.start_date?.substring(0, 10)}
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">마감일</p>
                    <div
                      onClick={() => setOpenCalendar(openCalendar === 'detailEnd' ? null : 'detailEnd')}
                      className="text-sm font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg cursor-pointer flex justify-between items-center gap-1 min-w-[150px] h-[32px] whitespace-nowrap max-[430px]:min-w-0 max-[430px]:px-2 max-[430px]:text-xs"
                    >
                      {detailModalTask.due_date.substring(0, 10)}
                      <FontAwesomeIcon icon={faCalendarAlt} className="shrink-0 text-slate-400 text-[10px]" />
                    </div>
                    {openCalendar === 'detailEnd' && (
                      <div className="absolute top-full right-0 z-[110] mt-2 w-[280px] max-[430px]:fixed max-[430px]:left-1/2 max-[430px]:right-auto max-[430px]:top-[265px] max-[430px]:w-[260px] max-[430px]:-translate-x-1/2 [&>div]:top-0 [&>div]:bottom-auto [&>div]:mt-0 [&>div]:mb-0">
                        <Calendar
                          value={detailModalTask.due_date}
                          minDate={detailModalTask?.start_date?.substring(0, 10)}
                          maxDate={project?.end_date?.substring(0, 10)}
                          onChange={(date) => {
                            const projectStart = project?.start_date?.substring(0, 10);
                            const projectEnd = project?.end_date?.substring(0, 10);
                            if (date < projectStart || date > projectEnd) {
                              setErrors(prev => ({ ...prev, detailEndDate: '프로젝트 기간 내에서만 선택 가능합니다.' }));
                              return;
                            }
                            setErrors(prev => ({ ...prev, detailEndDate: null }));
                            setDetailModalTask(prev => ({ ...prev, due_date: date }));
                            setOpenCalendar(null);
                          }}
                          onClose={() => setOpenCalendar(null)}
                        />
                      </div>
                    )}
                    {errors.detailEndDate && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.detailEndDate}</p>}
                  </div>
                </div>

                {/* 상세 내용 */}
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">상세 내용</p>
                  <textarea
                    rows={4}
                    className={`w-full bg-slate-50/50 rounded-2xl p-5 text-base leading-relaxed text-slate-600 outline-none resize-none custom-scrollbar transition-all ${errors.detailContent ? 'border-2 border-red-500' : 'border-none'}`}
                    value={detailModalTask.content}
                    onChange={e => {
                      const val = e.target.value;
                      setDetailModalTask({ ...detailModalTask, content: val });
                      if (val.length > 800) {
                        setErrors(prev => ({ ...prev, detailContent: '글자수가 초과되었습니다. 800자까지만 입력 가능합니다.' }));
                      } else {
                        if (errors.detailContent) setErrors(prev => ({ ...prev, detailContent: null }));
                      }
                    }}
                  />
                  {errors.detailContent && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.detailContent}</p>}
                </div>

                {/* 버튼 */}
                <div className="flex gap-4 mt-10">
                  <button onClick={() => setDetailModalTask(null)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-sm">취소</button>
                  <button onClick={handleUpdateTask} className="flex-1 bg-[#3530B8] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100">저장</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {draggingTask && (
        <div
          className="pointer-events-none fixed z-[200] rotate-[3deg] rounded-2xl border border-slate-100/80 bg-white p-5 opacity-70 shadow-2xl shadow-indigo-300/60"
          style={{
            left: draggingTask.x - draggingTask.offsetX,
            top: draggingTask.y - draggingTask.offsetY,
            width: draggingTask.width,
          }}
        >
          <div className="flex justify-between items-center mb-4 gap-2">
            <h3 className="font-bold text-base text-[#1a1c3d] leading-relaxed flex-1">{draggingTask.task.title}</h3>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                {
                  draggingTask.task?.sysname &&
                    <img
                      src={`https://api.sukong.shop/file/profile/view?sysname=${draggingTask.task?.sysname}&token=${token}`}
                      alt={draggingTask.task?.name}
                      className="w-full h-full object-cover"
                    />
                }
              </div>
              <span className="text-sm font-bold text-slate-500 leading-none">{draggingTask.task.name}</span>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-sm font-black px-2 py-0.5 rounded-full ${getPriorityStyle(draggingTask.task.priority)} leading-none`}>
                {draggingTask.task.priority}
              </span>
              <span className="text-xs font-medium text-slate-400 font-mono tracking-tight leading-none">{formatDate(draggingTask.task.due_date)}</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E0; }
        textarea.custom-scrollbar::-webkit-scrollbar { width: 3px; }
      `}</style>
    </div>
  );
};

export default Kanban;
