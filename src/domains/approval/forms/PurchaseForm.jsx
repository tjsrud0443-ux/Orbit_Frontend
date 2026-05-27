import React, { useState, useEffect } from 'react';
import Calendar from '../../../components/common/Calendar';

const PurchaseForm = ({ data, onChange, mode, user }) => {
  const isEditMode = mode === 'EDIT';
  const today = new Date().toISOString().split('T')[0];

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 초기 데이터 설정
  useEffect(() => {
    if (!data.items || data.items.length === 0) {
      handleFieldChange('items', [{ id: 1, itemName: '', quantity: 1, unitPrice: 0, note: '' }]);
    }
    if (!data.requestDate) {
      handleFieldChange('requestDate', today);
    }
  }, []);

  const handleFieldChange = (field, value) => {
    if (!onChange) return;

    // 구매 요청일 선택 시 오늘 이전 날짜는 선택 불가
    if (field === 'purchaseRequestDate' && value < today) {
      alert('구매 요청일은 오늘 이후여야 합니다.');
      return;
    }

    onChange({ ...data, [field]: value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...(data.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    handleFieldChange('items', newItems);
  };

  const handleAddRow = () => {
    const currentItems = data.items || [];
    const nextId = currentItems.length > 0 ? Math.max(...currentItems.map(i => i.id)) + 1 : 1;
    const newItems = [
      ...currentItems,
      { id: nextId, itemName: '', quantity: 1, unitPrice: 0, note: '' }
    ];
    handleFieldChange('items', newItems);
  };

  const handleRemoveRow = (index) => {
    const currentItems = [...(data.items || [])];
    if (currentItems.length <= 1) {
      alert('최소 한 개의 품목은 있어야 합니다.');
      return;
    }
    currentItems.splice(index, 1);
    const reorderedItems = currentItems.map((item, idx) => ({ ...item, id: idx + 1 }));
    handleFieldChange('items', reorderedItems);
  };

  const calculateTotal = () => {
    const items = data.items || [];
    return items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice) || 0), 0);
  };

  return (
    <div className="space-y-6">
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
              <td className="p-2.5 w-125 border-r border-gray-200">{user?.name || '-'}</td>
              <th className="w-24 bg-gray-50 p-2.5 border-r border-gray-200 text-left font-bold">사번</th>
              <td className="p-2.5 w-125">{user?.users_seq || '-'}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-2.5 border-r border-gray-200 text-left font-bold">부서</th>
              <td className="p-2.5 w-125 border-r border-gray-200">{user?.dept_name || '-'}</td>
              <th className="w-24 bg-gray-50 p-2.5 border-r border-gray-200 text-left font-bold">직급</th>
              <td className="p-2.5 w-125">{user?.rank_name || '-'}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-2.5 border-r border-gray-200 text-left font-bold">구매 요청일</th>
              <td className="p-2.5 w-125 border-r border-gray-200">
                {isEditMode ? (
                  <div className="relative w-65">
                    <input 
                      type="text" 
                      readOnly 
                      value={data.purchaseRequestDate || ''} 
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)} 
                      placeholder="요청일 선택" 
                      className={`w-full p-2 border ${isCalendarOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-300'} rounded-lg outline-none cursor-pointer text-[11px] transition-all pr-10`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {isCalendarOpen && (
                      <Calendar 
                        value={data.purchaseRequestDate} 
                        onChange={(d) => { handleFieldChange('purchaseRequestDate', d); setIsCalendarOpen(false); }} 
                        onClose={() => setIsCalendarOpen(false)}
                      />
                    )}
                  </div>
                ) : (
                  <span>{data.purchaseRequestDate || '-'}</span>
                )}
              </td>
              <th className="w-24 bg-gray-50 p-2.5 border-r border-gray-200 text-left font-bold">신청일</th>
              <td className="p-2.5">{data.requestDate || today}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 구매 목적 및 구매처 Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">구매 목적</h2>
          </div>
          {isEditMode ? (
            <textarea 
              value={data.purchasePurpose || ''}
              onChange={(e) => handleFieldChange('purchasePurpose', e.target.value)}
              placeholder="구매 목적을 입력하세요"
              className="w-full h-20 p-3 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#3530B8] resize-none transition-all"
            ></textarea>
          ) : (
            <div className="w-full h-20 p-3 text-xs bg-gray-50 border border-gray-100 rounded-lg whitespace-pre-wrap overflow-y-auto">
              {data.purchasePurpose || '-'}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">구매처</h2>
          </div>
          {isEditMode ? (
            <textarea 
              value={data.supplier || ''}
              onChange={(e) => handleFieldChange('supplier', e.target.value)}
              placeholder="구매처 정보를 입력하세요"
              className="w-full h-20 p-3 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#3530B8] resize-none transition-all"
            ></textarea>
          ) : (
            <div className="w-full h-20 p-3 text-xs bg-gray-50 border border-gray-100 rounded-lg whitespace-pre-wrap overflow-y-auto">
              {data.supplier || '-'}
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
            <button 
              onClick={handleAddRow}
              className="px-3 py-1 bg-[#3530B8] text-white text-[10px] font-bold rounded-full hover:bg-[#2a2696] transition-colors"
            >
              + 품목 추가
            </button>
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
                const itemTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                return (
                  <tr key={index} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                    <td className="p-2 border-r border-gray-200 text-center">{item.id}</td>
                    <td className="p-2 border-r border-gray-200">
                      {isEditMode ? (
                        <input 
                          type="text"
                          value={item.itemName || ''}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          className="w-full p-1 bg-white border border-gray-300 rounded outline-none focus:border-[#3530B8]"
                        />
                      ) : (
                        <span>{item.itemName || '-'}</span>
                      )}
                    </td>
                    <td className="p-2 border-r border-gray-200">
                      {isEditMode ? (
                        <input 
                          type="number"
                          value={item.quantity || ''}
                          min="0"
                          onChange={(e) => handleItemChange(index, 'quantity', Math.max(0, Number(e.target.value)))}
                          className="w-full p-1 bg-white border border-gray-300 rounded outline-none focus:border-[#3530B8] text-center"
                        />
                      ) : (
                        <div className="text-center">{item.quantity}</div>
                      )}
                    </td>
                    <td className="p-2 border-r border-gray-200">
                      {isEditMode ? (
                        <input 
                          type="number"
                          value={item.unitPrice || ''}
                          min="0"
                          onChange={(e) => handleItemChange(index, 'unitPrice', Math.max(0, Number(e.target.value)))}
                          className="w-full p-1 bg-white border border-gray-300 rounded outline-none focus:border-[#3530B8] text-right"
                        />
                      ) : (
                        <div className="text-right">{(Number(item.unitPrice) || 0).toLocaleString()}</div>
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
          </div>
          {isEditMode && (
            <label className="cursor-pointer bg-[#3530B8] text-white px-3 py-1 rounded-full text-[10px] font-bold hover:bg-[#2a2696] transition-colors shadow-sm">
              파일 선택
              <input 
                type="file" 
                multiple
                className="hidden" 
                onChange={(e) => handleFieldChange('attachments', [...(data.attachments || []), ...Array.from(e.target.files)])}
              />
            </label>
          )}
        </div>
        <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50 min-h-[60px] flex items-center">
          {isEditMode ? (
            <div className="flex flex-wrap gap-2 w-full">
              {data.attachments && data.attachments.length > 0 ? (
                data.attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 text-[10px] text-gray-600 shadow-sm">
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button 
                      onClick={() => handleFieldChange('attachments', data.attachments.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >✕</button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">선택된 파일이 없습니다.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 w-full">
              {data.attachments && data.attachments.length > 0 ? (
                data.attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#3530B8] cursor-pointer hover:underline">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span>{typeof file === 'string' ? file : file.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">첨부된 파일이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseForm;
