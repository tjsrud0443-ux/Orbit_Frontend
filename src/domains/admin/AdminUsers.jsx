import React, { useState,useEffect,useRef } from 'react';
import Pagination from '../../components/common/Pagination';
import MobilePagination from '../../components/common/MobilePagination';
import { getAllUsers, updateUsersInfo, updateUsersState, getDeptList, getRankList} from './adminApi';
import { alertError, alertConfirm, alertSuccess } from '../../utils/alert';
import useUserStore from '../../store/userStore';
import useDepartmentsStore from '../../store/useDepartmentsStore';

const OPS_TEAM = '운영총괄'; 

const AdminUsers = () => {
  const mode = import.meta.env.VITE_APP_MODE;
  const isDemoMode = mode === 'demo';
  
  const user = useUserStore(state => state.user);
  const isOpsManager = user?.dept_name?.includes(OPS_TEAM);
  const [employees, setEmployees] = useState([]);
  // pagenation
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  // 현재 수정 중인 직원 ID 관리
  const [editingId, setEditingId] = useState(null);
  // 상세 정보를 볼 직원 관리
  const [selectedUser, setSelectedUser] = useState(null);
  // 상세 정보 수정 모드 관리
  const [isDetailEditing, setIsDetailEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [nameError, setNameError] = useState(false); // 이름 오류 상태 추가
  // 커스텀 드롭다운 상태 관리
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isRankOpen, setIsRankOpen] = useState(false);
  const [isPermissionOpen, setIsPermissionOpen] = useState(false);
  const [isHrManagerOpen, setIsHrManagerOpen] = useState(false);
  const invalidateGroupData = useDepartmentsStore(state => state.invalidateGroupData);
  
  // 부서, 직급 리스트 (API로부터 가져옴)
  const [deptList, setDeptList] = useState([]);
  const [rankList, setRankList] = useState([]);
  const permissionList = ["USER", "ADMIN"];

  // 전체 통계용 상태
  const [statusCounts, setStatusCounts] = useState({ 전체: 0, 재직: 0, 휴직: 0, 퇴사: 0 });

  // 현재 선택된 탭 관리
  const [activeTab, setActiveTab] = useState('전체');

  // 검색 관련 상태
  const [searchKeyword, setSearchKeyword] = useState('');

  const containerRef = useRef(null);

  // 상태값 한글 변환 헬퍼
  const getStatusLabel = (status) => {
    const map = {
      'ACTIVE': '재직',
      'INACTIVE': '휴직',
      'RETIRE': '퇴사',
      'REJECTED': '퇴사',
      '재직': '재직',
      '휴직': '휴직',
      '퇴사': '퇴사'
    };
    return map[status] || status;
  };
  // 외부 클릭 시 수정 모드 및 드롭다운 해제
 useEffect(() => {
    const handleOutsideClick = (e) => {
      if (editingId !== null && !e.target.closest('.status-edit-buttons') && !e.target.closest('.edit-trigger-btn') && !e.target.closest('.mobile-edit-btn')) {
        setEditingId(null);
      }
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (!e.target.closest('.custom-dropdown')) {
          setIsDeptOpen(false);
          setIsRankOpen(false);
          setIsPermissionOpen(false);
          setIsHrManagerOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [editingId]);

  // 직원 정보 및 부서/직급 리스트 출력
  useEffect(() => {
    fetchEmployees(currentPage, searchKeyword, activeTab);
  }, [currentPage, activeTab, searchKeyword]);

  useEffect(() => {
    getDeptList().then(resp => setDeptList(resp.data));
    getRankList().then(resp => setRankList(resp.data));
    // 초기 로딩은 위 useEffect에서 처리됨
  }, []);

  const fetchEmployees = (page = 1, keyword = "", tab = "전체") => {
    const statusMap = {
      '재직': 'ACTIVE',
      '휴직': 'INACTIVE',
      '퇴사': 'RETIRE',
      '전체': ''
    };
    getAllUsers(page, keyword, statusMap[tab]).then(resp => {
        setEmployees(resp.data.users || []);
        setTotalCount(resp.data.totalCount || 0);
        setStatusCounts({
            전체: (resp.data.activeCount || 0) + (resp.data.inactiveCount || 0) + (resp.data.retireCount || 0),
            재직: resp.data.activeCount || 0,
            휴직: resp.data.inactiveCount || 0,
            퇴사: resp.data.retireCount || 0
        });
    });
  };

  // 검색 핸들러
  const handleSearch = () => {
    const keyword = searchKeyword.trim();
    setActiveTab('전체');
    setCurrentPage(1);
    fetchEmployees(1, keyword, '전체');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 필터링된 직원 목록 (서버에서 이미 필터링되어 온다고 가정)
  const filteredEmployees = employees;

  // 페이지네이션 처리
  const totalPages = Math.ceil(totalCount / 10);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // 상세 정보 수정 시작
  const handleDetailEdit = () => {
    const isCEOOffice = selectedUser.dept_name === '대표이사실';
    const isHeadquarters = selectedUser.dept_name.includes('본부');
    const ceoRank = rankList.find(r => r.rank_name === '대표');
    const headRank = rankList.find(r => r.rank_name === '본부장');
    const defaultTeamRank = 
      rankList.find(r => r.rank_name === '부서장') 
      || rankList.find(r => r.rank_name !== '대표' && r.rank_name !== '본부장') 
      || rankList[0];

    let forcedRank = null;
    if (isCEOOffice && ceoRank) {
      forcedRank = ceoRank;               // 대표이사실 → demo/production 공통 고정
    } else if (isHeadquarters && headRank) {
      forcedRank = headRank;              // 본부 → demo/production 공통 고정
    } else if (selectedUser.rank_name === '대표') {
      forcedRank = defaultTeamRank;       // 대표이사실이 아닌데 '대표'로 잘못 저장된 경우 리셋
    } else if (!isDemoMode && selectedUser.rank_name === '본부장') {
      forcedRank = defaultTeamRank;       // 본부가 아닌데 '본부장'으로 잘못 저장된 경우 리셋 (production만)
    }

    setEditForm({
      name: selectedUser.name,
      dept_name: selectedUser.dept_name,
      rank_name: forcedRank ? forcedRank.rank_name : selectedUser.rank_name,
      dept_seq: selectedUser.dept_seq, 
      rank_seq: forcedRank ? forcedRank.rank_seq : selectedUser.rank_seq,
      role: selectedUser.role,  
      is_hr_manager: selectedUser.is_hr_manager || 'N', // ✅ 추가
    });
    
    setNameError(false); // 수정 시작 시 에러 초기화
    setIsDeptOpen(false);   // ← 추가
    setIsRankOpen(false);
    setIsDetailEditing(true);
  };

  // 상세 정보 저장
  const handleDetailSave = () => {
    if (!editForm.name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);

    alertConfirm('직원 정보 수정', '직원 상세 정보를 수정하시겠습니까?').then((result) => {
      if (result.isConfirmed) {
        updateUsersInfo(selectedUser.users_seq, editForm).then(() => {
          setEmployees(prev => prev.map(emp => 
            emp.users_seq === selectedUser.users_seq ? 
            { 
              ...emp, 
              name: editForm.name, 
              dept_name: editForm.dept_name, 
              rank_name: editForm.rank_name, 
              dept_seq: editForm.dept_seq,
              rank_seq: editForm.rank_seq,
              role: editForm.role,
              is_hr_manager: editForm.is_hr_manager, // ✅ 추가
            } : emp
          ));
          setSelectedUser(prev => ({
             ...prev, 
             name: editForm.name, 
             dept_name: editForm.dept_name,
             rank_name: editForm.rank_name, 
             dept_seq: editForm.dept_seq,
             rank_seq: editForm.rank_seq,
             role: editForm.role,
             is_hr_manager: editForm.is_hr_manager, // ✅ 추가
          }));

          invalidateGroupData();

          setIsDetailEditing(false);
          alertSuccess('수정 완료', '직원 상세 정보가 성공적으로 수정되었습니다.');
        }).catch(err => {
          alertError('오류 발생', '정보 수정 중 오류가 발생했습니다.');
        });
      }
    });
  };

  // 상태 변경 핸들러
  const handleStatusChange = (e, upUsersSeq, newStatus) => {
    e.stopPropagation(); // 행 클릭 이벤트 방지

    // 서버로 보낼 상태값과 UI에 표시할 한글 상태값 매핑
    const statusMap = {
      'ACTIVE': '재직',
      'INACTIVE': '휴직',
      'RETIRE': '퇴사',
      'REJECTED': '퇴사'
    };
    const koreanStatus = statusMap[newStatus] || newStatus;

    alertConfirm('상태 변경', `직원의 상태를 '${koreanStatus}'(으)로 변경하시겠습니까?`).then((result) => {
      if (result.isConfirmed) {
        updateUsersState(upUsersSeq, newStatus).then(() => {
          // 1. 현재 페이지 데이터 다시 불러오기 (데이터와 상단 카운트 동시 갱신)
          fetchEmployees(currentPage, searchKeyword, activeTab);
          
          invalidateGroupData();

          setEditingId(null); // 수정 완료 후 버튼 숨김
          if (selectedUser?.users_seq === upUsersSeq) {
            setSelectedUser(prev => ({ ...prev, status: koreanStatus }));
          }
          alertSuccess('변경 완료', `직원의 상태가 '${koreanStatus}'(으)로 성공적으로 변경되었습니다.`);
        });
      }
    });
  };

  return (
    <div ref={containerRef} className={`h-full flex flex-col bg-white font-sans ${selectedUser ? 'p-0 md:p-8' : 'p-6 md:p-8'}`}>
      
      {/* [1] 헤더 영역 */}
      <div className={`mb-6 flex-shrink-0 ${selectedUser ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">직원 관리</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">등록된 직원 인적사항 및 재직 상태를 확인하고 관리할 수 있습니다.</p>
      </div>

      {/* [2] 필터 탭 & 검색창 라인 */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="w-full flex bg-white p-1 rounded-2xl shadow-sm border border-[#F0F4FF] flex-shrink-0 overflow-x-auto no-scrollbar sm:w-auto">
          {['전체', '재직', '휴직', '퇴사'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`flex-1 justify-center px-2.5 md:px-4 py-2 text-[0.6875rem] md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-[#3530B8] text-white shadow-md' 
                  : 'text-gray-500 hover:text-[#3530B8] hover:bg-[#F0F4FF]'
              }`}
            >
              {tab} <span className={`ml-1 ${activeTab === tab ? 'opacity-80' : 'text-gray-400'}`}>({statusCounts[tab]})</span>
            </button>
          ))}
        </div>

        <div className="relative group w-full md:w-72 flex-shrink-0">
          <input 
            type="text" 
            placeholder="사번, 이름, 부서로 검색"
            value={searchKeyword}
            onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1); // 검색 시 1페이지로 리셋
            }}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl 
            focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-sm text-gray-700 shadow-sm"/>
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
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-24">아이디</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-32">부서</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-14">직급</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center w-16">상태</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-28">입사일</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider pl-4 w-40">관리</th>
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
                  filteredEmployees.map((emp) => (
                    <tr 
                      key={emp.users_seq} 
                      onClick={() => { setSelectedUser(emp); setIsDetailEditing(false);  setIsDeptOpen(false); setIsRankOpen(false);}}
                      className={`hover:bg-[#F5F8FF] transition-colors block sm:table-row py-4 sm:py-0 border-b border-slate-50 sm:border-none
                         relative cursor-pointer ${selectedUser?.users_seq === emp.users_seq ? 'bg-[#F0F4FF] hover:bg-[#F0F4FF]' : ''}`}>
                      
                      <td className="py-1 sm:py-4 pl-4 text-xs font-bold text-slate-400 font-mono block sm:table-cell sm:text-slate-700 sm:align-middle ">
                        <span className="inline sm:hidden text-[0.625rem] font-medium text-slate-300 mr-1">사번</span>
                        {emp.users_seq}
                      </td>

                      {/* 이름, 아이디 (모바일에서 한 줄) */}
                      <td className="py-1 sm:py-4 pl-4 sm:pl-0 text-sm sm:text-xs font-semibold sm:font-bold text-slate-800 sm:text-slate-700 inline-block sm:table-cell whitespace-nowrap align-baseline sm:align-middle">
                        {emp.name}
                      </td>
                      <td className="py-1 sm:py-4 pl-1 sm:pl-0 text-[10px] text-slate-400 font-mono inline-block sm:table-cell sm:text-left whitespace-nowrap align-baseline sm:align-middle">
                        {emp.id}
                        <span className={`inline sm:hidden ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-semibold text-center ${
                          getStatusLabel(emp.status) === '재직' ? 'bg-[#F0FDF4] text-[#10B981]' : 
                          getStatusLabel(emp.status) === '휴직' ? 'bg-[#FFF9F0] text-[#FF9800]' : 
                          'bg-[#FFF0F0] text-[#FF4D4F]'
                        }`}>
                          {getStatusLabel(emp.status)}
                        </span>
                      </td>

                      <td className="py-1 sm:py-4 pl-4 sm:pl-0 text-xs text-slate-500 sm:text-slate-600 block sm:table-cell font-medium whitespace-nowrap sm:align-middle">
                        <span className="inline sm:hidden text-slate-300 mr-1">부서:</span>
                        {emp.dept_name}
                      </td>

                      {/* 직급, 권한 (모바일에서 한 줄) */}
                      <td className="py-1 sm:py-4 pl-4 sm:pl-0 text-xs text-slate-400 sm:text-slate-500 inline-block sm:table-cell sm:align-middle">
                        <span className="inline sm:hidden text-slate-300 mr-1">직급:</span>
                        {emp.rank_name}
                      </td>

                      <td className="hidden sm:table-cell py-1 sm:py-4 pl-4 sm:pl-0 text-left sm:text-center sm:align-middle">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-center whitespace-nowrap ${
                          getStatusLabel(emp.status) === '재직' ? 'bg-[#F0FDF4] text-[#10B981]' : 
                          getStatusLabel(emp.status) === '휴직' ? 'bg-[#FFF9F0] text-[#FF9800]' : 
                          'bg-[#FFF0F0] text-[#FF4D4F]'
                        }`}>
                          {getStatusLabel(emp.status)}
                        </span>
                      </td>

                      <td className="py-1 sm:py-4 pl-4 sm:pl-0 text-[0.6875rem] sm:text-xs text-slate-400 font-mono block sm:table-cell sm:align-middle">
                        <span className="inline sm:hidden text-slate-300 mr-1">입사일:</span>
                        {emp.hire_date ? String(emp.hire_date).split(' ')[0] : ''}
                      </td>

                      <td className="py-2 px-4 block sm:table-cell text-left w-fit sm:w-[160px] sm:min-w-[160px] clear-both mt-2">
                        {editingId === emp.users_seq ? (
                          <div className="status-edit-buttons flex gap-1 justify-start w-max whitespace-nowrap">
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(e, emp.users_seq, 'ACTIVE'); }}
                              className=" px-2 py-1 text-[10px] font-semibold text-[#10B981] bg-white border border-[#10B981]/30 rounded-full">
                              재직
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(e, emp.users_seq, 'INACTIVE'); }}
                              className="px-2 py-1 text-[10px] font-semibold text-[#FF9800] bg-white border border-[#FF9800]/30 rounded-full">
                              휴직
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(e, emp.users_seq, 'RETIRE'); }}
                              className="px-2 py-1 text-[10px] font-semibold text-[#FF4D4F] bg-white border border-[#FF4D4F]/30 rounded-full">
                              퇴사
                            </button>
                          </div>
                        ) : (getStatusLabel(emp.status) !== '퇴사' || isOpsManager) ? (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(emp.users_seq);
                            }}
                            className="edit-trigger-btn w-max px-7 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-full hover:bg-slate-50 shadow-sm">
                            수정
                          </button>
                        ) :null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody >
            </table>
          </div>

          <div className="border-t border-gray-50 bg-white rounded-b-[32px] py-2">
            <MobilePagination
              count={totalPages} 
              page={currentPage} 
              onChange={handlePageChange} 
            />
            <div className="hidden md:block">
              <Pagination 
                count={totalPages} 
                page={currentPage} 
                onChange={handlePageChange} 
              />
            </div>
          </div>
        </div>

        {/* 우측 상세정보 카드 */}
        {selectedUser && (
          <div className={`flex flex-col bg-white rounded-none md:rounded-[32px] 
          border-0 md:border border-slate-100 shadow-sm overflow-hidden min-h-0 animate-in slide-in-from-right duration-500 ${selectedUser ? 'flex-1 md:flex-[0.3]' : 'hidden'}`}>
            <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">직원 상세 정보</h2>
              <button onClick={() => { setSelectedUser(null); setIsDetailEditing(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
             
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="flex flex-col mb-8">
                {isDetailEditing ? (
                  <>
                    {nameError && (
                      <div className="text-[0.6875rem] text-red-500 mb-1">이름을 1~6자 사이로 입력해주세요.</div>
                    )}
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => {
                        if (e.target.value.length <= 6) {
                          setEditForm({...editForm, name: e.target.value});
                          if (e.target.value.trim()) setNameError(false); // 입력 시 에러 해제
                        }
                      }}
                      className={`text-xl font-bold text-slate-900 bg-slate-50 border ${nameError ? 'border-red-500' : 'border-slate-200'} rounded-lg px-3 py-1 outline-none focus:border-[#3530B8]`}
                    />
                  </>
                ) : (
                  <h3 className="text-xl font-bold text-slate-900">{selectedUser.name}</h3>
                )}
                <p className="text-sm text-[#3530B8] font-bold mt-1">{selectedUser.dept_name} · {selectedUser.rank_name}</p>
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
                      <span className="text-xs text-slate-500 min-w-[80px] whitespace-nowrap">아이디</span>
                      <span className="text-xs font-bold text-slate-700">{selectedUser.id}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h4 className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider mb-4">근무 정보</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 min-w-[80px] whitespace-nowrap">재직 상태</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-center whitespace-nowrap ${
                        getStatusLabel(selectedUser.status) === '재직' ? 'bg-[#F0FDF4] text-[#10B981]' : 
                        getStatusLabel(selectedUser.status) === '휴직' ? 'bg-[#FFF9F0] text-[#FF9800]' : 
                        'bg-[#FFF0F0] text-[#FF4D4F]'}`}>
                        {getStatusLabel(selectedUser.status)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 min-w-[80px] whitespace-nowrap">부서</span>
                      {isDetailEditing && selectedUser.rank_name !== '대표' && selectedUser.dept_name !== '대표이사실' ? (
                        <div className="relative custom-dropdown w-full">
                          <div 
                            onClick={() => { setIsDeptOpen(!isDeptOpen); setIsRankOpen(false); setIsPermissionOpen(false); setIsHrManagerOpen(false);}}
                            className={`w-full px-3 py-1.5 bg-white border ${isDeptOpen ? 'border-[#3530B8] ring-2 ring-[#3530B8]/5' : 'border-gray-200'} rounded-lg text-[0.6875rem] font-bold transition-all cursor-pointer flex justify-between items-center text-slate-700`}
                          >
                            <span>{editForm.dept_name}</span>
                            <svg className={`w-3 h-3 text-gray-400 transition-transform ${isDeptOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {isDeptOpen && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                              {deptList.map((dept, idx) => (
                                <div 
                                  key={dept.dept_seq}
                                  onClick={() => { 
                                    const isHeadquarters = dept.dept_name.includes('본부');
                                    const isTeam = dept.dept_name.includes('팀');
                                    const isCEOOffice = dept.dept_name === '대표이사실';
                                    const ceoRank = rankList.find(r => r.rank_name === '대표');
                                    const headRank = rankList.find(r => r.rank_name === '본부장');
                                    // ✨ 안전하게 기본값을 지정하기 위해 부서장(또는 사원) 직급을 찾아둡니다.
                                    const defaultTeamRank = 
                                      rankList.find(r => r.rank_name === '부서장') 
                                      || rankList.find(r => r.rank_name !== '대표' && r.rank_name !== '본부장') 
                                      || rankList[0];
                                    
                                  setEditForm(prev => {
                                    let updatedRank = {};
                                                                       
                                   if (isCEOOffice) {
                                      // 대표이사실이면 무조건 '대표'로 고정 (demo/production 공통)
                                      updatedRank = { rank_name: '대표', rank_seq: ceoRank ? ceoRank.rank_seq : prev.rank_seq };
                                    } else if (isHeadquarters && headRank) {
                                      // 본부면 무조건 '본부장'으로 고정 (demo/production 공통)
                                      updatedRank = { rank_name: headRank.rank_name, rank_seq: headRank.rank_seq };
                                    } else if (prev.rank_name === '대표') {
                                      // 대표이사실에서 다른 부서로 옮길 때 '대표' 직급 리셋
                                      updatedRank = { rank_name: defaultTeamRank.rank_name, rank_seq: defaultTeamRank.rank_seq };
                                    }else if (!isDemoMode && isTeam && prev.rank_name === '본부장') {
                                      updatedRank = { rank_name: defaultTeamRank.rank_name, rank_seq: defaultTeamRank.rank_seq };
                                    }

                                    return { 
                                      ...prev, 
                                      dept_name: dept.dept_name,  // 부서 이름 저장
                                      dept_seq: dept.dept_seq,    // 부서 번호 저장 
                                      ...updatedRank              // 조건에 맞춰 변경된 직급 반영
                                    };
                                  });
                                    setIsDeptOpen(false); 
                                    setIsRankOpen(false); 
                                  }}
                                  className="px-3 py-2 text-[0.625rem] hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer font-bold border-b border-gray-50 last:border-0"
                                >
                                  {dept.dept_name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-700">{selectedUser.dept_name}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 min-w-[80px] whitespace-nowrap">직급</span>
                    {isDetailEditing && editForm.dept_name !== '대표이사실' ? (
                      <div className="relative custom-dropdown w-full">
                        <div 
                          onClick={() => { 
                            if (!isDemoMode && editForm.dept_name.includes('본부')) return;
                            setIsRankOpen(!isRankOpen); 
                            setIsDeptOpen(false); 
                            setIsPermissionOpen(false); 
                            setIsHrManagerOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 bg-white border ${isRankOpen ? 'border-[#3530B8] ring-2 ring-[#3530B8]/5' : 'border-gray-200'} rounded-lg text-[0.6875rem] font-bold transition-all ${!isDemoMode && editForm.dept_name.includes('본부') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex justify-between items-center text-slate-700`}
                        >
                          <span>{editForm.rank_name}</span>
                          <svg className={`w-3 h-3 text-gray-400 transition-transform ${isRankOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {isRankOpen && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                            {rankList
                              .filter(rank => {
                                if (rank.rank_name === '대표') return false; // 대표이사실 외에는 '대표' 선택 불가
                                if (editForm.dept_name.includes('팀')) {
                                  return rank.rank_name !== '본부장';
                                }
                                return true;
                              })
                              .map((rank, idx) => (
                              <div 
                                key={rank.rank_seq}
                                onClick={() => { 
                                  setEditForm(prev => ({ ...prev, rank_name: rank.rank_name, rank_seq: rank.rank_seq }));
                                  setIsRankOpen(false); 
                                }}
                                className="px-3 py-2 text-[0.625rem] hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer font-bold border-b border-gray-50 last:border-0"
                              >
                                {rank.rank_name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-700">{isDetailEditing ? editForm.rank_name : selectedUser.rank_name}</span>
                    )}
                    </div>
                    {/* ✅ 근태 담당자 — 인사팀 직원에게만 표시 */}
                    {selectedUser.auth_group === 'ROLE_HR_ADMIN' && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 min-w-[80px] whitespace-nowrap">근태 담당자</span>
                        {isDetailEditing ? (
                          <div className="relative custom-dropdown w-full">
                            <div 
                              onClick={() => { 
                                setIsHrManagerOpen(!isHrManagerOpen); 
                                setIsDeptOpen(false); 
                                setIsRankOpen(false); 
                                setIsPermissionOpen(false); 
                              }}
                              className={`w-full px-3 py-1.5 bg-white border ${isHrManagerOpen ? 'border-[#3530B8] ring-2 ring-[#3530B8]/5' : 'border-gray-200'} rounded-lg text-[0.6875rem] font-bold transition-all cursor-pointer flex justify-between items-center text-slate-700`}
                            >
                              <span>{editForm.is_hr_manager === 'Y' ? '담당자' : '해당 없음'}</span>
                              <svg className={`w-3 h-3 text-gray-400 transition-transform ${isHrManagerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            {isHrManagerOpen && (
                              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                                <div 
                                  onClick={() => { 
                                    setEditForm(prev => ({ ...prev, is_hr_manager: 'Y' }));
                                    setIsHrManagerOpen(false); 
                                  }}
                                  className="px-3 py-2 text-[0.625rem] hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer font-bold border-b border-gray-50 last:border-0 text-slate-700"
                                >
                                  담당자
                                </div>
                                <div 
                                  onClick={() => { 
                                    setEditForm(prev => ({ ...prev, is_hr_manager: 'N' }));
                                    setIsHrManagerOpen(false); 
                                  }}
                                  className="px-3 py-2 text-[0.625rem] hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer font-bold border-b border-gray-50 last:border-0 text-slate-700"
                                >
                                  해당 없음
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                            selectedUser.is_hr_manager === 'Y'
                              ? 'bg-[#EEF2FF] text-[#3530B8]'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {selectedUser.is_hr_manager === 'Y' ? '✓ 담당자' : '해당 없음'}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 min-w-[80px] whitespace-nowrap">입사일</span>
                      <span className="text-xs font-bold text-slate-700 font-mono">{selectedUser.hire_date ? String(selectedUser.hire_date).split(' ')[0] : ''}</span>
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
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all">
                    취소
                  </button>
                  <button 
                    onClick={handleDetailSave}
                    className="flex-[2] py-3 bg-[#3530B8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#3530B8]/20 hover:bg-[#2a2696] transition-all">
                    저장
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all">
                    닫기
                  </button>
                  {(getStatusLabel(selectedUser.status) !== '퇴사' || isOpsManager) && (
                    <button 
                      onClick={handleDetailEdit}
                      className="flex-[2] py-3 bg-[#3530B8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#3530B8]/20 hover:bg-[#2a2696] transition-all">
                      정보 수정
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
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

export default AdminUsers;
