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

  // 수정 가능한 기안자 (첫 번째 결재자가 결재하기 전 상태)
  const isEditableDrafter = userRole === 'DRAFTER' && mode === 'VIEW' && firstApproverStatus === 'IN_PROGRESS';

  // 결재자 (현재 결재 순서인 경우)
  const isCurrentApprover = userRole === 'APPROVER' && mode === 'VIEW' && myStatus === 'IN_PROGRESS';

  const handleRejectConfirm = () => {
    if (!rejectReason.trim() || rejectReason.length > 100) {
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

  const handlePrint = () => {
    const printArea = document.querySelector('.print-area');
    const content = printArea.innerHTML;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');

    const coverPage = `
      <div style="page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
        <h1 style="font-size: 2rem; font-weight: bold;">지출 결의서</h1>
        <p style="margin-top: 20px;">작성일: 2026-06-30</p>
        <p>작성자: ${user.name}</p>
      </div>
    `;

    printWindow.document.write(`
    <html>
      <head>
        <title>인쇄</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <style>
          body { margin: 0; padding: 20px; background: white; }
          .no-print { display: none !important; }
          .md\\:flex { display: flex !important; }
          .md\\:block { display: block !important; }
          .md\\:hidden { display: none !important; }
          .min-w-\\[800px\\] { min-width: 0 !important; }
          .w-\\[85\\%\\] { width: 100% !important; }
          .shadow-xl { box-shadow: none !important; }
          .rounded-2xl { border-radius: 0 !important; }
          .overflow-hidden { overflow: visible !important; }
          .mb-10 { margin-bottom: 0 !important; }
          .justify-between { justify-content: space-between !important; }
          h1 { white-space: nowrap !important; }
          #approval-line-container { align-items: flex-end !important; width: auto !important; }
          .bg-\\[\\#3530B8\\] { display: flex !important; justify-content: space-between !important; align-items: center !important; }
          /* WAITING, IN_PROGRESS 상태 텍스트 숨기기 */
          .text-blue-300, .text-\\[\\#FF9800\\]\\/80 { display: none !important; }
          .approver-cell { justify-content: flex-start !important; padding-top: 6px !important; }
          .print-hide-dash { display: none !important; }
        </style>
      </head>
      <body>
        ${coverPage}
        ${content}
        <script>
          window.addEventListener('load', () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 1500);
          });
        <\/script>
      </body>
    </html>
  `);
    printWindow.document.close();
  };

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
                <div className="flex justify-between items-center w-full">
                  <button
                    className="no-print flex items-center gap-1.5 px-4 py-2 text-xs text-gray-500 hover:text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl transition-all active:scale-95"
                    onClick={handlePrint}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    인쇄
                  </button>
                  <div className="flex gap-3">
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
                  </div>
                </div>
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
