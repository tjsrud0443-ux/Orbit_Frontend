import React, { useState, useEffect, useRef } from 'react';
import ReferrerSelector from '../components/ReferrerSelector';
import useAuthStore from '../../../store/authStore';
import { getApprovedVacationList } from '../approvalApi';

const CancelVacationForm = ({ data, onChange, mode, user, isSubmitClicked, isTempSaveClicked, docType }) => {
    const isEditMode = mode === 'EDIT';
    const today = new Date().toLocaleDateString('sv-SE');

    const [isVacationDropdownOpen, setIsVacationDropdownOpen] = useState(false);
    const [errors, setErrors] = useState({});

    const [approvedVacations, setApprovedVacations] = useState([]);

    const vacationDropdownRef = useRef(null);
    const mobileVacationDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const isOutsideVacation =
                (!vacationDropdownRef.current || !vacationDropdownRef.current.contains(event.target)) &&
                (!mobileVacationDropdownRef.current || !mobileVacationDropdownRef.current.contains(event.target));

            if (isOutsideVacation) setIsVacationDropdownOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchApprovedVacations = async () => {
            try {
                const resp = await getApprovedVacationList();
                setApprovedVacations(resp.data);
            } catch (error) {
                console.error("승인된 휴가 목록 조회 실패", error);
            }
        };
        fetchApprovedVacations();
    }, []);

    useEffect(() => {
        if (isSubmitClicked) {
            const newErrors = {};
            newErrors.title = validateField('title', data.title);
            newErrors.vac_seq = validateField('vac_seq', data.vac_seq);
            newErrors.cancel_reason = validateField('cancel_reason', data.cancel_reason);
            setErrors(newErrors);
        } else {
            setErrors({});
        }
    }, [isSubmitClicked]);

    useEffect(() => {
        if (isTempSaveClicked) {
            const newErrors = {};
            newErrors.title = validateField('title', data.title);
            setErrors(newErrors);
        }
    }, [isTempSaveClicked]);

    const validateField = (field, value) => {
        let error = '';
        if (!value) {
            if (field === 'title') error = '제목을 입력해주세요.';
            if (field === 'vac_seq') error = '취소할 휴가를 선택해주세요.';
            if (field === 'cancel_reason') error = '취소 사유를 입력해주세요.';
        }

        if (value) {
            if (field === 'title' && value.length > 50) error = '글자 수 초과 (50자 이하)';
            if (field === 'cancel_reason' && value.length > 100) error = '글자 수 초과 (100자 이하)';
        }

        return error;
    };

    const handleFieldChange = (key, value) => {
        if (!onChange) return;

        let updatedData = { ...data, [key]: value };
        const error = validateField(key, value);
        setErrors(prev => ({ ...prev, [key]: error }));

        onChange(updatedData);
    };

    const handleSelectVacation = (vac) => {
        if (!onChange) return;

        onChange({
            ...data,
            vac_seq: vac.vac_seq,
            target_title: vac.target_title,
            vac_type: vac.vac_type,
            start_date: vac.start_date ? vac.start_date.substring(0, 10) : '',
            end_date: vac.end_date ? vac.end_date.substring(0, 10) : '',
            days: vac.days,
        });

        setIsVacationDropdownOpen(false);
        setErrors(prev => ({ ...prev, vac_seq: '' }));
    };

    const token = useAuthStore(state => state.token);
    const applicant = isEditMode ? user : data;
    const displayDate = isEditMode ? today : (data?.created_at?.substring(0, 10) || '-');

    return (
        <>
            {/* [Desktop View] */}
            <div className="hidden md:block space-y-5">
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

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
                        <h2 className="text-xs font-bold text-gray-800">신청자 정보</h2>
                    </div>
                    <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
                        <tbody>
                            <tr className="border-b border-gray-200">
                                <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">성명</th>
                                <td className="p-2 border-r border-gray-200 w-120">{applicant?.name || '-'}</td>
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
                                <td className="p-2" colSpan="3">{displayDate}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
                        <h2 className="text-xs font-bold text-gray-800">휴가 취소 신청 내용</h2>
                    </div>
                    <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
                        <tbody>
                            <tr className="border-b border-gray-200">
                                <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">취소할 휴가</th>
                                <td className="p-2" colSpan="3">
                                    {isEditMode ? (
                                        <div className="relative w-full" ref={vacationDropdownRef}>
                                            <div
                                                onClick={() => setIsVacationDropdownOpen(!isVacationDropdownOpen)}
                                                className={`w-full px-3 py-1.5 bg-white border ${errors.vac_seq ? 'border-red-500' : isVacationDropdownOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-200'} rounded-lg text-xs font-medium transition-all cursor-pointer flex justify-between items-center`}
                                            >
                                                <span className={data.vac_seq ? 'text-gray-800' : 'text-gray-400'}>
                                                    {data.vac_seq
                                                        ? approvedVacations.find(v => v.vac_seq === data.vac_seq)?.target_title || data.target_title
                                                        : '선택'}
                                                </span>
                                                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isVacationDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                            {errors.vac_seq && <p className="mt-1 text-[10px] text-red-500">{errors.vac_seq}</p>}
                                            {isVacationDropdownOpen && (
                                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-32 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                                                    {approvedVacations.map((vac) => (
                                                        <div
                                                            key={vac.vac_seq}
                                                            onClick={() => handleSelectVacation(vac)}
                                                            className="px-4 py-2.5 text-xs hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer font-medium border-b border-gray-50 last:border-0 transition-colors"
                                                        >
                                                            [{vac.vac_type}] {vac.target_title} ({vac.start_date ? vac.start_date.substring(0, 10) : ''}~{vac.end_date ? vac.end_date.substring(0, 10) : ''})
                                                        </div>
                                                    ))}
                                                    {approvedVacations.length === 0 && (
                                                        <div className="px-4 py-2.5 text-xs text-gray-400 text-center font-medium">
                                                            취소 가능한 휴가 내역이 없습니다.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span>{data.target_title}</span>
                                    )}
                                </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">휴가 종류</th>
                                <td className="p-2" colSpan="3">
                                    <span>{data.vac_type || '-'}</span>
                                </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">기존 신청 기간</th>
                                <td className="p-2 border-r border-gray-200 w-120">
                                    {data.start_date ? `${data.start_date.substring(0, 10)} ~ ${data.end_date ? data.end_date.substring(0, 10) : ''}` : '-'}
                                </td>
                                <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">연차 반환 일수</th>
                                <td className="p-2">
                                    <span className="font-bold text-[#3530B8]">{data.days ? `${data.days}일` : '-'}</span>
                                </td>
                            </tr>
                            <tr>
                                <th className="w-24 bg-gray-50 p-2 border-r border-gray-200 text-left font-bold">취소 사유</th>
                                <td className="p-2" colSpan="3">
                                    {isEditMode ? (
                                        <div>
                                            <textarea
                                                value={data.cancel_reason || ''}
                                                onChange={(e) => handleFieldChange('cancel_reason', e.target.value)}
                                                placeholder="사유를 입력하세요 (100자 이하)"
                                                maxLength={100}
                                                className={`w-full h-25 p-2 bg-white border ${errors.cancel_reason ? 'border-red-500' : 'border-gray-300'} rounded outline-none focus:border-[#3530B8] resize-none custom-scrollbar`}
                                            ></textarea>
                                            {errors.cancel_reason && <p className="mt-1 text-[10px] text-red-500">{errors.cancel_reason}</p>}
                                        </div>
                                    ) : (
                                        <div className="min-h-[4rem] whitespace-pre-wrap">{data.cancel_reason}</div>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="no-print">
                    <ReferrerSelector
                        value={data.referrers}
                        onChange={(val) => onChange({ ...data, referrers: val })}
                        isEditMode={isEditMode}
                        docType={docType}
                    />
                </div>
            </div>

            {/* [Mobile View] */}
            <div className="no-print md:hidden space-y-6">
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

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-3.5 bg-[#3530B8] rounded-full"></div>
                        <h2 className="text-xs font-bold text-gray-800">휴가 취소 신청 내용</h2>
                    </div>

                    <div className="space-y-4 border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">취소할 휴가</label>
                            {isEditMode ? (
                                <div className="relative" ref={mobileVacationDropdownRef}>
                                    <div
                                        onClick={() => setIsVacationDropdownOpen(!isVacationDropdownOpen)}
                                        className={`w-full px-3 py-2 bg-gray-50 border ${errors.vac_seq ? 'border-red-500' : 'border-gray-200'} rounded text-xs flex justify-between items-center`}
                                    >
                                        <span className={data.vac_seq ? 'text-gray-800' : 'text-gray-400'}>
                                            {data.vac_seq
                                                ? approvedVacations.find(v => v.vac_seq === data.vac_seq)?.title || data.target_title || `문서번호: ${data.vac_seq}`
                                                : '선택'}
                                        </span>
                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                    {errors.vac_seq && <p className="text-[10px] text-red-500">{errors.vac_seq}</p>}
                                    {isVacationDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg overflow-hidden max-h-32 overflow-y-auto">
                                            {approvedVacations.map((vac) => (
                                                <div
                                                    key={vac.vac_seq}
                                                    onClick={() => handleSelectVacation(vac)}
                                                    className="px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer"
                                                >
                                                    [{vac.vac_type}] {vac.title} ({vac.start_date ? vac.start_date.substring(0, 10) : ''}~{vac.end_date ? vac.end_date.substring(0, 10) : ''})
                                                </div>
                                            ))}
                                            {approvedVacations.length === 0 && (
                                                <div className="px-3 py-2 text-xs text-gray-400 text-center">
                                                    취소 가능한 휴가 내역이 없습니다.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-xs font-bold">{data.target_title}</div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">휴가 종류</label>
                            <div className="text-xs font-bold">{data.vac_type || '-'}</div>
                        </div>

                        <div className="flex gap-2 w-full">
                            <div className="flex-grow space-y-1">
                                <label className="text-[10px] font-bold text-gray-400">기존 신청 기간</label>
                                <div className="text-xs font-bold">
                                    {data.start_date ? (
                                        <>
                                            {data.start_date.substring(0, 10)} ~
                                            <br />
                                            {data.end_date ? data.end_date.substring(0, 10) : ''}
                                        </>
                                    ) : (
                                        '-'
                                    )}
                                </div>
                            </div>
                            <div className="w-24 space-y-1">
                                <label className="text-[10px] font-bold text-gray-400">연차 반환 일수</label>
                                <div className="text-xs font-black text-[#3530B8]">{data.days ? `${data.days}일` : '-'}</div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">취소 사유</label>
                            {isEditMode ? (
                                <div className="space-y-1">
                                    <textarea
                                        value={data.cancel_reason || ''}
                                        onChange={(e) => handleFieldChange('cancel_reason', e.target.value)}
                                        placeholder="사유를 입력하세요 (100자 이하)"
                                        maxLength={100}
                                        className={`w-full h-24 p-2 text-xs border ${errors.cancel_reason ? 'border-red-500' : 'border-gray-200'} rounded bg-gray-50 resize-none outline-none custom-scrollbar`}
                                    ></textarea>
                                    {errors.cancel_reason && <p className="text-[10px] text-red-500">{errors.cancel_reason}</p>}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-700 whitespace-pre-wrap min-h-[4rem]">{data.cancel_reason}</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <ReferrerSelector
                        value={data.referrers}
                        onChange={(val) => onChange({ ...data, referrers: val })}
                        isEditMode={isEditMode}
                        docType={docType}
                    />
                </div>
            </div>
        </>
    );
};

export default CancelVacationForm;
