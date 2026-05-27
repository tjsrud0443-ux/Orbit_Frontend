import React from 'react';

const ApprovalLine = ({ approvers, isEditMode, onAdd, onRemove, user }) => {
  
  const getStatusText = (approver, idx) => {
    // 이전 결재자 중 반려가 있는지 확인
    const hasRejectionBefore = approvers.slice(0, idx).some(a => a.status === '반려');
    if (hasRejectionBefore) return '';

    switch (approver.status) {
      case 'APPROVED': return '결재 완료';
      case 'REJECTED': return '반려';
      case 'IN_PROGRESS': return '진행 중';
      case 'WAITING': return '결재 대기';
      default: return approver.status || '결재 대기';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'text-[#10B981]';
      case 'REJECTED': return 'text-[#FF4D4F]';
      case 'IN_PROGRESS': return 'text-blue-600';
      default: return 'text-white/50';
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      {isEditMode && (
        <button 
          onClick={onAdd}
          className="text-[0.625rem] font-bold bg-white/10 hover:bg-white/20 border border-white/20 px-2 py-0.5 rounded-full transition-all"
        >
          결재자 추가
        </button>
      )}
      
      <div className="flex">
        {/* 기안자 영역 */}
        <div className="w-16 border border-white/30 flex flex-col">
          <div className="bg-white/10 text-[0.7rem] py-0.5 text-center font-bold border-b border-white/30">기안</div>
          <div className={`${isEditMode ? 'h-11' : 'h-14'} flex flex-col items-center justify-center text-[0.7rem] font-medium text-white/90 p-1`}>
            <span className="truncate w-full text-center">{user?.name || '기안'}</span>
            {!isEditMode && <span className="text-[0.7rem] mt-1 font-bold text-blue-200">기안</span>}
          </div>
          {!isEditMode && (
            <div className="h-5 border-t border-white/30 flex items-center justify-center text-[9px] font-medium text-white/60 bg-white/5">
              {user?.processedDate || '2026-05-27'}
            </div>
          )}
        </div>

        {/* 결재자 리스트 영역 */}
        {approvers.map((approver, idx) => {
          const statusText = getStatusText(approver, idx);
          return (
            <div key={idx} className="w-16 border-y border-r border-white/30 flex flex-col border-l-0 relative">
              <div className="bg-white/10 text-[0.625rem] py-0.5 text-center font-bold border-b border-white/30 text-white/90">
                {approver.rank_name || approver.rank || '결재'}
                {isEditMode && (
                  <button 
                    onClick={() => onRemove(idx)}
                    className="absolute top-0.5 right-0 text-white rounded-full w-3 h-3 text-[8px] flex items-center justify-center leading-none"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className={`${isEditMode ? 'h-11' : 'h-14'} flex flex-col items-center justify-center text-[0.625rem] font-bold text-white/90 p-1`}>
                <span className="truncate w-full text-center">{approver.name || '-'}</span>
                {!isEditMode && statusText && (
                  <span className={`text-[9px] font-bold ${getStatusColor(approver.status)}`}>
                    {statusText}
                  </span>
                )}
              </div>
              {!isEditMode && (
                <div className="h-7 border-t border-white/30 flex items-center justify-center text-[9px] font-medium text-white/60 bg-white/5">
                  {approver.processedDate || '-'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApprovalLine;
