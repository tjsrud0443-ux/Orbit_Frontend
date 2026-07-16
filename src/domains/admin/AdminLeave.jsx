import React, { useState, useEffect, useRef } from 'react';
import Pagination from '../../components/common/Pagination';
import MobilePagination from '../../components/common/MobilePagination';
// import { getAllLeaves, updateUserLeave } from './adminApi'; // TODO: 백엔드 API 구현 후 주석 해제
import { alertError, alertConfirm, alertSuccess } from '../../utils/alert';

// TODO: adminApi 완성 전까지 사용할 더미 데이터
const DUMMY_EMPLOYEES = [
  { users_seq: 1, name: '김철수', dept_name: '개발팀', rank_name: '사원', hire_date: '2023-03-02', total_leave: 15, used_leave: 4 },
  { users_seq: 2, name: '이영희', dept_name: '인사팀', rank_name: '대리', hire_date: '2021-07-15', total_leave: 15, used_leave: 12 },
  { users_seq: 3, name: '박민수', dept_name: '영업팀', rank_name: '과장', hire_date: '2019-01-10', total_leave: 18, used_leave: 2 },
];

const AdminLeave = () => {
  const [employees, setEmployees] = useState([]);
  // 페이지네이션
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 상세 정보를 볼 직원 관리
  const [selectedUser, setSelectedUser] = useState(null);
  // 상세 정보 수정 모드 관리
  const [isDetailEditing, setIsDetailEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // 검색 관련 상태
  const [searchKeyword, setSearchKeyword] = useState('');

  const containerRef = useRef(null);

  // 연차 스텝(1일 단위로 조절하고 싶으면 1로 변경)
  const LEAVE_STEP = 0.5;
  const LEAVE_MIN = 0;
  const LEAVE_MAX = 30;

  // 외부 클릭 시 수정 모드 해제 (드롭다운이 없어졌으므로 단순화)
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        // 필요 시 여기에 다른 팝업 닫기 로직 추가
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 직원 연차 정보 목록 조회
  useEffect(() => {
    fetchEmployees(currentPage, searchKeyword);
  }, [currentPage, searchKeyword]);

  const fetchEmployees = (page = 1, keyword = '') => {
    // TODO: 백엔드 API 완성되면 아래 주석 해제하고 더미 데이터 로직 제거
    // getAllLeaves(page, keyword).then((resp) => {
    //   setEmployees(resp.data.users || []);
    //   setTotalCount(resp.data.totalCount || 0);
    // });

    // ---- 더미 데이터로 임시 동작 ----
    const filtered = keyword
      ? DUMMY_EMPLOYEES.filter(
          (emp) =>
            emp.name.includes(keyword) ||
            emp.dept_name.includes(keyword) ||
            String(emp.users_seq).includes(keyword)
        )
      : DUMMY_EMPLOYEES;
    setEmployees(filtered);
    setTotalCount(filtered.length);
    // ---------------------------------
  };

  // 검색 핸들러
  const handleSearch = () => {
    const keyword = searchKeyword.trim();
    setCurrentPage(1);
    fetchEmployees(1, keyword);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredEmployees = employees;
  const totalPages = Math.ceil(totalCount / 10);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // 잔여 연차 계산
  const getRemainLeave = (total, used) => {
    const t = Number(total) || 0;
    const u = Number(used) || 0;
    return Math.max(t - u, 0);
  };

  // 상세 정보 수정 시작
  const handleDetailEdit = () => {
    setEditForm({
      total_leave: selectedUser.total_leave ?? 0,
      used_leave: selectedUser.used_leave ?? 0,
    });
    setIsDetailEditing(true);
  };

  // 연차 숫자 증감 (업다운 버튼)
  const handleLeaveStep = (direction) => {
    setEditForm((prev) => {
      const current = Number(prev.total_leave) || 0;
      let next = direction === 'up' ? current + LEAVE_STEP : current - LEAVE_STEP;
      next = Math.min(LEAVE_MAX, Math.max(LEAVE_MIN, next));
      next = Math.round(next * 10) / 10;
      return { ...prev, total_leave: next };
    });
  };

  // 입력창 직접 수정
  const handleLeaveInputChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setEditForm((prev) => ({ ...prev, total_leave: '' }));
      return;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    const clamped = Math.min(LEAVE_MAX, Math.max(LEAVE_MIN, num));
    setEditForm((prev) => ({ ...prev, total_leave: clamped }));
  };

  const handleLeaveInputBlur = () => {
    setEditForm((prev) => ({
      ...prev,
      total_leave: prev.total_leave === '' ? 0 : prev.total_leave,
    }));
  };

  // 상세 정보 저장
  const handleDetailSave = () => {
    alertConfirm('연차 정보 수정', '해당 직원의 연차 정보를 수정하시겠습니까?').then((result) => {
      if (result.isConfirmed) {
        // TODO: 백엔드 API 완성되면 아래 주석 해제
        // updateUserLeave(selectedUser.users_seq, editForm)
        //   .then(() => {
        //     setEmployees((prev) =>
        //       prev.map((emp) =>
        //         emp.users_seq === selectedUser.users_seq
        //           ? { ...emp, total_leave: editForm.total_leave, used_leave: editForm.used_leave }
        //           : emp
        //       )
        //     );
        //     setSelectedUser((prev) => ({
        //       ...prev,
        //       total_leave: editForm.total_leave,
        //       used_leave: editForm.used_leave,
        //     }));
        //     setIsDetailEditing(false);
        //     alertSuccess('수정 완료', '연차 정보가 성공적으로 수정되었습니다.');
        //   })
        //   .catch(() => {
        //     alertError('오류 발생', '연차 정보 수정 중 오류가 발생했습니다.');
        //   });

        // ---- 더미 데이터로 임시 동작 (프론트 상태만 반영) ----
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.users_seq === selectedUser.users_seq
              ? { ...emp, total_leave: editForm.total_leave, used_leave: editForm.used_leave }
              : emp
          )
        );
        setSelectedUser((prev) => ({
          ...prev,
          total_leave: editForm.total_leave,
          used_leave: editForm.used_leave,
        }));
        setIsDetailEditing(false);
        alertSuccess('수정 완료', '연차 정보가 성공적으로 수정되었습니다. (더미 데이터)');
        // ---------------------------------------------------
      }
    });
  };

  return (
    <div ref={containerRef} className={`h-full flex flex-col bg-white font-sans ${selectedUser ? 'p-0 md:p-8' : 'p-6 md:p-8'}`}>

      {/* [1] 헤더 영역 */}
      <div className={`mb-6 flex-shrink-0 ${selectedUser ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">연차 관리</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">직원별 연차 부여 및 사용 현황을 확인하고 관리할 수 있습니다.</p>
      </div>

      {/* [2] 검색창 라인 */}
      <div className={`flex flex-col md:flex-row md:items-center justify-end gap-4 mb-6 flex-shrink-0 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="relative group w-full md:w-72 flex-shrink-0">
          <input
            type="text"
            placeholder="사번, 이름, 부서로 검색"
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setCurrentPage(1);
            }}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl
            focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-sm text-gray-700 shadow-sm"
          />
          <div
            onClick={handleSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3530B8] transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* [3] 메인 콘텐츠 영역 */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">

        <div className={`flex flex-col bg-white border border-slate-100 rounded-[32px]
          shadow-sm overflow-hidden transition-all duration-500 min-h-0 ${selectedUser ? 'hidden md:flex md:flex-[0.7]' : 'flex-1'}`}>
          <div className="flex-1 overflow-y-auto p-6 pt-0 overflow-x-hidden sm:overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse block sm:table mt-6 min-w-[800px] sm:min-w-0">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100 hidden sm:table-row">
                  <th className="pb-4 pl-2 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-12">사번</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-16">이름</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-32">부서</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-14">직급</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center w-16">부여 연차</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center w-16">사용 연차</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center w-16">잔여 연차</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider pl-4 w-28">관리</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 sm:divide-slate-50/60 block sm:table-row-group">
                {filteredEmployees.length === 0 ? (
                  <tr className="block sm:table-row">
                    <td colSpan={8} className="block sm:table-cell text-center py-12 text-slate-400 text-sm">
                      결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const remain = getRemainLeave(emp.total_leave, emp.used_leave);
                    return (
                      <tr
                        key={emp.users_seq}
                        onClick={() => {
                          setSelectedUser(emp);
                          setIsDetailEditing(false);
                        }}
                        className={`hover:bg-[#F5F8FF] transition-colors block sm:table-row py-4 sm:py-0 border-b border-slate-50 sm:border-none
                         relative cursor-pointer ${selectedUser?.users_seq === emp.users_seq ? 'bg-[#F0F4FF] hover:bg-[#F0F4FF]' : ''}`}
                      >
                        <td className="py-1 sm:py-4 pl-4 text-xs font-bold text-slate-400 font-mono block sm:table-cell sm:text-slate-700 sm:align-middle">
                          <span className="inline sm:hidden text-[0.625rem] font-medium text-slate-300 mr-1">사번</span>
                          {emp.users_seq}
                        </td>

                        <td className="py-1 sm:py-4 pl-4 sm:pl-0 text-sm sm:text-xs font-semibold sm:font-bold text-slate-800 sm:text-slate-700 inline-block sm:table-cell whitespace-nowrap align-baseline sm:align-middle">
                          {emp.name}
                        </td>

                        <td className="py-1 sm:py-4 pl-4 sm:pl-0 text-xs text-slate-500 sm:text-slate-600 block sm:table-cell font-medium whitespace-nowrap sm:align-middle">
                          <span className="inline sm:hidden text-slate-300 mr-1">부서:</span>
                          {emp.dept_name}
                        </td>

                        <td className="py-1 sm:py-4 pl-4 sm:pl-0 text-xs text-slate-400 sm:text-slate-500 inline-block sm:table-cell sm:align-middle">
                          <span className="inline sm:hidden text-slate-300 mr-1">직급:</span>
                          {emp.rank_name}
                        </td>

                        <td className="hidden sm:table-cell py-4 text-center text-xs font-bold text-slate-700 align-middle">
                          {emp.total_leave ?? 0}일
                        </td>

                        <td className="hidden sm:table-cell py-4 text-center text-xs font-bold text-slate-500 align-middle">
                          {emp.used_leave ?? 0}일
                        </td>

                        <td className="hidden sm:table-cell py-4 text-center align-middle">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-center whitespace-nowrap ${
                              remain <= 3
                                ? 'bg-[#FFF0F0] text-[#FF4D4F]'
                                : remain <= 7
                                ? 'bg-[#FFF9F0] text-[#FF9800]'
                                : 'bg-[#F0FDF4] text-[#10B981]'
                            }`}
                          >
                            {remain}일
                          </span>
                        </td>

                        <td className="py-2 px-4 block sm:table-cell text-left w-fit sm:w-[120px] sm:min-w-[120px] clear-both mt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(emp);
                              setIsDetailEditing(false);
                            }}
                            className="w-max px-7 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-full hover:bg-slate-50 shadow-sm"
                          >
                            상세
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-50 bg-white rounded-b-[32px] py-2">
            <MobilePagination count={totalPages} page={currentPage} onChange={handlePageChange} />
            <div className="hidden md:block">
              <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} />
            </div>
          </div>
        </div>

        {/* 우측 상세정보 카드 */}
        {selectedUser && (
          <div
            className={`flex flex-col bg-white rounded-none md:rounded-[32px]
          border-0 md:border border-slate-100 shadow-sm overflow-hidden min-h-0 animate-in slide-in-from-right duration-500 ${
            selectedUser ? 'flex-1 md:flex-[0.3]' : 'hidden'
          }`}
          >
            <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">연차 상세 정보</h2>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setIsDetailEditing(false);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="flex flex-col mb-8">
                <h3 className="text-xl font-bold text-slate-900">{selectedUser.name}</h3>
                <p className="text-sm text-[#3530B8] font-bold mt-1">
                  {selectedUser.dept_name} · {selectedUser.rank_name}
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h4 className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider mb-4">인적 사항</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 min-w-[80px] whitespace-nowrap">사번</span>
                      <span className="text-xs font-bold text-slate-700">{selectedUser.users_seq}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 min-w-[80px] whitespace-nowrap">입사일</span>
                      <span className="text-xs font-bold text-slate-700 font-mono">
                        {selectedUser.hire_date ? String(selectedUser.hire_date).split(' ')[0] : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h4 className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider mb-4">연차 현황</h4>
                  <div className="space-y-4">

                    {/* 부여 연차 - 업다운 스테퍼 */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 min-w-[80px] whitespace-nowrap">부여 연차</span>
                      {isDetailEditing ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleLeaveStep('down')}
                            disabled={Number(editForm.total_leave) <= LEAVE_MIN}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#3530B8] hover:border-[#3530B8]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                            </svg>
                          </button>

                          <input
                            type="number"
                            value={editForm.total_leave}
                            onChange={handleLeaveInputChange}
                            onBlur={handleLeaveInputBlur}
                            step={LEAVE_STEP}
                            min={LEAVE_MIN}
                            max={LEAVE_MAX}
                            className="w-16 text-center px-1 py-1 bg-white border border-gray-200 rounded-lg text-[0.6875rem] font-bold text-slate-700 outline-none focus:border-[#3530B8] focus:ring-2 focus:ring-[#3530B8]/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />

                          <button
                            type="button"
                            onClick={() => handleLeaveStep('up')}
                            disabled={Number(editForm.total_leave) >= LEAVE_MAX}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#3530B8] hover:border-[#3530B8]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>

                          <span className="text-[0.6875rem] text-slate-400 font-bold ml-0.5">일</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-700">{selectedUser.total_leave ?? 0}일</span>
                      )}
                    </div>

                    {/* 사용 연차 - 표시 전용 */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 min-w-[80px] whitespace-nowrap">사용 연차</span>
                      <span className="text-xs font-bold text-slate-700">{selectedUser.used_leave ?? 0}일</span>
                    </div>

                    {/* 잔여 연차 - 자동 계산 */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 min-w-[80px] whitespace-nowrap">잔여 연차</span>
                      {(() => {
                        const remain = isDetailEditing
                          ? getRemainLeave(editForm.total_leave, editForm.used_leave)
                          : getRemainLeave(selectedUser.total_leave, selectedUser.used_leave);
                        return (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-center whitespace-nowrap ${
                              remain <= 3
                                ? 'bg-[#FFF0F0] text-[#FF4D4F]'
                                : remain <= 7
                                ? 'bg-[#FFF9F0] text-[#FF9800]'
                                : 'bg-[#F0FDF4] text-[#10B981]'
                            }`}
                          >
                            {remain}일
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-50 flex gap-3 flex-shrink-0">
              {isDetailEditing ? (
                <>
                  <button
                    onClick={() => setIsDetailEditing(false)}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDetailSave}
                    className="flex-[2] py-3 bg-[#3530B8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#3530B8]/20 hover:bg-[#2a2696] transition-all"
                  >
                    저장
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    닫기
                  </button>
                  <button
                    onClick={handleDetailEdit}
                    className="flex-[2] py-3 bg-[#3530B8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#3530B8]/20 hover:bg-[#2a2696] transition-all"
                  >
                    연차 수정
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `,
        }}
      />
    </div>
  );
};

export default AdminLeave;