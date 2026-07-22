import { useEffect, useMemo, useState } from 'react';
import Pagination from '../../components/common/Pagination';
import MobilePagination from '../../components/common/MobilePagination';
import Swal from 'sweetalert2';
import { getAdminCertRequestList, approveCertRequest, rejectCertRequest, getCertIssueHistoryList } from './adminApi';
import { alertConfirm, alertError, alertSuccess } from '../../utils/alert';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import usePageInfoStore from '../../store/usePageInfoStore';

const PAGE_SIZE = 10;

const tabKeyMap = {
    '전체': 'TOTAL',
    '대기': 'PENDING',
    '승인': 'APPROVED',
    '반려': 'REJECTED'
};

const AdminCertRequest = () => {
    const { pages } = usePageInfoStore();
    const currentPageInfo = pages.find(p => p.page_code === 'AdminCertRequest');

    const [activeStatusTab, setActiveStatusTab] = useState('전체');
    const [page, setPage] = useState(1);
    const [certRequests, setCertRequests] = useState([]);

    const tabs = ['전체', '대기', '승인', '반려'];

    const fetchCertRequests = async () => {
        try {
            const resp = await getAdminCertRequestList();
            setCertRequests(resp.data ?? []);
        } catch (err) {
            console.error('증명서 신청 목록 조회 실패:', err);
            setCertRequests([]);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(fetchCertRequests, 0);
        return () => clearTimeout(timeoutId);
    }, []);

    const handleApprove = async (request) => {
        const result = await alertConfirm(
            '증명서 신청 승인',
            `${request.name}님의 ${request.cert_type_name} 발급 신청을 승인하시겠습니까?`
        );

        if (!result.isConfirmed) return;

        try {
            await approveCertRequest(
                request.cert_request_seq
            );

            await fetchCertRequests();

            await alertSuccess(
                '승인 완료',
                '증명서 발급 신청을 승인했습니다.'
            );
        } catch (err) {
            console.error('증명서 신청 승인 실패:', err);

            await alertError(
                '승인 실패',
                err.response?.data?.message ||
                '증명서 신청 승인 중 오류가 발생했습니다.'
            );
        }
    };

    const handleReject = async (request) => {
        const result = await Swal.fire({
            title: '증명서 신청 반려',
            text: `${request.name}님의 ${request.cert_type_name} 발급 신청을 반려합니다.`,
            input: 'textarea',
            inputLabel: '반려 사유',
            inputPlaceholder: '반려 사유를 입력해주세요.',
            inputAttributes: {
                maxlength: 500
            },
            showCancelButton: true,
            confirmButtonText: '반려',
            cancelButtonText: '취소',
            confirmButtonColor: '#FF4D4F',
            cancelButtonColor: '#6B7280',

            inputValidator: (value) => {
                if (!value || !value.trim()) {
                    return '반려 사유를 입력해주세요.';
                }

                if (value.trim().length > 500) {
                    return '반려 사유는 500자 이하로 입력해주세요.';
                }

                return null;
            }
        });

        if (!result.isConfirmed) return;

        try {
            await rejectCertRequest(
                request.cert_request_seq,
                result.value.trim()
            );

            await fetchCertRequests();

            await alertSuccess(
                '반려 완료',
                '증명서 발급 신청을 반려했습니다.'
            );
        } catch (err) {
            console.error('증명서 신청 반려 실패:', err);

            await alertError(
                '반려 실패',
                err.response?.data?.message ||
                '증명서 신청 반려 중 오류가 발생했습니다.'
            );
        }
    };

    const tabCount = useMemo(() => (
        certRequests.reduce((acc, request) => {
            acc.TOTAL += 1;

            if (request.status === 'PENDING') acc.PENDING += 1;
            if (request.status === 'APPROVED') acc.APPROVED += 1;
            if (request.status === 'REJECTED') acc.REJECTED += 1;

            return acc;
        }, { TOTAL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 })
    ), [certRequests]);

    const filteredRequests = useMemo(() => {
        const activeStatus = tabKeyMap[activeStatusTab];

        if (activeStatus === 'TOTAL') {
            return certRequests;
        }

        return certRequests.filter((request) => request.status === activeStatus);
    }, [activeStatusTab, certRequests]);

    const totalPages = Math.max(
        Math.ceil(filteredRequests.length / PAGE_SIZE),
        1
    );

    const currentRequests = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredRequests.slice(start, start + PAGE_SIZE);
    }, [filteredRequests, page]);

    useEffect(() => {
        if (page > totalPages) {
            const timeoutId = setTimeout(() => setPage(totalPages), 0);
            return () => clearTimeout(timeoutId);
        }
    }, [page, totalPages]);

    const handleStatusTabClick = (tab) => {
        setActiveStatusTab(tab);
        setPage(1);
    };

    const renderStatusBadge = (status) => {
        if (status === 'PENDING') {
            return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF9F0] text-[#FF9800]">대기</span>;
        }

        if (status === 'APPROVED') {
            return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0FDF4] text-[#10B981]">승인</span>;
        }

        if (status === 'REJECTED') {
            return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF0F0] text-[#FF4D4F]">반려</span>;
        }

        return <span className="text-xs text-slate-400">{status || '-'}</span>;
    };

    const renderAction = (request) => {
        if (request.status === 'PENDING') {
            return (
                <>
                    <button
                        onClick={() => handleApprove(request)}
                        className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg hover:bg-[#F0FDF4] transition-all cursor-pointer">
                        승인
                    </button>
                    <button
                        onClick={() => handleReject(request)}
                        className="px-3 py-1 text-[10px] font-bold text-[#FF4D4F] bg-white border border-[#FF4D4F] rounded-lg hover:bg-[#FFF0F0] transition-all cursor-pointer">
                        반려
                    </button>
                </>
            );
        }

        if (request.status === 'APPROVED') {
            return (
                <button
                    disabled
                    className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg">
                    승인됨
                </button>
            );
        }

        if (request.status === 'REJECTED') {
            return (
                <button
                    disabled
                    className="px-3 py-1 text-[10px] font-bold text-[#FF4D4F] bg-white border border-[#FF4D4F] rounded-lg">
                    반려됨
                </button>
            );
        }

        return (
            <span className="text-xs text-slate-400">-</span>
        );
    };

    const formatDateTime = (value) => {
        if (!value) {
            return '-';
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return '-';
        }

        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const handleExcelDownload = async () => {
        try {
            const resp = await getCertIssueHistoryList();
            const issueHistory = resp.data ?? [];

            if (issueHistory.length === 0) {
                await alertError(
                    '다운로드 실패',
                    '다운로드할 증명서 발급 이력이 없습니다.'
                );
                return;
            }

            const excelData = issueHistory.map((history, index) => ({
                번호: index + 1,
                발급번호:
                    history.issue_number ||
                    (
                        history.issue_date_code && history.issue_no
                            ? `${history.issue_date_code}-${String(history.issue_no).padStart(3, '0')}`
                            : '-'
                    ),
                신청번호: history.cert_request_seq ?? '-',
                신청자: history.name ?? '-',
                사용자ID: history.users_id ?? '-',
                부서: history.dept_name ?? '-',
                직급: history.rank_name ?? '-',
                증명서유형: history.cert_type_name ?? '-',
                신청사유: history.request_reason ?? '-',
                승인일시: formatDateTime(history.approved_at),
                출력일시: formatDateTime(history.printed_at)
            }));

            const worksheet =
                XLSX.utils.json_to_sheet(excelData);

            const workbook =
                XLSX.utils.book_new();

            worksheet['!cols'] = [
                { wch: 7 },   // 번호
                { wch: 14 },  // 발급번호
                { wch: 12 },  // 신청번호
                { wch: 12 },  // 신청자
                { wch: 18 },  // 사용자ID
                { wch: 16 },  // 부서
                { wch: 12 },  // 직급
                { wch: 18 },  // 증명서유형
                { wch: 30 },  // 신청사유
                { wch: 22 },  // 승인일시
                { wch: 22 }   // 출력일시
            ];

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                '증명서 발급 이력'
            );

            const today = new Date()
                .toISOString()
                .slice(0, 10)
                .replaceAll('-', '');

            XLSX.writeFile(
                workbook,
                `증명서_발급이력_${today}.xlsx`
            );
        } catch (err) {
            console.error(
                '증명서 발급 이력 다운로드 실패:',
                err
            );

            await alertError(
                '다운로드 실패',
                err.response?.data?.message ||
                '증명서 발급 이력을 불러오지 못했습니다.'
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

            <div className="mb-6 flex-shrink-0 w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="inline-flex bg-white p-1 rounded-2xl shadow-sm border border-[#F0F4FF] max-w-full overflow-x-auto no-scrollbar align-top">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleStatusTabClick(tab)}
                            className={`px-3 md:px-4 py-2 text-[0.6875rem] md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${activeStatusTab === tab
                                ? 'bg-[#3530B8] text-white shadow-md'
                                : 'text-gray-500 hover:text-[#3530B8] hover:bg-[#F0F4FF]'
                                }`}
                        >
                            {tab} <span className={`ml-1 ${activeStatusTab === tab ? 'opacity-80' : 'text-gray-400'}`}>({tabCount[tabKeyMap[tab]]})</span>
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={handleExcelDownload}
                    className="inline-flex w-fit items-center gap-2 shrink-0 px-3 md:px-4 py-2 rounded-lg bg-emerald-600 text-xs md:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap">
                    <Download size={17} />
                    <span>발급 이력 엑셀 다운로드</span>
                </button>
            </div>

            <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden min-h-0">
                <div className="flex-1 overflow-auto p-6 pt-0 custom-scrollbar">
                    <table className="w-full text-left border-collapse mt-6 min-w-[1360px]">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 pl-2 md:pl-3 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">신청번호</th>
                                <th className="pb-4 pl-2 md:pl-3 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">신청자</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">부서/직급</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">증명서 유형</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">신청 사유</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">신청일시</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">처리 관리자</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">상태</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">처리일시</th>
                                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">출력기한</th>
                                <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center whitespace-nowrap">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="text-center py-12 text-slate-400 text-sm">
                                        신청 내역이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                currentRequests.map((request) => (
                                    <tr key={request.cert_request_seq} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="py-4 pl-4 md:pl-6 text-xs text-slate-500 font-mono whitespace-nowrap">
                                            {request.cert_request_seq}
                                        </td>
                                        <td className="py-4 pl-1 md:pl-2 text-sm font-bold text-slate-800 whitespace-nowrap">{request.name}</td>
                                        <td className="py-4 pl-3 md:pl-6 text-xs text-slate-500 font-medium whitespace-nowrap">{request.dept_name || '-'} / {request.rank_name || '-'}</td>
                                        <td className="py-4 pl-4 md:pl-6 text-xs text-[#3530B8] font-bold whitespace-nowrap">{request.cert_type_name}</td>
                                        <td className="py-4 pl-4 md:pl-6 text-xs text-slate-500 w-64 truncate whitespace-nowrap" title={request.request_reason}>{request.request_reason}</td>
                                        <td className="py-4 pl-4 md:pl-6 text-[0.6875rem] text-slate-400 font-mono whitespace-nowrap">{formatDateTime(request.requested_at)}</td>
                                        <td className="py-4 pl-4 md:pl-6 text-xs text-slate-600 font-medium whitespace-nowrap">{request.handler_name || '-'}</td>
                                        <td className="py-4 pl-4 md:pl-6 whitespace-nowrap">{renderStatusBadge(request.status)}</td>
                                        <td className="py-4 pl-4 md:pl-6 text-[0.6875rem] text-slate-400 font-mono whitespace-nowrap">{formatDateTime(request.processed_at)}</td>
                                        <td className="py-4 pl-4 md:pl-6 text-[0.6875rem] text-slate-400 font-mono whitespace-nowrap">{formatDateTime(request.print_expires_at)}</td>
                                        <td className="py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {renderAction(request)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-gray-50 bg-white rounded-b-[32px] py-2">
                    <MobilePagination count={totalPages} page={page} onChange={(e, page) => setPage(page)} />
                    <div className="hidden md:block">
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(e, page) => setPage(page)}
                        />
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
        </div>
    );
};

export default AdminCertRequest;
