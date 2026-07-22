import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { getAdminCertTypeList, updateCertTypeHidden, updateCertType } from './adminApi';
import usePageInfoStore from '../../store/usePageInfoStore';
import { alertError, alertSuccess } from '../../utils/alert';

const AdminCertType = () => {
    const { pages } = usePageInfoStore();
    const currentPageInfo = pages.find(p => p.page_code === 'AdminCertType');
    const [certTypes, setCertTypes] = useState([]);
    const [editingSeq, setEditingSeq] = useState(null);
    const [editForm, setEditForm] = useState({
        print_days: '',
        max_print_count: ''
    });
   
    const fetchCertType = async () => {
        try {
            const resp = await getAdminCertTypeList();
            setCertTypes(resp.data ?? []);
        } catch (err) {
            console.error('증명서 목록 조회 실패:', err);
            setCertTypes([]);
        }
    };

    useEffect(() => {
       fetchCertType();
    }, []);

    const handleStartEdit = (certType) => {
        setEditingSeq(certType.cert_type_seq);
        setEditForm({
            print_days: certType.print_days ?? '',
            max_print_count: certType.max_print_count ?? ''
        });
    };

    const handleCancelEdit = () => {
        setEditingSeq(null);
        setEditForm({
            print_days: '',
            max_print_count: ''
        });
    };

    const handleEditFormChange = (field, value) => {
        setEditForm((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const isPositiveInteger = (value) => {
        const numberValue = Number(value);

        return Number.isInteger(numberValue) && numberValue >= 1;
    };

    const handleSaveEdit = async (certType) => {
        if (!isPositiveInteger(editForm.print_days)) {
            await alertError('입력 오류', '출력 가능 일수는 1 이상의 정수만 입력할 수 있습니다.');
            return;
        }

        if (Number(editForm.print_days) > 365) {
            await alertError('입력 오류', '출력 가능 일수는 최대 365일까지 입력할 수 있습니다.');
            return;
        }

        if (!isPositiveInteger(editForm.max_print_count)) {
            await alertError('입력 오류', '출력 가능 장수는 1 이상의 정수만 입력할 수 있습니다.');
            return;
        }

        if (Number(editForm.max_print_count) > 100) {
            await alertError('입력 오류', '최대 출력 가능 장수는 100장까지 입력할 수 있습니다.');
            return;
        }

        const nextPrintDays = Number(editForm.print_days);
        const nextMaxPrintCount = Number(editForm.max_print_count);

        try {
            await updateCertType({
                cert_type_seq: certType.cert_type_seq,
                print_days: nextPrintDays,
                max_print_count: nextMaxPrintCount
            });

            setCertTypes((prev) =>
                prev.map((item) =>
                    item.cert_type_seq === certType.cert_type_seq
                        ? {
                            ...item,
                            print_days: nextPrintDays,
                            max_print_count: nextMaxPrintCount
                        }
                        : item
                )
            );

            handleCancelEdit();
            await alertSuccess('수정 완료', '증명서 유형 정보가 수정되었습니다.');
        } catch (err) {
            console.error('증명서 유형 수정 실패:', err);

            await alertError(
                '수정 실패',
                err.response?.data?.message ||
                '증명서 유형 정보 수정 중 오류가 발생했습니다.'
            );
        }
    };

    const handleToggleActive = async (certType) => {
        const nextHiddenYn = certType.hidden_yn === 'Y' ? 'N' : 'Y';

        try {
            await updateCertTypeHidden(certType.cert_type_seq, nextHiddenYn);

            setCertTypes((prev) =>
                prev.map((item) =>
                    item.cert_type_seq === certType.cert_type_seq
                        ? { ...item, hidden_yn: nextHiddenYn } : item
                )
            );
        } catch (err) {
            console.error("증명서 노출 상태 수정 실패", err);

            await alertError(
                '상태 변경 실패',
                err.response?.data?.message ||
                '증명서 노출 상태를 변경하지 못했습니다.'
            );
        }
    };
    return (
        <div className="h-full flex flex-col bg-white font-sans p-6 md:p-8">
            <div className="mb-6 flex-shrink-0">
                <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">
                    {currentPageInfo?.page_name}
                </h1>
                <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
                    {currentPageInfo?.page_info}
                </p>
            </div>

            <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden min-h-0">
                <div className="flex-1 overflow-auto p-6 pt-0 custom-scrollbar">
                    <table className="w-full text-left border-collapse mt-6 min-w-[900px]">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 pl-2 md:pl-3 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">증명서 유형</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">증명서 코드</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">출력 가능 일수</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">출력 가능 장수</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center whitespace-nowrap">관리</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center whitespace-nowrap">활성화 여부</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {certTypes.map((certType) => {
                                const isActive =
                                    certType.hidden_yn !== 'Y';
                                const isEditing =
                                    editingSeq === certType.cert_type_seq;

                                return (
                                    <tr
                                        key={certType.cert_type_seq}
                                        className="hover:bg-slate-50/40 transition-colors group"
                                    >
                                        <td className="py-4 pl-1 md:pl-2 text-sm font-bold text-slate-800 whitespace-nowrap">
                                            {certType.cert_type_name}
                                        </td>

                                        <td className="py-4 pl-4 md:pl-6 text-xs text-[#3530B8] font-bold whitespace-nowrap">
                                            {certType.cert_type_code}
                                        </td>

                                        <td className="py-4 pl-4 md:pl-6 text-xs text-slate-500 font-medium whitespace-nowrap">
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={editForm.print_days}
                                                        onChange={(e) => handleEditFormChange('print_days', e.target.value)}
                                                        className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#3530B8] focus:ring-2 focus:ring-[#3530B8]/10 transition-all"
                                                    />
                                                    <span>일</span>
                                                </div>
                                            ) : (
                                                `${certType.print_days}일`
                                            )}
                                        </td>

                                        <td className="py-4 pl-4 md:pl-6 text-xs text-slate-500 font-medium whitespace-nowrap">
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={editForm.max_print_count}
                                                        onChange={(e) => handleEditFormChange('max_print_count', e.target.value)}
                                                        className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#3530B8] focus:ring-2 focus:ring-[#3530B8]/10 transition-all"
                                                    />
                                                    <span>장</span>
                                                </div>
                                            ) : (
                                                `${certType.max_print_count}장`
                                            )}
                                        </td>

                                        <td className="py-4 pl-4 md:pl-6 text-center">
                                            <div className="flex justify-center gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveEdit(certType)}
                                                            className="px-3 py-1 text-[10px] font-bold text-white bg-[#3530B8] border border-[#3530B8] rounded-lg hover:bg-[#2a2594] transition-all cursor-pointer"
                                                        >
                                                            저장
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleCancelEdit}
                                                            className="px-3 py-1 text-[10px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                                                        >
                                                            취소
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartEdit(certType)}
                                                        className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-[#3530B8] transition-all flex items-center justify-center cursor-pointer"
                                                        title="수정"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faPenToSquare}
                                                            className="text-xs"
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-4 pl-4 md:pl-6 text-center">
                                            <button
                                                type="button"
                                                disabled={isEditing}
                                                onClick={() => handleToggleActive(certType)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEditing
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'cursor-pointer'
                                                    } ${isActive
                                                    ? 'bg-[#3530B8]'
                                                    : 'bg-slate-200'
                                                    }`}
                                                aria-pressed={isActive}
                                                title={
                                                    isActive
                                                        ? '활성화됨'
                                                        : '숨김'
                                                }
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${isActive
                                                        ? 'translate-x-5'
                                                        : 'translate-x-0.5'
                                                        }`}
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {certTypes.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-12 text-center text-sm text-slate-400"
                                    >
                                        등록된 증명서 유형이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
        </div>
    );
};

export default AdminCertType;
