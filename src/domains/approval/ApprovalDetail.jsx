import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import useEmployeeStore from '../../store/useEmployeeStore';
import ApprovalDocumentContainer from './components/ApprovalDocumentContainer';
import VacationForm from './forms/VacationForm';
import PaymentForm from './forms/PaymentForm';
import GeneralForm from './forms/GeneralForm';
import PurchaseForm from './forms/PurchaseForm';
import { submitVacation, submitPayment, submitGeneral, submitPurchase, getApprovalDetail } from './approvalApi';

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
  const { type, docSeq } = useParams();
  const location = useLocation();
  const { user } = useUserStore();
  const { fetchEmployees } = useEmployeeStore();

  const [mode, setMode] = useState('VIEW'); // EDIT or VIEW
  const [userRole, setUserRole] = useState('REFERRER'); // DRAFTER, APPROVER, REFERRER
  const [doc_type, setDoc_type] = useState('VACATION');
  const [approvers, setApprovers] = useState([]);
  const [formData, setFormData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (!type) return; 

    const upperType = type.toUpperCase();
    setDoc_type(upperType);

    if (!docSeq) {
      // [작성 모드]
      setUserRole('DRAFTER');
      setMode('EDIT');
      setApprovers([]);
      
      if (upperType === 'VACATION') {
        setFormData({ title: '', vac_type: '연차', start_date: '', end_date: '', days: 0, reason: '' });
      } else if (upperType === 'PAYMENT') {
        setFormData({ title: '', pay_date: '', pay_reason: '', account_info: '', items: [{ item_order: 1, item_name: '', amount: 0, receipt: null, note: '' }] });
      } else if (upperType === 'GENERAL') {
        setFormData({ title: '', purpose: '', content: '' });
      } else if (upperType === 'PURCHASE') {
        setFormData({ title: '', purpose: '', vendor: '', purchase_date: '', items: [{ item_order: 1, item_name: '', ea: 1, unit_price: 0, note: '' }], attachments: [] });
      }
    } else {
      fetchDocumentData(type, docSeq);
    }
  }, [type, docSeq]);

  const fetchDocumentData = async (type, docSeq) => {
    try {
      const response = await getApprovalDetail(type, docSeq).then(resp => {
        setFormData({
          ...resp.data.common,   // draft_documents 정보
          ...resp.data.detail,   // 각 문서별 본문 디테일 정보
          items: resp.data.items || [], // 상세 품목 리스트
          attachments: resp.data.attachments || [],
          referrers: resp.data.referrers || []
        });

        setApprovers(resp.data.approvers || []);
        setMode('VIEW');

        const documentStatus = resp.data.common?.status;

        const approver = resp.data.approvers?.find(a => a.users_id === user?.id && a.status === 'IN_PROGRESS')
        if(approver){
          setUserRole('APPROVER');
          setMode('VIEW');
        }else if(resp.data.users_id === user?.id){
          setUserRole('DRAFTER');
          if (documentStatus === 'TEMP') {
            setMode('EDIT');
          }else{
            setMode('VIEW');
          }
        }else{
          setUserRole('REFERRER');
          setMode('VIEW');
        }

      })
    } catch (error) {
      console.error('기안 문서 조회 실패:', error);
    }
  };

  const [isSubmitClicked, setIsSubmitClicked] = useState(false);

  // 버튼 액션
  const handleAction = async (actionType) => {
    const isTempSave = actionType === 'TEMP_SAVE';

    // [결재 상신 버튼을 누른 경우]
    if (actionType === 'SUBMIT') {
      setIsSubmitClicked(true);

      // 필수 항목 검증
      const isFormValid = () => {
        const today = new Date().toLocaleDateString('sv-SE');
        if (!formData.title?.trim() || formData.title.length > 50) return false;
        
        if (doc_type === 'VACATION') {
          if (!formData.start_date || formData.start_date < today) return false;
          if (formData.vac_type === '연차') {
            if (!formData.end_date || formData.end_date < formData.start_date) return false;
          }
          if (!formData.reason?.trim() || formData.reason.length > 300) return false;
        } else if (doc_type === 'PAYMENT') {
          const pay_date = formData.pay_date;
          const pay_reason = formData.pay_reason;
          const account_info = formData.account_info;

          if (!pay_date) return false;
          if (!pay_reason?.trim() || pay_reason.length > 300) return false;
          if (!account_info?.trim() || account_info.length > 50) return false;
          if (!formData.items || formData.items.length === 0) return false;
          
          return formData.items.every(item => {
            const item_name = item.item_name;
            const amount = item.amount;
            const receipt = item.receipt;
            const note = item.note;
            
            return (
              item_name?.trim() && item_name.length <= 30 &&
              amount > 0 && 
              receipt &&
              (!note || note.length <= 100)
            );
          });
        } else if (doc_type === 'GENERAL') {
          if (!formData.purpose?.trim() || formData.purpose.length > 300) return false;
          if (!formData.content?.trim() || formData.content.length > 1000) return false;
        } else if (doc_type === 'PURCHASE') {
          if (!formData.purchase_date || formData.purchase_date < today) return false;
          if (!formData.purpose?.trim() || formData.purpose.length > 300) return false;
          if (!formData.vendor?.trim() || formData.vendor.length > 50) return false;
          if (!formData.items || formData.items.length === 0) return false;
          if (!formData.attachments || formData.attachments.length === 0) return false;
          return formData.items.every(item => 
            item.item_name?.trim() && item.item_name.length <= 50 &&
            item.ea > 0 && 
            item.unit_price > 0
          );
        }
        return true;
      };

      if (!isFormValid()) {
        return;
      }

      if (!approvers || approvers.length === 0) {
        alert('최소 한 명 이상의 결재자를 추가해야 합니다.');
        return;
      }

      try {
        const { referrers, title, ...restOfData } = formData;
        
        const isVacation= doc_type === 'VACATION'
        const isHalfVacation = isVacation && formData.vac_type?.includes('반차');

        const finalDocData = isVacation
          ? {
              ...restOfData,
              end_date: isHalfVacation ? formData.start_date : formData.end_date,
              days: isHalfVacation ? 0.5 : Number(formData.days)
            }
          : restOfData;
        
        // 각 테이블 DTO 구조에 대입하기 좋게 조립
        const submitPayload = {
          title: formData.title,
          doc_type: doc_type,
          users_id: user?.id,
          status: isTempSave ? 'TEMP' : 'DRAFT',
          is_temp: isTempSave ? 1 : 0,
          // 결재자 리스트 (users_id 포함)
          approvers: approvers.map((app, index) => ({
            users_id: app.id || app.users_id,
            step_order: index + 1
          })),

          // 참조자 리스트 (users_id 포함)
          referrers: (referrers || []).map(ref => ({
            users_id: ref.id || ref.users_id
          })),

          // 나머지 문서 데이터
          ...finalDocData
        };

        // 문서 타입별로 분리된 API 호출
        let response;
        if (doc_type === 'VACATION') {
          response = docSeq ? updateVacation(docSeq, submitPayload) : submitVacation(submitPayload);
        } else if (doc_type === 'GENERAL') {
          response = docSeq ? updateGeneral(docSeq, submitPayload) : submitGeneral(submitPayload);
        } else if (doc_type === 'PAYMENT') {
          const formDataObj = new FormData();

          const total_amount = (formData.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

          const paymentPayload = {
            ...submitPayload,
            total_amount: total_amount
          };

          formDataObj.append("dto", new Blob([JSON.stringify(paymentPayload)], {type: "application/json"}));
          if(formData.items && formData.items.length > 0){
            formData.items.forEach(item => {
              if(item.receipt instanceof File){
                formDataObj.append("files", item.receipt);
              }
            });
          }
          response = docSeq ? updatePayment(docSeq, formDataObj) : submitPayment(formDataObj);
        } else if (doc_type === 'PURCHASE') {
          const formDataObj = new FormData();
          
          formDataObj.append("dto", new Blob([JSON.stringify(submitPayload)], { type: "application/json" }));
          
          if (formData.attachments && formData.attachments.length > 0) {
            formData.attachments.forEach(file => {
              if (file instanceof File) {
                formDataObj.append("files", file);
              }
            });
          }

          response = docSeq ? await updatePurchase(docSeq, formDataObj) : await submitPurchase(formDataObj);
        }

        if (response && (response.status === 200 || response.status === 201 || response.data)) {
          alert(isTempSave ? '임시저장이 완료되었습니다.' : '결재 문서가 성공적으로 상신되었습니다.');
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
      isSubmitClicked: isSubmitClicked
    };

    switch (doc_type) {
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
