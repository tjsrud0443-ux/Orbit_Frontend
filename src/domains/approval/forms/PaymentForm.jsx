import React, { useState, useEffect } from 'react';
import Calendar from '../../../components/common/Calendar';
import ReferrerSelector from '../components/ReferrerSelector';

const PaymentForm = ({ data, onChange, mode, user }) => {
  const isEditMode = mode === 'EDIT';
  const today = new Date().toISOString().split('T')[0];

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 초기 데이터 설정 (items가 없을 경우 기본 1행 추가)
  useEffect(() => {
    if (!data.items || data.items.length === 0) {
      handleFieldChange('items', [{ id: 1, itemName: '', amount: 0, receipt: null, note: '' }]);
    }
    if (!data.requestDate) {
      handleFieldChange('requestDate', today);
    }
  }, []);

  const handleFieldChange = (field, value) => {
    if (!onChange) return;
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
      { id: nextId, itemName: '', amount: 0, receipt: null, note: '' }
    ];
    handleFieldChange('items', newItems);
  };

  const handleRemoveRow = (index) => {
    const currentItems = [...(data.items || [])];
    if (currentItems.length <= 1) {
      alert('최소 한 개의 항목은 있어야 합니다.');
      return;
    }
    currentItems.splice(index, 1);
    // No. 재정렬
    const reorderedItems = currentItems.map((item, idx) => ({ ...item, id: idx + 1 }));
    handleFieldChange('items', reorderedItems);
  };

  const calculateTotal = () => {
    const items = data.items || [];
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  return (
    <div className="space-y-5">
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
              <td className="p-2 w-125 border-r border-gray-200">{user?.name || '-'}</td>
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">사번</th>
              <td className="p-2">{user?.users_seq || '-'}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">부서</th>
              <td className="p-2 border-r border-gray-200">{user?.dept_name || '-'}</td>
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">직급</th>
              <td className="p-2">{user?.rank_name || '-'}</td>
            </tr>
            <tr>
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">지출일</th>
              <td className="p-2 border-r border-gray-200">
                {isEditMode ? (
                  <div className="relative w-65">
                    <input 
                      type="text" 
                      readOnly 
                      value={data.expenditureDate || ''} 
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)} 
                      placeholder="지출일 선택" 
                      className={`w-full p-2 border ${isCalendarOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-300'} rounded-xl outline-none cursor-pointer text-xs transition-all pr-10`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {isCalendarOpen && (
                      <Calendar 
                        value={data.expenditureDate} 
                        onChange={(d) => { handleFieldChange('expenditureDate', d); setIsCalendarOpen(false); }} 
                        onClose={() => setIsCalendarOpen(false)}
                      />
                    )}
                  </div>
                ) : (
                  <span>{data.expenditureDate || '-'}</span>
                )}
              </td>
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청일</th>
              <td className="p-2">{data.requestDate || today}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 지출 목적 및 계좌 정보 Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">지출 목적</h2>
          </div>
          {isEditMode ? (
            <textarea 
              value={data.purpose || ''}
              onChange={(e) => handleFieldChange('purpose', e.target.value)}
              placeholder="지출 목적을 입력하세요"
              className="w-full h-20 p-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#3530B8] resize-none transition-all"
            ></textarea>
          ) : (
            <div className="w-full h-20 p-2 text-xs bg-gray-50 border border-gray-100 rounded-lg whitespace-pre-wrap overflow-y-auto">
              {data.purpose || '-'}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">계좌 정보</h2>
          </div>
          {isEditMode ? (
            <textarea 
              value={data.accountInfo || ''}
              onChange={(e) => handleFieldChange('accountInfo', e.target.value)}
              placeholder="은행명 / 계좌번호 / 예금주"
              className="w-full h-20 p-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#3530B8] resize-none transition-all"
            ></textarea>
          ) : (
            <div className="w-full h-20 p-2 text-xs bg-gray-50 border border-gray-100 rounded-lg whitespace-pre-wrap overflow-y-auto">
              {data.accountInfo || '-'}
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
            <button 
              onClick={handleAddRow}
              className="px-3 py-1 bg-[#3530B8] text-white text-[10px] font-bold rounded-full hover:bg-[#2a2696] transition-colors"
            >
              + 항목 추가
            </button>
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
                        min="0"
                        value={item.amount || ''}
                        onChange={(e) => handleItemChange(index, 'amount', Math.max(0, Number(e.target.value)))}
                        className="w-full p-1 bg-white border border-gray-300 rounded outline-none focus:border-[#3530B8] text-right"
                      />
                    ) : (
                      <div className="text-right">{(Number(item.amount) || 0).toLocaleString()}</div>
                    )}
                  </td>
                  <td className="p-2 border-r border-gray-200 text-center">
                    {isEditMode ? (
                      <div className="flex flex-col items-center gap-1">
                        <label className="cursor-pointer bg-white border border-gray-300 px-2 py-1 rounded text-[10px] hover:bg-gray-50">
                          파일 선택
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={(e) => handleItemChange(index, 'receipt', e.target.files[0])}
                          />
                        </label>
                        {item.receipt && <span className="text-[9px] text-gray-500 truncate max-w-[80px]">{item.receipt.name}</span>}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#3530B8] cursor-pointer hover:underline">
                        {item.receipt ? (typeof item.receipt === 'string' ? '영수증 보기' : item.receipt.name) : '-'}
                      </span>
                    )}
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
