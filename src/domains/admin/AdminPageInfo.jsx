import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import useLoadingStore from '../../store/useLoadingStore';
import usePageInfoStore from '../../store/usePageInfoStore';
import { updateCategory, updatePageInfo } from './adminApi';
import { alertWarning } from '../../utils/alert';

const AdminPageInfo = () => {
    const { categories, pages, fetchPageInfo } = usePageInfoStore();

    const [activeTab, setActiveTab] = useState('전체');

    const showLoading = useLoadingStore(state => state.showLoading);
    const hideLoading = useLoadingStore(state => state.hideLoading);

    // 페이지 수정 관련 상태
    const [editRowId, setEditRowId] = useState(null);
    const [editRowData, setEditRowData] = useState({ page_category: '', page_info: '' });
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

    // 카테고리 수정 관련 상태
    const [editCategoryNameId, setEditCategoryNameId] = useState(null);
    const [editCategoryNewName, setEditCategoryNewName] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredPages = activeTab === '전체'
        ? pages
        : pages.filter(page => page.page_category === activeTab);

    const count = Math.ceil(filteredPages.length / itemsPerPage);

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    const handleSavePage = async (pageSeq) => {
        showLoading();
        await updatePageInfo(pageSeq, editRowData);
        await fetchPageInfo();
        hideLoading();
        setEditRowId(null);
    };

    const handleSaveCategory = async (oldCategoryName) => {
        if (!editCategoryNewName || editCategoryNewName.trim() === '') {
            alertWarning("정보 미입력", "카테고리명을 입력해주세요.");
            return;
        }

        showLoading();
        await updateCategory(oldCategoryName, editCategoryNewName);
        await fetchPageInfo();
        hideLoading();
        setEditCategoryNameId(null);
    };

    const currentPageInfo = pages.find(p => p.page_code === 'AdminPageInfo');
    return (
        <div className="h-full flex flex-col bg-white font-sans p-3 md:p-8">
            {/* 타이틀 영역 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4 mb-4 md:mb-6 flex-shrink-0">
                <div className="space-y-1">
                    <h1 className="text-[1.25rem] md:text-[1.5rem] font-bold text-slate-900 mb-0 md:mb-1 tracking-tight">{currentPageInfo?.page_name}</h1>
                    <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">{currentPageInfo?.page_info}</p>
                </div>
            </div>

            {/* 탭 영역 */}
            <div className="flex gap-8 border-b border-gray-100 mb-6">
                {['전체', ...categories].map((category, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setActiveTab(category);
                            setCurrentPage(1);
                        }}
                        className={`pb-3 text-sm font-bold transition-all relative ${activeTab === category
                            ? 'text-[#3530B8]'
                            : 'text-gray-400 hover:text-[#3530B8]'
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
                            <thead className="bg-white border-b border-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">카테고리</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">페이지명</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-3/6">안내 문구</th>
                                    <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((page) => (
                                    editRowId === page.page_seq ? (
                                        <tr key={page.page_seq} className="bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 relative">
                                                <div
                                                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-700 flex items-center justify-between cursor-pointer hover:border-[#3530B8] transition-all"
                                                >
                                                    {editRowData.page_category || "선택"}
                                                    <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] text-gray-400 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                                                </div>
                                                {categoryDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-[99]" onClick={() => setCategoryDropdownOpen(false)} />
                                                        <div className="absolute top-full left-6 right-6 mt-1 z-[100] bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95">
                                                            {categories.filter(c => c !== '전체').map(c => (
                                                                <div
                                                                    key={c}
                                                                    onClick={() => {
                                                                        setEditRowData({ ...editRowData, page_category: c });
                                                                        setCategoryDropdownOpen(false);
                                                                    }}
                                                                    className={`p-3 hover:bg-[#F0F4FF] cursor-pointer text-xs font-bold text-gray-700 border-b border-gray-50 last:border-0 ${editRowData.page_category === c ? 'bg-[#F0F4FF]' : ''}`}
                                                                >
                                                                    {c}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-sm font-semibold text-slate-700">{page.page_name}</td>
                                            <td className="py-4 px-6">
                                                <input
                                                    type="text"
                                                    value={editRowData.page_info}
                                                    onChange={(e) => setEditRowData({ ...editRowData, page_info: e.target.value })}
                                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3530B8]"
                                                />
                                            </td>
                                            <td className="py-4 px-6 text-center space-x-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleSavePage(page.page_seq)}
                                                    className="text-xs font-bold text-white bg-[#3530B8] px-3 py-1.5 rounded-lg hover:bg-[#2a2594] transition-all">
                                                    저장
                                                </button>
                                                <button
                                                    onClick={() => setEditRowId(null)}
                                                    className="text-xs font-bold text-gray-500 border border-gray-300 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all">
                                                    취소
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={page.page_seq} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6 text-sm font-semibold text-slate-700">{page.page_category}</td>
                                            <td className="py-4 px-6 text-sm font-semibold text-slate-700">{page.page_name}</td>
                                            <td className="py-4 px-6 text-sm text-slate-600">{page.page_info}</td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => {
                                                        setEditRowId(page.page_seq);
                                                        setEditRowData({ page_category: page.page_category, page_info: page.page_info });
                                                        setCategoryDropdownOpen(false);
                                                    }}
                                                    className="text-xs font-bold text-[#3530B8] bg-[#F0F4FF] px-3 py-1.5 rounded-lg hover:bg-[#3530B8] hover:text-white transition-all">
                                                    수정
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                ))}
                                {filteredPages.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-gray-400 text-sm font-bold">
                                            등록된 페이지가 없습니다.
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
                            editCategoryNameId === category ? (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#3530B8] shadow-sm">
                                    <input
                                        type="text"
                                        value={editCategoryNewName}
                                        onChange={(e) => setEditCategoryNewName(e.target.value)}
                                        className="flex-1 mr-2 p-1 text-xs font-bold text-gray-900 focus:outline-none"
                                    />
                                    <div className="flex gap-1">
                                        <button onClick={() => handleSaveCategory(category)} className="text-[10px] font-bold text-white bg-[#3530B8] px-2 py-1 rounded hover:bg-[#2a2594]">저장</button>
                                        <button onClick={() => setEditCategoryNameId(null)} className="text-[10px] font-bold text-gray-500 border border-gray-300 bg-white px-2 py-1 rounded hover:bg-gray-200">취소</button>
                                    </div>
                                </div>
                            ) : (
                                <div key={idx} className="flex items-center justify-between p-3 bg-[#F0F4FF] rounded-xl border border-gray-100">
                                    <span className="text-xs font-bold text-gray-700">{category}</span>
                                    <button
                                        onClick={() => {
                                            setEditCategoryNameId(category);
                                            setEditCategoryNewName(category);
                                        }}
                                        className="text-gray-400 hover:text-[#3530B8] transition-colors p-1 rounded-lg hover:bg-white shadow-sm">
                                        <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )
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