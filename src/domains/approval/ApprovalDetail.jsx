import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import useEmployeeStore from '../../store/useEmployeeStore';
import ApprovalDocumentContainer from './components/ApprovalDocumentContainer';
import VacationForm from './forms/VacationForm';
import PaymentForm from './forms/PaymentForm';
import GeneralForm from './forms/GeneralForm';
import PurchaseForm from './forms/PurchaseForm';
import { submitVacation, submitPayment, submitGeneral, submitPurchase, getApprovalDetail, approveDraft, rejectApproval, 
  updateVacation, updateGeneral, updatePayment, updatePurchase, deleteDoc } from './approvalApi';
import useLoadingStore from '../../store/useLoadingStore';

const getDefaultApprovers = (docType, user, allEmployees) => {
  if(!user || !allEmployees?.length) return [];

  const isStaff = !['부서장', '본부장', '대표'].includes(user.rank_name);
  const isManager = user.rank_name === '부서장';
  const isDirector = user.rank_name === '본부장';

  const myManager = allEmployees.find(e => e.rank_name === '부서장' && e.dept_seq === user.dept_seq && e.users_seq !== user.users_seq) || null;
  const myDirector = allEmployees.find(e => e.rank_name === '본부장' && e.dept_seq === user.parent_dept_seq) || null;
  const fnManager = allEmployees.find(e => e.rank_name === '부서장' && e.auth_group === 'ROLE_FN_ADMIN') || null;
  const ceo = allEmployees.find(e => e.rank_name === '대표') || null;

  const lines = {
    VACATION: {
      staff: [myManager],
      manager: [myDirector],
      director: [ceo],
    },
    PURCHASE: {
      staff: [myManager, myDirector, ceo],
      manager: [myDirector, ceo],
      director: [ceo],
    },
    PAYMENT: {
      staff: [myManager, fnManager, myDirector, ceo],
      manager: [fnManager, myDirector, ceo],
      director: [ceo],
    },
    GENERAL: {
      staff: [myManager, myDirector, ceo],
      manager: [myDirector, ceo],
      director: [ceo],
    },
  };

  const role = isStaff ? 'staff' : isManager ? 'manager' : isDirector ? 'director' : null;

  const candidates = (lines[docType]?.[role] ?? []).filter(Boolean);
  const unique = candidates.filter(
    (e, idx, arr) => arr.findIndex(i => i.users_seq === e.users_seq) === idx
  );
  return unique.map(e => ({...e, status: 'WAITING'}));
};

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in duration-200 p-6">
      <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
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
  const { type, docSeq } = useParams();
  const { user } = useUserStore();
  const { fetchEmployees, allEmployees } = useEmployeeStore();

  const [mode, setMode] = useState('VIEW'); // EDIT or VIEW
  const [userRole, setUserRole] = useState('REFERRER'); // DRAFTER, APPROVER, REFERRER
  const [doc_type, setDoc_type] = useState('VACATION');
  const [approvers, setApprovers] = useState([]);
  const [formData, setFormData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  
  // 반려 관련 상태
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState(false);

  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (!type) return; 

    const upperType = type.toUpperCase();
    setDoc_type(upperType);
    
    // 이전 데이터 초기화 (화면 깜빡임 방지 및 정확한 폼 렌더링을 위해)
    setFormData({});
    setIsSubmitClicked(false);
    setIsRejecting(false);
    setRejectReason('');
    setRejectError(false);

    if (!docSeq) {
      showLoading();
      // [작성 모드]
      setUserRole('DRAFTER');
      setMode('EDIT');
      
      if (upperType === 'VACATION') {
        setFormData({ title: '', vac_type: '연차', start_date: '', end_date: '', days: 0, reason: '' });
      } else if (upperType === 'PAYMENT') {
        setFormData({ title: '', pay_date: '', pay_reason: '', account_info: '', items: [{ item_order: 1, item_name: '', amount: 0, receipt: null, note: '' }] });
      } else if (upperType === 'GENERAL') {
        setFormData({ title: '', purpose: '', content: '' });
      } else if (upperType === 'PURCHASE') {
        setFormData({ title: '', purpose: '', vendor: '', purchase_date: '', items: [{ item_order: 1, item_name: '', ea: 1, unit_price: 0, note: '' }], attachments: [] });
      }
      hideLoading();
    } else {
      fetchDocumentData(type, docSeq);
    }
  }, [type, docSeq, user?.id, refresh]);

  useEffect(() => {
    showLoading();
    if (!docSeq && allEmployees?.length > 0 && user && doc_type) {
      setApprovers(getDefaultApprovers(doc_type, user, allEmployees));
    }
    hideLoading();
  }, [allEmployees, user, doc_type, docSeq]);

  const fetchDocumentData = async (type, docSeq) => {
    showLoading();
    try {
      await getApprovalDetail(type, docSeq).then(resp => {
        setFormData({
          ...resp.data.common,   // draft_documents 정보
          ...resp.data.detail,   // 각 문서별 본문 디테일 정보
          items: resp.data.items || [], // 상세 품목 리스트
          attachments: resp.data.attachments || [],
          referrers: resp.data.referrers || []
        });

        const fetchedApprovers = resp.data.approvers || [];
        setApprovers(fetchedApprovers);
        
        const documentStatus = resp.data.common?.status;
        const drafterId = resp.data.common?.users_id || resp.data.users_id;

        // 역할 및 모드 설정
        if (drafterId === user?.id) {
          setUserRole('DRAFTER');
          setMode(documentStatus === 'TEMP' ? 'EDIT' : 'VIEW');
        } else if (fetchedApprovers.some(a => a.users_id === user?.id)) {
          setUserRole('APPROVER');
          setMode('VIEW');
        } else {
          setUserRole('REFERRER');
          setMode('VIEW');
        }
      })
    } catch (error) {
      console.error('기안 문서 조회 실패:', error);
    } finally {
      hideLoading();
    }
  };

  const [isSubmitClicked, setIsSubmitClicked] = useState(false);
  const [isTempSaveClicked, setIsTempSaveClicked] = useState(false);

  // 상신 vs 임시저장
  const handleSave = async (actionType) => {
    const isTempSave = actionType === 'TEMP_SAVE';
    const isSubmit = actionType === 'SUBMIT';
    const isNew = !docSeq;

    // 유효성 검사 분기
    if (isSubmit) setIsSubmitClicked(true);
    if (isTempSave) setIsTempSaveClicked(true);
    if (isSubmit) setIsTempSaveClicked(false);
    if (isTempSave) setIsSubmitClicked(false);

    if (!formData.title?.trim() || formData.title.length > 50) return false;

    if(isSubmit){
      const isFormValid = () => {
        const today = new Date().toLocaleDateString('sv-SE');
        const isMobile = window.innerWidth < 768;

        if (doc_type === 'VACATION') { 
          if (!formData.start_date || formData.start_date < today) return false;
          if (formData.vac_type === '연차') {
            if (!formData.end_date || formData.end_date < formData.start_date) return false;
          }
          if (!formData.reason?.trim() || formData.reason.length > 300) return false;
        } else if (doc_type === 'PAYMENT') {
          // 모바일 필수 입력 체크
          if (isMobile) {
            if (!formData.pay_date || !formData.pay_reason?.trim() || !formData.account_info?.trim()) {
              alert("필수 항목을 입력해 주세요.");
              return false;
            }
          }
          
          if (formData.items && formData.items.length > 0) {
            const itemsValid = formData.items.every(item => 
              item.item_name?.trim() && 
              item.item_name.length <= 30 &&
              Number(item.amount) > 0 && 
              (item.receipt instanceof File || item.oriname) &&
              (!item.note || item.note.length <= 100)
            );

            if (!itemsValid) {
              alert("지출 항목 내 비고 외 모든 정보는 필수 입력 사항입니다.");
              return false;
            }
          }
          
          if (!formData.pay_date || !formData.pay_reason?.trim() || !formData.account_info?.trim()) return false;
          if (!formData.items || formData.items.length === 0) return false;
        } else if (doc_type === 'GENERAL') {
          if (!formData.purpose?.trim() || formData.purpose.length > 300) return false;
          if (!formData.content?.trim() || formData.content.length > 1000) return false;
        } else if (doc_type === 'PURCHASE') {
          // 모바일 필수 입력 체크
          if (isMobile) {
            if (!formData.purchase_date || !formData.purpose?.trim() || !formData.vendor?.trim() || (!formData.attachments || formData.attachments.length === 0)) {
              alert("필수 항목을 입력해 주세요.");
              return false;
            }
          }

          if (formData.items && formData.items.length > 0) {
            const itemsValid = formData.items.every(item => 
            item.item_name?.trim() && 
            item.item_name.length <= 50 &&
            Number(item.ea) > 0 && 
            Number(item.unit_price) > 0
          );
          if (!itemsValid) {
            alert("구매 품목 내 비고 외 모든 정보는 필수 입력 사항입니다.");
            return false;
          }
        }
          if (!formData.purchase_date || formData.purchase_date < today) return false;
          if (!formData.purpose?.trim() || formData.purpose.length > 300) return false;
          if (!formData.vendor?.trim() || formData.vendor.length > 50) return false;
          if (!formData.items || formData.items.length === 0) return false;
          if (!formData.attachments || formData.attachments.length === 0) return false;
        }
        return true;
      };
      if (!isFormValid()) return;

      if (!approvers || approvers.length === 0) {
        alert('최소 한 명 이상의 결재자를 추가해야 합니다.');
        return;
      }
    }
    // 데이터 가공 및 Payload 조립
    try {
      showLoading();
      const { referrers, title, ...restOfData } = formData;
      const isVacation = doc_type === 'VACATION';
      const isHalfVacation = isVacation && formData.vac_type?.includes('반차');

      const finalDocData = isVacation
        ? {
          ...restOfData,
          end_date: isHalfVacation ? formData.start_date : formData.end_date,
          days: isHalfVacation ? 0.5 : Number(formData.days)
        }
        : restOfData;

      const submitPayload = {
        ...finalDocData,
        title: formData.title,
        doc_type: doc_type,
        users_id: user?.id,
        status: isTempSave ? 'TEMP' : 'DRAFT',
        is_temp: isTempSave ? 1 : 0,
        approvers: approvers.map((app, index) => ({
          users_id: app.id || app.users_id,
          step_order: index + 1
        })),
        referrers: (referrers || []).map(ref => ({
          users_id: ref.id || ref.users_id
        }))
      };

      let response;

      // 신규: POST / 임시저장 재작성: PUT
      if (doc_type === 'VACATION') {
        response = await (isNew ? submitVacation(submitPayload) : updateVacation(docSeq, submitPayload));
      } else if (doc_type === 'GENERAL') {
        response = await (isNew ? submitGeneral(submitPayload) : updateGeneral(docSeq, submitPayload));
      } else if (doc_type === 'PAYMENT') {
        const formDataObj = new FormData();
        const processedItems = (formData.items || []).map(({receipt, ...rest}) => rest);

        const total_amount = (formData.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const dto = { ...submitPayload, items: processedItems, total_amount };

        formDataObj.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));
        // 1:1 인덱스, 새 파일 없는 item은 빈 Blob으로 채움
        (formData.items || []).forEach(item => {
          if (item.receipt instanceof File){
            formDataObj.append("files", item.receipt, item.receipt.name);
          } else {
            formDataObj.append("files", new Blob([]), ""); // 기존 파일 유지
          }
        });
        
        response = await (isNew ? submitPayment(formDataObj) : updatePayment(docSeq, formDataObj));
      } else if (doc_type === 'PURCHASE') {
        const formDataObj = new FormData();
        const newFiles = (formData.attachments || []).filter(f => f instanceof File);
        const keptAttachments = (formData.attachments || [])
          .filter(f => !(f instanceof File))
          .map(({oriname, sysname}) => ({oriname, sysname}));

        // 백엔드가 기존 데이터를 DELETE 하므로, 유지할 기존 파일 정보를 DTO에 포함
        const dto = { ...submitPayload, attachments: keptAttachments };

        formDataObj.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));
        newFiles.forEach(file => formDataObj.append("files", file, file.name));

        response = await (isNew ? submitPurchase(formDataObj) : updatePurchase(docSeq, formDataObj));
      }

      if (response && (response.status === 200 || response.status === 201 || response.data)) {
        alert(isTempSave ? '임시저장이 완료되었습니다.' : '기안이 성공적으로 상신되었습니다.');
        if(isTempSave){
          navigate('/approvalTemp');
        }else {
          navigate('/approvalMypage');
        }
      }
    } catch (error) {
      if(error.response && error.response.data){
        alert(error.response.data);
      }else{
        alert("기안 문서 처리 중 오류가 발생했습니다.");
      }
    } finally {
      hideLoading();
    }
  };

  // 버튼 액션
  const handleAction = async (actionType, payload) => {
    const isTempSave = actionType === 'TEMP_SAVE';
    
    if (actionType === 'APPROVE') {
      if (!window.confirm('기안을 승인하시겠습니까?')) return;
      try {
        const response = await approveDraft(docSeq, doc_type);
        alert('승인이 완료되었습니다.');
        setRefresh(prev => prev + 1);
      } catch (error) {
        alert('승인 처리 중 오류가 발생했습니다.');
      }
      return;
    }

    if (actionType === 'REJECT') {
      if (!payload?.trim()) {
        setRejectError(true);
        return;
      }
      if (!window.confirm('기안을 반려하시겠습니까?')) return;
      try {
        console.log(rejectReason);
        const response = await rejectApproval(docSeq, rejectReason);
        alert('반려가 완료되었습니다.');
        setRefresh(prev => prev + 1);
      } catch (error) {
        alert('반려 처리 중 오류가 발생했습니다.');
      }
      return;
    }

    if (actionType === 'SUBMIT_CANCEL') {
      if (!window.confirm('상신을 취소하시겠습니까?')) return;
      try {
        const response = await deleteDoc(docSeq, doc_type);
        alert('상신 취소가 완료되었습니다.');
        navigate('/approvalMypage');
      } catch (error) {
        alert('상신 취소 중 오류가 발생했습니다.');
      }
      return;
    }

    // [결재 상신 / 임시 저장]
    if (actionType === 'SUBMIT' || actionType === 'TEMP_SAVE') {
      handleSave(actionType);
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
      isSubmitClicked: isSubmitClicked,
      isTempSaveClicked: isTempSaveClicked
    };

    switch (doc_type) {
      case 'VACATION':
        return <VacationForm key={doc_type} {...props} />;
      case 'PAYMENT':
        return <PaymentForm key={doc_type} {...props} />;
      case 'GENERAL':
        return <GeneralForm key={doc_type} {...props} />;
      case 'PURCHASE':
        return <PurchaseForm key={doc_type} {...props} />;
      default:
        return <div>알 수 없는 문서 형식입니다.</div>;
    }
  };

  const getTitle = () => {
    switch (doc_type) {
      case 'VACATION': return '휴가 신청서';
      case 'PAYMENT': return '지출 결의서';
      case 'GENERAL': return '일반 품의서';
      case 'PURCHASE': return '구매 신청서';
      default: return '전자결재';
    }
  };

  const drafter = mode === 'EDIT'
  ? user 
  : { 
      name:       formData.name,
      rank_name:  formData.rank_name,
      created_at: formData.created_at
    };

  // 반려 여부 및 사유 확인
  const rejectedApprover = approvers?.find(app => app.status === 'REJECTED');
  const showRejectReason = mode === 'VIEW' && rejectedApprover;

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
        drafter={drafter}
        userRole={userRole}
        mode={mode}
        approvers={approvers}
        referrers={formData.referrers}
        onAddApprover={handleAddApprover}
        onRemoveApprover={handleRemoveApprover}
        onAction={handleAction}
        isRejecting={isRejecting}
        setIsRejecting={setIsRejecting}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        rejectError={rejectError}
        setRejectError={setRejectError}
      >
        {renderForm()}

        {/* 반려 사유 영역 (조회 모드에서 반려된 경우 또는 결재자가 반려 진행 중인 경우) */}
        {(showRejectReason || isRejecting) && (
          <div className="mt-8 pt-8 border-t-2 border-red-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-red-500 rounded-full"></div>
              <span className="text-xs font-bold text-red-600">반려 사유</span>
            </div>
            
            {isRejecting ? (
              <>
                <textarea
                  className={`w-full p-4 text-sm border-2 rounded-xl bg-red-50/30 focus:outline-none transition-all resize-none h-32 ${
                    rejectError ? 'border-red-500 ring-4 ring-red-500/10 shadow-lg shadow-red-500/5' : 'border-red-100 focus:border-red-200'
                  }`}
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (e.target.value.trim()) setRejectError(false);
                  }}
                  placeholder="반려 사유를 입력해주세요."
                  autoFocus
                />
                {rejectError && (
                  <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1 animate-pulse">
                    <span>⚠️</span> 반려 사유를 입력해주세요.
                  </p>
                )}
              </>
            ) : (
              <div className="p-5 bg-red-50 rounded-xl border border-red-100 shadow-sm">
                <p className="text-sm text-red-700 leading-relaxed font-medium">
                  {rejectedApprover?.reject_reason || '반려 사유가 등록되지 않았습니다.'}
                </p>
                <div className="mt-3 flex justify-end">
                  <span className="text-[10px] font-bold text-red-400 bg-red-100/50 px-2 py-1 rounded">
                    반려자: {rejectedApprover?.name} {rejectedApprover?.rank_name}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </ApprovalDocumentContainer>
    </>
  );
};

export default ApprovalDetail;
