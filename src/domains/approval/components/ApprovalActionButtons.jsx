import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ApprovalActionButtons = ({ userRole, mode, onAction, approvers }) => {
  const navigate = useNavigate();
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // 상신 취소 가능 여부 확인: 기안자이면서 VIEW 모드이고, 첫 번째 결재자가 '진행 중' 상태인 경우
  const canCancelSubmit = userRole === 'DRAFTER' && mode === 'VIEW' && approvers?.[0]?.status === 'IN_PROGRESS';

  // DRAFTER(기안자): 닫기, 임시저장, 결재상신
  const renderDrafterButtons = () => (
    <>
      <button 
        className="px-5 py-1.5 bg-[#F0F4FF] text-[#3530B8] font-bold text-xs rounded-lg hover:bg-[#DDE8FF] transition-all"
        onClick={() => onAction('TEMP_SAVE')}
      >
        임시저장
      </button>
      <button 
        className="px-7 py-1.5 bg-[#3530B8] text-white font-bold text-xs rounded-lg hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all"
        onClick={() => onAction('SUBMIT')}
      >
        결재상신
      </button>
    </>
  );

  // APPROVER(결재자): 닫기, 반려, 결재승인
  const renderApproverButtons = () => (
    <div className="flex flex-col items-center w-full gap-4">
      {isRejecting && (
        <div className="w-full animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs font-bold text-gray-800">반려 사유</span>
          </div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="반려 사유를 입력해주세요."
            className="w-full p-3 text-xs border border-red-100 rounded-xl bg-red-50/30 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-200 transition-all resize-none h-24"
          />
        </div>
      )}
      <div className="flex justify-center gap-3 w-full">
        <button 
          className="px-5 py-1.5 bg-red-50 text-red-600 border border-red-100 font-bold text-xs rounded-lg hover:bg-red-100 transition-all"
          onClick={() => {
            if (!isRejecting) {
              setIsRejecting(true);
            } else {
              if (!rejectReason.trim()) {
                alert('반려 사유를 입력해주세요.');
                return;
              }
              onAction('REJECT', rejectReason);
            }
          }}
        >
          {isRejecting ? '반려 처리' : '반려'}
        </button>
        <button 
          className="px-7 py-1.5 bg-[#3530B8] text-white font-bold text-xs rounded-lg hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all"
          onClick={() => onAction('APPROVE')}
        >
          결재승인
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full gap-3 pt-5 pb-2 border-t border-gray-50 flex-shrink-0">
      <div className="flex justify-center gap-3 w-full">
        <button 
          className="px-5 py-1.5 border border-gray-200 text-gray-500 font-bold text-xs rounded-lg hover:bg-gray-50 transition-all"
          onClick={() => navigate(-1)}
        >
          닫기
        </button>

        {canCancelSubmit && (
          <button 
            className="px-5 py-1.5 bg-white border border-red-200 text-red-500 font-bold text-xs rounded-lg hover:bg-red-50 transition-all"
            onClick={() => onAction('SUBMIT_CANCEL')}
          >
            상신 취소
          </button>
        )}

        {userRole === 'DRAFTER' && mode === 'EDIT' && renderDrafterButtons()}
        {userRole === 'APPROVER' && mode === 'VIEW' && renderApproverButtons()}
      </div>
    </div>
  );
};

export default ApprovalActionButtons;
