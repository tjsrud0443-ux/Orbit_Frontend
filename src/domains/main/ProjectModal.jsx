// ProjectModal.jsx
import React, { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import Calendar from '../../components/common/Calendar';
import { getAllEmp, getMyAllProject, insertProjectAndMembers } from '../projects/projectsApi';
import useUserStore from '../../store/userStore';

const ProjectModal = ({ onClose, onSuccess }) => {
  const user = useUserStore(state => state.user);

  const [newProject, setNewProject] = useState({ project_name: '', contents: '', start_date: '', end_date: '', members: [] });
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const startCalendarRef = useRef(null);
  const endCalendarRef = useRef(null);
  const empDropdownRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    getAllEmp().then(resp => {
      setEmployees(resp.data);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (startCalendarRef.current && !startCalendarRef.current.contains(event.target)) {
        setIsStartCalendarOpen(false);
      }
      if (endCalendarRef.current && !endCalendarRef.current.contains(event.target)) {
        setIsEndCalendarOpen(false);
      }
      if (empDropdownRef.current && !empDropdownRef.current.contains(event.target)) {
        setShowEmpDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter(e => {
    const matchsSearch = e.name.includes(empSearch);
    const isAlreadyAdded = newProject.members.some(m => m.id === e.id);
    const targetLank = e.rank_name !== "대표";
    const targetMy = e.id !== user.id;
    return matchsSearch && !isAlreadyAdded && targetLank && targetMy;
  });

  const isDropdownActive = showEmpDropdown && empSearch;
  const getDynamicMargin = () => {
    if (!isDropdownActive) return 8;
    if (filteredEmployees.length === 0) {
      return 64;
    }
    const calculatedHeight = (filteredEmployees.length * 53) + 16;
    return Math.min(calculatedHeight, 144);
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

  const handleCreate = () => {
    const newErrors = {};
    if (!newProject.project_name) newErrors.project_name = '프로젝트명을 입력해주세요.';
    if (!newProject.start_date) newErrors.start_date = '시작일을 선택해주세요.';
    if (!newProject.end_date) newErrors.end_date = '종료일을 선택해주세요.';
    if (newProject.start_date && newProject.end_date && newProject.end_date < newProject.start_date) {
      newErrors.end_date = '종료일은 시작일보다 이전일 수 없습니다.';
    }
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
      alert('개인 캘린더에 일정이 성공적으로 추가되었습니다.');
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 md:p-8">
      <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] w-full max-w-[550px] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">새 프로젝트 생성</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <label className="block text-xs font-bold text-[#1a1c3d] mb-2 ">프로젝트명 *</label>
        <input
          className={`w-full p-4 bg-[#f4f7fc] rounded-xl outline-none text-xs ${errors.project_name ? 'border border-red-500' : ''}`}
          value={newProject.project_name}
          onChange={e => {
            setNewProject({ ...newProject, project_name: e.target.value });
            if (errors.project_name) setErrors(prev => ({ ...prev, project_name: null }));
          }}
        />
        {errors.project_name && <p className="text-[9px] text-red-500 font-medium ml-1 mt-1 mb-3">{errors.project_name}</p>}
        {!errors.project_name && <div className="mb-4"></div>}

        <label className="block text-xs font-bold text-[#1a1c3d] mb-2">프로젝트 내용</label>
        <textarea rows={3} value={newProject.contents} className="w-full text-xs p-4 bg-[#f4f7fc] rounded-xl mb-4 outline-none" onChange={e => setNewProject({ ...newProject, contents: e.target.value })} />

        <div className={`flex gap-4 mb-4 ${isStartCalendarOpen || isEndCalendarOpen ? 'relative z-50' : ''}`}>
          <div className="flex-1 relative" ref={startCalendarRef}>
            <label className="block text-xs font-bold text-[#1a1c3d] mb-2">시작일 *</label>
            <div onClick={() => { setIsStartCalendarOpen(!isStartCalendarOpen); setIsEndCalendarOpen(false); }} className={`w-full p-4 bg-[#f4f7fc] rounded-xl cursor-pointer text-xs ${newProject.start_date ? 'text-black' : 'text-[#9CA3AF]'} ${errors.start_date ? 'border border-red-500' : ''}`}>
              {newProject.start_date || "날짜 선택"}
            </div>
            {errors.start_date && <p className="text-[9px] text-red-500 font-medium ml-1 mt-1">{errors.start_date}</p>}
            {isStartCalendarOpen && (
              <Calendar
                value={newProject.start_date}
                minDate={new Date().toISOString().split('T')[0]}
                onChange={(date) => {
                  if (date < new Date().toISOString().split('T')[0]) {
                    setErrors(prev => ({ ...prev, start_date: '시작일은 오늘 이후의 날짜만 선택할 수 있습니다.' }));
                    return;
                  }
                  setErrors(prev => ({ ...prev, start_date: null }));
                  setNewProject(prev => ({ ...prev, start_date: date, end_date: prev.end_date && prev.end_date < date ? date : prev.end_date }));
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
                    setErrors(prev => ({ ...prev, end_date: '종료일은 시작일보다 이전일 수 없습니다.' }));
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
        <div className="relative transition-all duration-200" style={{ marginBottom: `${getDynamicMargin()}px` }} ref={empDropdownRef}>
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
            <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-32 overflow-y-auto custom-scrollbar">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(e => (
                  <div
                    key={e.id}
                    onClick={() => addMember(e)}
                    className="flex justify-between items-center px-5 py-3 hover:bg-[#F0F4FF] cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-[#1a1c3d] group-hover:text-[#3530B8] transition-colors">{e.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{e.dept_name || '소속 없음'}</span>
                    </div>
                    {e.rank_name && (
                      <span className="px-2 py-0.5 text-[10px] font-bold text-[#3530B8] bg-[#F0F4FF] rounded-md border border-[#3530B8]/10 transition-all">{e.rank_name}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-xs text-center text-gray-400 font-medium bg-gray-50/50">검색 결과가 없습니다.</div>
              )}
            </div>
          )}
        </div>
        {errors.members && <p className="text-[9px] text-red-500 font-medium ml-1 mb-2">{errors.members}</p>}
        
        <div className="flex flex-wrap gap-2 mb-8">
          {newProject.members?.map(m => (
            <div key={m.id} className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-[#3a36db]/20">
              {m.name} ({m.dept_name}) 
              <FontAwesomeIcon icon={faTimes} className="cursor-pointer" onClick={() => removeMember(m.id)} />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-8 py-3 bg-gray-100 rounded-xl font-bold text-sm">취소</button>
          <button onClick={handleCreate} className="px-8 py-3 bg-[#3a36db] text-white rounded-xl font-bold text-sm">등록</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;