import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';

const AdminPageInfo = () => {
    // 백엔드 연동 전 임시 데이터 및 상태 세팅
    const [categories, setCategories] = useState(['전체', '전자결재', '업무지원', '사내게시판', '마이페이지', '관리자']);
    const [activeTab, setActiveTab] = useState('전체');

    const [pages, setPages] = useState([
        { id: 1, page_category: '인사/조직', page_name: '직원조회', page_info: '직원 정보를 조회할 수 있습니다.' },
        { id: 2, page_category: '인사/조직', page_name: '조직도', page_info: '조직도를 확인할 수 있습니다.' },
        { id: 3, page_category: '일정/예약', page_name: '회의실 예약', page_info: '회의실을 예약할 수 있습니다.' },
    ]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredPages = activeTab === '전체'
        ? pages
        : pages.filter(page => page.page_category === activeTab);

    const count = Math.ceil(filteredPages.length / itemsPerPage);

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    return (
        <div className="h-full flex flex-col bg-white font-sans p-3 md:p-8">
            {/* 타이틀 영역 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4 mb-4 md:mb-6 flex-shrink-0">
                <div className="space-y-1">
                    <h1 className="text-[1.25rem] md:text-[1.5rem] font-bold text-slate-900 mb-0 md:mb-1 tracking-tight">페이지 안내 문구 관리</h1>
                </div>
            </div>

            {/* 탭 영역 */}
            <div className="flex gap-8 border-b border-gray-100 mb-6">
                {categories.map((category, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setActiveTab(category);
                            setCurrentPage(1);
                        }}
                        className={`pb-3 text-sm font-bold transition-all relative ${activeTab === category
                            ? 'text-[#3530B8]'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {category}
                        {activeTab === category && (
                            <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#3530B8] rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
                {/* 왼쪽 목록 및 페이지네이션 영역 */}
                <div className="flex-1 flex flex-col bg-white rounded-2xl md:rounded-[2rem] border border-[#F0F4FF] shadow-sm overflow-hidden min-h-0">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full min-w-[600px]">
                            <thead className="border-b border-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">카테고리</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">페이지명</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-3/6">안내 문구</th>
                                    <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((page) => (
                                    <tr key={page.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 text-sm font-semibold text-slate-700">{page.page_category}</td>
                                        <td className="py-4 px-6 text-sm font-semibold text-slate-700">{page.page_name}</td>
                                        <td className="py-4 px-6 text-sm text-slate-600">{page.page_info}</td>
                                        <td className="py-4 px-6 text-center">
                                            <button className="text-xs font-bold text-[#3530B8] bg-[#F0F4FF] px-3 py-1.5 rounded-lg hover:bg-[#3530B8] hover:text-white transition-all">
                                                수정
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredPages.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-gray-400 text-sm font-bold">
                                            등록된 안내 문구가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-gray-50 bg-white">
                        <Pagination count={count} page={currentPage} onChange={handlePageChange} />
                    </div>
                </div>

                {/* 우측 카테고리 관리 영역 */}
                <div className="hidden md:flex flex-col bg-white rounded-[2rem] border border-[#F0F4FF] shadow-sm overflow-hidden w-80 h-[73%] flex-shrink-0">
                    <div className="p-6 border-b border-gray-50 flex-shrink-0">
                        <h2 className="text-lg font-bold text-gray-900">카테고리 관리</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar space-y-2">
                        {categories.filter(c => c !== '전체').map((category, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-700">{category}</span>
                                <button className="text-gray-400 hover:text-[#3530B8] transition-colors p-1 rounded-lg hover:bg-[#F0F4FF]">
                                    <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        {categories.filter(c => c !== '전체').length === 0 && (
                            <div className="py-8 text-center text-gray-400 text-sm font-bold">
                                카테고리가 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPageInfo;