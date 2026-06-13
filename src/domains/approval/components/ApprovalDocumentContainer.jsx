import React from 'react';
import ApprovalLine from './ApprovalLine';
import ApprovalActionButtons from './ApprovalActionButtons';

const ApprovalDocumentContainer = ({ 
  title, 
  user, 
  drafter,
  userRole, 
  mode, 
  approvers, 
  onAddApprover, 
  onRemoveApprover, 
  onReorderApprover,
  onAction,
  isRejecting,
  setIsRejecting,
  rejectReason,
  setRejectReason,
  rejectError,
  setRejectError,
  children 
}) => {
  return (
    <div className="flex justify-center py-4 md:py-10 font-sans">
      {/* [Desktop View] - 기존 스타일 완벽 유지 */}
      <div className="hidden md:flex flex-col w-[85%] min-w-[800px] bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 h-fit mb-10">
        {/* Header Section */}
        <div className="bg-[#3530B8] px-8 py-4 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-[0.625rem] font-bold opacity-80 tracking-widest mb-0.5">(주)Lunex Soft</span>
            <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
          </div>

          <ApprovalLine 
            approvers={approvers} 
            isEditMode={mode === 'EDIT' && userRole === 'DRAFTER'} 
            onAdd={onAddApprover}
            onRemove={onRemoveApprover}
            onReorder={onReorderApprover}
            drafter={drafter}
          />
        </div>

        {/* Content Section */}
        <div className="px-10 py-8 space-y-8">
          {children}
          
          {/* Action Buttons */}
          <ApprovalActionButtons 
            user={user}
            userRole={userRole} 
            mode={mode} 
            onAction={onAction} 
            approvers={approvers}
            isRejecting={isRejecting}
            setIsRejecting={setIsRejecting}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            rejectError={rejectError}
            setRejectError={setRejectError}
          />
        </div>
      </div>

      {/* [Mobile View] - 새로운 모바일용 레이아웃 */}
      <div className="md:hidden flex flex-col w-[95%] bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 h-fit mb-10">
        {/* Mobile Header Section */}
        <div className="bg-[#3530B8] px-4 py-4 text-white flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-[0.625rem] font-bold opacity-80 tracking-widest mb-0.5">(주)Lunex Soft</span>
            <h1 className="text-lg font-extrabold tracking-tight">{title}</h1>
          </div>

          <ApprovalLine 
            approvers={approvers} 
            isEditMode={mode === 'EDIT' && userRole === 'DRAFTER'} 
            onAdd={onAddApprover}
            onRemove={onRemoveApprover}
            onReorder={onReorderApprover}
            drafter={drafter}
          />
        </div>

        {/* Mobile Content Section */}
        <div className="px-4 py-6 space-y-6">
          {children}
          
          <ApprovalActionButtons 
            user={user}
            userRole={userRole} 
            mode={mode} 
            onAction={onAction} 
            approvers={approvers}
            isRejecting={isRejecting}
            setIsRejecting={setIsRejecting}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            rejectError={rejectError}
            setRejectError={setRejectError}
          />
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

export default ApprovalDocumentContainer;
