import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

const dummyCertTypes = [
    {
        cert_type_seq: 1,
        cert_type_name: '재직증명서',
        cert_type_code: 'EMPLOYMENT',
        print_available_days: 7,
        applied_max_print: 3,
        is_active: true
    }
];

const AdminCertType = () => {
    const [certTypes, setCertTypes] = useState(dummyCertTypes);

    const handleToggleActive = (certTypeSeq) => {
        setCertTypes((prev) => (
            prev.map((certType) => (
                certType.cert_type_seq === certTypeSeq
                    ? { ...certType, is_active: !certType.is_active }
                    : certType
            ))
        ));
    };

    return (
        <div className="h-full flex flex-col bg-white font-sans p-6 md:p-8">
            <div className="mb-6 flex-shrink-0">
                <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">
                    증명서 유형 관리
                </h1>
                <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
                    증명서 유형별 출력 가능 기간, 최대 출력 장수 및 노출 여부를 관리합니다.
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
                            {certTypes.map((certType) => (
                                <tr key={certType.cert_type_seq} className="hover:bg-slate-50/40 transition-colors group">
                                    <td className="py-4 pl-1 md:pl-2 text-sm font-bold text-slate-800 whitespace-nowrap">
                                        {certType.cert_type_name}
                                    </td>
                                    <td className="py-4 pl-4 md:pl-6 text-xs text-[#3530B8] font-bold whitespace-nowrap">
                                        {certType.cert_type_code}
                                    </td>
                                    <td className="py-4 pl-4 md:pl-6 text-xs text-slate-500 font-medium whitespace-nowrap">
                                        {certType.print_available_days}일
                                    </td>
                                    <td className="py-4 pl-4 md:pl-6 text-xs text-slate-500 font-medium whitespace-nowrap">
                                        {certType.applied_max_print}장
                                    </td>
                                    <td className="py-4 pl-4 md:pl-6 text-center">
                                        <div className="flex justify-center">
                                            <button
                                                type="button"
                                                className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-[#3530B8] transition-all flex items-center justify-center cursor-pointer"
                                                title="수정"
                                            >
                                                <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-4 pl-4 md:pl-6 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleActive(certType.cert_type_seq)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${certType.is_active ? 'bg-[#3530B8]' : 'bg-slate-200'
                                                }`}
                                            aria-pressed={certType.is_active}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${certType.is_active ? 'translate-x-5' : 'translate-x-0.5'
                                                    }`}
                                            />
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
