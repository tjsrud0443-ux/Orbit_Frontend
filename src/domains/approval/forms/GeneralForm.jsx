import React, { useState, useEffect } from 'react';
import ReferrerSelector from '../components/ReferrerSelector';

const GeneralForm = ({ data, onChange, mode, user, isSubmitClicked }) => {

  const isEditMode = mode === 'EDIT';
  const today = new Date().toLocaleDateString('sv-SE');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isSubmitClicked) {
      const newErrors = {};
      newErrors.title = validateField('title', data.title || data?.TITLE);
      newErrors.purpose = validateField('purpose', data.purpose || data?.PURPOSE);
      newErrors.content = validateField('content', data.content || data?.CONTENT);
      setErrors(newErrors);
    }
  }, [isSubmitClicked]);

  const validateField = (field, value) => {
    let error = '';
    if (!value) {
      if (field === 'title') error = '제목을 입력해주세요.';
      if (field === 'purpose') error = '품의 목적을 입력해주세요.';
      if (field === 'content') error = '품의 내용을 입력해주세요.';
    }

    if (value) {
      if (field === 'title' && value.length > 50) error = '글자 수 초과 (50자 이하)';
      if (field === 'purpose' && value.length > 300) error = '글자 수 초과 (300자 이하)';
      if (field === 'content' && value.length > 1000) error = '글자 수 초과 (1000자 이하)';
    }

    return error;
  };

  const handleFieldChange = (field, value) => {
    if (!onChange) return;
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    onChange({ ...data, [field]: value });
  };

  const title = isEditMode 
    ? (data?.title || '') 
    : (data?.title || '-');

  const purpose = isEditMode
    ? (data?.purpose || '')
    : (data?.purpose || '-');

  const content = isEditMode
    ? (data?.content || '')
    : (data?.content || '-');

  const applicant = isEditMode
    ? {
        name: user?.name || '-',
        users_seq: user?.users_seq || '-',
        dept_name: user?.dept_name || '-',
        rank_name: user?.rank_name || '-'
      }
    : {
        name: data?.name || '-',
        users_seq: data?.users_seq || '-',
        dept_name: data?.dept_name || '-',
        rank_name: data?.rank_name || '-'
      };

  let created_at = '-';
  if (isEditMode) {
    created_at = today;
  } else {
    const draftDate = data?.created_at;
    created_at = draftDate ? draftDate.substring(0, 10) : '-';
  }
  
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
              value={editTitle}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="제목을 입력하세요 (50자 이하)"
              maxLength={50}
              className={`w-full p-3 text-xs bg-white border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all`}
            />
            {errors.title && <p className="mt-1 text-[10px] text-red-500">{errors.title}</p>}
          </div>
        ) : (
          <div className="w-full p-3 text-xs bg-gray-50 border border-gray-100 rounded-xl">
            {title}
          </div>
        )}
      </div>

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
              <td className="p-3 border-r border-gray-200">{applicant.name}</td>
              <th className="w-24 bg-gray-50 p-3 border-r border-gray-200 text-left font-bold">사번</th>
              <td className="p-3">{applicant.users_seq}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th className="w-24 bg-gray-50 p-3 border-r border-gray-200 text-left font-bold">부서</th>
              <td className="p-3 border-r border-gray-200">{applicant.dept_name}</td>
              <th className="w-24 bg-gray-50 p-3 border-r border-gray-200 text-left font-bold">직급</th>
              <td className="p-3">{applicant.rank_name}</td>
            </tr>
            <tr>
              <th className="w-24 bg-gray-50 p-3 border-r border-gray-200 text-left font-bold">신청일</th>
              <td className="p-3" colSpan={3}>{created_at}</td>
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
          <div>
            <textarea 
              value={editPurpose}
              onChange={(e) => handleFieldChange('purpose', e.target.value)}
              placeholder="품의 목적을 간략하게 입력하세요 (300자 이하)"
              maxLength={300}
              className={`w-full h-20 p-3 text-xs bg-white border ${errors.purpose ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 resize-none transition-all`}
            ></textarea>
            {errors.purpose && <p className="mt-1 text-[10px] text-red-500">{errors.purpose}</p>}
          </div>
        ) : (
          <div className="w-full p-3 text-xs bg-gray-50 border border-gray-100 rounded-xl whitespace-pre-wrap">
            {purpose}
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
          <div>
            <textarea 
              value={editContent}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              placeholder="품의 내용을 자유롭게 입력하세요 (1000자 이하)"
              maxLength={1000}
              className={`w-full h-80 p-4 text-xs bg-white border ${errors.content ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 resize-none transition-all`}
            ></textarea>
            {errors.content && <p className="mt-1 text-[10px] text-red-500">{errors.content}</p>}
          </div>
        ) : (
          <div className="w-full min-h-[20rem] p-4 text-xs bg-gray-50 border border-gray-100 rounded-xl whitespace-pre-wrap overflow-y-auto">
            {content}
          </div>
        )}
      </div>

      {/* Referrer Selection Section */}
      <ReferrerSelector 
        value={data?.referrers} 
        onChange={(val) => onChange({ ...data, referrers: val })} 
        isEditMode={isEditMode} 
      />
    </div>
  );
};

export default GeneralForm;
