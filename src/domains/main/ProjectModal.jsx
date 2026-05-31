// ProjectModal.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import Calendar from '../../components/common/Calendar';

const MOCK_EMPLOYEES = [
  { id: 1, name: '김철수', dept: '개발팀' },
  { id: 2, name: '이영희', dept: '인사팀' },
  { id: 3, name: '박지성', dept: '디자인팀' },
  { id: 4, name: '최민수', dept: '영업팀' },
];

const ProjectModal = ({ onClose }) => {
  const [newProject, setNewProject] = useState({ title: '', desc: '', start: '', end: '', members: [] });
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  const handleCreate = () => {
    if (!newProject.title || newProject.members.length === 0) return alert('필수 항목을 모두 입력해주세요.');
    alert('개인 캘린더에 일정이 성공적으로 추가되었습니다.');
    onClose();
  };

  const addMember = (emp) => {
    if (!newProject.members.find(m => m.id === emp.id)) {
      setNewProject({ ...newProject, members: [...newProject.members, emp] });
    }
    setEmpSearch('');
    setShowEmpDropdown(false);
  };

  const removeMember = (id) => {
    setNewProject({ ...newProject, members: newProject.members.filter(m => m.id !== id) });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-10 rounded-[2.5rem] w-[550px] shadow-2xl">
        <h2 className="text-2xl font-bold mb-8">새 프로젝트 생성</h2>

        <label className="block text-xs font-bold text-[#1a1c3d] mb-2">프로젝트명 *</label>
        <input className="w-full p-4 bg-[#f4f7fc] rounded-xl mb-4 outline-none text-xs"
          onChange={e => setNewProject({ ...newProject, title: e.target.value })} />

        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <label className="block text-xs font-bold text-[#1a1c3d] mb-2">시작일 *</label>
            <div onClick={() => { setIsStartCalendarOpen(!isStartCalendarOpen); setIsEndCalendarOpen(false); }}
              className={`w-full p-4 bg-[#f4f7fc] rounded-xl cursor-pointer text-xs ${newProject.start ? 'text-black' : 'text-[#9CA3AF]'}`}>
              {newProject.start || "날짜 선택"}
            </div>
            {isStartCalendarOpen && (
              <Calendar
                value={newProject.start}
                minDate={new Date().toISOString().split('T')[0]}
                onChange={(date) => {
                  if (date < new Date().toISOString().split('T')[0]) { alert('시작일은 오늘 이후의 날짜만 선택할 수 있습니다.'); return; }
                  setNewProject(prev => ({ ...prev, start: date, end: prev.end && prev.end < date ? date : prev.end }));
                  setIsStartCalendarOpen(false);
                }}
                onClose={() => setIsStartCalendarOpen(false)}
              />
            )}
          </div>

          <div className="flex-1 relative">
            <label className="block text-xs font-bold text-[#1a1c3d] mb-2">종료일 *</label>
            <div onClick={() => { setIsEndCalendarOpen(!isEndCalendarOpen); setIsStartCalendarOpen(false); }}
              className={`w-full p-4 bg-[#f4f7fc] rounded-xl cursor-pointer text-xs ${newProject.end ? 'text-black' : 'text-[#9CA3AF]'}`}>
              {newProject.end || "날짜 선택"}
            </div>
            {isEndCalendarOpen && (
              <Calendar
                value={newProject.end}
                minDate={newProject.start || new Date().toISOString().split('T')[0]}
                onChange={(date) => {
                  if (newProject.start && date < newProject.start) { alert('종료일은 시작일보다 이전일 수 없습니다.'); return; }
                  setNewProject(prev => ({ ...prev, end: date }));
                  setIsEndCalendarOpen(false);
                }}
                onClose={() => setIsEndCalendarOpen(false)}
              />
            )}
          </div>
        </div>

        <label className="block text-xs font-bold text-[#1a1c3d] mb-2">프로젝트 내용</label>
        <textarea rows={3} className="w-full text-xs p-4 bg-[#f4f7fc] rounded-xl mb-4 outline-none"
          onChange={e => setNewProject({ ...newProject, desc: e.target.value })} />

        <label className="block text-xs font-bold text-[#1a1c3d] mb-2">참여자 추가 *</label>
        <div className="relative mb-2">
          <input value={empSearch}
            onChange={e => { setEmpSearch(e.target.value); setShowEmpDropdown(true); }}
            className="w-full p-4 bg-[#f4f7fc] rounded-xl outline-none text-xs"
            placeholder="이름으로 검색하여 참여자를 추가하세요." />
          {showEmpDropdown && empSearch && (
            <div className="absolute top-full left-0 w-full bg-white border border-[#edf2f9] rounded-xl shadow-lg mt-1 z-50 overflow-hidden">
              {MOCK_EMPLOYEES.filter(e => e.name.includes(empSearch)).map(e => (
                <div key={e.id} onClick={() => addMember(e)}
                  className="p-3 hover:bg-[#f4f7fc] cursor-pointer text-xs">{e.name}</div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {newProject.members.map(m => (
            <div key={m.id} className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-[#3a36db]/20">
              {m.name}
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