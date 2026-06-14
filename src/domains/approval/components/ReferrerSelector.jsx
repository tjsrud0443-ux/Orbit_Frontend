import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useEmployeeStore from '../../../store/useEmployeeStore';
import useUserStore from '../../../store/userStore';
import { alertWarning } from "../../../utils/alert";

const ReferrerSelector = ({ value = [], onChange, isEditMode }) => {
  const { allEmployees } = useEmployeeStore();
  const { user } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  // 드롭다운 위치 계산 함수
  const updateDropdownPos = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  }, []);

  // 화면 리사이즈나 스크롤 시 위치 업데이트
  useEffect(() => {
    if (showResults) {
      updateDropdownPos();
      window.addEventListener('resize', updateDropdownPos);
      window.addEventListener('scroll', updateDropdownPos, true);
    }
    return () => {
      window.removeEventListener('resize', updateDropdownPos);
      window.removeEventListener('scroll', updateDropdownPos, true);
    };
  }, [showResults, updateDropdownPos]);

  // 검색 쿼리에 따른 필터링 (기안자 제외)
  const filteredEmployees = searchQuery 
    ? allEmployees.filter(emp => {
        if (emp.users_seq === user?.users_seq) return false;
        
        const name = emp?.name || '';
        const deptName = emp?.dept_name || '';
        return name.includes(searchQuery) || deptName.includes(searchQuery);
      }) 
    : [];

  const handleAddReferrer = (emp) => {
    if (value.some(r => r.users_seq === emp.users_seq)) {
      alertWarning('중복 입력', '이미 추가된 참조자입니다.');
      return;
    }
    onChange([...value, emp]);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleRemoveReferrer = (idx) => {
    const newReferrers = [...value];
    newReferrers.splice(idx, 1);
    onChange(newReferrers);
  };

  const renderDropdown = () => {
    if (!showResults || !searchQuery) return null;

    const dropdown = (
      <div 
        className="fixed z-[9999] bg-white border border-gray-100 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar"
        style={{ 
          top: `${dropdownPos.top + 4}px`, 
          left: `${dropdownPos.left}px`, 
          width: `${dropdownPos.width}px` 
        }}
      >
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(emp => (
            <div 
              key={emp.users_seq || emp.id} 
              onClick={() => handleAddReferrer(emp)}
              className="p-3 hover:bg-[#F0F4FF] cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-700">{emp.name}</span>
                <span className="text-[10px] text-gray-400">{emp.dept_name}</span>
              </div>
              <span className="text-[10px] font-bold text-[#3530B8] bg-[#F0F4FF] px-2 py-0.5 rounded-full">{emp.rank_name}</span>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-xs text-gray-400">검색 결과가 없습니다.</div>
        )}
      </div>
    );

    return createPortal(dropdown, document.body);
  };

  return (
    <div className="space-y-2 mt-6">
      <div className="flex items-center gap-2">
        <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
        <h2 className="text-xs font-bold text-gray-800">참조자 선택</h2>
      </div>
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
        {isEditMode ? (
          <div className="space-y-3">
            <div className="relative">
              <input 
                ref={inputRef}
                type="text" 
                placeholder="이름/부서로 검색하여 참조자를 추가하세요"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#3530B8] transition-all"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                  updateDropdownPos();
                }}
                onFocus={() => {
                  setShowResults(true);
                  updateDropdownPos();
                }}
              />
              
              {renderDropdown()}
              {showResults && searchQuery && (
                <div className="fixed inset-0 z-[9998]" onClick={() => setShowResults(false)}></div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {value?.map((ref, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1 rounded-full text-[10px] font-bold text-gray-700 shadow-sm animate-in zoom-in-95">
                  <span>{ref.name} ({ref.dept_name})</span>
                  <button onClick={() => handleRemoveReferrer(idx)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value && value.length > 0 ? (
              value.map((ref, idx) => (
                <div key={idx} className="bg-white border border-gray-100 px-3 py-1 rounded-full text-[10px] font-medium text-gray-600">
                  {ref.name} ({ref.dept_name} {ref.rank_name})
                </div>
              ))
            ) : (
              <span className="text-xs text-gray-400">지정된 참조자가 없습니다.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferrerSelector;
