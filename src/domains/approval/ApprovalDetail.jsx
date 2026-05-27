import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import useEmployeeStore from '../../store/useEmployeeStore';
import ApprovalDocumentContainer from './components/ApprovalDocumentContainer';
import VacationForm from './forms/VacationForm';
import PaymentForm from './forms/PaymentForm';
import GeneralForm from './forms/GeneralForm';
import PurchaseForm from './forms/PurchaseForm';
import { approvalApi, getAllEmployees } from './approvalApi';

// 결재자 선택 모달 컴포넌트
const EmployeeSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const { allEmployees } = useEmployeeStore();
  if (!isOpen) return null;
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery 
    ? allEmployees.filter(emp => 
        emp.name.includes(searchQuery) || emp.dept_name.includes(searchQuery)
      ) 
    : allEmployees;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-[400px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        <div className="bg-[#3530B8] px-6 py-4 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white">결재자 추가</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-4">
          <input 
            type="text" 
            placeholder="이름/부서로 검색하세요." 
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#3530B8] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <div className="h-64 overflow-y-auto mt-3 custom-scrollbar">
            {filtered.map((emp) => (
              <div 
                key={emp.id} 
                className="p-3 border-b border-gray-50 hover:bg-[#F0F4FF] cursor-pointer flex justify-between text-xs group transition-colors"
                onClick={() => onSelect(emp)}
              >
                <div className="flex flex-col">
                    <span className="font-bold text-gray-700 group-hover:text-[#3530B8]">{emp.name}</span>
                    <span className="text-[10px] text-gray-400">{emp.dept_name}</span>
                </div>
                <span className="text-[#3530B8] font-bold bg-[#F0F4FF] px-2 py-1 rounded-md h-fit">{emp.rank_name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ApprovalDetail = () => {
  const { docId } = useParams();
  const location = useLocation();
  const { user } = useUserStore();
  const { fetchEmployees } = useEmployeeStore();

  // 1. 상태 관리
  const [mode, setMode] = useState('VIEW'); // EDIT or VIEW
  const [userRole, setUserRole] = useState('REFERRER'); // DRAFTER, APPROVER, REFERRER
  const [docType, setDocType] = useState('VACATION'); // VACATION, PURCHASE, etc.
  const [approvers, setApprovers] = useState([]);
  const [formData, setFormData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 초기 사원 목록 로드
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // 2. 권한 및 데이터 초기화 (사용자 요구사항 반영)
  useEffect(() => {
    const isPaymentPath = location.pathname.includes('payment');
    const isVacationPath = location.pathname.includes('vacation');
    const isGeneralPath = location.pathname.includes('general');
    const isPurchasePath = location.pathname.includes('purchase');

    if (!docId) {
      // [신규 작성 모드]
      setUserRole('DRAFTER');
      setMode('EDIT');
      setApprovers([]);

      if (isVacationPath) {
        setDocType('VACATION');
        setFormData({
          vacationType: '연차',
          startDate: '',
          endDate: '',
          totalDays: 0,
          reason: '',
          referrers: []
        });
      } else if (isPaymentPath) {
        setDocType('PAYMENT');
        setFormData({
          expenditureDate: '',
          requestDate: new Date().toLocaleDateString('sv-SE'),
          purpose: '',
          accountInfo: '',
          items: [{ id: 1, itemName: '', amount: 0, receipt: null, note: '' }]
        });
      } else if (isGeneralPath) {
        setDocType('GENERAL');
        setFormData({
          requestDate: new Date().toLocaleDateString('sv-SE'),
          purpose: '',
          content: ''
        });
      } else if (isPurchasePath) {
        setDocType('PURCHASE');
        setFormData({
          purchaseRequestDate: '',
          requestDate: new Date().toLocaleDateString('sv-SE'),
          purchasePurpose: '',
          supplier: '',
          items: [{ id: 1, itemName: '', quantity: 1, unitPrice: 0, note: '' }],
          attachments: []
        });
      }
    } else {
      // [조회 모드]
      if (isVacationPath) setDocType('VACATION');
      else if (isPaymentPath) setDocType('PAYMENT');
      else if (isGeneralPath) setDocType('GENERAL');
      else if (isPurchasePath) setDocType('PURCHASE');
      
      fetchDocumentData(docId);
    }
  }, [docId, location.pathname]);

  const fetchDocumentData = async (id) => {
    setMode('VIEW');
  };

  // 3. 비즈니스 로직 핸들러
  const handleAction = (actionType) => {
    console.log(`Action: ${actionType}`, formData, approvers);
  };

  const handleAddApprover = () => {
    setIsModalOpen(true);
  };

  const handleSelectApprover = (selectedUser) => {
    if (approvers.some(a => a.id === selectedUser.id)) {
      alert('이미 추가된 결재자입니다.');
      return;
    }
    setApprovers(prev => [...prev, { ...selectedUser, status: 'WAITING' }]);
    setIsModalOpen(false);
  };

  const handleRemoveApprover = (idx) => {
    setApprovers(prev => prev.filter((_, i) => i !== idx));
  };

  // 4. 문서 타입에 따른 폼 렌더링
  const renderForm = () => {
    const props = {
      data: formData,
      onChange: setFormData,
      mode: mode,
      user: user,
    };

    switch (docType) {
      case 'VACATION':
        return <VacationForm {...props} />;
      case 'PAYMENT':
        return <PaymentForm {...props} />;
      case 'GENERAL':
        return <GeneralForm {...props} />;
      case 'PURCHASE':
        return <PurchaseForm {...props} />;
      default:
        return <div>알 수 없는 문서 형식입니다.</div>;
    }
  };

  const getTitle = () => {
    switch (docType) {
      case 'VACATION': return '휴가 신청서';
      case 'PAYMENT': return '지출 결의서';
      case 'GENERAL': return '일반 품의서';
      case 'PURCHASE': return '구매 신청서';
      default: return '전자결재';
    }
  };

  return (
    <>
      <EmployeeSelectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelect={handleSelectApprover}
      />
      <ApprovalDocumentContainer
        title={getTitle()}
        user={user}
        userRole={userRole}
        mode={mode}
        approvers={approvers}
        onAddApprover={handleAddApprover}
        onRemoveApprover={handleRemoveApprover}
        onAction={handleAction}
      >
        {renderForm()}
      </ApprovalDocumentContainer>
    </>
  );
};

export default ApprovalDetail;
