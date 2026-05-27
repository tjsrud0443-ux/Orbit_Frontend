import React, { useState } from 'react';
import Calendar from '../../../components/common/Calendar';
import ReferrerSelector from '../components/ReferrerSelector';

const VacationForm = ({ data, onChange, mode, user }) => {
  const isEditMode = mode === 'EDIT';
  const today = new Date().toLocaleDateString('sv-SE');
  
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

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

    updatedData.totalDays = Math.max(0, calculateDays(
      updatedData.vacationType || '연차', 
      updatedData.startDate, 
      updatedData.endDate
    ));

    onChange(updatedData);
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
          <input 
            type="text"
            value={data.title || ''}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all"
          />
        ) : (
          <div className="w-full p-2.5 text-xs bg-gray-50 border border-gray-100 rounded-xl">
            {data.title || '-'}
          </div>
        )}
      </div>

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
              <td className="p-2 border-r border-gray-200">{applicant?.name || '-'}</td>
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
      <ReferrerSelector 
        value={data.referrers} 
        onChange={(val) => onChange({ ...data, referrers: val })} 
        isEditMode={isEditMode} 
      />
    </div>
  );
};

export default VacationForm;
