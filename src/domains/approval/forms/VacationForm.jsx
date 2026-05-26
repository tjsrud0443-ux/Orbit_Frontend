import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useUserStore from '../../../store/userStore';

const VacationForm = () => {
  const location = useLocation();
  const isWriteMode = location.pathname.includes('/write/');
  const { user } = useUserStore();

  // Form states
  const [vacationType, setVacationType] = useState('연차');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState(0);
  const [reason, setReason] = useState('');
  const [today] = useState(new Date().toISOString().split('T')[0]);

  // Calculate total days
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(diffDays > 0 ? diffDays : 0);
    } else {
      setTotalDays(0);
    }
  }, [startDate, endDate]);

  // Mock data for approval line
  const [approvers, setApprovers] = useState([
    { rank: '팀장', name: '김철수', status: '결재 완료' },
    { rank: '본부장', name: '이영희', status: '결재 진행중' },
    { rank: '대표이사', name: '박지민', status: '결재 대기' }
  ]);

  const handleApprovalLineChange = () => {
    if (approvers.length === 3) {
      setApprovers([
        { rank: '팀장', name: '김철수', status: '결재 완료' }, 
        { rank: '대표이사', name: '박지민', status: '결재 대기' }
      ]);
    } else {
      setApprovers([
        { rank: '팀장', name: '김철수', status: '결재 완료' }, 
        { rank: '본부장', name: '이영희', status: '결재 진행중' }, 
        { rank: '대표이사', name: '박지민', status: '결재 대기' }
      ]);
    }
  };

  return (
    <div className="flex justify-center py-13 bg-gray-50 min-h-screen font-sans">
      {/* Form Container - Height reduced by removing flex-1 and overflow-y-auto on content, and adjusting paddings */}
      <div className="w-[70%] min-w-[800px] bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 flex flex-col h-full max-h-[70vh]">
        
        {/* Header Section */}
        <div className="bg-[#3530B8] px-8 py-5 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-[0.625rem] font-bold opacity-80 tracking-widest mb-0.5">(주)Lunex Soft</span>
            <h1 className="text-2xl font-extrabold tracking-tight">휴가 신청서</h1>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <button 
              onClick={handleApprovalLineChange}
              className="text-[0.625rem] font-bold bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-0.5 rounded-full transition-all"
            >
              결재선 변경
            </button>
            
            <div className="flex">
              {/* 기안자 칸 */}
              <div className="w-16 border border-white/30 flex flex-col">
                <div className="bg-white/10 text-[0.625rem] py-0.5 text-center font-bold border-b border-white/30 text-white/90">
                  기안
                </div>
                <div className="h-10 flex items-center justify-center text-[0.625rem] font-medium text-white/90">
                  기안
                </div>
              </div>

              {/* 결재자 라인 (팀장, 본부장, 대표이사 등) */}
              {approvers.map((approver, idx) => (
                <div key={idx} className="w-16 border-y border-r border-white/30 flex flex-col border-l-0">
                  <div className="bg-white/10 text-[0.625rem] py-0.5 text-center font-bold border-b border-white/30 text-white/90">
                    {approver.rank}
                  </div>
                  
                  <div className={`h-10 flex items-center justify-center text-[0.625rem] font-bold ${
                    !isWriteMode ? 'text-white/90' : 'text-transparent'
                  }`}>
                    {!isWriteMode ? approver.status : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section - Adjusted padding to prevent cutting off bottom */}
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
                    <select 
                      value={vacationType}
                      onChange={(e) => setVacationType(e.target.value)}
                      className="w-full p-1 bg-white border border-gray-300 rounded outline-none focus:border-[#3530B8]"
                    >
                      <option value="연차">연차</option>
                      <option value="오전반차">오전반차</option>
                      <option value="오후반차">오후반차</option>
                    </select>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청 기간</th>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="p-1 border border-gray-300 rounded outline-none focus:border-[#3530B8]" 
                      />
                      <span>~</span>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="p-1 border border-gray-300 rounded outline-none focus:border-[#3530B8]" 
                      />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청 일수</th>
                  <td className="p-2 font-bold text-[#3530B8]">{totalDays}일</td>
                </tr>
                <tr>
                  <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청 사유</th>
                  <td className="p-2">
                    <textarea 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="사유를 입력하세요"
                      className="w-full h-25 p-2 bg-white border border-gray-300 rounded outline-none focus:border-[#3530B8] resize-none"
                    ></textarea>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Buttons - Fixed at bottom of scrolling area or as part of flow */}
          <div className="flex justify-center gap-3 pt-5 pb-2 border-t border-gray-50 flex-shrink-0">
            <button className="px-5 py-1.5 border border-gray-200 text-gray-500 font-bold text-xs rounded-lg hover:bg-gray-50 transition-all">
              취소
            </button>
            <button className="px-5 py-1.5 bg-[#F0F4FF] text-[#3530B8] font-bold text-xs rounded-lg hover:bg-[#DDE8FF] transition-all">
              임시저장
            </button>
            <button className="px-7 py-1.5 bg-[#3530B8] text-white font-bold text-xs rounded-lg hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all">
              결재상신
            </button>
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
