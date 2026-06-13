import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faTimes, faChevronLeft, faChevronRight, faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import Calendar from '../../components/common/Calendar';
// updateProject 추가 (projectsApi.js 에 구현 필요)
import { deleteProject, getAllEmp, getMyAllProject, insertProjectAndMembers, updateProject } from './projectsApi';
import useUserStore from '../../store/userStore';
import useAuthStore from '../../store/authStore';

const ProjectsList = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('전체');
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('프로젝트명');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef(null);
  const startCalendarRef = useRef(null);
  const endCalendarRef = useRef(null);
  const empDropdownRef = useRef(null);
  // 인라인 수정용 ref (데스크탑/모바일이 동시에 DOM에 존재하므로 각각 분리)
  const editStartCalRefDesktop = useRef(null);
  const editEndCalRefDesktop = useRef(null);
  const editEmpRefDesktop = useRef(null);
  const editStartCalRefMobile = useRef(null);
  const editEndCalRefMobile = useRef(null);
  const editEmpRefMobile = useRef(null);
  const user = useUserStore(state => state.user);
  const token = useAuthStore(state => state.token);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [projects, setProjects] = useState([{}]);
  const [newProject, setNewProject] = useState({ project_name: '', contents: '', start_date: '', end_date: '', members: [] });
  const [employess, setEmployess] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // ===== 인라인 수정 상태 =====
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ project_name: '', contents: '', start_date: '', end_date: '', members: [] });
  const [editEmpSearch, setEditEmpSearch] = useState('');
  const [showEditEmpDropdown, setShowEditEmpDropdown] = useState(false);
  const [isEditStartCalendarOpen, setIsEditStartCalendarOpen] = useState(false);
  const [isEditEndCalendarOpen, setIsEditEndCalendarOpen] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
      if (startCalendarRef.current && !startCalendarRef.current.contains(event.target)) {
        setIsStartCalendarOpen(false);
      }
      if (endCalendarRef.current && !endCalendarRef.current.contains(event.target)) {
        setIsEndCalendarOpen(false);
      }
      if (empDropdownRef.current && !empDropdownRef.current.contains(event.target)) {
        setShowEmpDropdown(false);
      }
      if (editStartCalRefDesktop.current && !editStartCalRefDesktop.current.contains(event.target)
        && editStartCalRefMobile.current && !editStartCalRefMobile.current.contains(event.target)) {
        setIsEditStartCalendarOpen(false);
      }
      if (editEndCalRefDesktop.current && !editEndCalRefDesktop.current.contains(event.target)
        && editEndCalRefMobile.current && !editEndCalRefMobile.current.contains(event.target)) {
        setIsEditEndCalendarOpen(false);
      }
      if (editEmpRefDesktop.current && !editEmpRefDesktop.current.contains(event.target)
        && editEmpRefMobile.current && !editEmpRefMobile.current.contains(event.target)) {
        setShowEditEmpDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEmployees = employess.filter(e => {
    const matchsSearch = e.name.includes(empSearch);
    const isAlreadyAdded = newProject.members.some(m => m.id === e.id);
    const targetLank = e.rank_name !== "대표";
    const targetMy = e.id !== user.id;
    return matchsSearch && !isAlreadyAdded && targetLank && targetMy;
  });

  const isDropdownActive = showEmpDropdown && empSearch; // 검색창이 활성화되었는지 여부
  const getDynamicMargin = () => {
    if (!isDropdownActive) return 8; // 평소 간격 (mb-2 = 8px)
    if (filteredEmployees.length === 0) {
      return 64; // "검색 결과가 없습니다" (1줄 높이 약 64px)
    }
    const calculatedHeight = (filteredEmployees.length * 53) + 16;
    return Math.min(calculatedHeight, 144);
  };

  // ===== 수정 모드 참여자 검색 =====
  const filteredEditEmployees = employess.filter(e => {
    const matchesSearch = e.name.includes(editEmpSearch);
    const isAlreadyAdded = editData.members.some(m => m.id === e.id);
    const targetRank = e.rank_name !== "대표";
    const targetMy = e.id !== user.id;
    return matchesSearch && !isAlreadyAdded && targetRank && targetMy;
  });
  const isEditDropdownActive = showEditEmpDropdown && editEmpSearch;

  // 수정 관련 상태 전체 초기화
  const resetEditState = () => {
    setIsEditing(false);
    setEditData({ project_name: '', contents: '', start_date: '', end_date: '', members: [] });
    setEditEmpSearch('');
    setShowEditEmpDropdown(false);
    setIsEditStartCalendarOpen(false);
    setIsEditEndCalendarOpen(false);
    setEditErrors({});
  };

  // 상세보기 선택: 항상 보기 모드로 전환하며 이전 수정 내용 제거
  const handleSelectProject = (p) => {
    resetEditState();
    setSelectedProject(p);
  };

  // 상세 패널 닫기: 수정 내용까지 모두 제거
  const handleCloseDetail = () => {
    resetEditState();
    setSelectedProject(null);
  };


  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesFilter = filter === '전체' || p.status === filter;
      const matchesSearch = searchBy === '프로젝트명'
        ? p.project_name?.includes(search)
        : p.members.some(m => m.includes(search));
      return matchesFilter && matchesSearch;
    });
  }, [filter, search, searchBy, projects]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const handleCreate = () => {
    const newErrors = {};
    if (!newProject.project_name) newErrors.project_name = '프로젝트명을 입력해주세요.';
    if (!newProject.start_date) newErrors.start_date = '시작일을 선택해주세요.';
    if (!newProject.end_date) newErrors.end_date = '종료일을 선택해주세요.';
    if (newProject.members.length === 0) newErrors.members = '참여자를 추가해주세요.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newEntry = {
      project_name: newProject.project_name,
      start_date: `${newProject.start_date}`,
      end_date: `${newProject.end_date}`,
      status: 'IN_PROGRESS',
      projectMembersDTO: newProject.members.map(m => ({ users_id: m.id })),
      contents: newProject.contents
    };

    insertProjectAndMembers(newEntry).then(resp => {
      getMyAllProject().then(resp => {
        setProjects(resp.data);
        setIsModalOpen(false);
        setNewProject({ project_name: '', contents: '', start_date: '', end_date: '', members: [] });
        setEmpSearch('');
        setErrors({});
        alert('개인 캘린더에 일정이 성공적으로 추가되었습니다.');
      });
    });
  };

  const addMember = (emp) => {
    if (!newProject.members.find(m => m.id === emp.id)) {
      setNewProject({ ...newProject, members: [...newProject.members, emp] });
      if (errors.members) setErrors(prev => ({ ...prev, members: null }));
    }
    setEmpSearch('');
    setShowEmpDropdown(false);
  };

  const removeMember = (id) => {
    setNewProject({ ...newProject, members: newProject.members.filter(m => m.id !== id) });
  };

  // ===== 인라인 수정 시작 =====
  const startEdit = () => {
    const members = (selectedProject.projectMembersDTO || []).map(m => {
      const emp = employess.find(e => String(e.id) === String(m.users_id));
      return emp || {
        id: m.users_id,
        name: m.name,
        sysname: m.sysname,
        dept_name: m.dept_name,
        rank_name: m.rank_name,
      };
    });
    setEditData({
      project_name: selectedProject.project_name || '',
      contents: selectedProject.contents || '',
      start_date: selectedProject.start_date ? selectedProject.start_date.substring(0, 10) : '',
      end_date: selectedProject.end_date ? selectedProject.end_date.substring(0, 10) : '',
      members,
    });
    setEditErrors({});
    setEditEmpSearch('');
    setShowEditEmpDropdown(false);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    resetEditState();
  };

  const addEditMember = (emp) => {
    if (!editData.members.find(m => m.id === emp.id)) {
      setEditData(prev => ({ ...prev, members: [...prev.members, emp] }));
      if (editErrors.members) setEditErrors(prev => ({ ...prev, members: null }));
    }
    setEditEmpSearch('');
    setShowEditEmpDropdown(false);
  };

  const removeEditMember = (id) => {
    setEditData(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
  };

  // ===== 인라인 수정 저장 =====
  const handleUpdate = () => {
    const newErrors = {};
    if (!editData.project_name) newErrors.project_name = '프로젝트명을 입력해주세요.';
    if (!editData.start_date) newErrors.start_date = '시작일을 선택해주세요.';
    if (!editData.end_date) newErrors.end_date = '종료일을 선택해주세요.';
    if (editData.members.length === 0) newErrors.members = '참여자를 추가해주세요.';

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    const newMembersDTO = editData.members.map(m => ({
      users_id: m.id,
      name: m.name,
      sysname: m.sysname,
      dept_name: m.dept_name,
      rank_name: m.rank_name,
    }));

    const updatedEntry = {
      project_seq: selectedProject.project_seq,
      project_name: editData.project_name,
      contents: editData.contents,
      start_date: editData.start_date,
      end_date: editData.end_date,
      status: selectedProject.status,
      users_id: selectedProject.users_id,
      projectMembersDTO: newMembersDTO,
    };

    updateProject(updatedEntry).then(() => {
      alert('프로젝트가 성공적으로 수정되었습니다.');
      setProjects(prev => prev.map(p => (p.project_seq === selectedProject.project_seq ? { ...p, ...updatedEntry } : p)));
      setSelectedProject(prev => ({ ...prev, ...updatedEntry }));
      setIsEditing(false);
      setEditEmpSearch('');
      setShowEditEmpDropdown(false);
      setEditErrors({});
    });
  };

  const handleDelete = (project_seq) => {
    if (window.confirm('정말 삭제하시겠습니까? 삭제 시 복구는 불가합니다.')) {
      deleteProject(project_seq).then(resp => {
        alert("삭제되었습니다.")
        getMyAllProject().then(resp => {
          setProjects(resp.data);
          setIsModalOpen(false);
          handleCloseDetail();
          setNewProject({ project_name: '', contents: '', start_date: '', end_date: '', members: [] });
          setEmpSearch('');
          setErrors({});
        })
      });
    }
  };

  const handleComplete = (p) => {
    // if (window.confirm('프로젝트를 완료 처리하시겠습니까?')) {
    //   const updatedEntry = {
    //     ...p,
    //     status: 'DONE',
    //   };
    //   updateProject(updatedEntry).then(() => {
    //     alert('프로젝트가 완료되었습니다.');
    //     setProjects(prev => prev.map(item => item.project_seq === p.project_seq ? { ...item, status: 'DONE' } : item));
    //   });
    // }
  };

  useEffect(() => {
    getAllEmp().then(resp => {
      setEmployess(resp.data)
    })
  }, []);

  useEffect(() => {
    getMyAllProject().then(resp => {
      setProjects(resp.data);
      setIsModalOpen(false);
      setNewProject({ project_name: '', contents: '', start_date: '', end_date: '', members: [] });
      setEmpSearch('');
      setErrors({});
    })
  }, []);

  // ===== 상세 패널(수정/보기) 공통 렌더 =====
  const renderDetailBody = (mobile = false) => {
    const canEdit = selectedProject.users_id === user?.id;

    if (isEditing) {
      // 데스크탑/모바일 인스턴스별 ref 선택
      const startCalRef = mobile ? editStartCalRefMobile : editStartCalRefDesktop;
      const endCalRef = mobile ? editEndCalRefMobile : editEndCalRefDesktop;
      const empRef = mobile ? editEmpRefMobile : editEmpRefDesktop;

      return (
        <div className="shrink-0">
          {/* 1. 프로젝트명 */}
          <label className="block text-xs font-bold text-[#1a1c3d] mb-2">프로젝트명 *</label>
          <input
            value={editData.project_name}
            onChange={e => {
              setEditData(prev => ({ ...prev, project_name: e.target.value }));
              if (editErrors.project_name) setEditErrors(prev => ({ ...prev, project_name: null }));
            }}
            className={`w-full p-3 bg-[#f4f7fc] rounded-xl outline-none text-xs ${editErrors.project_name ? 'border border-red-500' : ''}`}
          />
          {editErrors.project_name && <p className="text-[9px] text-red-500 font-medium ml-1 mt-1">{editErrors.project_name}</p>}

          {/* 2. 내용 */}
          <label className="block text-xs font-bold text-[#1a1c3d] mb-2 mt-4">내용</label>
          <textarea
            rows={3}
            value={editData.contents}
            onChange={e => setEditData(prev => ({ ...prev, contents: e.target.value }))}
            className="w-full text-xs p-3 bg-[#f4f7fc] rounded-xl outline-none"
          />

          {/* 3. 시작일 / 종료일 */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 relative" ref={startCalRef}>
              <label className="block text-xs font-bold text-[#1a1c3d] mb-2">시작일 *</label>
              <div
                onClick={() => { setIsEditStartCalendarOpen(!isEditStartCalendarOpen); setIsEditEndCalendarOpen(false); }}
                className={`w-full p-3 bg-[#f4f7fc] rounded-xl cursor-pointer text-xs ${editData.start_date ? 'text-black' : 'text-[#9CA3AF]'} ${editErrors.start_date ? 'border border-red-500' : ''}`}
              >
                {editData.start_date || '날짜 선택'}
              </div>
              {editErrors.start_date && <p className="text-[9px] text-red-500 font-medium ml-1 mt-1">{editErrors.start_date}</p>}
              {isEditStartCalendarOpen && (
                <Calendar
                  value={editData.start_date}
                  onChange={(date) => {
                    setEditErrors(prev => ({ ...prev, start_date: null }));
                    setEditData(prev => ({
                      ...prev,
                      start_date: date,
                      end_date: prev.end_date && prev.end_date < date ? date : prev.end_date,
                    }));
                    setIsEditStartCalendarOpen(false);
                  }}
                  onClose={() => setIsEditStartCalendarOpen(false)}
                />
              )}
            </div>
            <div className="flex-1 relative" ref={endCalRef}>
              <label className="block text-xs font-bold text-[#1a1c3d] mb-2">종료일 *</label>
              <div
                onClick={() => { setIsEditEndCalendarOpen(!isEditEndCalendarOpen); setIsEditStartCalendarOpen(false); }}
                className={`w-full p-3 bg-[#f4f7fc] rounded-xl cursor-pointer text-xs ${editData.end_date ? 'text-black' : 'text-[#9CA3AF]'} ${editErrors.end_date ? 'border border-red-500' : ''}`}
              >
                {editData.end_date || '날짜 선택'}
              </div>
              {editErrors.end_date && <p className="text-[9px] text-red-500 font-medium ml-1 mt-1">{editErrors.end_date}</p>}
              {isEditEndCalendarOpen && (
                <Calendar
                  value={editData.end_date}
                  minDate={editData.start_date || undefined}
                  onChange={(date) => {
                    if (editData.start_date && date < editData.start_date) {
                      setEditErrors(prev => ({ ...prev, end_date: '종료일은 시작일보다 이전일 수 없습니다.' }));
                      return;
                    }
                    setEditErrors(prev => ({ ...prev, end_date: null }));
                    setEditData(prev => ({ ...prev, end_date: date }));
                    setIsEditEndCalendarOpen(false);
                  }}
                  onClose={() => setIsEditEndCalendarOpen(false)}
                />
              )}
            </div>
          </div>

          {/* 4. 참여자 */}
          <label className="block text-xs font-bold text-[#1a1c3d] mb-2 mt-4">참여자 *</label>
          <div className="relative" ref={empRef}>
            <input
              value={editEmpSearch}
              onChange={e => {
                setEditEmpSearch(e.target.value);
                setShowEditEmpDropdown(true);
                if (editErrors.members) setEditErrors(prev => ({ ...prev, members: null }));
              }}
              className={`w-full p-3 bg-white border ${editErrors.members ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none text-xs focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5`}
              placeholder="이름으로 검색하여 참여자를 추가하세요."
            />
            {isEditDropdownActive && (
              <div className="w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-32 overflow-y-auto custom-scrollbar">
                {filteredEditEmployees.length > 0 ? (
                  filteredEditEmployees.map(e => (
                    <div
                      key={e.id}
                      onClick={() => addEditMember(e)}
                      className="flex justify-between items-center px-5 py-3 hover:bg-[#F0F4FF] cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-[#1a1c3d] group-hover:text-[#3530B8] transition-colors">{e.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{e.dept_name || '소속 없음'}</span>
                      </div>
                      {e.rank_name && (
                        <span className="px-2 py-0.5 text-[10px] font-bold text-[#3530B8] bg-[#F0F4FF] rounded-md border border-[#3530B8]/10">{e.rank_name}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-xs text-center text-gray-400 font-medium bg-gray-50/50">검색 결과가 없습니다.</div>
                )}
              </div>
            )}
          </div>
          {editErrors.members && <p className="text-[9px] text-red-500 font-medium ml-1 mt-1">{editErrors.members}</p>}

          <div className="flex flex-wrap gap-2 mt-3">
            {editData.members?.map(m => (
              <div key={m.id} className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-[#3a36db]/20">
                {m.name} {m.dept_name ? `(${m.dept_name})` : ''}
                <FontAwesomeIcon icon={faTimes} className="cursor-pointer" onClick={() => removeEditMember(m.id)} />
              </div>
            ))}
          </div>

          {/* 저장 / 취소 */}
          <div className={`${mobile ? 'mt-6' : 'mt-8'} flex gap-3`}>
            <button onClick={handleUpdate} className={`flex-1 ${mobile ? 'py-2.5 text-xs rounded-xl' : 'py-3 rounded-2xl'} bg-[#3530B8] text-white font-bold hover:bg-[#2a2594] transition-all`}>저장</button>
            <button onClick={cancelEdit} className={`flex-1 ${mobile ? 'py-2.5 text-xs rounded-xl' : 'py-3 rounded-2xl'} bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all`}>취소</button>
          </div>
        </div>
      );
    }

    // ===== 보기 모드 =====
    return (
      <>
        <div className="flex items-center gap-2 min-w-0 mb-2">
          <h3 className="text-lg font-bold">{selectedProject.project_name}</h3>
          {selectedProject.projectMembersDTO?.some(m => String(m.users_id) === String(user?.id)) && (
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">참석자</span>
          )}
        </div>
        <p className={`${mobile ? 'text-xs mb-4' : 'text-sm mb-8'} text-gray-500`}>
          {selectedProject.start_date?.substring(0, 10)}~{selectedProject.end_date?.substring(0, 10)}
        </p>

        {mobile ? (
          <>
            <h4 className="text-[10px] font-bold text-[#8a92a6] uppercase mb-2">내용</h4>
            <p className="text-xs text-gray-700 mb-4 bg-[#f4f7fc] p-3 rounded-lg">{selectedProject.contents}</p>
          </>
        ) : (
          <div className="bg-[#f4f7fc] p-6 rounded-2xl mb-8">
            <h4 className="text-xs font-bold text-[#8a92a6] uppercase mb-3">내용</h4>
            <p className="text-sm text-gray-700">{selectedProject.contents}</p>
          </div>
        )}

        <h4 className={`${mobile ? 'text-[10px]' : 'text-xs'} font-bold text-[#8a92a6] uppercase mb-2`}>참여자</h4>
        <div className="flex flex-wrap gap-4 rounded-xl">
          {selectedProject.projectMembersDTO?.map((member, index) => (
            <div key={index} className="flex flex-col items-center gap-2 px-3 py-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-300">
                <img
                  src={`http://localhost/file/profile/view?sysname=${member?.sysname}&token=${token}`}
                  alt={member?.name}
                  className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-medium">{member.name}</span>
            </div>
          ))}
        </div>

        {canEdit && (
          <div className={`${mobile ? 'mt-6' : 'mt-auto pt-8'} flex gap-3`}>
            <button
              onClick={startEdit}
              className={`flex-1 ${mobile ? 'py-2.5 text-xs rounded-xl' : 'py-3 rounded-2xl'} bg-white border border-[#3530B8]/20 text-[#3530B8] font-bold hover:bg-[#F0F4FF] transition-all`}
            >
              수정
            </button>
            <button onClick={() => { handleDelete(selectedProject.project_seq) }} className={`flex-1 ${mobile ? 'py-2.5 text-xs rounded-xl' : 'py-3 rounded-2xl'} bg-white border border-red-200 text-red-500 font-bold hover:bg-red-50 transition-all`}>삭제</button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFFFF] py-8 px-1 md:px-7 overflow-y-auto lg:overflow-hidden custom-scrollbar">
      <div className="mb-6 px-4 md:px-2">
        <h1 className="text-xl md:text-2xl font-bold text-[#121331]">프로젝트 관리</h1>
        <p className="text-xs md:text-sm text-[#8a92a6] mt-1">진행 중인 프로젝트명을 클릭하여 칸반 보드에서 업무를 관리하세요.</p>
      </div>

      {/* 2단 분할은 lg(1024px) 이상에서만. 그 미만은 목록 전체폭 + 상세 모달 */}
      <div className="flex flex-col lg:flex-row h-auto lg:flex-1 gap-6 min-h-0 max-w-[1450px] mx-auto w-full">
        <div className={`bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-[#edf2f9] p-3 md:p-8 flex flex-col transition-all duration-300 lg:overflow-hidden min-w-0 ${selectedProject ? 'lg:w-[65%] w-full' : 'w-full'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex bg-white rounded-2xl shadow-sm border border-[#edf2f9] p-1 w-full md:w-fit overflow-x-auto md:overflow-x-visible items-center">
              {['전체', '진행중', '완료'].map(tab => (
                <button key={tab} onClick={() => {
                  if (tab === '전체') setFilter('전체');
                  else if (tab === '진행중') setFilter('IN_PROGRESS');
                  else setFilter('DONE'); setCurrentPage(1);
                }}
                  className={`flex-1 md:flex-none px-4 md:px-6 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${filter === tab || (tab === '진행중' && filter === 'IN_PROGRESS') || (tab === '완료' && filter === 'DONE') ? 'bg-[#3530B8] text-white shadow-sm' : 'bg-white text-[#8a92a6] hover:bg-[#F0F4FF] hover:text-[#3530B8]'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-end md:items-center min-w-0">
              <div className="flex gap-2 w-full md:w-auto justify-end md:flex-1 min-w-0">
                <div className="relative w-fit md:w-auto shrink-0" ref={searchDropdownRef}>
                  <div className="bg-[#f4f7fc] px-4 h-[40px] rounded-xl text-xs text-[#8a92a6] outline-none cursor-pointer flex items-center justify-between gap-3 whitespace-nowrap"
                    onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}>
                    {searchBy}
                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
                  </div>
                  {isSearchDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-lg z-50 overflow-hidden border border-[#edf2f9]">
                      {['프로젝트명', '참여자'].map(option => (
                        <div key={option}
                          className="px-4 py-2.5 text-xs text-[#8a92a6] hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer transition-colors whitespace-nowrap"
                          onClick={() => { setSearchBy(option); setIsSearchDropdownOpen(false); }}>
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative flex items-center flex-1 md:w-auto md:max-w-48 md:min-w-[100px]">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-4 text-[#8a92a6]" />
                  <input placeholder="검색" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="pl-12 pr-4 h-[40px] bg-[#f4f7fc] rounded-xl text-sm w-full outline-none placeholder:text-[#8a92a6]" />
                </div>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-[#3530B8] text-white text-xs md:text-sm px-2.5 md:px-4 py-2.5 rounded-xl font-bold hover:bg-[#2a2594] whitespace-nowrap shrink-0">
                <FontAwesomeIcon icon={faPlus} className="mr-2" /> 새 프로젝트
              </button>
            </div>
          </div>

          <div className="flex-1 lg:overflow-y-auto lg:min-h-0 custom-scrollbar">
            <table className="w-full text-left border-collapse md:table-fixed">
              <thead className="hidden md:table-header-group">
                <tr className="text-[#8a92a6] text-sm border-b border-gray-100">
                  <th className="pb-4 font-medium px-2 text-left md:w-[32%]">프로젝트명 (클릭 시 칸반 보드로 이동)</th>
                  <th className="pb-4 font-medium px-2 text-left md:w-[24%]">기간</th>
                  <th className="pb-4 font-medium px-3 text-left md:w-[15%]">진행상황</th>
                  <th className="pb-4 font-medium px-2 text-left md:w-[12%]">참여자</th>
                  <th className="pb-4 font-medium px-2 text-left md:w-[8%]">상세보기</th>
                  <th className="pb-4 font-medium px-2 text-left md:w-[5%]">완료</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.map(p => (
                  <tr key={p.project_seq} className="border-b border-gray-100  transition-colors block md:table-row w-full mb-4 md:mb-0">
                    <td className="py-2 px-2 block md:table-cell font-bold text-[#1a1c3d] text-base flex justify-between items-center md:items-start md:table-cell">
                      <div className="flex items-center gap-2 min-w-0">
                        <span onClick={() => navigate(`/kanban/${p.project_seq}`)} className="cursor-pointer hover:text-[#3530B8] text-sm md:block md:truncate">{p.project_name}</span>
                        {p.projectMembersDTO?.some(m => String(m.users_id) === String(user?.id)) && (
                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">참석자</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 md:hidden shrink-0">
                        <button onClick={() => handleSelectProject(p)} className="text-[10px] font-bold text-[#3530B8] border border-[#F0F4FF] bg-[#F0F4FF] px-2 py-1 rounded">상세보기</button>
                        {p.users_id === user?.id ? (
                          <button
                            onClick={() => handleComplete(p)}
                            className="w-7 h-7 flex items-center justify-center bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-all"
                          >
                            <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs w-7 h-7 flex items-center justify-center">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 block md:table-cell text-sm text-gray-500 md:whitespace-nowrap md:truncate">{p.start_date?.substring(0, 10)}~{p.end_date?.substring(0, 10)}</td>
                    <td className="py-2 px-2 block md:table-cell">
                      <div className="flex items-center gap-4">
                        <span className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-bold md:whitespace-nowrap ${p.status === 'DONE' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                          {p.status === 'IN_PROGRESS' ? '진행 중' : '완료'}
                        </span>
                        <div className="flex items-center -space-x-2 md:hidden">
                          {p.projectMembersDTO?.slice(0, 3).map((member, index) => (
                            <div key={index} className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-[#3530B8] border border-white shrink-0">
                              <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                                <img
                                  src={`http://localhost/file/profile/view?sysname=${member?.sysname}&token=${token}`}
                                  alt={member?.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          ))}
                          {p.projectMembersDTO?.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-[#F0F4FF] border border-white flex items-center justify-center text-[8px] font-bold text-[#3530B8] shrink-0 z-10 shadow-sm">
                              +{p.projectMembersDTO.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-2">
                      <div className={`flex items-center ${p.projectMembersDTO?.length > 1 ? 'md:-space-x-3' : ''}`}>
                        {p.projectMembersDTO?.slice(0, 3).map((member, index) => (
                          <div key={index} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-[#3530B8] border-2 border-white shrink-0">
                            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                              <img
                                src={`http://localhost/file/profile/view?sysname=${member?.sysname}&token=${token}`}
                                alt={member?.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        ))}
                        {p.projectMembersDTO?.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-[#F0F4FF] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#3530B8] shrink-0 z-10 shadow-sm">
                            +{p.projectMembersDTO.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-2 md:whitespace-nowrap">
                      <button onClick={() => handleSelectProject(p)} className="text-[11px] font-bold text-[#3530B8] border border-[#F0F4FF] bg-[#F0F4FF] px-3 py-1.5 rounded-lg hover:bg-[#3530B8] hover:text-white transition-all whitespace-nowrap">
                        상세보기
                      </button>
                    </td>
                    <td className="hidden md:table-cell py-4 px-2 md:whitespace-nowrap">
                      {p.users_id === user?.id ? (
                        <button
                          onClick={() => handleComplete(p)}
                          className="w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all"
                        >
                          <FontAwesomeIcon icon={faCheck} className="text-[9px]" />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs w-6 h-6 flex items-center justify-center">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className={`px-2.5 py-1 rounded-lg transition-all text-xs ${currentPage === 1 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}><FontAwesomeIcon icon={faChevronLeft} /></button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-2.5 py-1 rounded-lg transition-all text-xs ${currentPage === i + 1 ? 'bg-[#3530B8] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{i + 1}</button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className={`px-2.5 py-1 rounded-lg transition-all text-xs ${currentPage === totalPages ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}><FontAwesomeIcon icon={faChevronRight} /></button>
          </div>
        </div>

        {/* 데스크탑(lg+) 뷰: 상세 정보 사이드 패널 */}
        {selectedProject && (
          <div className="hidden lg:flex lg:w-[35%] bg-white rounded-[2.5rem] shadow-sm border border-[#edf2f9] p-10 transition-all duration-300 flex-col lg:overflow-y-auto lg:min-h-0 custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-[#1a1c3d]">{isEditing ? '프로젝트 수정' : '프로젝트 상세'}</h2>
              <button onClick={handleCloseDetail}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            {renderDetailBody(false)}
          </div>
        )}

        {/* 모바일/태블릿(lg 미만) 뷰: 상세 정보 모달 */}
        {selectedProject && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">{isEditing ? '프로젝트 수정' : '프로젝트 상세'}</h2>
                <button onClick={handleCloseDetail}><FontAwesomeIcon icon={faTimes} /></button>
              </div>
              {renderDetailBody(true)}
            </div>
          </div>
        )}
      </div>

      {
        isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 md:p-8">
            <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] w-full max-w-[550px] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h2 className="text-2xl font-bold mb-8">새 프로젝트 생성</h2>
              <label className="block text-xs font-bold text-[#1a1c3d] mb-2 ">프로젝트명 *</label>
              <input
                className={`w-full p-4 bg-[#f4f7fc] rounded-xl outline-none text-xs ${errors.project_name ? 'border border-red-500' : ''}`}
                onChange={e => {
                  setNewProject({ ...newProject, project_name: e.target.value });
                  if (errors.project_name) setErrors(prev => ({ ...prev, project_name: null }));
                }}
              />
              {errors.project_name && <p className="text-[9px] text-red-500 font-medium ml-1 mt-1 mb-3">{errors.project_name}</p>}
              {!errors.project_name && <div className="mb-4"></div>}

              <label className="block text-xs font-bold text-[#1a1c3d] mb-2">프로젝트 내용</label>
              <textarea rows={3} className="w-full text-xs p-4 bg-[#f4f7fc] rounded-xl mb-4 outline-none" onChange={e => setNewProject({ ...newProject, contents: e.target.value })} />

              <div className={`flex gap-4 mb-4 ${isStartCalendarOpen || isEndCalendarOpen ? 'relative z-50' : ''}`}>
                <div className="flex-1 relative" ref={startCalendarRef}>
                  <label className="block text-xs font-bold text-[#1a1c3d] mb-2">시작일 *</label>
                  <div onClick={() => { setIsStartCalendarOpen(!isStartCalendarOpen); setIsEndCalendarOpen(false); }} className={`w-full p-4 bg-[#f4f7fc] rounded-xl cursor-pointer text-xs ${newProject.start_date ? 'text-black' : 'text-[#9CA3AF]'} ${errors.start_date ? 'border border-red-500' : ''}`}>
                    {newProject.start_date || "날짜 선택"}
                  </div>
                  {errors.start_date && <p className="text-[9px] text-red-500 font-medium ml-1 mt-1">{errors.start_date}</p>}
                  {isStartCalendarOpen && (
                    <Calendar
                      value={newProject.start}
                      minDate={new Date().toISOString().split('T')[0]}
                      onChange={(date) => {
                        if (date < new Date().toISOString().split('T')[0]) {
                          setErrors(prev => ({ ...prev, start_date: '시작일은 오늘 이후의 날짜만 선택할 수 있습니다.' }));
                          return;
                        }
                        setErrors(prev => ({ ...prev, start_date: null }));
                        setNewProject(prev => ({ ...prev, start_date: date, end: prev.end_date && prev.end_date < date ? date : prev.end_date }));
                        setIsStartCalendarOpen(false);
                      }}
                      onClose={() => setIsStartCalendarOpen(false)}
                    />
                  )}
                </div>

                <div className="flex-1 relative" ref={endCalendarRef}>
                  <label className="block text-xs font-bold text-[#1a1c3d] mb-2">종료일 *</label>
                  <div onClick={() => { setIsEndCalendarOpen(!isEndCalendarOpen); setIsStartCalendarOpen(false); }} className={`w-full p-4 bg-[#f4f7fc] rounded-xl cursor-pointer text-xs ${newProject.end_date ? 'text-black' : 'text-[#9CA3AF]'} ${errors.end_date ? 'border border-red-500' : ''}`}>
                    {newProject.end_date || "날짜 선택"}
                  </div>
                  {errors.end_date && <p className="text-[9px] text-red-500 font-medium ml-1 mt-1">{errors.end_date}</p>}
                  {isEndCalendarOpen && (
                    <Calendar
                      value={newProject.end_date}
                      minDate={newProject.start_date || new Date().toISOString().split('T')[0]}
                      onChange={(date) => {
                        if (newProject.start_date && date < newProject.start_date) {
                          setErrors(prev => ({ ...prev, end: '종료일은 시작일보다 이전일 수 없습니다.' }));
                          return;
                        }
                        setErrors(prev => ({ ...prev, end_date: null }));
                        setNewProject(prev => ({ ...prev, end_date: date }));
                        setIsEndCalendarOpen(false);
                      }}
                      onClose={() => setIsEndCalendarOpen(false)}
                    />
                  )}
                </div>
              </div>


              <label className="block text-xs font-bold text-[#1a1c3d] mb-2">참여자 추가 *</label>
              <div className="relative transition-all duration-200"
                style={{ marginBottom: `${getDynamicMargin()}px` }} ref={empDropdownRef}>
                <input
                  value={empSearch}
                  onChange={e => {
                    setEmpSearch(e.target.value);
                    setShowEmpDropdown(true);
                    if (errors.members) setErrors(prev => ({ ...prev, members: null }));
                  }}
                  className={`w-full p-4 bg-white border ${errors.members ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none text-xs transition-all focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5`}
                  placeholder="이름으로 검색하여 참여자를 추가하세요."
                />
                {isDropdownActive && (
                  <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-32 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200 custom-scrollbar">

                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map(e => (
                        <div
                          key={e.id}
                          onClick={() => addMember(e)}
                          className="flex justify-between items-center px-5 py-3 hover:bg-[#F0F4FF] cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-[#1a1c3d] group-hover:text-[#3530B8] transition-colors">
                              {e.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {e.dept_name || '소속 없음'}
                            </span>
                          </div>
                          {e.rank_name && (
                            <span className="px-2 py-0.5 text-[10px] font-bold text-[#3530B8] bg-[#F0F4FF] rounded-md border border-[#3530B8]/10 transition-all">
                              {e.rank_name}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-xs text-center text-gray-400 font-medium bg-gray-50/50">
                        검색 결과가 없습니다.
                      </div>
                    )}

                  </div>
                )}
              </div>
              {errors.members && <p className="text-[9px] text-red-500 font-medium ml-1 mb-2">{errors.members}</p>}
              <div className="flex flex-wrap gap-2 mb-8">
                {newProject.members?.map(m => (
                  <div key={m.id} className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-[#3a36db]/20">{m.name} ({m.dept_name}) <FontAwesomeIcon icon={faTimes} className="cursor-pointer" onClick={() => removeMember(m.id)} /></div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setIsModalOpen(false); setNewProject({ project_name: '', contents: '', start_date: '', end_date: '', members: [] }); setEmpSearch(''); setErrors({}); }} className="px-8 py-3 bg-gray-100 rounded-xl font-bold text-sm">취소</button>
                <button onClick={handleCreate} className="px-8 py-3 bg-[#3a36db] text-white rounded-xl font-bold text-sm">등록</button>
              </div>
            </div>
          </div>
        )
      }

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
    </div >
  );
};

export default ProjectsList;