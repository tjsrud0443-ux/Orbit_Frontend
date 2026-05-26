import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useUserStore from '../../../store/userStore';
import Calendar from '../../../components/common/Calendar';

const EmployeeSelectionModal = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;
  const employees = [
    { name: '김철수', rank: '팀장' },
    { name: '이영희', rank: '본부장' },
    { name: '박지민', rank: '대표이사' },
    { name: '최고수', rank: '대리' }
  ];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[400px] shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-[#3530B8] px-6 py-4 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white">결재자 선택</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>
        <div className="p-4">
          <input type="text" placeholder="이름으로 검색..." className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#3530B8]" />
          <div className="h-64 overflow-y-auto mt-3 custom-scrollbar">
            {employees.map((emp, idx) => (
              <div key={idx} className="p-3 border-b border-gray-50 hover:bg-[#F0F4FF] cursor-pointer flex justify-between items-center text-xs" onClick={() => onSelect(emp)}>
                <span className="font-bold text-gray-700">{emp.name}</span>
                <span className="text-[#3530B8] font-medium">{emp.rank}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const VacationForm = () => {
  const navi = useNavigate();
  const location = useLocation();
  const isWriteMode = location.pathname.includes('/write/');
  const { user } = useUserStore();

  const [vacationType, setVacationType] = useState('연차');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState(0);
  const [reason, setReason] = useState('');
  const [today] = useState(new Date().toISOString().split('T')[0]);

  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [approvers, setApprovers] = useState(isWriteMode ? [
    { rank: '부서장', name: '김철수', status: '결재 대기' }
  ] : [
    { rank: '팀장', name: '김철수', status: '결재 완료' },
    { rank: '본부장', name: '이영희', status: '결재 진행중' },
    { rank: '대표이사', name: '박지민', status: '결재 대기' }
  ]);

  const removeApprover = (idx) => {
    setApprovers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSelectApprover = (selectedUser) => {
    setApprovers(prev => [...prev, { ...selectedUser, status: '결재 대기' }]);
    setIsModalOpen(false);
  };

  const openApprovalModal = () => {
    setApprovers([]);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (vacationType === '연차') {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setTotalDays(diffDays > 0 ? diffDays : 0);
      } else {
        setTotalDays(0);
      }
    } else {
      setTotalDays(0.5);
    }
  }, [startDate, endDate, vacationType]);

  const handleTemp = () => {
    navi("/approvalTemp");
  }

  return (
    <div className="flex justify-center py-14 bg-gray-50 min-h-screen font-sans">
      <EmployeeSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handleSelectApprover} />
      <div className="w-[70%] min-w-[800px] bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 flex flex-col h-fit max-h-[95vh] mb-4">
        
        {/* Header Section */}
        <div className="bg-[#3530B8] px-8 py-4 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-[0.625rem] font-bold opacity-80 tracking-widest mb-0.5">(주)Lunex Soft</span>
            <h1 className="text-xl font-extrabold tracking-tight">휴가 신청서</h1>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {isWriteMode && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-[0.625rem] font-bold bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-0.5 rounded-full transition-all"
              >
                결재선 변경
              </button>
            )}
            
            <div className="flex">
              <div className="w-16 border border-white/30 flex flex-col">
                <div className="bg-white/10 text-[0.625rem] py-0.5 text-center font-bold border-b border-white/30">기안</div>
                <div className="h-11 flex items-center justify-center text-[0.625rem] font-medium text-white/90">
                  {user?.name || '본인'}
                </div>
              </div>

              {approvers.map((approver, idx) => (
                <div key={idx} className="w-16 border-y border-r border-white/30 flex flex-col border-l-0 relative">
                  <div className="bg-white/10 text-[0.625rem] py-0.5 text-center font-bold border-b border-white/30 text-white/90">
                    {approver.rank}
                    {isWriteMode && (
                      <button 
                        onClick={() => removeApprover(idx)}
                        className="absolute top-0.5 right-0 text-white rounded-full w-3 h-3 text-[8px] flex items-center justify-center leading-none"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="h-11 flex items-center justify-center text-[0.625rem] font-bold text-white/90">
                    {isWriteMode ? approver.name : approver.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Content Section */}
        <div className="px-10 py-5 space-y-5 overflow-y-auto custom-scrollbar">
          
          {/* Applicant Info Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
              <h2 className="text-xs font-bold text-gray-800">신청자 정보</h2>
            </div>
            <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
              <tbody>
                <tr className="border-b border-gray-200">
                  <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">성명</th>
                  <td className="p-2 border-r border-gray-200">{user?.name || '관리자'}</td>
                  <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">사번</th>
                  <td className="p-2">{user?.emp_seq || '20260001'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">부서</th>
                  <td className="p-2 border-r border-gray-200">{user?.dept_name || '개발본부'}</td>
                  <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">직급</th>
                  <td className="p-2">{user?.rank_name || '팀장'}</td>
                </tr>
                <tr>
                  <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청일</th>
                  <td colSpan="3" className="p-2">{today}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Vacation Details Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
              <h2 className="text-xs font-bold text-gray-800">휴가 신청 내용</h2>
            </div>
            <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
              <tbody>
                <tr className="border-b border-gray-200">
                  <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">연차 종류</th>
                  <td className="p-2">
                    {isWriteMode ? (
                      <select 
                        value={vacationType}
                        onChange={(e) => setVacationType(e.target.value)}
                        className="w-full p-1 bg-white border border-gray-300 rounded outline-none focus:border-[#3530B8]"
                      >
                        <option value="연차">연차</option>
                        <option value="오전반차">오전반차</option>
                        <option value="오후반차">오후반차</option>
                      </select>
                    ) : (
                      <span>{vacationType}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청 기간</th>
                  <td className="p-2">
                    {isWriteMode ? (
                      <div className="flex items-center gap-2">
                        <div className="relative w-50">
                          <input 
                            type="text" 
                            readOnly 
                            value={startDate} 
                            onClick={() => { setIsStartCalendarOpen(!isStartCalendarOpen); setIsEndCalendarOpen(false); }} 
                            placeholder="시작일" 
                            className={`w-full p-2 border ${isStartCalendarOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-300'} rounded-xl outline-none cursor-pointer text-xs transition-all`}
                          />
                          <svg className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {isStartCalendarOpen && (
                            <Calendar 
                              value={startDate} 
                              onChange={(d) => { setStartDate(d); setIsStartCalendarOpen(false); }} 
                              onClose={() => setIsStartCalendarOpen(false)}
                            />
                          )}
                        </div>
                        {vacationType === '연차' && (
                          <>
                            <span className="px-1">~</span>
                            <div className="relative w-50">
                              <input 
                                type="text" 
                                readOnly 
                                value={endDate} 
                                onClick={() => { setIsEndCalendarOpen(!isEndCalendarOpen); setIsStartCalendarOpen(false); }} 
                                placeholder="종료일" 
                                className={`w-full p-2 border ${isEndCalendarOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-300'} rounded-xl outline-none cursor-pointer text-xs transition-all`}
                              />
                              <svg className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {isEndCalendarOpen && (
                                <Calendar 
                                  value={endDate} 
                                  onChange={(d) => { setEndDate(d); setIsEndCalendarOpen(false); }} 
                                  onClose={() => setIsEndCalendarOpen(false)}
                                />
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <span>{startDate} {vacationType === '연차' ? `~ ${endDate}` : ''}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청 일수</th>
                  <td className="p-2 font-bold text-[#3530B8]">{totalDays}일</td>
                </tr>
                <tr>
                  <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청 사유</th>
                  <td className="p-2">
                    {isWriteMode ? (
                      <textarea 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="사유를 입력하세요"
                        className="w-full h-25 p-2 bg-white border border-gray-300 rounded outline-none focus:border-[#3530B8] resize-none"
                      ></textarea>
                    ) : (
                      <div className="min-h-[4rem] whitespace-pre-wrap">{reason}</div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 pt-5 pb-2 border-t border-gray-50 flex-shrink-0">
            <button 
              className="px-5 py-1.5 border border-gray-200 text-gray-500 font-bold text-xs rounded-lg hover:bg-gray-50 transition-all"
              onClick={() => navi(-1)}
            >
              닫기
            </button>
            {isWriteMode && (
              <>
                <button 
                  className="px-5 py-1.5 bg-[#F0F4FF] text-[#3530B8] font-bold text-xs rounded-lg hover:bg-[#DDE8FF] transition-all"
                  onClick={handleTemp}
                >
                  임시저장
                </button>
                <button className="px-7 py-1.5 bg-[#3530B8] text-white font-bold text-xs rounded-lg hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all">
                  결재상신
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
    </div>
  );
};

export default VacationForm;
