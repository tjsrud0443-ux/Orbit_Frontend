import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faChevronLeft, faChevronRight, faChevronDown, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { getMyQuestions } from './mypageApi';

const QnaHistory = () => {
  const [filter, setFilter] = useState('전체');
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('질문 내용');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [qnaList, setQnaList] = useState([]);
  const [selectedQna, setSelectedQna] = useState(null);

  useEffect(() => {
    getMyQuestions().then(resp => {
      console.log(resp.data)
      setQnaList(resp.data);
    })
  },[]);

  const filteredQna = useMemo(() => {
    return qnaList.filter(item => {
      const matchesFilter = filter === '전체' || item.status === filter;
      const matchesSearch = searchBy === '질문 내용'
        ? item.question.includes(search)
        : item.category.includes(search);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search, searchBy, qnaList]);

  const paginatedQna = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQna.slice(start, start + itemsPerPage);
  }, [filteredQna, currentPage]);

  const totalPages = Math.ceil(filteredQna.length / itemsPerPage);

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setQnaList(prev => prev.filter(q => q.id !== id));
      alert('삭제되었습니다.');
    }
  };

  return (
    <div className="flex flex-col h-full py-8 px-2 overflow-y-auto">
      <div className="mb-6 px-2">
        <h1 className="text-xl md:text-2xl font-bold text-[#121331]">문의 내역</h1>
        <p className="text-xs md:text-sm text-[#8a92a6] mt-1">내가 작성한 문의 내역과 관리자의 답변을 확인할 수 있습니다.</p>
      </div>

      <div className="flex flex-col md:flex-row h-auto gap-6">
        <div className={`bg-white rounded-[2.5rem] shadow-sm border border-[#edf2f9] p-4 md:p-8 flex flex-col transition-all duration-300 ${selectedQna ? 'md:w-[65%] w-full' : 'w-full'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex bg-white rounded-2xl shadow-sm border border-[#edf2f9] p-1 w-full md:w-fit overflow-x-auto items-center">
              {['전체', '답변 대기', '답변 완료'].map(tab => (
                <button key={tab} onClick={() => { setFilter(tab); setCurrentPage(1); }}
                  className={`flex-1 md:flex-none px-6 py-1.5 rounded-xl text-sm font-bold transition-all ${filter === tab ? 'bg-[#3530B8] text-white shadow-sm' : 'bg-white text-[#8a92a6] hover:bg-[#F0F4FF] hover:text-[#3530B8]'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-end md:items-center">
              <div className="flex gap-2 w-full md:w-auto justify-end">
                <div className="relative w-fit md:w-auto" ref={searchDropdownRef}>
                  <div className="bg-[#f4f7fc] px-4 h-[40px] rounded-xl text-xs text-[#8a92a6] outline-none cursor-pointer flex items-center justify-between gap-3 whitespace-nowrap"
                    onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}>
                    {searchBy}
                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
                  </div>
                  {isSearchDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-lg z-50 overflow-hidden border border-[#edf2f9]">
                      {['질문 내용', '카테고리'].map(option => (
                        <div key={option}
                          className="px-4 py-2.5 text-xs text-[#8a92a6] hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer transition-colors whitespace-nowrap"
                          onClick={() => { setSearchBy(option); setIsSearchDropdownOpen(false); }}>
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative flex items-center flex-1 md:w-48">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-4 text-[#8a92a6]" />
                  <input placeholder="검색" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="pl-12 pr-4 h-[40px] bg-[#f4f7fc] rounded-xl text-sm w-full outline-none placeholder:text-[#8a92a6]" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-visible">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group">
                <tr className="text-[#8a92a6] text-sm border-b border-gray-100">
                  <th className="pb-4 font-medium px-2 text-left w-[15%]">카테고리</th>
                  <th className="pb-4 font-medium px-2 text-left w-[35%]">질문 내용</th>
                  <th className="pb-4 font-medium px-2 text-left w-[10%]">질문자</th>
                  <th className="pb-4 font-medium px-2 text-left w-[15%]">등록일</th>
                  <th className="pb-4 font-medium px-2 text-left w-[15%]">상태</th>
                  <th className="pb-4 font-medium px-2 text-left w-[10%]">상세보기</th>
                </tr>
              </thead>
              <tbody>
                {filteredQna.map(item => (
                  <tr key={item.question_seq} className="border-b border-gray-100 hover:bg-[#f8fbff] transition-colors block md:table-row w-full mb-4 md:mb-0">
                    <td className="py-2 px-2 block md:table-cell text-sm font-bold md:font-medium text-[#1a1c3d]">
                      <span className="md:hidden text-[#8a92a6] mr-2">카테고리:</span><span className="px-3 py-1 bg-[#F0F4FF] text-[#3530B8] rounded-lg text-xs font-bold">{item.category.replace("팀","")}</span>
                    </td>
                    <td className="py-2 px-2 block md:table-cell text-sm text-[#1a1c3d] truncate max-w-[200px] md:max-w-none">
                      <span className="md:hidden text-[#8a92a6] mr-2">질문:</span>{item.question}
                    </td>
                    <td className="py-2 px-2 block md:table-cell text-sm text-gray-500">
                      <span className="md:hidden text-[#8a92a6] mr-2">질문자:</span>{item.users_id}
                    </td>
                    <td className="py-2 px-2 block md:table-cell text-sm text-gray-500">
                      <span className="md:hidden text-[#8a92a6] mr-2">등록일:</span>{item.created_at}
                    </td>
                    <td className="py-2 px-2 block md:table-cell">
                      <span className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-bold ${item.status === '답변 완료' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 block md:table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedQna(item)} className="text-[11px] font-bold text-[#3530B8] border border-[#F0F4FF] bg-[#F0F4FF] px-3 py-1.5 rounded-lg hover:bg-[#3530B8] hover:text-white transition-all">
                          상세보기
                        </button>
                        {item.status === '답변 대기' && (
                          <button onClick={() => handleDelete(item.id)} className="text-[11px] font-bold text-red-600 border border-red-50 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className={`px-2.5 py-1 rounded-lg transition-all text-xs ${currentPage === 1 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}><FontAwesomeIcon icon={faChevronLeft} /></button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-2.5 py-1 rounded-lg transition-all text-xs ${currentPage === i + 1 ? 'bg-[#3530B8] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{i + 1}</button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} className={`px-2.5 py-1 rounded-lg transition-all text-xs ${currentPage === totalPages ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}><FontAwesomeIcon icon={faChevronRight} /></button>
          </div>
        </div>

        {/* 데스크탑 뷰: 상세 정보 패널 */}
        {selectedQna && (
          <div className="hidden md:flex w-[35%] bg-white rounded-[2.5rem] shadow-sm border border-[#edf2f9] p-10 transition-all duration-300 flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-[#1a1c3d]">문의 상세</h2>
              <button onClick={() => setSelectedQna(null)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#F0F4FF] text-[#3530B8] rounded-lg text-xs font-bold">{selectedQna.category.replace("팀","")}</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedQna.status === '답변 완료' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                {selectedQna.status}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[#1a1c3d]">Q. 질문 내용</h3>
            <div className="bg-[#f4f7fc] p-6 rounded-2xl mb-8">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQna.question}</p>
              <p className="text-xs text-[#8a92a6] mt-4">{selectedQna.created_at} | {selectedQna.users_id}</p>
            </div>
            
            <h3 className="text-lg font-bold mb-2 text-[#3530B8]">A. 관리자 답변</h3>
            <div className={`p-6 rounded-2xl border ${selectedQna.status === '답변 완료' ? 'bg-white border-[#edf2f9]' : 'bg-gray-50 border-dashed border-gray-200'}`}>
              {selectedQna.status === '답변 완료' ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQna.answer}</p>
              ) : (
                <p className="text-sm font-bold text-gray-400 text-center py-4">답변을 기다리는 중입니다.</p>
              )}
            </div>
            
            <button onClick={() => setSelectedQna(null)} className="mt-auto w-full py-4 bg-[#3530B8] text-white rounded-xl font-bold hover:bg-[#2a2594] transition-all">
              닫기
            </button>
          </div>
        )}

        {/* 모바일 뷰: 상세 정보 모달 */}
        {selectedQna && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">문의 상세</h2>
                <button onClick={() => setSelectedQna(null)}><FontAwesomeIcon icon={faTimes} /></button>
              </div>
              <div className="flex gap-2 mb-4">
                <span className="px-2 py-1 bg-[#F0F4FF] text-[#3530B8] rounded-md text-[10px] font-bold">{selectedQna.category.replace("팀","")}</span>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${selectedQna.status === '답변 완료' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                  {selectedQna.status}
                </span>
              </div>
              <h4 className="text-[11px] font-bold text-[#8a92a6] uppercase mb-2">질문 내용</h4>
              <p className="text-xs text-gray-700 mb-4 bg-[#f4f7fc] p-4 rounded-xl whitespace-pre-wrap">{selectedQna.question}</p>
              
              <h4 className="text-[11px] font-bold text-[#3530B8] uppercase mb-2">관리자 답변</h4>
              <div className={`p-4 rounded-xl border ${selectedQna.status === '답변 완료' ? 'bg-white border-[#edf2f9]' : 'bg-gray-50 border-dashed border-gray-200'}`}>
                {selectedQna.status === '답변 완료' ? (
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{selectedQna.answer}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center">답변을 기다리는 중입니다.</p>
                )}
              </div>
              <button onClick={() => setSelectedQna(null)} className="w-full mt-6 py-3 bg-[#3530B8] text-white rounded-xl font-bold">
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QnaHistory;