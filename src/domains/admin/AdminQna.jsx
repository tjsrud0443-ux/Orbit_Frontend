import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faChevronLeft, faChevronRight, faChevronDown, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { getMyQuestions, deleteMyQuestions } from '../mypage/mypageApi';


const AdminQna = () => {
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
      setQnaList(resp.data);
    })
  }, []);

  const filteredQna = useMemo(() => {
    return qnaList.filter(item => {
      const matchesFilter = filter === '전체' || (
        filter === '답변 대기' ? item.status === 'PENDING' : filter === '답변완료' ? item.status === 'ANSWERED' : item.status === filter
      );
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

  const handleDelete = (question_seq) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteMyQuestions(question_seq).then(resp => {
        console.log("DB 삭제 완료");
        alert('삭제되었습니다.');
        getMyQuestions().then(resp => {
          setQnaList(resp.data);
        })
      })
    }
  };

  return (
    <div className="flex flex-col h-full py-8 px-1 md:px-7 overflow-y-auto">
      <div className="mb-6 px-4 md:px-2">
        <h1 className="text-xl md:text-2xl font-bold text-[#121331]">AI 답변 불가 질문 관리</h1>
        <p className="text-xs md:text-sm text-[#8a92a6] mt-1">AI가 답변할 수 없는 질문을 관리하고 답변을 등록하세요.</p>
      </div>

      <div className="flex flex-col md:flex-row h-auto md:h-[1100px] gap-6 min-h-0 max-w-[1450px] mx-auto w-full">
        <div className={`bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-[#edf2f9] p-3 md:p-8 flex flex-col transition-all duration-300 md:overflow-hidden min-w-0 ${selectedQna ? 'md:w-[65%] w-full' : 'w-full'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex bg-white rounded-2xl shadow-sm border border-[#edf2f9] p-1 w-full md:w-fit items-center flex-shrink-0">
              {['전체', '답변 대기', '답변완료'].map(tab => (
                <button key={tab} onClick={() => { setFilter(tab); setCurrentPage(1); }}
                  className={`flex-1 md:flex-none px-2 md:px-6 py-1.5 rounded-xl text-[11px] md:text-sm font-bold transition-all whitespace-nowrap ${filter === tab ? 'bg-[#3530B8] text-white shadow-sm' : 'bg-white text-[#8a92a6] hover:bg-[#F0F4FF] hover:text-[#3530B8]'}`}>
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

          <div className="flex-1">
            {/* 데스크탑 뷰: 테이블 형식 */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse table-auto">
                <thead className="md:table-header-group">
                  <tr className="text-[#8a92a6] text-sm border-b border-gray-100">
                    <th className="pb-4 font-medium px-6 text-left w-[10%] whitespace-nowrap">카테고리</th>
                    <th className="pb-4 font-medium px-4 text-left w-[30%] whitespace-nowrap">질문 내용</th>
                    <th className="pb-4 font-medium px-4 text-left w-[15%] whitespace-nowrap">등록일</th>
                    <th className="pb-4 font-medium px-5 text-left w-[10%] whitespace-nowrap">상태</th>
                    <th className="pb-4 font-medium px-5 text-left w-[10%] whitespace-nowrap">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedQna.map(item => (
                    <tr key={item.question_seq} className="border-b border-gray-100 hover:bg-[#f8fbff] transition-colors md:table-row align-middle">
                      <td className="py-7 px-6 md:table-cell text-sm font-medium text-[#1a1c3d] whitespace-nowrap align-middle">
                        <span className="inline-flex items-center px-3 py-1 bg-[#F0F4FF] text-[#3530B8] rounded-lg text-xs font-bold">
                          {item.category.replace("팀", "")}
                        </span>
                      </td>
                      <td className="py-4 px-4 md:table-cell text-sm text-[#1a1c3d] max-w-0 align-middle">
                        <div className="truncate">{item.question}</div>
                      </td>
                      <td className="py-4 px-4 md:table-cell text-sm text-gray-500 whitespace-nowrap align-middle">{item.created_at}</td>
                      <td className="py-4 px-4 md:table-cell whitespace-nowrap align-middle">
                        <span className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-bold ${item.status === 'ANSWERED' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                          {item.status === 'ANSWERED' ? '답변완료' : '답변 대기'}
                        </span>
                      </td>
                      <td className="py-4 px-4 md:table-cell whitespace-nowrap align-middle">
                        <div className="flex gap-2">
                          {item.status === 'PENDING' ? (
                            <button onClick={() => setSelectedQna(item)} className="text-[11px] font-bold text-white border border-[#3530B8] bg-[#3530B8] px-3 py-1.5 rounded-lg hover:bg-[#2a2594] transition-all">
                              답변하기
                            </button>
                          ) : (
                            <>
                              <button onClick={() => setSelectedQna(item)} className="text-[11px] font-bold text-[#3530B8] border border-[#F0F4FF] bg-[#F0F4FF] px-3 py-1.5 rounded-lg hover:bg-[#3530B8] hover:text-white transition-all">
                                상세보기
                              </button>
                              <button onClick={() => handleDelete(item.question_seq)} className="text-[11px] font-bold text-red-600 border border-red-50 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                                <FontAwesomeIcon icon={faTrashCan} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일 뷰: 카드 형식 */}
            <div className="md:hidden flex flex-col gap-4">
              {paginatedQna.map(item => (
                <div key={item.question_seq} className="bg-[#f8fbff] rounded-2xl p-5 border border-[#edf2f9] shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 bg-[#F0F4FF] text-[#3530B8] rounded-lg text-xs font-bold whitespace-nowrap">
                      {item.category.replace("팀", "")}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${item.status === 'ANSWERED' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                      {item.status === 'ANSWERED' ? '답변완료' : '답변 대기'}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-[#1a1c3d] font-bold mb-1">Q. 질문 내용</p>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{item.question}</p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-400">{item.created_at}</span>
                    </div>
                    <div className="flex gap-2">
                      {item.status === 'PENDING' ? (
                        <button onClick={() => setSelectedQna(item)} className="text-[11px] font-bold text-white border border-[#3530B8] bg-[#3530B8] px-3 py-1.5 rounded-lg active:bg-[#2a2594] active:text-white whitespace-nowrap">
                          답변하기
                        </button>
                      ) : (
                        <>
                          <button onClick={() => setSelectedQna(item)} className="text-[11px] font-bold text-[#3530B8] border border-[#F0F4FF] bg-[#F0F4FF] px-3 py-1.5 rounded-lg active:bg-[#3530B8] active:text-white whitespace-nowrap">
                            상세보기
                          </button>
                          <button onClick={() => handleDelete(item.question_seq)} className="text-[11px] font-bold text-red-600 border border-red-50 bg-red-50 px-3 py-1.5 rounded-lg active:bg-red-600 active:text-white">
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <span className="px-3 py-1 bg-[#F0F4FF] text-[#3530B8] rounded-lg text-xs font-bold">{selectedQna.category.replace("팀", "")}</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedQna.status === 'ANSWERED' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                {selectedQna.status === 'ANSWERED' ? '답변완료' : '답변 대기'}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[#1a1c3d]">Q. 질문 내용</h3>
            <div className="bg-[#f4f7fc] p-6 rounded-2xl mb-8">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQna.question}</p>
              <p className="text-xs text-[#8a92a6] mt-4">{selectedQna.created_at}</p>
            </div>

            <h3 className="text-lg font-bold mb-2 text-[#3530B8]">A. 관리자 답변</h3>
            <div className={`p-6 rounded-2xl border ${selectedQna.status === 'ANSWERED' ? 'bg-white border-[#edf2f9]' : 'bg-gray-50 border-dashed border-gray-200'}`}>
              {selectedQna.status === 'ANSWERED' ? (
                <div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQna.handle_answer}</p>
                  <p className="text-xs text-[#8a92a6] mt-4">{selectedQna.answer_at} | {selectedQna.name}</p>
                </div>
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
                <span className="px-2 py-1 bg-[#F0F4FF] text-[#3530B8] rounded-md text-[10px] font-bold">{selectedQna.category.replace("팀", "")}</span>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${selectedQna.status === 'ANSWERED' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                  {selectedQna.status === 'ANSWERED' ? '답변완료' : '답변 대기'}
                </span>
              </div>
              <h4 className="text-[11px] font-bold text-[#8a92a6] uppercase mb-2">질문 내용</h4>
              <p className="text-xs text-gray-700 mb-4 bg-[#f4f7fc] p-4 rounded-xl whitespace-pre-wrap">{selectedQna.question}</p>

              <h4 className="text-[11px] font-bold text-[#3530B8] uppercase mb-2">관리자 답변</h4>
              <div className={`p-4 rounded-xl border ${selectedQna.status === 'ANSWERED' ? 'bg-white border-[#edf2f9]' : 'bg-gray-50 border-dashed border-gray-200'}`}>
                {selectedQna.status === 'ANSWERED' ? (
                  <div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQna.handle_answer}</p>
                    <p className="text-xs text-[#8a92a6] mt-4">{selectedQna.answer_at} | {selectedQna.name}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center">답변을 기다리는 중입니다.</p>
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

export default AdminQna;
