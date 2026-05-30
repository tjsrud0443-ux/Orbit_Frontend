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
  onAction,
  children 
}) => {
  return (
    <div className="flex justify-center py-10 font-sans">
      <div className="w-[85%] min-w-[800px] bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 flex flex-col h-fit mb-10">
        
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
            drafter={drafter}
          />
        </div>

        {/* Content Section */}
        <div className="px-10 py-8 space-y-8">
          {children}
          
          {/* Action Buttons */}
          <ApprovalActionButtons 
            userRole={userRole} 
            mode={mode} 
            onAction={onAction} 
            approvers={approvers}
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
