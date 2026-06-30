import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';
import { getCompanyInfo } from '../../admin/adminApi';

const ApprovalActionButtons = ({
  user,
  userRole,
  mode,
  documentStatus,
  onAction,
  approvers,
  isRejecting,
  setIsRejecting,
  rejectReason,
  setRejectReason,
  rejectError,
  setRejectError,
  title,
  drafter,
  docNo,
  formTitle,
  attachments
}) => {
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const [companyInfo, setCompanyInfo] = useState({});

  // 상태 판단 로직
  const firstApproverStatus = approvers?.[0]?.status;
  const myApproverInfo = approvers?.find(a => a.users_id === user?.id);
  const myStatus = myApproverInfo?.status;

  // 수정 가능한 기안자 (첫 번째 결재자가 결재하기 전 상태)
  const isEditableDrafter = userRole === 'DRAFTER' && mode === 'VIEW' && firstApproverStatus === 'IN_PROGRESS';
  const isEditingSubmitted = userRole === 'DRAFTER' && mode === 'EDIT' && documentStatus !== 'TEMP' && documentStatus !== undefined;

  // 결재자 (현재 결재 순서인 경우)
  const isCurrentApprover = userRole === 'APPROVER' && mode === 'VIEW' && myStatus === 'IN_PROGRESS';

  useEffect(() => {
    getCompanyInfo().then(resp => {
      setCompanyInfo(resp.data);
    }).catch(err => {
      console.error('회사 정보 조회 실패', err);
    });
  }, []);

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

    const finalApprover = approvers?.[approvers.length - 1];

    const attachmentList = (attachments || [])
      .map(a => `<div style="font-size: 12px; color: #475569;">${a.oriname}</div>`)
      .join('');

    const coverPage = `
      <div style="page-break-after: always; padding: 70px 80px; font-family: sans-serif; height: 277mm; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 50px; position: relative;">
          <div style="position: absolute; top: 0; left: 0; width: 60px; height: 4px; background: #3530B8;"></div>
          <h1 style="font-size: 30px; font-weight: 800; letter-spacing: 8px; color: #1a1a1a; margin: 20px 0 0 0;">
            기 안 문
          </h1>
        </div>

        <!-- 문서번호 + 결재라인 -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
          <div style="font-size: 13px; color: #475569; padding-top: 8px;">
            문서번호 : ${docNo || '-'}
          </div>

          <table style="border-collapse: collapse; font-size: 12px;">
            <tr>
              <th style="background: #3530B8; color: white; border: 1px solid #3530B8; padding: 6px 20px; font-weight: 700;">기안자</th>
              <th style="background: #3530B8; color: white; border: 1px solid #3530B8; padding: 6px 20px; font-weight: 700;">결재자</th>
            </tr>
            <tr>
              <td style="border: 1px solid #DDE8FF; padding: 14px 20px; text-align: center; background: #F8FAFF;">
                ${drafter?.stamp_sysname
        ? `<img src="https://api.sukong.shop/file/profile/view?sysname=${drafter.stamp_sysname}&token=${token}" style="width: 36px; height: 36px; object-fit: cover; display: block; margin: 0 auto 4px;" />`
        : ''
      }
                <div style="font-weight: 600; color: #1a1a1a;">${drafter?.name || '-'}</div>
              </td>
              <td style="border: 1px solid #DDE8FF; padding: 14px 20px; text-align: center; background: #F8FAFF;">
                ${finalApprover?.stamp_sysname
        ? `<img src="https://api.sukong.shop/file/profile/view?sysname=${finalApprover.stamp_sysname}&token=${token}" style="width: 36px; height: 36px; object-fit: cover; display: block; margin: 0 auto 4px;" />`
        : ''
      }
                <div style="font-weight: 600; color: #1a1a1a;">${finalApprover?.name || '-'}</div>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #DDE8FF; padding: 6px 20px; text-align: center; font-size: 10px; color: #94a3b8;">
                ${drafter?.created_at?.substring(0, 10) || '-'}
              </td>
              <td style="border: 1px solid #DDE8FF; padding: 6px 20px; text-align: center; font-size: 10px; color: #94a3b8;">
                ${finalApprover?.handle_at?.substring(0, 10) || '-'}
              </td>
            </tr>
          </table>
        </div>

        <!-- 제목 -->
        <div style="margin-bottom: 16px;">
          <span style="font-size: 13px; color: #64748b; font-weight: 600;">제목 :</span>
          <span style="font-size: 14px; color: #1a1a1a; margin-left: 8px;">${formTitle}</span>
        </div>

        <div style="border-top: 2px solid #1a1a1a; margin-bottom: 16px;"></div>

        <!-- 첨부문서 -->
        <div style="margin-bottom: 60px;">
          <span style="font-size: 13px; color: #64748b; font-weight: 600;">첨부문서</span>
          <div style="margin-top: 6px; margin-left: 4px;">
            ${attachmentList || '<div style="font-size: 12px; color: #94a3b8;">없음</div>'}
          </div>
        </div>

        <!-- 기안 날짜 -->
        <div style="text-align: center; font-size: 14px; color: #1a1a1a; margin-bottom: 50px;">
          ${drafter?.created_at?.substring(0, 10)?.replaceAll('-', '. ') || '-'}
        </div>

        <div style="border-top: 1px solid #cbd5e1; margin-bottom: 20px;"></div>

        <!-- 회사명 + 주소/연락처 -->
        <div style="text-align: center;">
          <div style="font-size: 22px; font-weight: 800; color: #3530B8; margin-bottom: 8px;">
            ${companyInfo?.companyName}
          </div>
          <div style="font-size: 11px; color: #64748b;">
            ${companyInfo ? `(${companyInfo.companyZonecode}) ${companyInfo.companyAddress} ${companyInfo.companyDetailAddr || ''}` : ''}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            ${companyInfo ? `Tel : ${companyInfo.companyTel}　Fax : ${companyInfo.companyFax}` : ''}
          </div>
        </div>

      </div>
    `;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
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
          @page { margin: 0; }
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
            {!isEditingSubmitted && <CloseButton />}
            {isEditingSubmitted ? (
              <>
                <button
                  className="px-6 py-2 bg-gray-100 text-gray-500 font-bold text-xs rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                  onClick={() => onAction('CANCEL_EDIT')}
                >
                  취소
                </button>
                <button
                  className="px-8 py-2 bg-[#3530B8] text-white font-bold text-xs rounded-xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all active:scale-95"
                  onClick={() => onAction('SUBMIT')}
                >
                  수정완료
                </button>
              </>
            ) : (
              <>
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
                      <>
                        <button
                          className="px-6 py-2 bg-white border border-red-200 text-red-500 font-bold text-xs rounded-xl hover:bg-red-50 transition-all active:scale-95"
                          onClick={() => onAction('SUBMIT_CANCEL')}
                        >
                          상신취소
                        </button>
                        <button
                          className="px-6 py-2 bg-white border border-[#3530B8] text-[#3530B8] font-bold text-xs rounded-xl hover:bg-[#F0F4FF] transition-all active:scale-95"
                          onClick={() => onAction('SWITCH_TO_EDIT')}
                        >
                          수정
                        </button>
                      </>
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
            {!isEditingSubmitted && (
              <button
                className="flex-1 py-2.5 border border-gray-200 text-gray-500 font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap"
                onClick={() => navigate(-1)}
              >
                닫기
              </button>
            )}
            {isEditingSubmitted ? (
              <>
                <button
                  className="flex-1 py-2.5 bg-gray-100 text-gray-500 font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap"
                  onClick={() => onAction('CANCEL_EDIT')}
                >
                  취소
                </button>
                <button
                  className="flex-1 py-2.5 bg-[#3530B8] text-white font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap shadow-md"
                  onClick={() => onAction('SUBMIT')}
                >
                  수정완료
                </button>
              </>
            ) : (
              <>
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
                  <>
                    <button
                      className="flex-1 py-2.5 bg-white border border-red-200 text-red-500 font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap"
                      onClick={() => onAction('SUBMIT_CANCEL')}
                    >
                      상신취소
                    </button>
                    <button
                      className="flex-1 py-2.5 bg-white border border-[#3530B8] text-[#3530B8] font-bold text-[11px] rounded-lg active:scale-95 whitespace-nowrap"
                      onClick={() => onAction('SWITCH_TO_EDIT')}
                    >
                      수정
                    </button>
                  </>
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
