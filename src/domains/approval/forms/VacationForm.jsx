import React, { useState, useEffect } from 'react';
import Calendar from '../../../components/common/Calendar';
import ReferrerSelector from '../components/ReferrerSelector';

const VacationForm = ({ data, onChange, mode, user, isSubmitClicked, isTempSaveClicked }) => {
  const isEditMode = mode === 'EDIT';
  const today = new Date().toLocaleDateString('sv-SE');
  
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isSubmitClicked) {
      const newErrors = {};
      newErrors.title = validateField('title', data.title, data);
      newErrors.start_date = validateField('start_date', data.start_date, data);
      if (data.vac_type === '연차') {
        newErrors.end_date = validateField('end_date', data.end_date, data);
      }
      newErrors.reason = validateField('reason', data.reason, data);
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

  const validateField = (field, value, currentData) => {
    let error = '';
    if (!value && field !== 'end_date') {
      if (field === 'title') error = '제목을 입력해주세요.';
      if (field === 'start_date') error = '시작 날짜를 선택해주세요.';
      if (field === 'reason') error = '신청 사유를 입력해주세요.';
    }

    if (value) {
      if (field === 'title' && value.length > 50) error = '글자 수 초과 (50자 이하)';
      if (field === 'reason' && value.length > 300) error = '글자 수 초과 (300자 이하)';
    }

    if (field === 'start_date' && value && value < today) {
      error = '시작 날짜는 오늘 이후여야 합니다.';
    }

    if (field === 'end_date') {
      if (currentData.vac_type === '연차' && !value) {
        error = '종료 날짜를 선택해주세요.';
      } else if (value && currentData.start_date && value < currentData.start_date) {
        error = '종료 날짜는 시작 날짜 이후여야 합니다.';
      }
    }

    return error;
  };

  const handleFieldChange = (key, value) => {
    if (!onChange) return;

    let updatedData = { ...data, [key]: value };
    const error = validateField(key, value, updatedData);
    setErrors(prev => ({ ...prev, [key]: error }));

    if(key === 'vac_type' && value !== '연차'){
      setErrors(prev => ({...prev, end_date: ''}));
    }

    if (key === 'start_date') {
      if (data.end_date && value > data.end_date) {
        updatedData.end_date = '';
        setErrors(prev => ({ ...prev, end_date: '종료 날짜를 선택해주세요.' }));
      }
    }

    // 2. 신청 일수 자동 계산
    const calculateDays = (type, start, end) => {
      if (type !== '연차') return 0.5;
      if (!start || !end) return 0;
      
      const s = new Date(start);
      const e = new Date(end);
      let count = 0;
      let current = new Date(s);
      
      while (current <= e) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0: Sunday, 6: Saturday
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      return count;
    };

    updatedData.days = Math.max(0, calculateDays(
      updatedData.vac_type || '연차', 
      updatedData.start_date, 
      updatedData.end_date
    ));

    onChange(updatedData);
  };

  const applicant = isEditMode ? user : data;
  const displayDate = isEditMode ? today : (data?.created_at?.substring(0, 10) || '-');

  return (
    <>
      {/* [Desktop View] - 기존 스타일 완벽 유지 */}
      <div className="hidden md:block space-y-5">
        {/* 제목 Section */}
        <div className="space-y-2">
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
                className={`w-full p-2.5 text-xs bg-white border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all`}
              />
              {errors.title && <p className="mt-1 text-[10px] text-red-500">{errors.title}</p>}
            </div>
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
                <td colSpan="3" className="p-2">{displayDate}</td>
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
                    <div className="relative w-full">
                      <div 
                        onClick={() => setIsTypeOpen(!isTypeOpen)}
                        className={`w-full px-3 py-1.5 bg-white border ${isTypeOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-200'} rounded-lg text-xs font-medium transition-all cursor-pointer flex justify-between items-center`}
                      >
                        <span className="text-gray-800">{data.vac_type || '연차'}</span>
                        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                      {isTypeOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-32 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                          {['연차', '오전반차', '오후반차'].map((type) => (
                            <div 
                              key={type}
                              onClick={() => { 
                                handleFieldChange('vac_type', type); 
                                setIsTypeOpen(false); 
                              }}
                              className="px-4 py-2.5 text-xs hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer font-medium border-b border-gray-50 last:border-0 transition-colors"
                            >
                              {type}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span>{data.vac_type}</span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청 기간</th>
                <td className="p-2">
                  {isEditMode ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="relative w-50">
                          <input 
                            type="text" 
                            readOnly 
                            value={data.start_date || ''} 
                            onClick={() => { setIsStartCalendarOpen(!isStartCalendarOpen); setIsEndCalendarOpen(false); }} 
                            placeholder="시작일" 
                            className={`w-full p-2 border ${errors.start_date ? 'border-red-500' : isStartCalendarOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-300'} rounded-xl outline-none cursor-pointer text-xs transition-all`}
                          />
                          {isStartCalendarOpen && (
                            <Calendar 
                              value={data.start_date} 
                              onChange={(d) => { handleFieldChange('start_date', d); setIsStartCalendarOpen(false); }} 
                              onClose={() => setIsStartCalendarOpen(false)}
                            />
                          )}
                        </div>
                        {data.vac_type === '연차' && (
                          <>
                            <span className="px-1">~</span>
                            <div className="relative w-50">
                              <input 
                                type="text" 
                                readOnly 
                                value={data.end_date || ''} 
                                onClick={() => { setIsEndCalendarOpen(!isEndCalendarOpen); setIsStartCalendarOpen(false); }} 
                                placeholder="종료일" 
                                className={`w-full p-2 border ${errors.end_date ? 'border-red-500' : isEndCalendarOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-300'} rounded-xl outline-none cursor-pointer text-xs transition-all`}
                              />
                              {isEndCalendarOpen && (
                                <Calendar 
                                  value={data.end_date} 
                                  onChange={(d) => { handleFieldChange('end_date', d); setIsEndCalendarOpen(false); }} 
                                  onClose={() => setIsEndCalendarOpen(false)}
                                />
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {(errors.start_date || errors.end_date) && (
                        <p className="text-[10px] text-red-500">
                          {errors.start_date || errors.end_date}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span>{data?.start_date?.substring(0, 10)} {data.vac_type === '연차' ? `~ ${data?.end_date?.substring(0, 10)}` : ''}</span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청 일수</th>
                <td className="p-2 font-bold text-[#3530B8]">{data.days || 0}일</td>
              </tr>
              <tr>
                <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">신청 사유</th>
                <td className="p-2">
                  {isEditMode ? (
                    <div>
                      <textarea 
                        value={data.reason || ''}
                        onChange={(e) => handleFieldChange('reason', e.target.value)}
                        placeholder="사유를 입력하세요 (300자 이하)"
                        maxLength={300}
                        className={`w-full h-25 p-2 bg-white border ${errors.reason ? 'border-red-500' : 'border-gray-300'} rounded outline-none focus:border-[#3530B8] resize-none`}
                      ></textarea>
                      {errors.reason && <p className="mt-1 text-[10px] text-red-500">{errors.reason}</p>}
                    </div>
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

      {/* [Mobile View] - 새로운 모바일용 레이아웃 */}
      <div className="md:hidden space-y-6">
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
                value={data.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="제목을 입력하세요"
                className={`w-full p-2.5 text-xs bg-white border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-lg outline-none`}
              />
              {errors.title && <p className="text-[10px] text-red-500">{errors.title}</p>}
            </div>
          ) : (
            <div className="p-2.5 bg-gray-50 rounded-lg text-xs border border-gray-100">{data.title || '-'}</div>
          )}
        </div>

        {/* 신청 정보 (모바일) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">신청자 정보</h2>
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

        {/* 휴가 상세 (모바일) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
            <h2 className="text-xs font-bold text-gray-800">휴가 신청 내용</h2>
          </div>
          
          <div className="space-y-4 border border-gray-200 rounded-lg p-3 bg-white">
            {/* 연차 종류 */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">연차 종류</label>
              {isEditMode ? (
                <div className="relative">
                   <div 
                    onClick={() => setIsTypeOpen(!isTypeOpen)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs flex justify-between items-center"
                  >
                    <span>{data.vac_type || '연차'}</span>
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {isTypeOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg overflow-hidden">
                      {['연차', '오전반차', '오후반차'].map((type) => (
                        <div 
                          key={type}
                          onClick={() => { handleFieldChange('vac_type', type); setIsTypeOpen(false); }}
                          className="px-3 py-2 text-xs hover:bg-gray-50"
                        >
                          {type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs font-bold">{data.vac_type}</div>
              )}
            </div>

            {/* 신청 기간 */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">신청 기간</label>
              {isEditMode ? (
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <input 
                      type="text" readOnly value={data.start_date || ''} 
                      onClick={() => setIsStartCalendarOpen(!isStartCalendarOpen)} 
                      placeholder="시작일"
                      className="w-full p-2 text-xs border border-gray-200 rounded bg-gray-50"
                    />
                    {isStartCalendarOpen && (
                      <div className="absolute z-50 left-0 scale-90 origin-top-left">
                        <Calendar value={data.start_date} onChange={(d) => { handleFieldChange('start_date', d); setIsStartCalendarOpen(false); }} onClose={() => setIsStartCalendarOpen(false)} />
                      </div>
                    )}
                  </div>
                  {data.vac_type === '연차' && (
                    <div className="relative">
                      <input 
                        type="text" readOnly value={data.end_date || ''} 
                        onClick={() => setIsEndCalendarOpen(!isEndCalendarOpen)} 
                        placeholder="종료일"
                        className="w-full p-2 text-xs border border-gray-200 rounded bg-gray-50"
                      />
                      {isEndCalendarOpen && (
                        <div className="absolute z-50 left-0 scale-90 origin-top-left">
                          <Calendar value={data.end_date} onChange={(d) => { handleFieldChange('end_date', d); setIsEndCalendarOpen(false); }} onClose={() => setIsEndCalendarOpen(false)} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs font-bold">{data?.start_date?.substring(0,10)} {data.vac_type === '연차' ? `~ ${data?.end_date?.substring(0,10)}` : ''}</div>
              )}
            </div>

            {/* 신청 일수 */}
            <div className="flex justify-between items-center bg-[#F0F4FF] p-2 rounded">
              <span className="text-[10px] font-bold text-gray-500">총 신청 일수</span>
              <span className="text-xs font-black text-[#3530B8]">{data.days || 0}일</span>
            </div>

            {/* 신청 사유 */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">신청 사유</label>
              {isEditMode ? (
                <textarea 
                  value={data.reason || ''}
                  onChange={(e) => handleFieldChange('reason', e.target.value)}
                  className="w-full h-24 p-2 text-xs border border-gray-200 rounded bg-gray-50 resize-none outline-none"
                ></textarea>
              ) : (
                <div className="text-xs text-gray-700 whitespace-pre-wrap min-h-[4rem]">{data.reason}</div>
              )}
            </div>
          </div>
        </div>

        {/* Referrer (모바일) */}
        <ReferrerSelector 
          value={data.referrers} 
          onChange={(val) => onChange({ ...data, referrers: val })} 
          isEditMode={isEditMode} 
        />
      </div>
    </>
  );
};

export default VacationForm;
