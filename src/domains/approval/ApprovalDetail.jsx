import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import useEmployeeStore from '../../store/useEmployeeStore';
import ApprovalDocumentContainer from './components/ApprovalDocumentContainer';
import VacationForm from './forms/VacationForm';
import PaymentForm from './forms/PaymentForm';
import GeneralForm from './forms/GeneralForm';
import PurchaseForm from './forms/PurchaseForm';
import { submitVacation } from './approvalApi';

// 결재자 선택 모달 컴포넌트
const EmployeeSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const { allEmployees } = useEmployeeStore();
  const { user } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  if (!isOpen) return null;

  // 1. 직급 필터링 (부서장, 본부장, 대표) 및 기안자 제외
  const allowedRanks = ['부서장', '본부장', '대표'];
  const baseFiltered = allEmployees.filter(emp => 
    allowedRanks.includes(emp.rank_name) && emp.users_seq !== user?.users_seq
  );

  // 2. 검색어 필터링
  const filtered = searchQuery 
    ? baseFiltered.filter(emp => 
        emp.name.includes(searchQuery) || emp.dept_name.includes(searchQuery)
      ) 
    : baseFiltered;

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

  const [mode, setMode] = useState('VIEW'); // EDIT or VIEW
  const [userRole, setUserRole] = useState('REFERRER'); // DRAFTER, APPROVER, REFERRER
  const [docType, setDocType] = useState('VACATION');
  const [approvers, setApprovers] = useState([]);
  const [formData, setFormData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const isPaymentPath = location.pathname.includes('payment');
    const isVacationPath = location.pathname.includes('vacation');
    const isGeneralPath = location.pathname.includes('general');
    const isPurchasePath = location.pathname.includes('purchase');

    if (!docId) {
      // [작성 모드]
      setUserRole('DRAFTER');
      setMode('EDIT');
      setApprovers([]);

      if (isVacationPath) {
        setDocType('VACATION');
        setFormData({
          title: '',
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
          title: '',
          expenditureDate: '',
          requestDate: new Date().toLocaleDateString('sv-SE'),
          purpose: '',
          accountInfo: '',
          items: [{ id: 1, itemName: '', amount: 0, receipt: null, note: '' }]
        });
      } else if (isGeneralPath) {
        setDocType('GENERAL');
        setFormData({
          title: '',
          requestDate: new Date().toLocaleDateString('sv-SE'),
          purpose: '',
          content: ''
        });
      } else if (isPurchasePath) {
        setDocType('PURCHASE');
        setFormData({
          title: '',
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

  // 버튼 액션
  const handleAction = (actionType) => {
    console.log(`Action: ${actionType}`, formData, approvers);

    if (actionType === 'TEMP_SAVE') {
      // 임시저장 처리
      return;
    }

    // [결재 상신 버튼을 누른 경우]
    if (actionType === 'SUBMIT') {
      if (!approvers || approvers.length === 0) {
        alert('최소 한 명 이상의 결재자를 추가해야 합니다.');
        return;
      }

      try {
        // formData에 섞여 있는 referrers(참조자 배열)와 순수 휴가 상세 내역(docData) 분리
        const { referrers, ...docData } = formData;

        // 각 테이블 DTO 구조에 대입하기 좋게 껍데기(Wrapper) 구조로 패킹
        const submitPayload = {
          docType: docType,               // "VACATION"
          users_id: user?.users_id,    // 공통 마스터 테이블용 기안자 ID
        
          // 결재 라인 테이블 DTO 배열 양식 맞추기
          approvers: approvers.map((app, index) => ({
            users_id: app.users_id,
            step_order: index + 1     // 오라클에 저장될 결재 순서 (1, 2, 3...)
          })),

          // 참조자 테이블 DTO 배열 양식 맞추기
          referrers: (referrers || []).map(ref => ({
            users_id: ref.users_id
          })),

          // 휴가 상세 테이블 DTO 양식과 1:1 매핑될 데이터
          docData: docData
        };

        console.log("🚀 오라클 백엔드로 전송할 최종 조립 데이터:", submitPayload);

        // 문서 타입별로 분리된 API 호출
        let response;
        if (docType === 'VACATION') {
          response = submitVacation(submitPayload);
        } 
        /* else if (docType === 'PURCHASE') {
          response = submitPurchase(submitPayload);
        } 
        */

        // maxios 통신 성공 시
        if (response && (response.status === 200 || response.status === 201 || response.data)) {
          alert('결재 문서가 성공적으로 상신되었습니다.');
          navigate('/approval');
        }

      } catch (error) {
        console.error('결재 상신 중 에러 발생:', error);
        alert('결재 상신 중 오류가 발생했습니다.');
      }
    }
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
