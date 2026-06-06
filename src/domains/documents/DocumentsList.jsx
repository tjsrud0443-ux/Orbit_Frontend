import React, { useState, useEffect } from 'react';
import Pagination from '../../components/common/Pagination';
import { addFavorite, getAllDocs, getFavorites, removeFavorite } from './documentsApi';

const DocumentsList = () => {
  const [activeTab, setActiveTab] = useState('전체 문서');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [documents, setDocuments] = useState([]);
  const [favorites, setFavorites] = useState(new Set());

  const loadDocuments = async () => {
    try {
    const docsResp = await getAllDocs();
    setDocuments(docsResp.data);

    const favsResp = await getFavorites();
    const favSeq = new Set(favsResp.data.map(fav => fav.document_seq));
    setFavorites(favSeq);

  } catch (err) {
    console.error("데이터 로드 실패:", err);
  }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // 필터링 및 검색
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesTab = activeTab === '전체 문서' || favorites.has(doc.document_seq);
    return matchesSearch && matchesTab;
  });

  // 페이지네이션
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const displayedDocs = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const toggleFavorite = async (document_seq) => {
    const isFavorite = favorites.has(document_seq);

    try{
      if (isFavorite) {
        await removeFavorite(document_seq);

        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.delete(document_seq);
          return newFavorites;
        });
        if (activeTab === '즐겨찾기') {
          setCurrentPage(1);
        }
      } else {
        await addFavorite(document_seq);

        setFavorites((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.add(document_seq);
          return newFavorites;
        });
      }
    } catch (err){
      console.error("즐겨찾기 실패:", err);
      alert("즐겨찾기 중 오류가 발생했습니다.");
    }
  }

  const handleDownload = (title) => {
    alert(`${title} 파일을 다운로드합니다.`);
  };

  return (
    <div className="h-full flex flex-col bg-white font-sans p-6 md:p-8">
      {/* [1] 헤더 영역 */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">자료실</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">업무에 필요한 사내 문서를 간편하게 조회하고 다운로드하세요.</p>
      </div>

      {/* [2] 필터 탭 & 검색창 라인 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-[#F0F4FF] overflow-x-auto no-scrollbar sm:w-auto">
          {['전체 문서', '즐겨찾기'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-6 py-2 text-[0.6875rem] md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-[#3530B8] text-white shadow-md' 
                  : 'text-gray-500 hover:text-[#3530B8] hover:bg-[#F0F4FF]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative group w-full md:w-72 flex-shrink-0">
          <input 
            type="text" 
            placeholder="문서 제목으로 검색"
            value={searchKeyword}
            onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl 
            focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-sm text-gray-700 shadow-sm"/>
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3530B8] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* [3] 목록 영역 */}
      <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
          <table className="w-full text-left border-collapse mt-6">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center w-50">다운로드</th>
                <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-110">제목</th>
                <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-50">작성자</th>
                <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-30">등록일</th>
                <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center w-50">즐겨찾기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                    문서가 없습니다.
                  </td>
                </tr>
              ) : (
                displayedDocs.map((doc) => (
                  <tr key={doc.document_seq} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 text-center">
                      <button 
                        onClick={() => handleDownload(doc.title)}
                        className="p-2 border border-[#3530B8]/30 rounded-lg hover:bg-[#F0F4FF] transition-all group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#3530B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </td>
                    <td className="py-4 text-sm font-semibold text-slate-800 cursor-pointer hover:text-[#3530B8] transition-colors">
                      {doc.title}
                    </td>
                    <td className="py-4 text-xs text-slate-500 font-medium">
                      {doc.users_id}
                    </td>
                    <td className="py-4 text-[0.6875rem] text-slate-400 font-mono">
                      {doc.created_at?.substring(0,10)}
                    </td>
                    <td className="py-4 text-center">
                      <button 
                        onClick={() => toggleFavorite(doc.document_seq)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        {favorites.has(doc.document_seq) ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-50 bg-white rounded-b-[32px] py-2">
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={handlePageChange} 
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
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

export default DocumentsList;
