import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import ApprovalDocumentContainer from './components/ApprovalDocumentContainer';
import VacationForm from './forms/VacationForm';
// import PurchaseForm from './forms/PurchaseForm'; // 추후 추가
// import PaymentForm from './forms/PaymentForm'; // 추후 추가
// import GeneralForm from './forms/GeneralForm'; // 추후 추가

const ApprovalDetail = () => {
  const { docId } = useParams();
  const location = useLocation();
  const { user } = useUserStore();

  // 1. 상태 관리
  const [mode, setMode] = useState('VIEW'); // EDIT or VIEW
  const [userRole, setUserRole] = useState('REFERRER'); // DRAFTER, APPROVER, REFERRER
  const [docType, setDocType] = useState('VACATION'); // VACATION, PURCHASE, etc.
  const [approvers, setApprovers] = useState([]);
  const [formData, setFormData] = useState({});

  // 2. 권한 및 데이터 초기화 (사용자 요구사항 반영)
  useEffect(() => {
    if (!docId) {
      // [신규 작성 모드]
      setUserRole('DRAFTER');
      setMode('EDIT');
      setApprovers([]); // 초기 결재라인은 비어있거나 기본값 설정
      setFormData({
        vacationType: '연차',
        startDate: '',
        endDate: '',
        totalDays: 0,
        reason: ''
      });
      
      // URL 경로 등으로 docType 판별 (예: /approval/write/vacation)
      if (location.pathname.includes('vacation')) setDocType('VACATION');
      // else if ... 
    } else {
      // [기존 문서 조회 모드] - API 호출 필요
      fetchDocumentData(docId);
    }
  }, [docId, location.pathname]);

  const fetchDocumentData = async (id) => {
    // API 호출 시뮬레이션
    // const res = await approvalApi.getDetail(id);
    // setFormData(res.data);
    // setApprovers(res.approvers);
    // setUserRole(res.userRole); // 서버에서 판별해준 권한 설정
    setMode('VIEW');
  };

  // 3. 비즈니스 로직 핸들러
  const handleAction = (actionType) => {
    console.log(`Action: ${actionType}`, formData, approvers);
    switch (actionType) {
      case 'SUBMIT':
        // 결재 상신 로직
        break;
      case 'APPROVE':
        // 승인 로직
        break;
      case 'REJECT':
        // 반려 로직
        break;
      case 'TEMP_SAVE':
        // 임시저장 로직
        break;
      default:
        break;
    }
  };

  const handleAddApprover = () => {
    // 결재자 선택 모달 오픈 로직 등
    console.log("Open Approver Selection Modal");
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
      user: user
    };

    switch (docType) {
      case 'VACATION':
        return <VacationForm {...props} />;
      // case 'PURCHASE': return <PurchaseForm {...props} />;
      default:
        return <div>알 수 없는 문서 형식입니다.</div>;
    }
  };

  const getTitle = () => {
    switch (docType) {
      case 'VACATION': return '휴가 신청서';
      case 'PURCHASE': return '구매 신청서';
      default: return '전자결재';
    }
  };

  return (
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
  );
};

export default ApprovalDetail;
