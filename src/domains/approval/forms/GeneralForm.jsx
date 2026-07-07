import React, { useState, useEffect } from 'react';
import ReferrerSelector from '../components/ReferrerSelector';
import useAuthStore from '../../../store/authStore';

const GeneralForm = ({ data, onChange, mode, user, isSubmitClicked, isTempSaveClicked, docType }) => {

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
    if (isTempSaveClicked) {
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

  const handleRemoveAttachment = (targetIdx) => {
    const currentAttachments = data.attachments || [];
    const filteredFiles = currentAttachments.filter((_, i) => i !== targetIdx);
    onChange({ ...data, attachments: filteredFiles });
  };

  const token = useAuthStore(state => state.token);

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
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files);
                    onChange({
                      ...data,
                      attachments: [...(data.attachments || []), ...newFiles]
                    });
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
                        href={`${import.meta.env.VITE_API_BASE_URL}/file/download/${file.sysname}?token=${token}`}
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
        <div className="no-print">
          <ReferrerSelector
            value={data?.referrers}
            onChange={(val) => onChange({ ...data, referrers: val })}
            isEditMode={isEditMode}
            docType={docType}
          />
        </div>
      </div>

      {/* [Mobile View] - 새로운 모바일용 레이아웃 */}
      <div className="no-print md:hidden space-y-5">
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

        {/* 첨부파일 & Referrer (모바일) */}
        <div className="space-y-5">
          {/* 첨부파일 (모바일) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
                <h2 className="text-xs font-bold text-gray-800">첨부파일</h2>
              </div>
              {isEditMode && (
                <label className="cursor-pointer bg-gray-100 px-3 py-1 rounded-full text-[10px] font-bold">
                  파일 추가
                  <input type="file" multiple className="hidden" onChange={(e) => {
                    const newFiles = Array.from(e.target.files);
                    onChange({
                      ...data,
                      attachments: [...(data.attachments || []), ...newFiles]
                    });
                    e.target.value = '';
                  }} />
                </label>
              )}
            </div>
            <div className="p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
              <div className="flex flex-col gap-2">
                {data.attachments?.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] text-[#3530B8] bg-white p-2 rounded border border-gray-100">
                    <span className="truncate flex-grow">{file.oriname || file.name}</span>
                    {isEditMode && (
                      <button onClick={() => handleRemoveAttachment(idx)} className="ml-2 text-red-400">✕</button>
                    )}
                  </div>
                ))}
                {!data.attachments?.length && (
                  <p className="text-[11px] text-gray-400 text-center">첨부된 파일이 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* Referrer (모바일) */}
          <ReferrerSelector
            value={data?.referrers}
            onChange={(val) => onChange({ ...data, referrers: val })}
            isEditMode={isEditMode}
            docType={docType}
          />
        </div>
      </div>
    </>
  );
};

export default GeneralForm;
