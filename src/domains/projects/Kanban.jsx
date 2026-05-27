import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';

const INITIAL_TASKS = [
  { id: 1, title: '디자인 시스템 가이드 작성', assignee: '김철수', date: '2026.05.28', status: 'TODO', priority: '높음', desc: '그룹웨어 디자인 시스템 문서화' },
  { id: 2, title: '로그인 페이지 UI 고도화', assignee: '이영희', date: '2026.05.29', status: 'DOING', priority: '보통', desc: 'JWT 로그인 처리 및 스타일링' },
  { id: 3, title: 'API 문서 정비', assignee: '박지성', date: '2026.05.30', status: 'DONE', priority: '낮음', desc: 'Swagger 문서 최신화' },
];

const Kanban = () => {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [inlineAdd, setInlineAdd] = useState({ status: null, title: '' });

  const onDragStart = (e, task) => e.dataTransfer.setData('taskId', task.id);

  const onDrop = (e, status) => {
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const handleAddTask = (status, title) => {
    if (!title) return;
    const newTask = { id: Date.now(), title, assignee: '미지정', date: new Date().toISOString().split('T')[0], status, priority: '보통', desc: '' };
    setTasks([...tasks, newTask]);
    setInlineAdd({ status: null, title: '' });
  };

  return (
    <div className="flex flex-col h-full py-8 px-6 bg-[#f4f7fc]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-extrabold text-[#121331]">Orbit 그룹웨어 고도화</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#3530B8] text-white px-6 py-3 rounded-[2.5rem] font-bold text-sm hover:bg-[#2a2594]">
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> Task 생성
        </button>
      </div>

      <div className="flex gap-6 h-full">
        {['TODO', 'DOING', 'DONE'].map(status => (
          <div key={status} className="flex-1 bg-white rounded-[2.5rem] p-6 border border-[#edf2f9] flex flex-col min-h-[500px]" 
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, status)}>
            <h2 className="text-lg font-bold text-[#121331] mb-6">{status} <span className="text-gray-400 font-normal">({tasks.filter(t => t.status === status).length})</span></h2>
            <div className="flex-1 space-y-4">
              {tasks.filter(t => t.status === status).map(task => (
                <div key={task.id} draggable onDragStart={(e) => onDragStart(e, task)} onClick={() => setSelectedTask(task)} className="bg-[#f8f9fc] rounded-2xl border p-4 cursor-pointer hover:shadow-md">
                  <h3 className="font-bold text-sm text-[#1a1c3d]">{task.title}</h3>
                  <p className="text-xs text-gray-500 mt-2">{task.assignee} | {task.date}</p>
                </div>
              ))}
              {inlineAdd.status === status && (
                <div className="p-4 bg-white border border-[#3530B8] rounded-2xl">
                  <input autoFocus className="w-full mb-2 outline-none text-sm" placeholder="제목" onChange={(e) => setInlineAdd({...inlineAdd, title: e.target.value})} />
                  <div className="flex gap-2">
                    <button onClick={() => handleAddTask(status, inlineAdd.title)} className="bg-[#3530B8] text-white px-3 py-1 rounded text-xs">등록</button>
                    <button onClick={() => setInlineAdd({ status: null, title: '' })} className="bg-gray-100 px-3 py-1 rounded text-xs">취소</button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setInlineAdd({ status, title: '' })} className="mt-4 text-[#3530B8] text-xs font-bold hover:underline">+ Task 추가</button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-[2rem] w-[400px]">
             <h2 className="font-bold mb-4">Task 생성</h2>
             <input className="w-full p-3 bg-gray-50 rounded-lg mb-4" placeholder="제목을 입력하세요" />
             <div className="flex justify-end gap-2">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500">취소</button>
                <button onClick={() => setIsModalOpen(false)} className="bg-[#3530B8] text-white px-4 py-2 rounded-lg">추가</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kanban;