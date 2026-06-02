import React, { useState, useEffect } from 'react';
import Calendar from '../../../components/common/Calendar';
import ReferrerSelector from '../components/ReferrerSelector';
import useAuthStore from '../../../store/authStore';

const PaymentForm = ({ data, onChange, mode, user, isSubmitClicked, isTempSaveClicked }) => {
  const isEditMode = mode === 'EDIT';
  const today = new Date().toLocaleDateString('sv-SE');

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const token = useAuthStore(state => state.token);

  // 초기 데이터 설정 (items가 없을 경우 기본 1행 추가)
  useEffect(() => {
    if (!data.items || data.items.length === 0) {
      handleFieldChange('items', [{ id: 1, item_name: '', amount: 0, receipt: null, note: '' }]);
    }
    if (!data.created_at) {
      handleFieldChange('created_at', today);
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
        if (!item.item_name?.trim()) itemErrors[`${index}-item_name`] = '항목명을 입력해주세요.';
        else if (item.item_name.length > 30) itemErrors[`${index}-item_name`] = '글자 수 초과 (30자 이하)';
        
        if (!item.amount || item.amount <= 0) itemErrors[`${index}-amount`] = '금액을 입력해주세요.';
        if (!item.receipt && !item.oriname) itemErrors[`${index}-receipt`] = '영수증을 첨부해주세요.';
        
        if (item.note && item.note.length > 100) itemErrors[`${index}-note`] = '글자 수 초과 (100자 이하)';
      });
      newErrors.items = itemErrors;
      
      setErrors(newErrors);
    } else {
      setErrors({});
    }
  }, [isSubmitClicked]);

  useEffect(() => {
    if (isTempSaveClicked){
      const newErrors= {};
      newErrors.title = validateField('title', data.title);
      setErrors(newErrors);
    }
  }, [isTempSaveClicked]);

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
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    onChange(prev => {
      const newItems = [...(prev.items || [])];
      const updatedItem = { ...newItems[index], [field]: value };
      if (field === 'receipt' && value instanceof File) {
        updatedItem.sysname = null;
        updatedItem.oriname = null;
      }
      newItems[index] = updatedItem;
      return { ...prev, items: newItems };
    });

    const itemErrors = { ...(errors.items || {}) };
    if (field === 'receipt') {
      if (!value) itemErrors[`${index}-receipt`] = '영수증을 첨부해주세요.';
      else delete itemErrors[`${index}-receipt`];
    } else if (!value && (field === 'item_name' || field === 'amount')) {
      itemErrors[`${index}-${field}`] = field === 'item_name' ? '항목명을 입력해주세요.' : '금액을 입력해주세요.';
    } else {
      if (field === 'item_name' && value.length > 30) itemErrors[`${index}-item_name`] = '글자 수 초과 (30자 이하)';
      else if (field === 'note' && value.length > 100) itemErrors[`${index}-note`] = '글자 수 초과 (100자 이하)';
      else {
        delete itemErrors[`${index}-${field}`];
        if (field === 'note') delete itemErrors[`${index}-note`];
      }
    }
    setErrors(prev => ({ ...prev, items: itemErrors }));
  };

  const handleAddRow = () => {
    onChange(prev => {
      const currentItems = prev.items || [];
      const nextId = currentItems.length > 0 ? Math.max(...currentItems.map(i => i.id)) + 1 : 1;
      return {
        ...prev,
        items: [...currentItems, { id: nextId, item_name: '', amount: 0, receipt: null, note: '' }]
      };
    });
  };

  const handleRemoveRow = (index) => {
    const currentItems = data.items || [];
    if (currentItems.length <= 1) {
      setErrors(err => ({ ...err, itemMin: '최소 한 개의 항목은 있어야 합니다.' }));
      setTimeout(() => setErrors(err => ({ ...err, itemMin: '' })), 3000);
      return prev;
    }
    setErrors(err => {
      const itemErrors = { ...(err.items || {}) };
      const newItemErrors = {};
      Object.keys(itemErrors).forEach(key => {
        const [idxStr, f] = key.split('-');
        const numericIdx = parseInt(idxStr);
        if (numericIdx < index) newItemErrors[key] = itemErrors[key];
        else if (numericIdx > index) newItemErrors[`${numericIdx - 1}-${f}`] = itemErrors[key];
      });
      return { ...err, items: newItemErrors };
    });

    onChange(prev => {
      const currentItems = prev.items || [];
      const filteredItems = currentItems.filter((_, i) => i !== index);
      const reorderedItems = filteredItems.map((item, idx) => ({ ...item, id: idx + 1 }));
      return { ...prev, items: reorderedItems };
    });
  };

  const handleRemoveFile = (itemIndex) => {
    onChange(prev => ({
      ...prev,
      items: (prev.items || []).map((it, i) => 
        i === itemIndex ? { ...it, sysname: null, oriname: null, receipt: null } : it
      )
    }));
  };

  const calculateTotal = () => {
    const items = data.items || [];
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const applicant = isEditMode ? user : data;
  const displayDate = isEditMode ? today : (data?.created_at?.substring(0, 10) || '-');

  return (
    <>
      {/* [Desktop View] - 기존 스타일 완벽 유지 */}
      <div className="hidden md:block space-y-5">
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
                    <span>{data.pay_date?.substring(0, 10) || '-'}</span>
                  )}
                </td>
                <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청일</th>
                <td className="p-2">{displayDate}</td>
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
                            onKeyDown={(e) => {
                              if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                e.preventDefault();
                              }
                            }}
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
                                e.target.value = '';
                              }}
                            />
                          </label>
                          {(item.receipt?.name || item.oriname) && (
                            <span className="text-[9px] text-gray-500 truncate max-w-[80px]">
                              {item.receipt?.name || item.oriname}
                            </span>
                          )}
                          {errors.items?.[`${index}-receipt`] && !item.receipt && !item.oriname && (
                            <p className="text-[9px] text-red-500 mt-0.5 whitespace-nowrap">{errors.items[`${index}-receipt`]}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#3530B8]">
                          {item.oriname || (item.receipt instanceof File ? item.receipt.name : '-')}
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

        {/* 첨부파일 Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">첨부파일</h2>
          </div>
          <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50 min-h-[60px] flex items-center">
            <div className="flex flex-wrap gap-4 w-full">
              {data.items?.map((item, originalIdx) => {
                if(!(item.oriname || item.receipt instanceof File)) return null;
                return (
                  <div key={item.sysname || item.receipt?.name || originalIdx} className="flex items-center gap-2 text-xs text-[#3530B8] group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {item.sysname ? (
                      <a 
                        href={`http://localhost/file/download/${item.sysname}?token=${token}`} 
                        download 
                        className="hover:underline"
                      >
                        {item.oriname}
                      </a>
                    ) : (
                      <span className="text-gray-500">{item.receipt?.name}</span>
                    )}
                    {isEditMode && (
                      <button 
                        onClick={() => handleRemoveFile(originalIdx)}
                        className="text-gray-400 hover:text-red-500 ml-1 font-bold"
                      >✕</button>
                    )}
                  </div>
                );
              })}
              {!data.items?.some(it => it.oriname || it.receipt instanceof File) && (
                <p className="text-xs text-gray-400">첨부된 파일이 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* Referrer Selection Section */}
        <ReferrerSelector 
          value={data.referrers} 
          onChange={(val) => onChange(prev => ({ ...prev, referrers: val }))} 
          isEditMode={isEditMode} 
        />
      </div>

      {/* [Mobile View] - 새로운 모바일용 레이아웃 */}
      <div className="md:hidden space-y-6">
        {/* 제목 (모바일) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">제목</h2>
          </div>
          {isEditMode ? (
            <div className="space-y-1">
              <input 
                type="text"
                value={data.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="제목을 입력하세요"
                className={`w-full p-2.5 text-xs bg-white border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-lg outline-none`}
              />
              {errors.title && <p className="text-[10px] text-red-500">{errors.title}</p>}
            </div>
          ) : (
            <div className="p-2.5 bg-gray-50 rounded-lg text-xs border border-gray-100">{data.title || '-'}</div>
          )}
        </div>

        {/* 신청 정보 (모바일) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">신청 정보</h2>
          </div>
          <div className="border border-gray-200 rounded-lg text-xs">
            <div className="flex border-b border-gray-100">
              <div className="w-20 bg-gray-50 p-2 font-bold text-gray-500 border-r border-gray-100">성명</div>
              <div className="flex-grow p-2">{applicant?.name || '-'}</div>
            </div>
            <div className="flex border-b border-gray-100">
              <div className="w-20 bg-gray-50 p-2 font-bold text-gray-500 border-r border-gray-100">사번</div>
              <div className="flex-grow p-2">{applicant?.users_seq || '-'}</div>
            </div>
            <div className="flex border-b border-gray-100">
              <div className="w-20 bg-gray-50 p-2 font-bold text-gray-500 border-r border-gray-100">부서</div>
              <div className="flex-grow p-2">{applicant?.dept_name || '-'}</div>
            </div>
            <div className="flex border-b border-gray-100">
              <div className="w-20 bg-gray-50 p-2 font-bold text-gray-500 border-r border-gray-100">직급</div>
              <div className="flex-grow p-2">{applicant?.rank_name || '-'}</div>
            </div>
            <div className="flex border-b border-gray-100 relative overflow-visible">
              <div className="w-20 bg-gray-50 p-2 font-bold text-gray-500 border-r border-gray-100">지출일</div>
              <div className="flex-grow p-2 overflow-visible">
                {isEditMode ? (
                  <div className="relative">
                    <input 
                      type="text" 
                      readOnly 
                      value={data.pay_date || ''} 
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)} 
                      placeholder="날짜 선택" 
                      className="w-full p-1 border border-gray-200 rounded outline-none text-xs"
                    />
                    {isCalendarOpen && (
                      <div className="absolute z-50 left-0 w-full">
                        <Calendar 
                          value={data.pay_date} 
                          onChange={(d) => { handleFieldChange('pay_date', d); setIsCalendarOpen(false); }} 
                          onClose={() => setIsCalendarOpen(false)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <span>{data.pay_date?.substring(0, 10) || '-'}</span>
                )}
              </div>
            </div>
            <div className="flex">
              <div className="w-20 bg-gray-50 p-2 font-bold text-gray-500 border-r border-gray-100">신청일</div>
              <div className="flex-grow p-2">{displayDate}</div>
            </div>
          </div>
        </div>

        {/* 지출 목적 & 계좌 정보 (모바일) */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
              <h2 className="text-xs font-bold text-gray-800">지출 목적</h2>
            </div>
            {isEditMode ? (
              <div className="space-y-1">
                <textarea 
                  value={data.pay_reason || ''}
                  onChange={(e) => handleFieldChange('pay_reason', e.target.value)}
                  className={`w-full h-20 p-2.5 text-xs border ${errors.pay_reason ? 'border-red-500' : 'border-gray-200'} rounded-lg outline-none`}
                ></textarea>
                {errors.pay_reason && <p className="text-[10px] text-red-500">{errors.pay_reason}</p>}
              </div>
            ) : (
              <div className="p-2.5 bg-gray-50 rounded-lg text-xs border border-gray-100 min-h-[5rem] whitespace-pre-wrap">{data.pay_reason || '-'}</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
              <h2 className="text-xs font-bold text-gray-800">계좌 정보</h2>
            </div>
            {isEditMode ? (
              <div className="space-y-1">
                <textarea 
                  value={data.account_info || ''}
                  onChange={(e) => handleFieldChange('account_info', e.target.value)}
                  className={`w-full h-20 p-2.5 text-xs border ${errors.account_info ? 'border-red-500' : 'border-gray-200'} rounded-lg outline-none`}
                ></textarea>
                {errors.account_info && <p className="text-[10px] text-red-500">{errors.account_info}</p>}
              </div>
            ) : (
              <div className="p-2.5 bg-gray-50 rounded-lg text-xs border border-gray-100 min-h-[5rem] whitespace-pre-wrap">{data.account_info || '-'}</div>
            )}
          </div>
        </div>

        {/* 지출 항목 (모바일 카드 레이아웃) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
              <h2 className="text-xs font-bold text-gray-800">지출 항목</h2>
            </div>
            {isEditMode && (
              <button 
                onClick={handleAddRow}
                className="px-3 py-1 bg-[#3530B8] text-white text-[10px] font-bold rounded-full"
              >+ 추가</button>
            )}
          </div>
          
          <div className="space-y-4">
            {data.items?.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-white relative shadow-sm">
                {isEditMode && (
                  <button 
                    onClick={() => handleRemoveRow(index)}
                    className="absolute top-2 right-2 text-gray-400 p-1"
                  >✕</button>
                )}
                <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">항목명</label>
                  {isEditMode ? (
                    <div>
                      <input 
                        type="text"
                        value={item.item_name || ''}
                        onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                        className={`w-full p-1.5 text-xs border ${errors.items?.[`${index}-item_name`] ? 'border-red-500' : 'border-gray-200'} rounded outline-none`}
                      />
                      {errors.items?.[`${index}-item_name`] && <p className="text-[10px] text-red-500">{errors.items[`${index}-item_name`]}</p>}
                    </div>
                  ) : (
                    <div className="text-xs font-bold">{item.item_name || '-'}</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">금액(원)</label>
                    {isEditMode ? (
                      <div>
                        <input 
                          type="number"
                          min="0"
                          value={item.amount || ''}
                          onKeyDown={(e) => {
                            if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => handleItemChange(index, 'amount', Math.max(0, parseInt(e.target.value) || 0))}
                          className={`w-full p-1.5 text-xs border ${errors.items?.[`${index}-amount`] ? 'border-red-500' : 'border-gray-200'} rounded text-right outline-none`}
                        />
                        {errors.items?.[`${index}-amount`] && <p className="text-[10px] text-red-500">{errors.items[`${index}-amount`]}</p>}
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-[#3530B8]">{(Number(item.amount) || 0).toLocaleString()}원</div>
                    )}
                  </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase text-right block">영수증</label>
                      <div className="flex justify-end flex-col items-end">
                        {isEditMode ? (
                          <div className="flex flex-col items-end gap-1">
                            <label className={`cursor-pointer bg-gray-100 px-2 py-1 rounded text-[10px] hover:bg-gray-200 ${errors.items?.[`${index}-receipt`] ? 'border border-red-500' : ''}`}>
                              파일 선택
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => {
                                  handleItemChange(index, 'receipt', e.target.files[0]);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            {errors.items?.[`${index}-receipt`] && !item.receipt && !item.oriname && (
                                <p className="text-[10px] text-red-500">{errors.items[`${index}-receipt`]}</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-500 truncate max-w-[80px]">{item.oriname || '-'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">비고</label>
                    {isEditMode ? (
                      <input 
                        type="text"
                        value={item.note || ''}
                        onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                        className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none"
                      />
                    ) : (
                      <div className="text-xs text-gray-600">{item.note || '-'}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-[#F0F4FF] p-3 rounded-lg flex justify-between items-center">
            <span className="text-xs font-bold text-gray-600">합계 금액</span>
            <span className="text-sm font-black text-[#3530B8]">￦ {calculateTotal().toLocaleString()}</span>
          </div>
        </div>

        {/* 첨부파일 & Referrer (모바일) */}
        <div className="space-y-5">
           {/* 첨부파일 (모바일) */}
           <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
              <h2 className="text-xs font-bold text-gray-800">첨부파일</h2>
            </div>
            <div className="p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
              <div className="flex flex-col gap-2">
                {data.items?.map((item, idx) => {
                  if(!(item.oriname || item.receipt instanceof File)) return null;
                  return (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-[#3530B8] bg-white p-2 rounded border border-gray-100">
                      <span className="truncate flex-grow">{item.oriname || item.receipt?.name}</span>
                      {isEditMode && (
                        <button onClick={() => handleRemoveFile(idx)} className="ml-2 text-red-400">✕</button>
                      )}
                    </div>
                  );
                })}
                {!data.items?.some(it => it.oriname || it.receipt instanceof File) && (
                  <p className="text-[11px] text-gray-400 text-center">첨부된 파일이 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          <ReferrerSelector 
            value={data.referrers} 
            onChange={(val) => onChange(prev => ({ ...prev, referrers: val }))} 
            isEditMode={isEditMode} 
          />
        </div>
      </div>
    </>
  );
};

export default PaymentForm;
