import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import PurposeSelectModal from './PurposeSelectModal';
import EmploymentCertificate from './EmploymentCertificate';
import usePageInfoStore from '../../store/usePageInfoStore';

const CertificationList = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [selectedPurpose, setSelectedPurpose] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const { pages } = usePageInfoStore();

    const handlePreviewClick = (purpose) => {
        setSelectedPurpose(purpose);
        setIsModalOpen(false);
        setPreviewMode(true);
    };

    const handleBackToOptions = () => {
        setPreviewMode(false);
        setSelectedPurpose('');
    };

    if (previewMode) {
        return (
            <EmploymentCertificate
                purpose={selectedPurpose}
                onBack={handleBackToOptions}
            />
        );
    }

    const currentPageInfo = pages.find(p => p.page_code === 'CertificationList');

    return (
        <div className="w-full h-full flex flex-col p-6 md:p-8 lg:px-10 box-border bg-white font-sans">
            <div className="mb-4 sm:mb-8 flex justify-between items-start shrink-0">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{currentPageInfo?.page_name}</h1>
                    <p className="text-xs sm:text-[0.85rem] text-gray-500 font-medium mb-3">{currentPageInfo?.page_info}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
                {/* 재직증명서 카드 */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-md flex flex-row items-center justify-between sm:flex-col sm:items-stretch sm:justify-start p-4 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex-grow sm:flex-grow-0 sm:flex-grow">
                        <div className="hidden sm:inline-block bg-white/60 p-3 rounded-lg mb-4 text-indigo-600">
                            <FileText size={28} />
                        </div>
                        <h2 className="text-md sm:text-xl font-bold text-gray-800 mb-0 sm:mb-2">재직증명서</h2>
                        <p className="hidden sm:block text-sm text-gray-600 mb-6">현재 재직 중임을 증명하는 공식 문서</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-auto sm:w-full py-2 px-3 sm:px-0 sm:py-2.5 bg-white text-indigo-600 text-sm sm:text-base font-semibold rounded-lg shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-colors whitespace-nowrap ml-4 sm:ml-0"
                    >
                        미리보기 및 출력
                    </button>
                </div>

                {/* 빈 카드들 */}
                {Array.from({ length: 7 }).map((_, idx) => (
                    <div key={idx} className="rounded-xl bg-gray-50/60 border border-gray-200 border-dashed min-h-[80px] sm:min-h-[220px] flex items-center justify-center p-4 sm:p-6">
                        <span className="text-gray-400 font-medium opacity-70 text-sm sm:text-base">양식 준비중...</span>
                    </div>
                ))}
            </div>

            <div className="flex justify-center mt-auto">
                <Pagination count={1} page={currentPage} onChange={(e, val) => setCurrentPage(val)} />
            </div>

            {isModalOpen && (
                <PurposeSelectModal
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handlePreviewClick}
                />
            )}
        </div>
    );
};

export default CertificationList;