import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faChevronLeft, faChevronRight, faChevronDown, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { getMyQuestions, deleteMyQuestions } from '../mypage/mypageApi';
import { maxios } from '../../api/axiosConfig';
import { adminAiQuestionsData, deleteMyAnswer, getMyDeptQuestion, insertUpdateAnswer } from './adminApi';
import useUserStore from '../../store/userStore';
import { alertWarning, alertSuccess, alertError, alertConfirm } from '../../utils/alert';
import useLoadingStore from '../../store/useLoadingStore';
import Pagination from '../../components/common/Pagination';
import usePageInfoStore from '../../store/usePageInfoStore';

const AdminQna = () => {
  const { pages } = usePageInfoStore();
  const [filter, setFilter] = useState('전체');
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('질문 내용');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef(null);
  const [count, setCount] = useState({});

  const [isEditing, setIsEditing] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [answerError, setAnswerError] = useState('');
  const user = useUserStore(state => state.user);
  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);
  const currentPageInfo = pages.find(p => p.page_code === 'AdminQna');

  const userAuthGroups = user?.user_auth_group ?? [];
  const allUserGroups = [user?.auth_group, ...userAuthGroups].filter(Boolean);
  const isSuperAdmin = allUserGroups.includes('ROLE_SUPER_ADMIN');

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
    if (!user) return;

    const fetchData = async () => {
      try {
        showLoading();

        const [qnaResp, countResp] = await Promise.all([
          getMyDeptQuestion(user.dept_seq, isSuperAdmin),
          adminAiQuestionsData(user.dept_seq, isSuperAdmin)
        ]);

        setQnaList(qnaResp.data);
        setCount(countResp.data);
      } catch (err) {
        console.error("AI 문의 데이터 조회 실패: ", err);
        alertError("조회 실패", "문의 데이터를 불러오지 못했습니다.");
      } finally {
        hideLoading();
      }
    };

    fetchData();
  }, [user?.dept_seq, isSuperAdmin]);

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
  const mobilePageNumbers = (() => {
    if (totalPages <= 0) return [];
    const maxVisible = 5;
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - maxVisible + 1));
    const end = Math.min(totalPages, start + maxVisible - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  })();
  const hasPaginationData = paginatedQna.length > 0 && totalPages > 0;

  const handleDelete = async (question_seq) => {
    const result = await alertConfirm('정말 삭제하시겠습니까?', '삭제 후 복구는 불가합니다.');
    if (result.isConfirmed) {
      showLoading();
      await deleteMyAnswer(question_seq);
      hideLoading();
      await alertSuccess('삭제 완료', '답변 삭제가 완료되었습니다.');
      const resp = await getMyDeptQuestion(user?.dept_seq, isSuperAdmin);
      setQnaList(resp.data);
      const updated = resp.data.find(q => q.question_seq === selectedQna.question_seq);
      setSelectedQna(updated);
      const updateCount = await adminAiQuestionsData(user?.dept_seq, isSuperAdmin);
      setCount(updateCount.data);
    }
  };

  const handleAnswerClick = (item) => {
    setSelectedQna(item);
    setIsEditing(true);
    setAnswerText('');
    setAnswerError('');
  };

  const handleDetailClick = (item) => {
    setSelectedQna(item);
    setIsEditing(false);
    setAnswerText(item.handle_answer || '');
    setAnswerError('');
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setAnswerText(selectedQna.handle_answer || '');
    setAnswerError('');
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setAnswerError('');
    if (selectedQna.status === 'PENDING') {
      setSelectedQna(null);
    }
  };

  const hasPermission = (item) => {
    if (!item || !user) return false;
    return isSuperAdmin || item.users_handle_id === user.id;
  };

  // selectedQna가 null일 때 렌더링 에러를 방지하기 위한 안전장치 추가
  const payload = selectedQna ? {
    question_seq: selectedQna.question_seq,
    handle_answer: answerText,
    users_handle_id: user.id
  } : null;

  // 🛠️ 중괄호 및 if-return 로직 완벽 수정
  const handleAnswerSubmit = () => {
    if (!answerText.trim()) {
      alertWarning('답변 미입력', '답변을 입력해주세요.');
      return;
    }
    if (answerText.length > 300) {
      setAnswerError("글자수가 초과되었습니다. 300자까지만 입력 가능합니다.");
      return;
    }

    showLoading();
    insertUpdateAnswer(payload).then(resp => {
      hideLoading();
      alertSuccess(
        selectedQna.status === 'PENDING' ? '등록 완료' : '수정 완료',
        selectedQna.status === 'PENDING' ? '답변 등록이 완료되었습니다.' : '답변이 수정되었습니다.'
      );
      setIsEditing(false);
      getMyDeptQuestion(user?.dept_seq, isSuperAdmin).then(resp => {
        setQnaList(resp.data);
        const updated = resp.data.find(q => q.question_seq === selectedQna.question_seq);
        setSelectedQna(updated);
      });
      adminAiQuestionsData(user?.dept_seq, isSuperAdmin).then(resp => {
        setCount(resp.data);
      });
    }).catch(err => {
      console.error(err);
      alertError('처리 실패', '답변 처리에 실패했습니다.');
    });
  }

  return (
    <div className="flex flex-col h-full bg-[#FFFFFF] py-8 px-1 md:px-7 overflow-y-auto md:overflow-hidden custom-scrollbar">
      <div className="mb-6 px-4 md:px-2">
        <h1 className="text-xl md:text-2xl font-bold text-[#121331]">{currentPageInfo?.page_name}</h1>
        <p className="text-xs md:text-sm text-[#8a92a6] mt-1">{currentPageInfo?.page_info}</p>
      </div>

      <div className="flex flex-col md:flex-row h-auto md:flex-1 gap-6 min-h-0 max-w-[1450px] mx-auto w-full">
        <div className={`bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-[#edf2f9] p-3 md:p-8 flex flex-col transition-all duration-300 md:overflow-hidden min-w-0 ${selectedQna ? 'md:w-[65%] w-full' : 'w-full'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex bg-white rounded-2xl shadow-sm border border-[#edf2f9] p-1 w-full md:w-fit items-center flex-shrink-0">
              {[
                { label: '전체', count: count.allCount ?? 0 },
                { label: '답변 대기', count: count.pendingCount ?? 0 },
                { label: '답변완료', count: count.answeredCount ?? 0 }
              ].map(tab => (
                <button key={tab.label} onClick={() => { setFilter(tab.label); setCurrentPage(1); }}
                  className={`flex-1 md:flex-none px-2 md:px-6 py-1.5 rounded-xl text-[11px] md:text-sm font-bold transition-all whitespace-nowrap ${filter === tab.label ? 'bg-[#3530B8] text-white shadow-sm' : 'bg-white text-[#8a92a6] hover:bg-[#F0F4FF] hover:text-[#3530B8]'}`}>
                  {tab.label}
                  <span className="ml-1.5">
                    ({tab.count})
                  </span>
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

          <div className="flex-1 md:overflow-y-auto md:min-h-0 custom-scrollbar">
            {/* 데스크탑 뷰: 테이블 형식 */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse table-auto">
                <thead className="md:table-header-group">
                  <tr className="text-[#8a92a6] text-sm border-b border-gray-100">
                    <th className="pb-4 font-medium px-6 text-left w-[10%] whitespace-nowrap">카테고리</th>
                    <th className="pb-4 font-medium px-4 text-left w-[30%] whitespace-nowrap">질문 내용</th>
                    <th className="pb-4 font-medium px-4 text-left w-[5%] whitespace-nowrap">질문자</th>
                    <th className="pb-4 font-medium text-center px-4 w-[15%] whitespace-nowrap">등록일</th>
                    <th className="pb-4 font-medium px-9 text-left w-[10%] whitespace-nowrap">상태</th>
                    <th className="pb-4 font-medium px-8 text-left w-[10%] whitespace-nowrap">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedQna.length > 0 ? (
                    paginatedQna.map(item => (
                      <tr key={item.question_seq} className="border-b border-gray-100 transition-colors md:table-row align-middle">
                        <td className="py-7 px-6 md:table-cell text-sm font-medium text-[#1a1c3d] whitespace-nowrap align-middle">
                          <span className="inline-flex items-center px-3 py-1 bg-[#F0F4FF] text-[#3530B8] rounded-lg text-xs font-bold">
                            {item.category.replace("팀", "")}
                          </span>
                        </td>
                        <td className="py-4 px-4 md:table-cell text-sm text-[#1a1c3d] max-w-0 align-middle">
                          <div className="truncate">{item.question}</div>
                        </td>
                        <td className="py-4 px-4 md:table-cell text-sm text-gray-500 whitespace-nowrap align-middle">{item.user_name}</td>
                        <td className="py-4 px-4 text-center text-sm text-gray-500 whitespace-nowrap align-middle">{item?.created_at?.substring(0, 10)}</td>
                        <td className="py-4 px-4 md:table-cell whitespace-nowrap align-middle">
                          <span className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-bold ${item.status === 'ANSWERED' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                            {item.status === 'ANSWERED' ? '답변완료' : '답변 대기'}
                          </span>
                        </td>
                        <td className="py-4 px-4 md:table-cell whitespace-nowrap align-middle">
                          <div className="flex gap-2">
                            {item.status === 'PENDING' ? (
                              <button onClick={() => handleAnswerClick(item)} className="text-[11px] font-bold text-white border border-[#3530B8] bg-[#3530B8] px-3 py-1.5 rounded-lg hover:bg-[#2a2594] transition-all">
                                답변하기
                              </button>
                            ) : (
                              <>
                                <button onClick={() => handleDetailClick(item)} className="text-[11px] font-bold text-[#3530B8] border border-[#F0F4FF] bg-[#F0F4FF] px-3 py-1.5 rounded-lg hover:bg-[#3530B8] hover:text-white transition-all">
                                  상세보기
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-gray-400 text-sm">
                        질문이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 모바일 뷰: 카드 형식 */}
            <div className="md:hidden flex flex-col gap-4">
              {paginatedQna.length > 0 ? (
                paginatedQna.map(item => (
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
                        <span className="text-[10px] text-gray-400">{item.user_name}</span>
                        <span className="text-[10px] text-gray-400">{item?.created_at?.substring(0, 10)}</span>
                      </div>
                      <div className="flex gap-2">
                        {item.status === 'PENDING' ? (
                          <button onClick={() => handleAnswerClick(item)} className="text-[11px] font-bold text-white border border-[#3530B8] bg-[#3530B8] px-3 py-1.5 rounded-lg active:bg-[#2a2594] active:text-white whitespace-nowrap">
                            답변하기
                          </button>
                        ) : (
                          <>
                            <button onClick={() => handleDetailClick(item)} className="text-[11px] font-bold text-[#3530B8] border border-[#F0F4FF] bg-[#F0F4FF] px-3 py-1.5 rounded-lg active:bg-[#3530B8] active:text-white whitespace-nowrap">
                              상세보기
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-gray-400 text-sm bg-white rounded-2xl border border-[#edf2f9]">
                  질문이 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex justify-center gap-2 mt-4">
            <Pagination count={totalPages} page={currentPage} onChange={(_, value) => setCurrentPage(value)} />
          </div>
          <div className="md:hidden flex justify-center gap-2 mt-4">
            <button disabled={!hasPaginationData || currentPage === 1} onClick={() => hasPaginationData && currentPage > 1 && setCurrentPage(c => c - 1)} className="w-8 h-8 rounded-xl border border-[rgba(0,0,0,0.23)] text-xs font-bold text-[rgba(0,0,0,0.87)] transition-colors hover:bg-[#F0F4FF] hover:text-[#3530B8] disabled:opacity-[0.38] disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[rgba(0,0,0,0.87)]"><FontAwesomeIcon icon={faChevronLeft} /></button>
            {mobilePageNumbers.map(pageNumber => (
              <button key={pageNumber} onClick={() => setCurrentPage(pageNumber)} className={`w-8 h-8 rounded-xl border text-xs font-bold transition-colors ${currentPage === pageNumber ? 'bg-[#3530B8] border-[#3530B8] text-white hover:bg-[#2a2594]' : 'border-[rgba(0,0,0,0.23)] text-[rgba(0,0,0,0.87)] hover:bg-[#F0F4FF] hover:text-[#3530B8]'}`}>{pageNumber}</button>
            ))}
            <button disabled={!hasPaginationData || currentPage === totalPages} onClick={() => hasPaginationData && currentPage < totalPages && setCurrentPage(c => c + 1)} className="w-8 h-8 rounded-xl border border-[rgba(0,0,0,0.23)] text-xs font-bold text-[rgba(0,0,0,0.87)] transition-colors hover:bg-[#F0F4FF] hover:text-[#3530B8] disabled:opacity-[0.38] disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[rgba(0,0,0,0.87)]"><FontAwesomeIcon icon={faChevronRight} /></button>
          </div>
        </div>

        {/* 데스크탑 뷰: 상세 정보 패널 */}
        {selectedQna && (
          <div className="hidden md:flex w-[35%] bg-white rounded-[2.5rem] shadow-sm border border-[#edf2f9] p-10 transition-all duration-300 flex-col md:min-h-0">
            <div className="flex justify-between items-center mb-8 flex-shrink-0">
              <h2 className="text-xl font-bold text-[#1a1c3d]">문의 상세</h2>
              <button onClick={() => setSelectedQna(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><FontAwesomeIcon icon={faTimes} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-[#F0F4FF] text-[#3530B8] rounded-lg text-xs font-bold">{selectedQna.category.replace("팀", "")}</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedQna.status === 'ANSWERED' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                  {selectedQna.status === 'ANSWERED' ? '답변완료' : '답변 대기'}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#1a1c3d]">Q. 질문 내용</h3>
              <div className="bg-[#f4f7fc] p-6 rounded-2xl mb-8">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQna.question}</p>
                <p className="text-xs text-[#8a92a6] mt-4">{selectedQna?.created_at?.substring(0, 10)}</p>
              </div>

              <h3 className="text-lg font-bold mb-2 text-[#3530B8]">A. 관리자 답변</h3>
              <div className={`p-6 rounded-2xl border ${selectedQna.status === 'ANSWERED' && !isEditing ? 'bg-white border-[#edf2f9]' : 'bg-gray-50 border-dashed border-gray-200'}`}>
                {isEditing ? (
                  <>
                    <textarea
                      className="w-full h-32 p-4 bg-white border border-[#edf2f9] rounded-xl text-sm outline-none resize-none custom-scrollbar transition-all"
                      placeholder="답변을 입력해 주세요."
                      value={answerText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnswerText(val);
                        if (val.length > 300) {
                          setAnswerError("글자수가 초과되었습니다. 300자까지만 입력 가능합니다.");
                        } else {
                          setAnswerError("");
                        }
                      }}
                    />
                    {answerError && <p className="text-[11px] text-red-500 mt-2 ml-1">{answerError}</p>}
                  </>
                ) : selectedQna.status === 'ANSWERED' ? (
                  <div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQna.handle_answer}</p>
                    <p className="text-xs text-[#8a92a6] mt-4">{selectedQna?.answer_at?.substring(0, 10)} | {selectedQna.admin_name}</p>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-gray-400 text-center py-4">답변을 작성해 주세요.</p>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="flex gap-2 mt-auto pt-8 flex-shrink-0">
                <button onClick={handleCancelClick} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all">
                  취소
                </button>
                <button onClick={handleAnswerSubmit} className="flex-1 py-4 bg-[#3530B8] text-white rounded-xl font-bold hover:bg-[#2a2594] transition-all">
                  {selectedQna.status === 'PENDING' ? '등록' : '저장'}
                </button>
              </div>
            ) : (selectedQna.status === 'ANSWERED' && hasPermission(selectedQna)) ? (
              <div className="flex gap-2 mt-auto pt-8 flex-shrink-0">
                <button onClick={handleEditClick} className="flex-1 py-4 bg-[#3530B8] text-white rounded-xl font-bold hover:bg-[#2a2594] transition-all">
                  수정
                </button>
                <button onClick={() => handleDelete(selectedQna.question_seq)} className="flex-1 py-4 bg-red-50 text-red-600 border border-red-50 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all">
                  삭제
                </button>
              </div>
            ) : (
              <div className="mt-auto pt-8 flex-shrink-0">
                <button onClick={() => setSelectedQna(null)} className="w-full py-4 bg-[#3530B8] text-white rounded-xl font-bold hover:bg-[#2a2594] transition-all">
                  닫기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 모바일 뷰: 상세 정보 모달 */}
        {selectedQna && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-lg font-bold">문의 상세</h2>
                <button onClick={() => setSelectedQna(null)} className="text-gray-400"><FontAwesomeIcon icon={faTimes} /></button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div className="flex gap-2 mb-4">
                  <span className="px-2 py-1 bg-[#F0F4FF] text-[#3530B8] rounded-md text-[10px] font-bold">{selectedQna.category.replace("팀", "")}</span>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${selectedQna.status === 'ANSWERED' ? 'bg-[#F0FDF4] text-[#10B981]' : 'bg-[#FFF9F0] text-[#FF9800]'}`}>
                    {selectedQna.status === 'ANSWERED' ? '답변완료' : '답변 대기'}
                  </span>
                </div>
                <h4 className="text-[11px] font-bold text-[#8a92a6] uppercase mb-2">질문 내용</h4>
                <p className="text-xs text-gray-700 mb-4 bg-[#f4f7fc] p-4 rounded-xl whitespace-pre-wrap">{selectedQna.question}</p>

                <h4 className="text-[11px] font-bold text-[#3530B8] uppercase mb-2">관리자 답변</h4>
                <div className={`p-4 rounded-xl border ${selectedQna.status === 'ANSWERED' && !isEditing ? 'bg-white border-[#edf2f9]' : 'bg-gray-50 border-dashed border-gray-200'}`}>
                  {isEditing ? (
                    <>
                      <textarea
                        className="w-full h-24 p-3 bg-white border border-[#edf2f9] rounded-xl text-xs outline-none resize-none custom-scrollbar transition-all"
                        placeholder="답변을 입력해 주세요."
                        value={answerText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnswerText(val);
                          if (val.length > 300) {
                            setAnswerError("글자수가 초과되었습니다. 300자까지만 입력 가능합니다.");
                          } else {
                            setAnswerError("");
                          }
                        }}
                      />
                      {answerError && <p className="text-[10px] text-red-500 mt-2 ml-1">{answerError}</p>}
                    </>
                  ) : selectedQna.status === 'ANSWERED' ? (
                    <div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQna.handle_answer}</p>
                      <p className="text-xs text-[#8a92a6] mt-4">{selectedQna?.answer_at?.substring(0, 10)} | {selectedQna.admin_name}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center">답변을 작성해 주세요.</p>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="flex gap-2 mt-6 pt-2 flex-shrink-0">
                  <button onClick={handleAnswerSubmit} className="flex-1 py-3 bg-[#3530B8] text-white rounded-xl font-bold">
                    {selectedQna.status === 'PENDING' ? '등록' : '저장'}
                  </button>
                  <button onClick={handleCancelClick} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold">
                    취소
                  </button>
                </div>
              ) : (selectedQna.status === 'ANSWERED' && hasPermission(selectedQna)) ? (
                <div className="flex gap-2 mt-6 pt-2 flex-shrink-0">
                  <button onClick={handleEditClick} className="flex-1 py-3 bg-[#3530B8] text-white rounded-xl font-bold">
                    수정
                  </button>
                  <button onClick={() => handleDelete(selectedQna.question_seq)} className="flex-1 py-3 bg-red-50 text-red-600 border border-red-50 rounded-xl font-bold">
                    삭제
                  </button>
                </div>
              ) : (
                <div className="mt-6 pt-2 flex-shrink-0">
                  <button onClick={() => setSelectedQna(null)} className="w-full py-3 bg-[#3530B8] text-white rounded-xl font-bold">
                    닫기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
        textarea.custom-scrollbar::-webkit-scrollbar { width: 3px; }
      `}} />
    </div>
  );
};

export default AdminQna;
