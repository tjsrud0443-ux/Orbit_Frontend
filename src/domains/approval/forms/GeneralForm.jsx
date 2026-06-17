import React, { useState, useEffect } from 'react';
import ReferrerSelector from '../components/ReferrerSelector';

const GeneralForm = ({ data, onChange, mode, user, isSubmitClicked, isTempSaveClicked }) => {

  const isEditMode = mode === 'EDIT';
  const today = new Date().toLocaleDateString('sv-SE');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isSubmitClicked) {
      const newErrors = {};
      newErrors.title = validateField('title', data.title);
      newErrors.purpose = validateField('purpose', data.purpose);
      newErrors.content = validateField('content', data.content);
      setErrors(newErrors);
    } else {
      setErrors({});
    }
  }, [isSubmitClicked]);

  useEffect(() => {
    if (isTempSaveClicked){
      setErrors(prev => ({
        ...prev,
        title: validateField('title', data.title, data)
      }));
    }
  }, [isTempSaveClicked]);

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

  const title = data?.title || '';
  const purpose = data?.purpose || '';
  const content = data?.content || '';

  const applicant = isEditMode ? user : data;
  const displayDate = isEditMode ? today : (data?.created_at?.substring(0, 10) || '-');
  
  return (
    <>
      {/* [Desktop View] - 기존 스타일 완벽 유지 */}
      <div className="hidden md:block space-y-6">
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
                value={title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="제목을 입력하세요 (50자 이하)"
                maxLength={50}
                className={`w-full p-3 text-xs bg-white border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all`}
              />
              {errors.title && <p className="mt-1 text-[10px] text-red-500">{errors.title}</p>}
            </div>
          ) : (
            <div className="w-full p-3 text-xs bg-gray-50 border border-gray-100 rounded-xl">
              {title || '-'}
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
                <td className="p-3" colSpan={3}>{displayDate}</td>
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
                value={purpose}
                onChange={(e) => handleFieldChange('purpose', e.target.value)}
                placeholder="품의 목적을 간략하게 입력하세요 (300자 이하)"
                maxLength={300}
                className={`w-full h-20 p-3 text-xs bg-white border ${errors.purpose ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 resize-none transition-all custom-scrollbar`}
              ></textarea>
              {errors.purpose && <p className="mt-1 text-[10px] text-red-500">{errors.purpose}</p>}
            </div>
          ) : (
            <div className="w-full p-3 text-xs bg-gray-50 border border-gray-100 rounded-xl whitespace-pre-wrap">
              {purpose || '-'}
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
                value={content}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                placeholder="품의 내용을 자유롭게 입력하세요 (1000자 이하)"
                maxLength={1000}
                className={`w-full h-80 p-4 text-xs bg-white border ${errors.content ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 resize-none transition-all custom-scrollbar`}
              ></textarea>
              {errors.content && <p className="mt-1 text-[10px] text-red-500">{errors.content}</p>}
            </div>
          ) : (
            <div className="w-full min-h-[20rem] p-4 text-xs bg-gray-50 border border-gray-100 rounded-xl whitespace-pre-wrap overflow-y-auto">
              {content || '-'}
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

      {/* [Mobile View] - 새로운 모바일용 레이아웃 */}
      <div className="md:hidden space-y-5">
        {/* 신청 정보 (모바일) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">신청 정보</h2>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
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
            <div className="flex">
              <div className="w-20 bg-gray-50 p-2 font-bold text-gray-500 border-r border-gray-100">신청일</div>
              <div className="flex-grow p-2">{displayDate}</div>
            </div>
          </div>
        </div>

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
                value={title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="제목을 입력하세요"
                className={`w-full p-2.5 text-xs bg-white border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-lg outline-none`}
              />
              {errors.title && <p className="text-[10px] text-red-500">{errors.title}</p>}
            </div>
          ) : (
            <div className="p-2.5 bg-gray-50 rounded-lg text-xs font-medium border border-gray-100">{title || '-'}</div>
          )}
        </div>

        {/* 품의 목적 (모바일) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">품의 목적</h2>
          </div>
          {isEditMode ? (
            <div className="space-y-1">
              <textarea 
                value={purpose}
                onChange={(e) => handleFieldChange('purpose', e.target.value)}
                placeholder="품의 목적을 입력하세요"
                className={`w-full h-24 p-2.5 text-xs bg-white border ${errors.purpose ? 'border-red-500' : 'border-gray-200'} rounded-lg outline-none resize-none custom-scrollbar`}
              ></textarea>
              {errors.purpose && <p className="text-[10px] text-red-500">{errors.purpose}</p>}
            </div>
          ) : (
            <div className="p-2.5 bg-gray-50 rounded-lg text-xs border border-gray-100 whitespace-pre-wrap">{purpose || '-'}</div>
          )}
        </div>

        {/* 품의 내용 (모바일) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">품의 내용</h2>
          </div>
          {isEditMode ? (
            <div className="space-y-1">
              <textarea 
                value={content}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                placeholder="품의 내용을 입력하세요"
                className={`w-full h-64 p-2.5 text-xs bg-white border ${errors.content ? 'border-red-500' : 'border-gray-200'} rounded-lg outline-none resize-none custom-scrollbar`}
              ></textarea>
              {errors.content && <p className="text-[10px] text-red-500">{errors.content}</p>}
            </div>
          ) : (
            <div className="p-2.5 bg-gray-50 rounded-lg text-xs border border-gray-100 whitespace-pre-wrap min-h-[15rem]">{content || '-'}</div>
          )}
        </div>

        {/* Referrer (모바일) */}
        <ReferrerSelector 
          value={data?.referrers} 
          onChange={(val) => onChange({ ...data, referrers: val })} 
          isEditMode={isEditMode} 
        />
      </div>
    </>
  );
};

export default GeneralForm;
