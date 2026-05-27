import React, { useEffect } from 'react';
import ReferrerSelector from '../components/ReferrerSelector';

const GeneralForm = ({ data, onChange, mode, user }) => {
  const isEditMode = mode === 'EDIT';
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!data.requestDate) {
      handleFieldChange('requestDate', today);
    }
  }, []);

  const handleFieldChange = (field, value) => {
    if (!onChange) return;
    onChange({ ...data, [field]: value });
  };

  const applicant = isEditMode ? user : data;

  return (
    <div className="space-y-6">
      {/* 신청 정보 Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
          <h2 className="text-xs font-bold text-gray-800">신청자 정보</h2>
        </div>
        <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
          <tbody>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-3 border-r border-gray-200 text-left font-bold">성명</th>
              <td className="p-3 border-r border-gray-200">{applicant?.name || '-'}</td>
              <th className="w-24 bg-gray-50 p-3 border-r border-gray-200 text-left font-bold">사번</th>
              <td className="p-3">{applicant?.users_seq || '-'}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-3 border-r border-gray-200 text-left font-bold">부서</th>
              <td className="p-3 border-r border-gray-200">{applicant?.dept_name || '-'}</td>
              <th className="w-24 bg-gray-50 p-3 border-r border-gray-200 text-left font-bold">직급</th>
              <td className="p-3">{applicant?.rank_name || '-'}</td>
            </tr>
            <tr>
              <th className="w-24 bg-gray-50 p-3 border-r border-gray-200 text-left font-bold">신청일</th>
              <td className="p-3" colSpan={3}>{data.requestDate || today}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 품의 목적 Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
          <h2 className="text-xs font-bold text-gray-800">품의 목적</h2>
        </div>
        {isEditMode ? (
          <textarea 
            value={data.purpose || ''}
            onChange={(e) => handleFieldChange('purpose', e.target.value)}
            placeholder="품의 목적을 간략하게 입력하세요"
            className="w-full h-20 p-3 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 resize-none transition-all"
          ></textarea>
        ) : (
          <div className="w-full p-3 text-xs bg-gray-50 border border-gray-100 rounded-xl whitespace-pre-wrap">
            {data.purpose || '-'}
          </div>
        )}
      </div>

      {/* 품의 내용 Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
          <h2 className="text-xs font-bold text-gray-800">품의 내용</h2>
        </div>
        {isEditMode ? (
          <textarea 
            value={data.content || ''}
            onChange={(e) => handleFieldChange('content', e.target.value)}
            placeholder="품의 내용을 자유롭게 입력하세요"
            className="w-full h-80 p-4 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 resize-none transition-all"
          ></textarea>
        ) : (
          <div className="w-full min-h-[20rem] p-4 text-xs bg-gray-50 border border-gray-100 rounded-xl whitespace-pre-wrap overflow-y-auto">
            {data.content || '-'}
          </div>
        )}
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

export default GeneralForm;
