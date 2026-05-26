import React, { useState } from 'react';

const VacationForm = () => {
  // Mock data for approval line - this would eventually come from a modal/selector
  const [approvers, setApprovers] = useState([
    { rank: '팀장', name: '김철수', status: '결재 완료' },
    { rank: '본부장', name: '이영희', status: '결재 진행중' },
    { rank: '대표이사', name: '박지민', status: '결재 대기' }
  ]);

  const handleApprovalLineChange = () => {
    // This will be implemented when the modal/logic is ready
    console.log('Open approval line selector');
    // For testing: toggle between 2 and 3 approvers
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
    <div className="flex justify-center py-6 bg-gray-50 min-h-screen font-sans">
      <div className="w-[70%] min-w-[800px] bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 flex flex-col">
        
        {/* Header Section - Height reduced */}
        <div className="bg-[#3530B8] px-8 py-5 text-white flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[0.625rem] font-bold opacity-80 tracking-widest mb-0.5">(주)Lunex Soft</span>
            <h1 className="text-2xl font-extrabold tracking-tight">휴가 신청서</h1>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button 
              onClick={handleApprovalLineChange}
              className="text-[0.625rem] font-bold bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-0.5 rounded-full transition-all"
            >
              결재선 변경
            </button>
            
            <div className="flex">
              {/* Draft Box */}
              <div className="w-20 border border-white/30 flex flex-col">
                <div className="bg-white/10 text-[0.625rem] py-0.5 text-center font-bold border-b border-white/30">기안</div>
                <div className="h-12 flex items-center justify-center text-[0.6875rem] font-medium text-white/90">
                  결재 완료
                </div>
              </div>

              {/* Dynamic Approval Boxes */}
              {approvers.map((approver, idx) => (
                <div key={idx} className="w-20 border-y border-r border-white/30 flex flex-col border-l-0">
                  <div className="bg-white/10 text-[0.625rem] py-0.5 text-center font-bold border-b border-white/30">
                    {approver.rank}
                  </div>
                  <div className={`h-12 flex items-center justify-center text-[0.6875rem] font-bold ${
                    approver.status === '결재 완료' ? 'text-green-300' :
                    approver.status === '결재 진행중' ? 'text-amber-300' :
                    approver.status === '반려' ? 'text-red-300' : 'text-white/40'
                  }`}>
                    {approver.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-10 space-y-8 flex-1">
          
          {/* Applicant Info Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-[#3530B8] rounded-full"></div>
              <h2 className="text-sm font-bold text-gray-800">신청자 정보</h2>
            </div>
            <div className="border border-gray-100 rounded-xl h-32 bg-gray-50/30 flex items-center justify-center text-gray-300 italic text-xs">
              신청자 정보 표가 들어갈 자리입니다.
            </div>
          </div>

          {/* Vacation Details Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-[#3530B8] rounded-full"></div>
              <h2 className="text-sm font-bold text-gray-800">휴가 신청 내용</h2>
            </div>
            <div className="border border-gray-100 rounded-xl h-48 bg-gray-50/30 flex items-center justify-center text-gray-300 italic text-xs">
              휴가 신청 내용 표가 들어갈 자리입니다.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 pt-6 border-t border-gray-50">
            <button className="px-6 py-2 border border-gray-200 text-gray-500 font-bold text-sm rounded-xl hover:bg-gray-50 transition-all">
              취소
            </button>
            <button className="px-6 py-2 bg-[#F0F4FF] text-[#3530B8] font-bold text-sm rounded-xl hover:bg-[#DDE8FF] transition-all">
              임시저장
            </button>
            <button className="px-8 py-2 bg-[#3530B8] text-white font-bold text-sm rounded-xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all">
              결재상신
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VacationForm;
