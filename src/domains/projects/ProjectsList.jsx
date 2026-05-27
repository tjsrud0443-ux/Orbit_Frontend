import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

// Mock Data
const INITIAL_PROJECTS = [
  { id: 1, title: 'Orbit 그룹웨어 고도화', period: '2026.05.01 ~ 2026.08.31', status: '진행 중', members: ['A', 'B', 'C', 'D'], desc: '그룹웨어의 전반적인 고도화 작업 및 UI 개선' },
  { id: 2, title: '사내 AI 챗봇 구축', period: '2026.04.10 ~ 2026.06.30', status: '진행 중', members: ['E', 'F'], desc: '사내 업무 자동화를 위한 AI 챗봇 개발' },
  { id: 3, title: '연차 시스템 개선', period: '2026.03.01 ~ 2026.04.30', status: '완료', members: ['A', 'B'], desc: '연차 신청 프로세스 최적화' },
];

const ProjectsList = () => {
  const [filter, setFilter] = useState('전체');
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', start: '', end: '' });

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      (filter === '전체' || p.status === filter) &&
      (p.title.includes(search))
    );
  }, [filter, search, projects]);

  const handleCreate = () => {
    const newEntry = {
      id: Date.now(),
      title: newProject.title,
      period: `${newProject.start} ~ ${newProject.end}`,
      status: '진행 중',
      members: ['U'],
      desc: '신규 프로젝트'
    };
    setProjects([...projects, newEntry]);
    alert('캘린더에 일정이 성공적으로 추가되었습니다.');
    setIsModalOpen(false);
    setNewProject({ title: '', start: '', end: '' });
  };

  return (
    <div className="flex flex-col h-full py-8 px-6 bg-[#FFFFFF]">
      {/* Page Title Area */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-[#121331]">프로젝트 관리</h1>
        <p className="text-xs md:text-sm text-[#8a92a6] mt-1">진행 중인 프로젝트와 참여 인원을 관리합니다.</p>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 gap-6 overflow-hidden items-stretch">
        
        {/* 1. Left Project List Card */}
        <div className={`bg-white rounded-[2.5rem] shadow-sm border border-[#edf2f9] p-8 flex flex-col transition-all duration-300 ${selectedProject ? 'w-[65%]' : 'w-full'}`}>
          {/* Header Control */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex bg-[#f4f7fc] p-1 rounded-2xl w-fit">
              {['전체', '진행중', '완료'].map(tab => (
                <button key={tab} onClick={() => setFilter(tab === '진행중' ? '진행 중' : tab)} 
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === tab || (tab === '진행중' && filter === '진행 중') ? 'bg-[#3530B8] text-white shadow-sm' : 'text-[#8a92a6]'}`}>
                    {tab}
                  </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <div className="relative flex items-center">
                <FontAwesomeIcon icon={faSearch} className="absolute left-4 text-[#8a92a6]" />
                <input 
                  placeholder="검색" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-4 py-2.5 bg-[#f4f7fc] rounded-xl text-sm w-48 outline-none" 
                />
              </div>
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-[#3530B8] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#2a2594] transition-all"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" /> 새 프로젝트
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[#8a92a6] text-sm border-b border-gray-100">
                  <th className="pb-4 font-medium px-2">프로젝트명</th>
                  <th className="pb-4 font-medium">기간</th>
                  <th className="pb-4 font-medium">진행상황</th>
                  <th className="pb-4 font-medium text-center">참여자</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(p => (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedProject(p)} 
                    className="border-b border-gray-50 hover:bg-[#f8fbff] cursor-pointer transition-colors group"
                  >
                    <td className="py-6 font-bold text-sm text-[#1a1c3d] px-2">{p.title}</td>
                    <td className="py-6 text-sm text-gray-500">{p.period}</td>
                    <td className="py-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.status === '완료' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-6">
                      <div className="flex justify-center -space-x-3">
                        {p.members.slice(0, 3).map((m, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#3a36db]">
                            {m}
                          </div>
                        ))}
                        {p.members.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold">
                            +{p.members.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div> {/* 💡 [교정 완료] Left Card 닫는 div가 정상 누락 해결됨 */}

        {/* 2. Right Detail Panel Card */}
        {selectedProject && (
          <div className="w-[35%] bg-white rounded-[2.5rem] shadow-sm border border-[#edf2f9] p-10 transition-all duration-300 animate-in slide-in-from-right-8 fade-in flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-[#1a1c3d]">프로젝트 상세</h2>
              <button onClick={() => setSelectedProject(null)} className="text-[#8a92a6] hover:text-[#1a1c3d]">
                <FontAwesomeIcon icon={faTimes}/>
              </button>
            </div>
            <h3 className="text-lg font-bold text-[#1a1c3d] mb-2">{selectedProject.title}</h3>
            <p className="text-sm text-gray-400 mb-8">{selectedProject.period}</p>
            <div className="bg-[#f4f7fc] p-6 rounded-2xl mb-8">
              <h4 className="text-xs font-bold text-[#8a92a6] uppercase mb-3">상세 내용</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedProject.desc}</p>
            </div>
            <h4 className="text-xs font-bold text-[#8a92a6] uppercase mb-4">참여자</h4>
            <div className="flex flex-wrap gap-2 overflow-y-auto flex-1 content-start custom-scrollbar">
              {selectedProject.members.map((m, i) => (
                <div key={i} className="px-4 py-2 bg-white border border-[#edf2f9] rounded-xl flex items-center gap-2 h-fit">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-[#3a36db]">
                    {m}
                  </div>
                  <span className="text-sm font-medium">{m} 사원</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white p-10 rounded-[2.5rem] w-[500px] shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-8 text-[#121331]">새 프로젝트 생성</h2>
            <input 
              placeholder="프로젝트명" 
              className="w-full p-4 bg-[#f4f7fc] rounded-2xl mb-4 outline-none focus:ring-2 focus:ring-[#3a36db]/20 transition-all" 
              onChange={e => setNewProject({...newProject, title: e.target.value})} 
            />
            <div className="flex gap-4 mb-8">
              <input 
                type="date" 
                className="flex-1 p-4 bg-[#f4f7fc] rounded-2xl outline-none text-gray-600 text-sm" 
                onChange={e => setNewProject({...newProject, start: e.target.value})} 
              />
              <input 
                type="date" 
                className="flex-1 p-4 bg-[#f4f7fc] rounded-2xl outline-none text-gray-600 text-sm" 
                onChange={e => setNewProject({...newProject, end: e.target.value})} 
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-8 py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
              >
                취소
              </button>
              <button 
                onClick={handleCreate} 
                className="px-8 py-3 bg-[#3a36db] text-white rounded-2xl font-bold text-sm hover:bg-[#2a2594] transition-all"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;