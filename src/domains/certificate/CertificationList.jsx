import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import PurposeSelectModal from './PurposeSelectModal';
import EmploymentCertificate from './EmploymentCertificate';
import usePageInfoStore from '../../store/usePageInfoStore';
import { getCertType, insertCertRequest } from './certificateApi';
import { alertError, alertSuccess } from '../../utils/alert';

const CertificationList = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [selectedPurpose, setSelectedPurpose] = useState('');
    const [selectedCertType, setSelectedCertType] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { pages } = usePageInfoStore();
    const currentPageInfo = pages.find(p => p.page_code === 'CertificationList');
    const [certType, setCertType] = useState([]);

    const fetchCertType = async () => {
        try {
            const resp = await getCertType();
            setCertType(resp.data ?? []);
        } catch (err) {
            console.error("증명서 유형 조회 실패", err);
        }
    }

    useEffect(() => {
        fetchCertType();
    }, []);

    const handleRequestClick = (cert) => {
        setSelectedCertType(cert);
        setIsModalOpen(true);
    };

    const handlePreview = (cert) => {
        setSelectedCertType(cert);
        setSelectedPurpose(cert.request_reason ?? '');
        setPreviewMode(true);
    };

    const isPrintExpired = (cert) => {
        if (!cert.print_expires_at) return false;

        return new Date(cert.print_expires_at).getTime() < Date.now();
    };

    const isPrintLimitReached = (cert) => {
        if (cert.applied_max_print == null) return false;

        return Number(cert.printed_count ?? 0)
            >= Number(cert.applied_max_print);
    };

    const handlePreviewClick = async ({ purposeLabel }) => {
        if (!selectedCertType?.cert_type_seq) {
            await alertError('신청 실패', '증명서 유형 정보가 없습니다.');
            return;
        }

        try {
            await insertCertRequest({
                cert_type_seq: selectedCertType.cert_type_seq,
                request_reason: purposeLabel
            });

            await fetchCertType();
            setIsModalOpen(false);

            await alertSuccess('신청 완료', '관리자 승인 후 증명서를 출력할 수 있습니다.');
            // setPreviewMode(true);
        } catch (err) {
            console.error('증명서 발급 신청 실패', err);
            await alertError('신청 실패', '증명서 발급 신청 중 오류가 발생했습니다.');
        }
    };

    const handleBackToOptions = () => {
        setPreviewMode(false);
        setSelectedPurpose('');
        setSelectedCertType(null);
    };

    if (previewMode) {
        return (
            <EmploymentCertificate
                certRequestSeq={selectedCertType?.cert_request_seq}
                certTypeCode={selectedCertType?.cert_type_code}
                purpose={selectedPurpose}
                printExpiresAt={selectedCertType?.print_expires_at}
                printedCount={selectedCertType?.printed_count}
                maxPrintCount={selectedCertType?.applied_max_print}
                onBack={handleBackToOptions}
            />
        );
    }

    const handleCancelRequest = async (cert) => {
        console.log('취소 대상:', cert);
    };
    const renderCertAction = (cert) => {
        if (cert.status === 'PENDING') {
            return (
                <button
                    type="button"
                    onClick={() => handleCancelRequest(cert)}
                    className="w-auto sm:w-full py-2 px-3 sm:px-0 sm:py-2.5 bg-white text-red-500 text-sm sm:text-base font-semibold rounded-lg shadow-sm border border-red-200 hover:bg-red-50 transition-colors whitespace-nowrap ml-4 sm:ml-0"
                >
                    신청 취소
                </button>
            );
        }

        if (cert.status === 'APPROVED') {
            if (isPrintExpired(cert)) {
                return (
                    <button
                        type="button"
                        disabled
                        className="w-auto sm:w-full py-2 px-3 sm:px-0 sm:py-2.5 bg-gray-100 text-gray-400 text-sm sm:text-base font-semibold rounded-lg border border-gray-200 whitespace-nowrap ml-4 sm:ml-0 cursor-not-allowed"
                    >
                        출력 기간 만료
                    </button>
                );
            }

            if (isPrintLimitReached(cert)) {
                return (
                    <button
                        type="button"
                        disabled
                        className="w-auto sm:w-full py-2 px-3 sm:px-0 sm:py-2.5 bg-gray-100 text-gray-400 text-sm sm:text-base font-semibold rounded-lg border border-gray-200 whitespace-nowrap ml-4 sm:ml-0 cursor-not-allowed"
                    >
                        출력 횟수 소진
                    </button>
                );
            }

            return (
                <button
                    type="button"
                    onClick={() => handlePreview(cert)}
                    className="w-auto sm:w-full py-2 px-3 sm:px-0 sm:py-2.5 bg-indigo-600 text-white text-sm sm:text-base font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors whitespace-nowrap ml-4 sm:ml-0"
                >
                    미리보기 및 출력
                </button>
            );
        }

        return (
            <button
                type="button"
                onClick={() => handleRequestClick(cert)}
                className="w-auto sm:w-full py-2 px-3 sm:px-0 sm:py-2.5 bg-white text-indigo-600 text-sm sm:text-base font-semibold rounded-lg shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-colors whitespace-nowrap ml-4 sm:ml-0"
            >
                발급 신청
            </button>
        );
    };

    return (
        <div className="w-full h-full flex flex-col p-6 md:p-8 lg:px-10 box-border bg-white font-sans">
            <div className="mb-4 sm:mb-8 flex justify-between items-start shrink-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{currentPageInfo?.page_name}</h1>
                    <p className="text-xs sm:text-[0.85rem] text-gray-500 font-medium mb-3">{currentPageInfo?.page_info}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
                {Array.from({ length: 8 }).map((_, idx) => {
                    const cert = certType[idx];

                    return cert ? (
                        <div
                            key={cert.cert_type_seq ?? cert.cert_type_id ?? cert.cert_type_name ?? idx}
                            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-md flex flex-row items-center justify-between sm:flex-col sm:items-stretch sm:justify-start p-4 sm:p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex-grow sm:flex-grow-0 sm:flex-grow">
                                <div className="hidden sm:inline-block bg-white/60 p-3 rounded-lg mb-4 text-indigo-600">
                                    <FileText size={28} />
                                </div>
                                <h2 className="text-md sm:text-xl font-bold text-gray-800 mb-0 sm:mb-2">{cert.cert_type_name}</h2>
                                <p className="hidden sm:block text-sm text-gray-600 mb-6">{cert.cert_description}</p>
                            </div>
                            {renderCertAction(cert)}
                        </div>
                    ) : (
                        <div key={`empty-${idx}`} className="rounded-xl bg-gray-50/60 border border-gray-200 border-dashed min-h-[80px] sm:min-h-[220px] flex items-center justify-center p-4 sm:p-6">
                            <span className="text-gray-400 font-medium opacity-70 text-sm sm:text-base">양식 준비중...</span>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-center mt-auto">
                <Pagination count={1} page={currentPage} onChange={(e, val) => setCurrentPage(val)} />
            </div>

            {isModalOpen && (
                <PurposeSelectModal
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedCertType(null);
                    }}
                    onConfirm={handlePreviewClick}
                />
            )}
        </div>
    );
};

export default CertificationList;
