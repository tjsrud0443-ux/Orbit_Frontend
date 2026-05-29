import React, { useState, useEffect } from 'react';
import Calendar from '../../../components/common/Calendar';
import ReferrerSelector from '../components/ReferrerSelector';

const PaymentForm = ({ data, onChange, mode, user, isSubmitClicked }) => {
  const isEditMode = mode === 'EDIT';
  const today = new Date().toLocaleDateString('sv-SE');

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // 초기 데이터 설정 (items가 없을 경우 기본 1행 추가)
  useEffect(() => {
    if (!data.items || data.items.length === 0) {
      handleFieldChange('items', [{ id: 1, item_name: '', amount: 0, receipt: null, note: '' }]);
    }
    if (!data.requestDate) {
      handleFieldChange('requestDate', today);
    }
  }, []);

  useEffect(() => {
    if (isSubmitClicked) {
      const newErrors = {};
      newErrors.title = validateField('title', data.title);
      newErrors.pay_date = validateField('pay_date', data.pay_date);
      newErrors.pay_reason = validateField('pay_reason', data.pay_reason);
      newErrors.account_info = validateField('account_info', data.account_info);
      
      const itemErrors = {};
      data.items?.forEach((item, index) => {
        if (!item.item_name?.trim()) itemErrors[`${index}-item_name`] = '품목명을 입력해주세요.';
        else if (item.item_name.length > 30) itemErrors[`${index}-item_name`] = '글자 수 초과 (30자 이하)';
        
        if (!item.amount || item.amount <= 0) itemErrors[`${index}-amount`] = '금액을 입력해주세요.';
        if (!item.receipt) itemErrors[`${index}-receipt`] = '영수증을 첨부해주세요.';
        
        if (item.note && item.note.length > 100) itemErrors[`${index}-note`] = '글자 수 초과 (100자 이하)';
      });
      newErrors.items = itemErrors;
      
      setErrors(newErrors);
    }
  }, [isSubmitClicked]);

  const validateField = (field, value) => {
    let error = '';
    if (!value && field !== 'items') {
      if (field === 'title') error = '제목을 입력해주세요.';
      if (field === 'pay_date') error = '지출일을 선택해주세요.';
      if (field === 'pay_reason') error = '지출 목적을 입력해주세요.';
      if (field === 'account_info') error = '계좌 정보를 입력해주세요.';
    }

    if (value) {
      if (field === 'title' && value.length > 50) error = '글자 수 초과 (50자 이하)';
      if (field === 'pay_reason' && value.length > 300) error = '글자 수 초과 (300자 이하)';
      if (field === 'account_info' && value.length > 50) error = '글자 수 초과 (50자 이하)';
    }

    return error;
  };

  const handleFieldChange = (field, value) => {
    if (!onChange) return;
    if (field !== 'items') {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
    onChange({ ...data, [field]: value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...(data.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // 개별 아이템 필드 검증
    const itemErrors = { ...(errors.items || {}) };
    
    if (field === 'receipt') {
      if (!value) {
        itemErrors[`${index}-receipt`] = '영수증을 첨부해주세요.';
      } else {
        delete itemErrors[`${index}-receipt`];
      }
    } else if (!value && (field === 'item_name' || field === 'amount')) {
      itemErrors[`${index}-${field}`] = field === 'item_name' ? '품목명을 입력해주세요.' : '금액을 입력해주세요.';
    } else {
      if (field === 'item_name' && value.length > 30) {
        itemErrors[`${index}-item_name`] = '글자 수 초과 (30자 이하)';
      } else if (field === 'note' && value.length > 100) {
        itemErrors[`${index}-note`] = '글자 수 초과 (100자 이하)';
      } else {
        delete itemErrors[`${index}-${field}`];
        if (field === 'note') delete itemErrors[`${index}-note`]; // 명시적으로 note 에러 삭제
      }
    }
    
    setErrors(prev => ({ ...prev, items: itemErrors }));
    handleFieldChange('items', newItems);
  };

  const handleAddRow = () => {
    const currentItems = data.items || [];
    const nextId = currentItems.length > 0 ? Math.max(...currentItems.map(i => i.id)) + 1 : 1;
    const newItems = [
      ...currentItems,
      { id: nextId, item_name: '', amount: 0, receipt: null, note: '' }
    ];
    handleFieldChange('items', newItems);
  };

  const handleRemoveRow = (index) => {
    const currentItems = [...(data.items || [])];
    if (currentItems.length <= 1) {
      setErrors(prev => ({ ...prev, itemMin: '최소 한 개의 항목은 있어야 합니다.' }));
      setTimeout(() => setErrors(prev => ({ ...prev, itemMin: '' })), 3000);
      return;
    }
    currentItems.splice(index, 1);
    // No. 재정렬
    const reorderedItems = currentItems.map((item, idx) => ({ ...item, id: idx + 1 }));
    
    // 에러 상태도 같이 업데이트
    const itemErrors = { ...(errors.items || {}) };
    const newItemErrors = {};
    Object.keys(itemErrors).forEach(key => {
      const [idx, field] = key.split('-');
      const numericIdx = parseInt(idx);
      if (numericIdx < index) newItemErrors[key] = itemErrors[key];
      else if (numericIdx > index) newItemErrors[`${numericIdx - 1}-${field}`] = itemErrors[key];
    });
    
    setErrors(prev => ({ ...prev, items: newItemErrors }));
    handleFieldChange('items', reorderedItems);
  };

  const calculateTotal = () => {
    const items = data.items || [];
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const applicant = isEditMode ? user : data;

  return (
    <div className="space-y-5">
      {/* 제목 Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
          <h2 className="text-xs font-bold text-gray-800">제목</h2>
        </div>
        {isEditMode ? (
          <div>
            <input 
              type="text"
              value={data.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="제목을 입력하세요 (50자 이하)"
              maxLength={50}
              className={`w-full p-2.5 text-xs bg-white border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all`}
            />
            {errors.title && <p className="mt-1 text-[10px] text-red-500">{errors.title}</p>}
          </div>
        ) : (
          <div className="w-full p-2.5 text-xs bg-gray-50 border border-gray-100 rounded-xl">
            {data.title || '-'}
          </div>
        )}
      </div>

      {/* 신청 정보 Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
          <h2 className="text-xs font-bold text-gray-800">신청 정보</h2>
        </div>
        <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
          <tbody>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">성명</th>
              <td className="p-2 w-125 border-r border-gray-200">{applicant?.name || '-'}</td>
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">사번</th>
              <td className="p-2">{applicant?.users_seq || '-'}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">부서</th>
              <td className="p-2 border-r border-gray-200">{applicant?.dept_name || '-'}</td>
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">직급</th>
              <td className="p-2">{applicant?.rank_name || '-'}</td>
            </tr>
            <tr>
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">지출일</th>
              <td className="p-2 border-r border-gray-200">
                {isEditMode ? (
                  <div className="relative w-65">
                    <div className="relative h-[34px]">
                      <input 
                        type="text" 
                        readOnly 
                        value={data.pay_date || ''} 
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)} 
                        placeholder="지출일 선택" 
                        className={`w-full h-full p-2 border ${errors.pay_date ? 'border-red-500' : isCalendarOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-300'} rounded-xl outline-none cursor-pointer text-xs transition-all pr-10`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {isCalendarOpen && (
                        <Calendar 
                          value={data.pay_date} 
                          onChange={(d) => { handleFieldChange('pay_date', d); setIsCalendarOpen(false); }} 
                          onClose={() => setIsCalendarOpen(false)}
                        />
                      )}
                    </div>
                    {errors.pay_date && (
                      <p className="absolute left-0 top-full mt-3 text-[10px] text-red-500 whitespace-nowrap">
                        {errors.pay_date}
                      </p>
                    )}
                  </div>
                ) : (
                  <span>{data.pay_date || '-'}</span>
                )}
              </td>
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청일</th>
              <td className="p-2">{data.requestDate || today}</td>
            </tr>
          </tbody>
        </table>
        {/* 지출일 에러를 위한 여백 확보 (인라인 모드일 때만) */}
        {isEditMode && errors.pay_date && <div className="h-4"></div>}
      </div>

      {/* 지출 목적 및 계좌 정보 Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">지출 목적</h2>
          </div>
          {isEditMode ? (
            <div>
              <textarea 
                value={data.pay_reason || ''}
                onChange={(e) => handleFieldChange('pay_reason', e.target.value)}
                placeholder="지출 목적을 입력하세요 (300자 이하)"
                maxLength={300}
                className={`w-full h-20 p-2 text-xs bg-white border ${errors.pay_reason ? 'border-red-500' : 'border-gray-200'} rounded-lg outline-none focus:border-[#3530B8] resize-none transition-all`}
              ></textarea>
              {errors.pay_reason && <p className="mt-1 text-[10px] text-red-500">{errors.pay_reason}</p>}
            </div>
          ) : (
            <div className="w-full h-20 p-2 text-xs bg-gray-50 border border-gray-100 rounded-lg whitespace-pre-wrap overflow-y-auto">
              {data.pay_reason || '-'}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">계좌 정보</h2>
          </div>
          {isEditMode ? (
            <div>
              <textarea 
                value={data.account_info || ''}
                onChange={(e) => handleFieldChange('account_info', e.target.value)}
                placeholder="은행명 / 계좌번호 / 예금주 (50자 이하)"
                maxLength={50}
                className={`w-full h-20 p-2 text-xs bg-white border ${errors.account_info ? 'border-red-500' : 'border-gray-200'} rounded-lg outline-none focus:border-[#3530B8] resize-none transition-all`}
              ></textarea>
              {errors.account_info && <p className="mt-1 text-[10px] text-red-500">{errors.account_info}</p>}
            </div>
          ) : (
            <div className="w-full h-20 p-2 text-xs bg-gray-50 border border-gray-100 rounded-lg whitespace-pre-wrap overflow-y-auto">
              {data.account_info || '-'}
            </div>
          )}
        </div>
      </div>

      {/* 지출 항목 Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">지출 항목</h2>
          </div>
          {isEditMode && (
            <div className="flex flex-col items-end gap-1">
              <button 
                onClick={handleAddRow}
                className="px-3 py-1 bg-[#3530B8] text-white text-[10px] font-bold rounded-full hover:bg-[#2a2696] transition-colors"
              >
                + 항목 추가
              </button>
              {errors.itemMin && <p className="text-[9px] text-red-500 animate-pulse">{errors.itemMin}</p>}
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 p-2 border-r border-gray-200 text-center font-bold">No.</th>
                <th className="p-2 border-r border-gray-200 text-center font-bold">지출 항목명</th>
                <th className="w-32 p-2 border-r border-gray-200 text-center font-bold">금액(원)</th>
                <th className="w-32 p-2 border-r border-gray-200 text-center font-bold">영수증 첨부</th>
                <th className="p-2 border-r border-gray-200 text-center font-bold">비고</th>
                {isEditMode && <th className="w-12 p-2 text-center font-bold">삭제</th>}
              </tr>
            </thead>
            <tbody>
              {data.items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                  <td className="p-2 border-r border-gray-200 text-center">{index + 1}</td>
                  <td className="p-2 border-r border-gray-200">
                    {isEditMode ? (
                      <div>
                        <input 
                          type="text"
                          value={item.item_name || ''}
                          onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                          maxLength={30}
                          className={`w-full p-1 bg-white border ${errors.items?.[`${index}-item_name`] ? 'border-red-500' : 'border-gray-300'} rounded outline-none focus:border-[#3530B8]`}
                        />
                        {errors.items?.[`${index}-item_name`] && <p className="text-[9px] text-red-500 mt-0.5">{errors.items[`${index}-item_name`]}</p>}
                      </div>
                    ) : (
                      <span>{item.item_name || '-'}</span>
                    )}
                  </td>
                  <td className="p-2 border-r border-gray-200">
                    {isEditMode ? (
                      <div>
                        <input 
                          type="number"
                          min="0"
                          value={item.amount || ''}
                          onChange={(e) => handleItemChange(index, 'amount', Math.max(0, Number(e.target.value)))}
                          className={`w-full p-1 bg-white border ${errors.items?.[`${index}-amount`] ? 'border-red-500' : 'border-gray-300'} rounded outline-none focus:border-[#3530B8] text-right`}
                        />
                        {errors.items?.[`${index}-amount`] && <p className="text-[9px] text-red-500 mt-0.5">{errors.items[`${index}-amount`]}</p>}
                      </div>
                    ) : (
                      <div className="text-right">{(Number(item.amount) || 0).toLocaleString()}</div>
                    )}
                  </td>
                  <td className="p-2 border-r border-gray-200 text-center">
                    {isEditMode ? (
                      <div className="flex flex-col items-center gap-1">
                        <label className={`cursor-pointer bg-white border ${errors.items?.[`${index}-receipt`] ? 'border-red-500' : 'border-gray-300'} px-2 py-1 rounded text-[10px] hover:bg-gray-50`}>
                          파일 선택
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={(e) => {
                              handleItemChange(index, 'receipt', e.target.files[0]);
                            }}
                          />
                        </label>
                        {item.receipt && <span className="text-[9px] text-gray-500 truncate max-w-[80px]">{item.receipt.name}</span>}
                        {errors.items?.[`${index}-receipt`] && !item.receipt && (
                          <p className="text-[9px] text-red-500 mt-0.5 whitespace-nowrap">{errors.items[`${index}-receipt`]}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#3530B8] cursor-pointer hover:underline">
                        {item.receipt ? (typeof item.receipt === 'string' ? '영수증 보기' : item.receipt.name) : '-'}
                      </span>
                    )}
                  </td>
                  <td className="p-2 border-r border-gray-200">
                    {isEditMode ? (
                      <div>
                        <input 
                          type="text"
                          value={item.note || ''}
                          onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                          maxLength={100}
                          className={`w-full p-1 bg-white border ${errors.items?.[`${index}-note`] ? 'border-red-500' : 'border-gray-300'} rounded outline-none focus:border-[#3530B8]`}
                        />
                        {errors.items?.[`${index}-note`] && <p className="text-[9px] text-red-500 mt-0.5">{errors.items[`${index}-note`]}</p>}
                      </div>
                    ) : (
                      <span>{item.note || '-'}</span>
                    )}
                  </td>
                  {isEditMode && (
                    <td className="p-2 text-center">
                      <button 
                        onClick={() => handleRemoveRow(index)}
                        className="text-gray-400 hover:text-red-500 font-bold transition-colors"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={2} className="p-2 border-r border-gray-200 text-center">합계 금액</td>
                <td className="p-2 border-r border-gray-200 text-right text-[#3530B8]">
                  ￦ {calculateTotal().toLocaleString()}
                </td>
                <td colSpan={isEditMode ? 3 : 2} className="p-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Referrer Selection Section */}
      <ReferrerSelector 
        value={data.referrers} 
        onChange={(val) => onChange({ ...data, referrers: val })} 
        isEditMode={isEditMode} 
      />
    </div>
  );
};

export default PaymentForm;
