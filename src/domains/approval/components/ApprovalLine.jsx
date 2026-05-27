import React from 'react';

const ApprovalLine = ({ approvers, isEditMode, onAdd, onRemove, user }) => {
  return (
    <div className="flex flex-col items-end gap-1.5">
      {isEditMode && (
        <button 
          onClick={onAdd}
          className="text-[0.625rem] font-bold bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-0.5 rounded-full transition-all"
        >
          결재자 추가
        </button>
      )}
      
      <div className="flex">
        {/* 기안자 영역 */}
        <div className="w-16 border border-white/30 flex flex-col">
          <div className="bg-white/10 text-[0.625rem] py-0.5 text-center font-bold border-b border-white/30">기안</div>
          <div className="h-11 flex items-center justify-center text-[0.625rem] font-medium text-white/90">
            {user?.name || '기안'}
          </div>
        </div>

        {/* 결재자 리스트 영역 */}
        {approvers.map((approver, idx) => (
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
            <div className="h-11 flex items-center justify-center text-[0.625rem] font-bold text-white/90">
              {isEditMode ? approver.name : (approver.status || '대기')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalLine;
