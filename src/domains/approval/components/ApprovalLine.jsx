import React from 'react';
import useAuthStore from '../../../store/authStore';

const ApprovalLine = ({ approvers, isEditMode, onAdd, onRemove, onReorder, drafter }) => {
  const token = useAuthStore(state => state.token);

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
      case 'IN_PROGRESS': return 'text-blue-300';
      default: return 'text-[#FF9800]/80';
    }
  };

  return (
    <div id="approval-line-container" className="flex flex-col items-start md:items-end gap-1.5 w-full md:w-auto">
      {isEditMode && (
        <button
          onClick={onAdd}
          className="text-[0.625rem] font-bold bg-white/10 hover:bg-white/20 border border-white/20 px-2 py-0.5 rounded-full transition-all"
        >
          결재자 추가
        </button>
      )}

      {/* [Desktop View] - 기존 스타일 완벽 유지 */}
      <div className="hidden md:flex">
        {/* 기안자 영역 */}
        <div className="w-16 border border-white/30 flex flex-col">
          <div className="bg-white/10 text-[0.7rem] py-0.5 text-center font-bold border-b border-white/30">기안</div>
          <div className={`${isEditMode ? 'h-12' : 'h-14'} flex flex-col items-center justify-center text-[0.7rem] font-medium text-white/90 p-1`}>
            {!isEditMode && drafter?.stamp_sysname ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}/file/profile/view?sysname=${drafter.stamp_sysname}&token=${token}`}
                    alt={drafter?.name || '기안'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[0.65rem] mt-0.5 truncate w-full text-center">{drafter?.name}</span>
              </div>
            ) : (
              <>
                <span className={`truncate w-full text-center ${isEditMode ? 'mb-3' : ''}`}>{drafter?.name || '기안'}</span>
                {!isEditMode && <span className="text-[0.7rem] mt-1 font-bold text-white">기안</span>}
              </>
            )}
          </div>
          {!isEditMode && (
            <div className="h-7 border-t border-white/30 flex items-center justify-center text-[9px] font-medium text-white/60 bg-white/5">
              {drafter?.created_at?.slice(0, 10) || '-'}
            </div>
          )}
        </div>

        {/* 결재자 리스트 영역 */}
        {approvers.map((approver, idx) => {
          const hasRejectionBefore = approvers.slice(0, idx).some(a => a.status === 'REJECTED');
          const statusText = hasRejectionBefore ? '' : getStatusText(approver, idx);
          const showDetails = !hasRejectionBefore;

          const showStamp = !isEditMode && showDetails && approver.status === 'APPROVED' && approver.stamp_sysname;

          return (
            <div key={idx} className="w-16 border-y border-r border-white/30 flex flex-col border-l-0 relative group">
              <div className="bg-white/10 text-[0.7rem] py-0.5 text-center font-bold border-b border-white/30 text-white/90">
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
              <div className={`${isEditMode ? 'h-11' : 'h-14'} ${!showStamp ? 'approver-cell' : ''} flex flex-col items-center justify-center text-[0.7rem] font-medium text-white/90 p-1 relative w-full`}>
                {showStamp ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}/file/profile/view?sysname=${approver.stamp_sysname}&token=${token}`}
                        alt={approver.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[0.65rem] mt-0.5 truncate w-full text-center">{approver.name}</span>
                  </div>
                ) : (
                  <>
                    <span className={`truncate w-full text-center ${isEditMode ? 'mb-2' : ''}`}>{showDetails ? (approver.name || '-') : '-'}</span>
                    {isEditMode && (
                      <span className={'absolute bottom-1 left-0 w-full flex justify-center gap-1 opacity-0 group-hover:opacity-70 transition-opacity duration-200'}>
                        {idx > 0 && (
                          <button onClick={() => onReorder(idx, 'up')} className="hover:text-white transition-colors">◀</button>
                        )}
                        {idx < approvers.length - 1 && (
                          <button onClick={() => onReorder(idx, 'down')} className="hover:text-white transition-colors">▶</button>
                        )}
                      </span>
                    )}
                    {!isEditMode && statusText && showDetails && (
                      <span className={`text-[0.7rem] mt-1 font-bold ${getStatusColor(approver.status)}`}>
                        {statusText}
                      </span>
                    )}
                  </>
                )}
              </div>
              {!isEditMode && (
                <div className="h-7 border-t border-white/30 flex items-center justify-center text-[9px] font-medium text-white/60 bg-white/5">
                  <span className={!(showDetails && approver.handle_at) ? 'print-hide-dash' : ''}>
                    {(showDetails && approver.handle_at) ? approver.handle_at.slice(0, 10) : '-'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* [Mobile View] - 새로운 모바일용 세로형 결재선 */}
      <div className="md:hidden flex flex-col w-full border border-white/20 rounded-lg overflow-hidden">
        {/* 기안자 (모바일) */}
        <div className="flex items-center bg-white/5 border-b border-white/10">
          <div className="w-16 bg-white/10 py-2 text-[0.7rem] text-center font-bold border-r border-white/10">기안</div>
          <div className="flex-grow flex items-center justify-between px-3 py-2 text-[0.75rem]">
            <div className="flex items-center gap-2 relative h-10 w-full justify-between">
              {!isEditMode && drafter?.stamp_sysname ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}/file/profile/view?sysname=${drafter.stamp_sysname}&token=${token}`}
                      alt={drafter?.name || '기안'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-bold">{drafter?.name}</span>
                </div>
              ) : (
                <span className="font-bold">{drafter?.name || '-'}</span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[0.7rem] text-white/60">기안</span>
                {!isEditMode && (
                  <span className="text-[0.7rem] text-white/40">{drafter?.created_at?.slice(0, 10)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 결재자들 (모바일) */}
        {approvers.map((approver, idx) => {
          const hasRejectionBefore = approvers.slice(0, idx).some(a => a.status === 'REJECTED');
          const statusText = hasRejectionBefore ? '' : getStatusText(approver, idx);
          const showDetails = !hasRejectionBefore;

          const showStamp = !isEditMode && showDetails && approver.status === 'APPROVED' && approver.stamp_sysname;

          return (
            <div key={idx} className="flex items-center bg-white/5 border-b border-white/10 last:border-0 relative">
              <div className="w-16 bg-white/10 py-2 text-[0.7rem] text-center font-bold border-r border-white/10">
                {approver.rank_name || approver.rank || '결재'}
              </div>
              <div className="flex-grow flex items-center justify-between px-3 py-2 text-[0.75rem] h-12">
                {showStamp ? (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}/file/profile/view?sysname=${approver.stamp_sysname}&token=${token}`}
                        alt={approver.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-bold">{approver.name}</span>
                  </div>
                ) : (
                  <span className="font-bold">{showDetails ? (approver.name || '-') : '-'}</span>
                )}
                <div className="flex items-center gap-2">
                  {!showStamp && !isEditMode && statusText && showDetails && (
                    <span className={`text-[0.7rem] font-bold ${getStatusColor(approver.status)}`}>
                      {statusText}
                    </span>
                  )}
                  {!isEditMode && showDetails && approver.handle_at && (
                    <span className="text-[0.7rem] text-white/40">{approver.handle_at.slice(0, 10)}</span>
                  )}
                </div>
              </div>
              {isEditMode && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <div className="flex flex-col text-[8px] leading-tight text-white/30">
                    {idx > 0 && (
                      <button
                        onClick={() => onReorder(idx, 'up')}
                        className="hover:text-white transition-colors"
                      >
                        ▲
                      </button>
                    )}
                    {idx < approvers.length - 1 && (
                      <button
                        onClick={() => onReorder(idx, 'down')}
                        className="hover:text-white transition-colors"
                      >
                        ▼
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => onRemove(idx)}
                    className="text-white/30 hover:text-white p-1"
                  >
                    ✕
                  </button>
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
