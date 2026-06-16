import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ApprovalActionButtons = ({ 
  user,
  userRole, 
  mode, 
  onAction, 
  approvers,
  isRejecting,
  setIsRejecting,
  rejectReason,
  setRejectReason,
  rejectError,
  setRejectError
}) => {
  const navigate = useNavigate();

  // 상태 판단 로직
  const firstApproverStatus = approvers?.[0]?.status;
  const myApproverInfo = approvers?.find(a => a.users_id === user?.id);
  const myStatus = myApproverInfo?.status;

  // 단순 기안자 (첫 번째 결재자가 결재를 완료한 상태)
  const isSimpleDrafter = userRole === 'DRAFTER' && mode === 'VIEW' && (firstApproverStatus === 'APPROVED' || firstApproverStatus === 'REJECTED');
  
  // 수정 가능한 기안자 (첫 번째 결재자가 결재하기 전 상태)
  const isEditableDrafter = userRole === 'DRAFTER' && mode === 'VIEW' && firstApproverStatus === 'IN_PROGRESS';

  // 참조자 (기안자나 결재자가 아닌 경우)
  const isActualReferrer = userRole === 'REFERRER' && mode === 'VIEW';

  // 결재자 (현재 결재 순서인 경우)
  const isCurrentApprover = userRole === 'APPROVER' && mode === 'VIEW' && myStatus === 'IN_PROGRESS';

  // 결재자 (결재를 이미 완료한 경우)
  const isPastApprover = userRole === 'APPROVER' && mode === 'VIEW' && (myStatus === 'APPROVED' || myStatus === 'REJECTED');

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      setRejectError(true);
      return;
    }
    onAction('REJECT', rejectReason);
  };

  const handleRejectCancel = () => {
    setIsRejecting(false);
    setRejectReason('');
    setRejectError(false);
  };

  const CloseButton = () => (
    <button 
      className="px-6 py-2 border border-gray-200 text-gray-500 font-bold text-xs rounded-xl hover:bg-gray-50 transition-all active:scale-95"
      onClick={() => navigate(-1)}
    >
      닫기
    </button>
  );

  return (
    <div className="flex flex-col items-center w-full gap-3 pt-8 pb-2 border-t border-gray-100 flex-shrink-0">
      {/* [Desktop] */}
      <div className="hidden md:flex justify-center gap-3 w-full">
        {mode === 'EDIT' && userRole === 'DRAFTER' && (
          <>
            <CloseButton />
            <button 
              className="px-6 py-2 bg-[#F0F4FF] text-[#3530B8] font-bold text-xs rounded-xl hover:bg-[#DDE8FF] transition-all active:scale-95"
              onClick={() => onAction('TEMP_SAVE')}
            >
              임시저장
            </button>
            <button 
              className="px-8 py-2 bg-[#3530B8] text-white font-bold text-xs rounded-xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all active:scale-95"
              onClick={() => onAction('SUBMIT')}
            >
              결재상신
            </button>
          </>
        )}

        {mode === 'VIEW' && (
          <>
            {isRejecting ? (
              <div className="flex gap-3 animate-in fade-in zoom-in-95 duration-200">
                <button 
                  className="px-8 py-2 bg-red-500 text-white font-bold text-xs rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                  onClick={handleRejectConfirm}
                >
                  반려 확정
                </button>
                <button 
                  className="px-6 py-2 bg-gray-100 text-gray-500 font-bold text-xs rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                  onClick={handleRejectCancel}
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <CloseButton />
                {isEditableDrafter && (
                  <button 
                    className="px-6 py-2 bg-white border border-red-200 text-red-500 font-bold text-xs rounded-xl hover:bg-red-50 transition-all active:scale-95"
                    onClick={() => onAction('SUBMIT_CANCEL')}
                  >
                    상신취소
                  </button>
                )}
                {isCurrentApprover && (
                  <>
                    <button 
                      className="px-6 py-2 bg-red-50 text-red-600 border border-red-100 font-bold text-xs rounded-xl hover:bg-red-100 transition-all active:scale-95"
                      onClick={() => setIsRejecting(true)}
                    >
                      반려
                    </button>
                    <button 
                      className="px-8 py-2 bg-[#3530B8] text-white font-bold text-xs rounded-xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all active:scale-95"
                      onClick={() => onAction('APPROVE')}
                    >
                      승인
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* [Mobile View] */}
      <div className="md:hidden flex justify-center gap-2 w-full px-2">
        {mode === 'EDIT' && userRole === 'DRAFTER' && (
          <>
            <button 
              className="flex-1 py-2.5 border border-gray-200 text-gray-500 font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap"
              onClick={() => navigate(-1)}
            >
              닫기
            </button>
            <button 
              className="flex-1 py-2.5 bg-[#F0F4FF] text-[#3530B8] font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap"
              onClick={() => onAction('TEMP_SAVE')}
            >
              임시저장
            </button>
            <button 
              className="flex-1 py-2.5 bg-[#3530B8] text-white font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap shadow-md"
              onClick={() => onAction('SUBMIT')}
            >
              결재상신
            </button>
          </>
        )}

        {mode === 'VIEW' && (
          <>
            {isRejecting ? (
              <div className="flex gap-2 w-full">
                <button 
                  className="flex-1 py-2.5 bg-red-500 text-white font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap shadow-md"
                  onClick={handleRejectConfirm}
                >
                  반려 확정
                </button>
                <button 
                  className="flex-1 py-2.5 bg-gray-100 text-gray-500 font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap"
                  onClick={handleRejectCancel}
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <button 
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap"
                  onClick={() => navigate(-1)}
                >
                  닫기
                </button>
                {isEditableDrafter && (
                  <button 
                    className="flex-1 py-2.5 bg-white border border-red-200 text-red-500 font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap"
                    onClick={() => onAction('SUBMIT_CANCEL')}
                  >
                    상신취소
                  </button>
                )}
                {isCurrentApprover && (
                  <>
                    <button 
                      className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-100 font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap"
                      onClick={() => setIsRejecting(true)}
                    >
                      반려
                    </button>
                    <button 
                      className="flex-1 py-2.5 bg-[#3530B8] text-white font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap shadow-md"
                      onClick={() => onAction('APPROVE')}
                    >
                      승인
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApprovalActionButtons;
