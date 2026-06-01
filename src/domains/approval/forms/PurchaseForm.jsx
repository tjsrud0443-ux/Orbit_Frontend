import React, { useState, useEffect } from 'react';
import Calendar from '../../../components/common/Calendar';
import ReferrerSelector from '../components/ReferrerSelector';

const PurchaseForm = ({ data, onChange, mode, user, isSubmitClicked, isTempSaveClicked }) => {
  const isEditMode = mode === 'EDIT';
  const today = new Date().toLocaleDateString('sv-SE');

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // 초기 데이터 설정
  useEffect(() => {
    if (!data.items || data.items.length === 0) {
      handleFieldChange('items', [{ item_order: 1, item_name: '', ea: 1, unit_price: 0, note: '' }]);
    }
    if (!data.created_at) {
      handleFieldChange('created_at', today);
    }
  }, []);

  useEffect(() => {
    if (isSubmitClicked) {
      const newErrors = {};
      newErrors.title = validateField('title', data.title);
      newErrors.purchase_date = validateField('purchase_date', data.purchase_date);
      newErrors.purpose = validateField('purpose', data.purpose);
      newErrors.vendor = validateField('vendor', data.vendor);
      newErrors.attachments = (!data.attachments || data.attachments.length === 0) ? '파일을 첨부해주세요.' : '';
      
      const itemErrors = {};
      data.items?.forEach((item, index) => {
        if (!item.item_name?.trim()) itemErrors[`${index}-item_name`] = '품목명을 입력해주세요.';
        else if (item.item_name.length > 50) itemErrors[`${index}-item_name`] = '글자 수 초과 (50자 이하)';
        
        if (!item.ea || item.ea <= 0) itemErrors[`${index}-ea`] = '수량을 입력해주세요.';
        if (!item.unit_price || item.unit_price <= 0) itemErrors[`${index}-unit_price`] = '단가를 입력해주세요.';
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
    if (!value && field !== 'items' && field !== 'attachments') {
      if (field === 'title') error = '제목을 입력해주세요.';
      if (field === 'purchase_date') error = '구매 요청일을 선택해주세요.';
      if (field === 'purpose') error = '구매 목적을 입력해주세요.';
      if (field === 'vendor') error = '구매처를 입력해주세요.';
    }

    if (value) {
      if (field === 'title' && value.length > 50) error = '글자 수 초과 (50자 이하)';
      if (field === 'purpose' && value.length > 300) error = '글자 수 초과 (300자 이하)';
      if (field === 'vendor' && value.length > 50) error = '글자 수 초과 (50자 이하)';
    }

    if (field === 'purchase_date' && value && value < today) {
      error = '구매 요청일은 오늘 이후여야 합니다.';
    }

    return error;
  };

  const handleFieldChange = (field, value) => {
    if (!onChange) return;
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    onChange(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      const ea = Number(newItems[index].ea) || 0;
      const unit_price = Number(newItems[index].unit_price) || 0;
      newItems[index].total_price = ea * unit_price;
      const total_amount = newItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
      return { ...prev, items: newItems, total_amount };
    });

    const itemErrors = { ...(errors.items || {}) };
    if (!value && (field === 'item_name' || field === 'ea' || field === 'unit_price')) {
      if (field === 'item_name') itemErrors[`${index}-item_name`] = '품목명을 입력해주세요.';
      if (field === 'ea') itemErrors[`${index}-ea`] = '수량을 입력해주세요.';
      if (field === 'unit_price') itemErrors[`${index}-unit_price`] = '단가를 입력해주세요.';
    } else {
      if (field === 'item_name' && value.length > 50) {
        itemErrors[`${index}-item_name`] = '글자 수 초과 (50자 이하)';
      } else {
        delete itemErrors[`${index}-${field}`];
      }
    }
    setErrors(prev => ({ ...prev, items: itemErrors }));
  };

  const handleRemoveAttachment = (targetIdx) => {
    onChange(prev => {
      const currentAttachments = prev.attachments || [];
      // const targetFile = currentAttachments[idx];
      const filteredFiles = currentAttachments.filter((_, i) => i !== targetIdx);
      
      if (filteredFiles.length === 0) {
        setErrors(err => ({ ...err, attachments: '파일을 첨부해주세요.' }));
      }

      // if (targetFile && targetFile.attachment_seq) {
      //   const deletedSeqs = prev.deletedAttachmentSeqs || [];
      //   return {
      //     ...prev,
      //     attachments: filteredFiles,
      //     deletedAttachmentSeqs: [...deletedSeqs, targetFile.attachment_seq]
      //   };
      // }
      return { ...prev, attachments: filteredFiles };
    });
  };

  const handleAddRow = () => {
    onChange(prev => {
      const currentItems = prev.items || [];
      const nextOrder = currentItems.length > 0 ? Math.max(...currentItems.map(i => i.item_order || 0)) + 1 : 1;
      return {
        ...prev,
        items: [...currentItems, { item_order: nextOrder, item_name: '', ea: 1, unit_price: 0, note: '' }]
      };
    });
  };

  const handleRemoveRow = (index) => {
    onChange(prev => {
      const currentItems = prev.items || [];
      if (currentItems.length <= 1) {
        setErrors(err => ({ ...err, itemMin: '최소 한 개의 품목은 있어야 합니다.' }));
        setTimeout(() => setErrors(err => ({ ...err, itemMin: '' })), 3000);
        return prev;
      }
      const filteredItems = currentItems.filter((_, i) => i !== index);
      const reorderedItems = filteredItems.map((item, idx) => ({ ...item, item_order: idx + 1 }));
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
      return { ...prev, items: reorderedItems };
    });
  };

  const calculateTotal = () => {
    const items = data.items || [];
    return items.reduce((sum, item) => sum + (Number(item.ea) * Number(item.unit_price) || 0), 0);
  };

  const applicant = isEditMode ? user : data;
  const displayDate = isEditMode ? today : (data?.created_at?.substring(0, 10) || '-');
  const token = sessionStorage.getItem("token");

  return (
    <div className="space-y-6">
      {/* 제목 Section */}
      <div className="space-y-3">
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
              className={`w-full p-3 text-xs bg-white border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all`}
            />
            {errors.title && <p className="mt-1 text-[10px] text-red-500">{errors.title}</p>}
          </div>
        ) : (
          <div className="w-full p-3 text-xs bg-gray-50 border border-gray-100 rounded-xl">
            {data.title || '-'}
          </div>
        )}
      </div>

      {/* 신청 정보 Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
          <h2 className="text-xs font-bold text-gray-800">신청 정보</h2>
        </div>
        <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
          <tbody>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-2.5 border-r border-gray-200 text-left font-bold">성명</th>
              <td className="p-2.5 w-125 border-r border-gray-200">{applicant?.name || '-'}</td>
              <th className="w-24 bg-gray-50 p-2.5 border-r border-gray-200 text-left font-bold">사번</th>
              <td className="p-2.5 w-125">{applicant?.users_seq || '-'}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-2.5 border-r border-gray-200 text-left font-bold">부서</th>
              <td className="p-2.5 w-125 border-r border-gray-200">{applicant?.dept_name || '-'}</td>
              <th className="w-24 bg-gray-50 p-2.5 border-r border-gray-200 text-left font-bold">직급</th>
              <td className="p-2.5 w-125">{applicant?.rank_name || '-'}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-2.5 border-r border-gray-200 text-left font-bold">구매 요청일</th>
              <td className="p-2.5 w-125 border-r border-gray-200">
                {isEditMode ? (
                  <div className="relative w-65">
                    <div className="relative h-[34px]">
                      <input 
                        type="text" 
                        readOnly 
                        value={data.purchase_date || ''} 
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)} 
                        placeholder="요청일 선택" 
                        className={`w-full h-full p-2 border ${errors.purchase_date ? 'border-red-500' : isCalendarOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-300'} rounded-lg outline-none cursor-pointer text-[11px] transition-all pr-10`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {isCalendarOpen && (
                        <Calendar 
                          value={data.purchase_date} 
                          onChange={(d) => { handleFieldChange('purchase_date', d); setIsCalendarOpen(false); }} 
                          onClose={() => setIsCalendarOpen(false)}
                        />
                      )}
                    </div>
                    {errors.purchase_date && (
                      <p className="absolute left-0 top-full mt-3 text-[10px] text-red-500 whitespace-nowrap">
                        {errors.purchase_date}
                      </p>
                    )}
                  </div>
                ) : (
                  <span>{data.purchase_date?.substring(0, 10) || '-'}</span>
                )}
              </td>
              <th className="w-24 bg-gray-50 p-2.5 border-r border-gray-200 text-left font-bold">신청일</th>
              <td className="p-2.5">{displayDate}</td>
            </tr>
          </tbody>
        </table>
        {isEditMode && errors.purchase_date && <div className="h-4"></div>}
      </div>

      {/* 구매 목적 및 구매처 Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">구매 목적</h2>
          </div>
          {isEditMode ? (
            <div>
              <textarea 
                value={data.purpose || ''}
                onChange={(e) => handleFieldChange('purpose', e.target.value)}
                placeholder="구매 목적을 입력하세요 (300자 이하)"
                maxLength={300}
                className={`w-full h-20 p-3 text-xs bg-white border ${errors.purpose ? 'border-red-500' : 'border-gray-200'} rounded-lg outline-none focus:border-[#3530B8] resize-none transition-all`}
              ></textarea>
              {errors.purpose && <p className="mt-1 text-[10px] text-red-500">{errors.purpose}</p>}
            </div>
          ) : (
            <div className="w-full h-20 p-3 text-xs bg-gray-50 border border-gray-100 rounded-lg whitespace-pre-wrap overflow-y-auto">
              {data.purpose || '-'}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">구매처</h2>
          </div>
          {isEditMode ? (
            <div>
              <textarea 
                value={data.vendor || ''}
                onChange={(e) => handleFieldChange('vendor', e.target.value)}
                placeholder="구매처 정보를 입력하세요 (50자 이하)"
                maxLength={50}
                className={`w-full h-20 p-3 text-xs bg-white border ${errors.vendor ? 'border-red-500' : 'border-gray-200'} rounded-lg outline-none focus:border-[#3530B8] resize-none transition-all`}
              ></textarea>
              {errors.vendor && <p className="mt-1 text-[10px] text-red-500">{errors.vendor}</p>}
            </div>
          ) : (
            <div className="w-full h-20 p-3 text-xs bg-gray-50 border border-gray-100 rounded-lg whitespace-pre-wrap overflow-y-auto">
              {data.vendor || '-'}
            </div>
          )}
        </div>
      </div>

      {/* 구매 품목 Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">구매 품목</h2>
          </div>
          {isEditMode && (
            <div className="flex flex-col items-end gap-1">
              <button 
                onClick={handleAddRow}
                className="px-3 py-1 bg-[#3530B8] text-white text-[10px] font-bold rounded-full hover:bg-[#2a2696] transition-colors"
              >
                + 품목 추가
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
                <th className="p-2 border-r border-gray-200 text-center font-bold">품목명</th>
                <th className="w-20 p-2 border-r border-gray-200 text-center font-bold">수량</th>
                <th className="w-32 p-2 border-r border-gray-200 text-center font-bold">단가(원)</th>
                <th className="w-32 p-2 border-r border-gray-200 text-center font-bold">합계(원)</th>
                <th className="p-2 border-r border-gray-200 text-center font-bold">비고</th>
                {isEditMode && <th className="w-12 p-2 text-center font-bold">삭제</th>}
              </tr>
            </thead>
            <tbody>
              {data.items?.map((item, index) => {
                const itemTotal = (Number(item.ea) || 0) * (Number(item.unit_price) || 0);
                return (
                  <tr key={index} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                    <td className="p-2 border-r border-gray-200 text-center">{index + 1}</td>
                    <td className="p-2 border-r border-gray-200">
                      {isEditMode ? (
                        <div>
                          <input 
                            type="text"
                            value={item.item_name || ''}
                            onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                            maxLength={50}
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
                            value={item.ea || ''}
                            min="0"
                            onChange={(e) => handleItemChange(index, 'ea', Math.max(0, Number(e.target.value)))}
                            className={`w-full p-1 bg-white border ${errors.items?.[`${index}-ea`] ? 'border-red-500' : 'border-gray-300'} rounded outline-none focus:border-[#3530B8] text-center`}
                          />
                          {errors.items?.[`${index}-ea`] && <p className="text-[9px] text-red-500 mt-0.5">{errors.items[`${index}-ea`]}</p>}
                        </div>
                      ) : (
                        <div className="text-center">{item.ea}</div>
                      )}
                    </td>
                    <td className="p-2 border-r border-gray-200">
                      {isEditMode ? (
                        <div>
                          <input 
                            type="number"
                            value={item.unit_price || ''}
                            min="0"
                            onChange={(e) => handleItemChange(index, 'unit_price', Math.max(0, Number(e.target.value)))}
                            className={`w-full p-1 bg-white border ${errors.items?.[`${index}-unit_price`] ? 'border-red-500' : 'border-gray-300'} rounded outline-none focus:border-[#3530B8] text-right`}
                          />
                          {errors.items?.[`${index}-unit_price`] && <p className="text-[9px] text-red-500 mt-0.5">{errors.items[`${index}-unit_price`]}</p>}
                        </div>
                      ) : (
                        <div className="text-right">{(Number(item.unit_price) || 0).toLocaleString()}</div>
                      )}
                    </td>
                    <td className="p-2 border-r border-gray-200 text-right bg-gray-50/30">
                      {itemTotal.toLocaleString()}
                    </td>
                    <td className="p-2 border-r border-gray-200">
                      {isEditMode ? (
                        <input 
                          type="text"
                          value={item.note || ''}
                          onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                          maxLength={100}
                          className="w-full p-1 bg-white border border-gray-300 rounded outline-none focus:border-[#3530B8]"
                        />
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
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={4} className="p-2 border-r border-gray-200 text-center text-gray-600">총 구매 예산</td>
                <td className="p-2 border-r border-gray-200 text-right text-[#3530B8]">
                  ￦ {calculateTotal().toLocaleString()}
                </td>
                <td colSpan={isEditMode ? 2 : 1} className="p-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 첨부파일 Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">첨부파일</h2>
            {isEditMode && errors.attachments && (!data.attachments || data.attachments.length === 0) && (
              <span className="text-[10px] text-red-500 ml-2 animate-pulse">{errors.attachments}</span>
            )}
          </div>
          {isEditMode && (
            <label className="cursor-pointer bg-[#3530B8] text-white px-3 py-1 rounded-full text-[10px] font-bold hover:bg-[#2a2696] transition-colors shadow-sm">
              파일 선택
              <input 
                type="file" 
                multiple
                className="hidden" 
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files);
                  onChange(prev => ({
                    ...prev,
                    attachments: [...(prev.attachments || []), ...newFiles]
                  }));
                  if (newFiles.length > 0) setErrors(prev => ({ ...prev, attachments: '' }));
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>
        <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50 min-h-[60px] flex items-center">
          <div className="flex flex-wrap gap-4 w-full">
            {data.attachments && data.attachments.length > 0 ? (
              data.attachments.map((file, idx) => (
                <div key={file.sysname || file.name || idx} className="flex items-center gap-2 text-xs text-[#3530B8] group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {file.sysname ? (
                    <a 
                      href={`http://localhost/file/download/${file.sysname}?token=${token}`} 
                      download 
                      className="hover:underline"
                    >
                      {file.oriname}
                    </a>
                  ) : (
                    <span className="text-gray-500">{file.name}</span>
                  )}
                  {isEditMode && (
                    <button 
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-gray-400 hover:text-red-500 ml-1 font-bold"
                    >✕</button>
                  )}
                </div>
              ))
            ) : (
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
  );
};

export default PurchaseForm;
