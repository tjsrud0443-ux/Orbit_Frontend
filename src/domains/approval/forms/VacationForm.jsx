import React, { useState, useEffect } from 'react';
import Calendar from '../../../components/common/Calendar';

const VacationForm = ({ data, onChange, mode, user }) => {
  const isEditMode = mode === 'EDIT';
  const today = new Date().toISOString().split('T')[0];
  
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  
  // 참조자 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  // 임시 직원 데이터 (실제 서비스에서는 API로 연동 권장)
  const mockEmployees = [
    { id: 1, name: '김철수', dept_name: '개발본부', rank_name: '팀장' },
    { id: 2, name: '이영희', dept_name: '인사팀', rank_name: '과장' },
    { id: 3, name: '박지민', dept_name: '경영지원팀', rank_name: '대리' },
    { id: 4, name: '최유진', dept_name: '마케팅팀', rank_name: '본부장' },
    { id: 5, name: '한소희', dept_name: '디자인팀', rank_name: '사원' },
  ];

  const filteredEmployees = searchQuery 
    ? mockEmployees.filter(emp => 
        emp.name.includes(searchQuery) || emp.dept_name.includes(searchQuery)
      ) 
    : [];

  const handleFieldChange = (field, value) => {
    if (!onChange) return;

    let updatedData = { ...data, [field]: value };

    // 1. 날짜 제약 조건 검증
    if (field === 'startDate') {
      if (value < today) {
        alert('시작 날짜는 오늘 이후여야 합니다.');
        return;
      }
      if (data.endDate && value > data.endDate) {
        updatedData.endDate = ''; // 시작일이 종료일보다 늦어지면 종료일 리셋
      }
    }

    if (field === 'endDate') {
      if (data.startDate && value < data.startDate) {
        alert('종료 날짜는 시작 날짜 이후여야 합니다.');
        return;
      }
    }

    // 2. 신청 일수 자동 계산
    const calculateDays = (type, start, end) => {
      if (type !== '연차') return 0.5;
      if (!start || !end) return 0;
      const s = new Date(start);
      const e = new Date(end);
      const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 0;
    };

    updatedData.totalDays = calculateDays(
      updatedData.vacationType || '연차', 
      updatedData.startDate, 
      updatedData.endDate
    );

    onChange(updatedData);
  };

  const handleAddReferrer = (emp) => {
    const currentReferrers = data.referrers || [];
    if (currentReferrers.some(r => r.id === emp.id)) {
      alert('이미 추가된 참조자입니다.');
      return;
    }
    onChange({ ...data, referrers: [...currentReferrers, emp] });
    setSearchQuery('');
    setShowResults(false);
  };

  const handleRemoveReferrer = (idx) => {
    const newReferrers = [...(data.referrers || [])];
    newReferrers.splice(idx, 1);
    onChange({ ...data, referrers: newReferrers });
  };

  return (
    <div className="space-y-5">
      {/* Applicant Info Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
          <h2 className="text-xs font-bold text-gray-800">신청자 정보</h2>
        </div>
        <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
          <tbody>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">성명</th>
              <td className="p-2 border-r border-gray-200">{user?.name || '-'}</td>
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
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청일</th>
              <td colSpan="3" className="p-2">{today}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Vacation Details Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
          <h2 className="text-xs font-bold text-gray-800">휴가 신청 내용</h2>
        </div>
        <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
          <tbody>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">연차 종류</th>
              <td className="p-2">
                {isEditMode ? (
                  <select 
                    value={data.vacationType || '연차'}
                    onChange={(e) => handleFieldChange('vacationType', e.target.value)}
                    className="w-full p-1 bg-white border border-gray-300 rounded outline-none focus:border-[#3530B8]"
                  >
                    <option value="연차">연차</option>
                    <option value="오전반차">오전반차</option>
                    <option value="오후반차">오후반차</option>
                  </select>
                ) : (
                  <span>{data.vacationType}</span>
                )}
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청 기간</th>
              <td className="p-2">
                {isEditMode ? (
                  <div className="flex items-center gap-2">
                    <div className="relative w-50">
                      <input 
                        type="text" 
                        readOnly 
                        value={data.startDate || ''} 
                        onClick={() => { setIsStartCalendarOpen(!isStartCalendarOpen); setIsEndCalendarOpen(false); }} 
                        placeholder="시작일" 
                        className={`w-full p-2 border ${isStartCalendarOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-300'} rounded-xl outline-none cursor-pointer text-xs transition-all`}
                      />
                      {isStartCalendarOpen && (
                        <Calendar 
                          value={data.startDate} 
                          onChange={(d) => { handleFieldChange('startDate', d); setIsStartCalendarOpen(false); }} 
                          onClose={() => setIsStartCalendarOpen(false)}
                        />
                      )}
                    </div>
                    {data.vacationType === '연차' && (
                      <>
                        <span className="px-1">~</span>
                        <div className="relative w-50">
                          <input 
                            type="text" 
                            readOnly 
                            value={data.endDate || ''} 
                            onClick={() => { setIsEndCalendarOpen(!isEndCalendarOpen); setIsStartCalendarOpen(false); }} 
                            placeholder="종료일" 
                            className={`w-full p-2 border ${isEndCalendarOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-300'} rounded-xl outline-none cursor-pointer text-xs transition-all`}
                          />
                          {isEndCalendarOpen && (
                            <Calendar 
                              value={data.endDate} 
                              onChange={(d) => { handleFieldChange('endDate', d); setIsEndCalendarOpen(false); }} 
                              onClose={() => setIsEndCalendarOpen(false)}
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <span>{data.startDate} {data.vacationType === '연차' ? `~ ${data.endDate}` : ''}</span>
                )}
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청 일수</th>
              <td className="p-2 font-bold text-[#3530B8]">{data.totalDays || 0}일</td>
            </tr>
            <tr>
              <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청 사유</th>
              <td className="p-2">
                {isEditMode ? (
                  <textarea 
                    value={data.reason || ''}
                    onChange={(e) => handleFieldChange('reason', e.target.value)}
                    placeholder="사유를 입력하세요"
                    className="w-full h-25 p-2 bg-white border border-gray-300 rounded outline-none focus:border-[#3530B8] resize-none"
                  ></textarea>
                ) : (
                  <div className="min-h-[4rem] whitespace-pre-wrap">{data.reason}</div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Referrer Selection Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
          <h2 className="text-xs font-bold text-gray-800">참조자 선택</h2>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
          {isEditMode ? (
            <div className="space-y-3">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="이름/부서로 검색하여 참조자를 추가하세요"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#3530B8] transition-all"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                />
                
                {/* Search Results Dropdown */}
                {showResults && searchQuery && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map(emp => (
                        <div 
                          key={emp.id} 
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
                )}
                {showResults && searchQuery && <div className="fixed inset-0 z-10" onClick={() => setShowResults(false)}></div>}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {data.referrers?.map((ref, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1 rounded-full text-[10px] font-bold text-gray-700 shadow-sm animate-in zoom-in-95">
                    <span>{ref.name} ({ref.dept_name})</span>
                    <button onClick={() => handleRemoveReferrer(idx)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.referrers && data.referrers.length > 0 ? (
                data.referrers.map((ref, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 px-3 py-1 rounded-full text-[10px] font-medium text-gray-600">
                    {ref.name} ({ref.dept_name} {ref.rank_name})
                  </div>
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">지정된 참조자가 없습니다.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VacationForm;
