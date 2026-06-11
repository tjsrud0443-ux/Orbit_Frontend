import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faTimes, faChevronLeft, faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Calendar from '../../components/common/Calendar';

const MOCK_EMPLOYEES = [
  { id: 1, name: '김철수', dept: '개발팀' },
  { id: 2, name: '이영희', dept: '인사팀' },
  { id: 3, name: '박지성', dept: '디자인팀' },
  { id: 4, name: '최민수', dept: '영업팀' },
];

const INITIAL_PROJECTS = [
  { id: 1, title: 'Orbit 그룹웨어 고도화', period: '2026.05.01 ~ 2026.08.31', status: '진행 중', members: ['김철수', '이영희'], desc: '그룹웨어의 전반적인 고도화 작업 및 UI 개선' },
  { id: 2, title: '사내 AI 챗봇 구축', period: '2026.04.10 ~ 2026.06.30', status: '진행 중', members: ['박지성'], desc: '사내 업무 자동화를 위한 AI 챗봇 개발' },
  { id: 3, title: '연차 시스템 개선', period: '2026.03.01 ~ 2026.04.30', status: '완료', members: ['김철수', '박지성', '최민수'], desc: '연차 신청 프로세스 최적화' },
  { id: 4, title: '마케팅 대시보드', period: '2026.06.01 ~ 2026.09.30', status: '진행 중', members: ['이영희'], desc: '마케팅 데이터 시각화' },
];

const ProjectsList = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('전체');
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('프로젝트명');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newProject, setNewProject] = useState({ title: '', desc: '', start: '', end: '', members: [] });
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesFilter = filter === '전체' || p.status === filter;
      const matchesSearch = searchBy === '프로젝트명'
        ? p.title.includes(search)
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
    if (!newProject.title) newErrors.title = '프로젝트명을 입력해주세요.';
    if (!newProject.start) newErrors.start = '시작일을 선택해주세요.';
    if (!newProject.end) newErrors.end = '종료일을 선택해주세요.';
    if (newProject.members.length === 0) newErrors.members = '참여자를 추가해주세요.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newEntry = {
      id: Date.now(),
      title: newProject.title,
      period: `${newProject.start} ~ ${newProject.end}`,
      status: '진행 중',
      members: newProject.members.map(m => m.name),
      desc: newProject.desc
    };
    setProjects([...projects, newEntry]);
    alert('개인 캘린더에 일정이 성공적으로 추가되었습니다.');
    setIsModalOpen(false);
    setNewProject({ title: '', desc: '', start: '', end: '', members: [] });
    setErrors({});
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

  return (
    <div className="flex flex-col h-full bg-[#FFFFFF] py-8 px-1 md:px-7 overflow-y-auto md:overflow-hidden custom-scrollbar">
      <div className="mb-6 px-4 md:px-2">
        <h1 className="text-xl md:text-2xl font-bold text-[#121331]">프로젝트 관리</h1>
        <p className="text-xs md:text-sm text-[#8a92a6] mt-1">진행 중인 프로젝트명을 클릭하여 칸반 보드에서 업무를 관리하세요.</p>
      </div>

      <div className="flex flex-col md:flex-row h-auto md:flex-1 gap-6 min-h-0 max-w-[1450px] mx-auto w-full">
        <div className={`bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-[#edf2f9] p-3 md:p-8 flex flex-col transition-all duration-300 md:overflow-hidden min-w-0 ${selectedProject ? 'md:w-[65%] w-full' : 'w-full'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex bg-white rounded-2xl shadow-sm border border-[#edf2f9] p-1 w-full md:w-fit overflow-x-auto items-center">
              {['전체', '진행중', '완료'].map(tab => (
                <button key={tab} onClick={() => { setFilter(tab === '진행중' ? '진행 중' : tab); setCurrentPage(1); }}
                  className={`flex-1 md:flex-none px-6 py-1.5 rounded-xl text-sm font-bold transition-all ${filter === tab || (tab === '진행중' && filter === '진행 중') ? 'bg-[#3530B8] text-white shadow-sm' : 'bg-white text-[#8a92a6] hover:bg-[#F0F4FF] hover:text-[#3530B8]'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-end md:items-center">
              <div className="flex gap-2 w-full md:w-auto justify-end">
                <div className="relative w-fit md:w-auto" ref={searchDropdownRef}>
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
                <div className="relative flex items-center flex-1 md:w-48">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-4 text-[#8a92a6]" />
                  <input placeholder="검색" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="pl-12 pr-4 h-[40px] bg-[#f4f7fc] rounded-xl text-sm w-full outline-none placeholder:text-[#8a92a6]" />
                </div>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-[#3530B8] text-white text-xs md:text-sm px-2.5 md:px-6 py-2.5 rounded-xl font-bold hover:bg-[#2a2594] whitespace-nowrap w-fit md:w-auto">
                <FontAwesomeIcon icon={faPlus} className="mr-2" /> 새 프로젝트
              </button>
            </div>
          </div>

          <div className="flex-1 md:overflow-y-auto md:min-h-0 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group">
                <tr className="text-[#8a92a6] text-sm border-b border-gray-100">
                  <th className="pb-4 font-medium px-2 text-left">프로젝트명</th>
                  <th className="pb-4 font-medium px-2 text-left">기간</th>
                  <th className="pb-4 font-medium px-2 text-left">진행상황</th>
                  <th className="pb-4 font-medium px-2 text-left">참여자</th>
                  <th className="pb-4 font-medium px-2 text-left">상세보기</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.map(p => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-[#f8fbff] transition-colors block md:table-row w-full mb-4 md:mb-0">
                    <td className="py-2 px-2 block md:table-cell font-bold text-[#1a1c3d] text-base flex justify-between items-center md:items-start md:block">
                      <span onClick={() => navigate('/kanban')} className="cursor-pointer hover:text-[#3530B8] text-sm">{p.title}</span>
                      <button onClick={() => setSelectedProject(p)} className="md:hidden text-[10px] font-bold text-[#3530B8] border border-[#F0F4FF] bg-[#F0F4FF] px-2 py-1 rounded">상세보기</button>
                    </td>
                    <td className="py-2 px-2 block md:table-cell text-sm text-gray-500">{p.period}</td>
                    <td className="py-2 px-2 block md:table-cell flex items-center gap-4">
                      <span className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-bold ${p.status === '완료' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                        {p.status}
                      </span>
                      <div className="flex gap-1 md:hidden">
                        {p.members.map((m, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-[#3530B8] border border-white">{m.charAt(0)}</div>
                        ))}
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-2">
                      <div className="flex gap-2">
                        {p.members.map((m, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-[#3530B8] border border-white">{m.charAt(0)}</div>
                        ))}
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-2">
                      <button onClick={() => setSelectedProject(p)} className="text-[11px] font-bold text-[#3530B8] border border-[#F0F4FF] bg-[#F0F4FF] px-3 py-1.5 rounded-lg hover:bg-[#3530B8] hover:text-white transition-all">
                        상세보기
                      </button>
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

        {/* 데스크탑 뷰: 상세 정보 패널 */}
        {selectedProject && (
          <div className="hidden md:flex w-[35%] bg-white rounded-[2.5rem] shadow-sm border border-[#edf2f9] p-10 transition-all duration-300 flex-col md:overflow-y-auto md:min-h-0 custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-[#1a1c3d]">프로젝트 상세</h2>
              <button onClick={() => setSelectedProject(null)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <h3 className="text-lg font-bold mb-2">{selectedProject.title}</h3>
            <p className="text-sm text-gray-500 mb-8">{selectedProject.period}</p>
            <div className="bg-[#f4f7fc] p-6 rounded-2xl mb-8">
              <h4 className="text-xs font-bold text-[#8a92a6] uppercase mb-3">내용</h4>
              <p className="text-sm text-gray-700">{selectedProject.desc}</p>
            </div>
            <h4 className="text-xs font-bold text-[#8a92a6] uppercase mb-4">참여자</h4>
            <div className="flex flex-wrap gap-2 p-4 rounded-xl">{selectedProject.members.map((m, i) => <div key={i} className="px-3 py-1 border rounded-lg text-xs border border-[#edf2f9] shadow-sm">{m}</div>)}</div>
          </div>
        )}

        {/* 모바일 뷰: 상세 정보 모달 */}
        {selectedProject && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">프로젝트 상세</h2>
                <button onClick={() => setSelectedProject(null)}><FontAwesomeIcon icon={faTimes} /></button>
              </div>
              <h3 className="text-md font-bold mb-1">{selectedProject.title}</h3>
              <p className="text-xs text-gray-500 mb-4">{selectedProject.period}</p>
              <h4 className="text-[10px] font-bold text-[#8a92a6] uppercase mb-2">내용</h4>
              <p className="text-xs text-gray-700 mb-4 bg-[#f4f7fc] p-3 rounded-lg">{selectedProject.desc}</p>
              <h4 className="text-[10px] font-bold text-[#8a92a6] uppercase mb-2">참여자</h4>
              <div className="flex flex-wrap gap-2">{selectedProject.members.map((m, i) => <div key={i} className="px-2 py-1 border rounded-lg text-[10px] border-[#edf2f9] shadow-sm">{m}</div>)}</div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-8">
          <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] w-full max-w-[550px] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-bold mb-8">새 프로젝트 생성</h2>
            <label className="block text-xs font-bold text-[#1a1c3d] mb-2 ">프로젝트명 *</label>
            <input 
              className={`w-full p-4 bg-[#f4f7fc] rounded-xl outline-none text-xs ${errors.title ? 'border border-red-500' : ''}`} 
              onChange={e => {
                setNewProject({ ...newProject, title: e.target.value });
                if (errors.title) setErrors(prev => ({ ...prev, title: null }));
              }} 
            />
            {errors.title && <p className="text-[9px] text-red-500 font-medium ml-1 mt-1 mb-3">{errors.title}</p>}
            {!errors.title && <div className="mb-4"></div>}

            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <label className="block text-xs font-bold text-[#1a1c3d] mb-2">시작일 *</label>
                <div onClick={() => { setIsStartCalendarOpen(!isStartCalendarOpen); setIsEndCalendarOpen(false); }} className={`w-full p-4 bg-[#f4f7fc] rounded-xl cursor-pointer text-xs ${newProject.start ? 'text-black' : 'text-[#9CA3AF]'} ${errors.start ? 'border border-red-500' : ''}`}>
                  {newProject.start || "날짜 선택"}
                </div>
                {errors.start && <p className="text-[9px] text-red-500 font-medium ml-1 mt-1">{errors.start}</p>}
                {isStartCalendarOpen && (
                  <Calendar
                    value={newProject.start}
                    minDate={new Date().toISOString().split('T')[0]}
                    onChange={(date) => {
                      if (date < new Date().toISOString().split('T')[0]) { 
                        setErrors(prev => ({ ...prev, start: '시작일은 오늘 이후의 날짜만 선택할 수 있습니다.' }));
                        return; 
                      }
                      setErrors(prev => ({ ...prev, start: null }));
                      setNewProject(prev => ({ ...prev, start: date, end: prev.end && prev.end < date ? date : prev.end }));
                      setIsStartCalendarOpen(false);
                    }}
                    onClose={() => setIsStartCalendarOpen(false)}
                  />
                )}
              </div>

              <div className="flex-1 relative">
                <label className="block text-xs font-bold text-[#1a1c3d] mb-2">종료일 *</label>
                <div onClick={() => { setIsEndCalendarOpen(!isEndCalendarOpen); setIsStartCalendarOpen(false); }} className={`w-full p-4 bg-[#f4f7fc] rounded-xl cursor-pointer text-xs ${newProject.end ? 'text-black' : 'text-[#9CA3AF]'} ${errors.end ? 'border border-red-500' : ''}`}>
                  {newProject.end || "날짜 선택"}
                </div>
                {errors.end && <p className="text-[9px] text-red-500 font-medium ml-1 mt-1">{errors.end}</p>}
                {isEndCalendarOpen && (
                  <Calendar
                    value={newProject.end}
                    minDate={newProject.start || new Date().toISOString().split('T')[0]}
                    onChange={(date) => {
                      if (newProject.start && date < newProject.start) { 
                        setErrors(prev => ({ ...prev, end: '종료일은 시작일보다 이전일 수 없습니다.' }));
                        return; 
                      }
                      setErrors(prev => ({ ...prev, end: null }));
                      setNewProject(prev => ({ ...prev, end: date }));
                      setIsEndCalendarOpen(false);
                    }}
                    onClose={() => setIsEndCalendarOpen(false)}
                  />
                )}
              </div>
            </div>

            <label className="block text-xs font-bold text-[#1a1c3d] mb-2">프로젝트 내용</label>
            <textarea rows={3} className="w-full text-xs p-4 bg-[#f4f7fc] rounded-xl mb-4 outline-none" onChange={e => setNewProject({ ...newProject, desc: e.target.value })} />

            <label className="block text-xs font-bold text-[#1a1c3d] mb-2">참여자 추가 *</label>
            <div className="relative mb-2">
              <input value={empSearch} onChange={e => { setEmpSearch(e.target.value); setShowEmpDropdown(true); }} className={`w-full p-4 bg-[#f4f7fc] rounded-xl outline-none text-xs ${errors.members ? 'border border-red-500' : ''}`} placeholder="이름으로 검색하여 참여자를 추가하세요." />
              {showEmpDropdown && empSearch && (
                <div className="absolute top-full left-0 w-full bg-white border border-[#edf2f9] rounded-xl shadow-lg mt-1 z-50 overflow-hidden">
                  {MOCK_EMPLOYEES.filter(e => e.name.includes(empSearch)).map(e => (
                    <div key={e.id} onClick={() => addMember(e)} className="p-3 hover:bg-[#f4f7fc] cursor-pointer text-xs">{e.name}</div>
                  ))}
                </div>
              )}
            </div>
            {errors.members && <p className="text-[9px] text-red-500 font-medium ml-1 mb-2">{errors.members}</p>}
            <div className="flex flex-wrap gap-2 mb-8">
              {newProject.members.map(m => (
                <div key={m.id} className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-[#3a36db]/20">{m.name} <FontAwesomeIcon icon={faTimes} className="cursor-pointer" onClick={() => removeMember(m.id)} /></div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsModalOpen(false); setNewProject({ title: '', desc: '', start: '', end: '', members: [] }); setErrors({}); }} className="px-8 py-3 bg-gray-100 rounded-xl font-bold text-sm">취소</button>
              <button onClick={handleCreate} className="px-8 py-3 bg-[#3a36db] text-white rounded-xl font-bold text-sm">등록</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
    </div>
  );
};

export default ProjectsList;