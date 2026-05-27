import React, { useState,useEffect } from 'react';
import Pagination from '../../components/common/Pagination';
import { getAllUsers, updateUsersInfo, updateUsersState, getDeptList, getRankList } from './adminApi';

const AdminUsers = () => {
  // UI 확인용 하드코딩 더미 데이터
  const [employees, setEmployees] = useState([]);

  // 현재 수정 중인 직원 ID 관리
  const [editingId, setEditingId] = useState(null);
  // 상세 정보를 볼 직원 관리
  const [selectedUser, setSelectedUser] = useState(null);
  // 상세 정보 수정 모드 관리
  const [isDetailEditing, setIsDetailEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  // 커스텀 드롭다운 상태 관리
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isRankOpen, setIsRankOpen] = useState(false);
  const [isPermissionOpen, setIsPermissionOpen] = useState(false);

  // 부서, 직급 리스트 (API로부터 가져옴)
  const [deptList, setDeptList] = useState([]);
  const [rankList, setRankList] = useState([]);
  const permissionList = ["USER", "ADMIN"];

  // 현재 선택된 탭 관리
  const [activeTab, setActiveTab] = useState('전체');

  // 외부 클릭 시 수정 모드 및 드롭다운 해제
 useEffect(() => {
    const handleOutsideClick = (e) => {
      if (editingId !== null && !e.target.closest('.mobile-edit-btn')) {
        setEditingId(null);
      }
      if (!e.target.closest('.custom-dropdown')) {
        setIsDeptOpen(false);
        setIsRankOpen(false);
        setIsPermissionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [editingId]);

  // 직원 정보 및 부서/직급 리스트 출력
  useEffect(() => {
    getAllUsers().then(resp=> setEmployees(resp.data));
    getDeptList().then(resp => setDeptList(resp.data));
    getRankList().then(resp => setRankList(resp.data));
  }, []);

  // 상태별 인원수 계산
  const counts = {
    전체: employees.length,
    재직: employees.filter(e => e.status === '재직').length,
    휴직: employees.filter(e => e.status === '휴직').length,
    퇴사: employees.filter(e => e.status === '퇴사').length,
  };

  // 필터링된 직원 목록
  const filteredEmployees = activeTab === '전체' 
    ? employees 
    : employees.filter(emp => emp.status === activeTab);

  // 상세 정보 수정 시작
  const handleDetailEdit = () => {
    setEditForm({
      name: selectedUser.name,
      dept_name: selectedUser.dept_name,
      rank_name: selectedUser.rank_name,
      dept_seq: selectedUser.dept_seq, 
      rank_seq: selectedUser.rank_seq ,
      role: selectedUser.role
    });
    setIsDetailEditing(true);
  };

  // 상세 정보 저장
  const handleDetailSave = () => {
       console.log("보내는 데이터:", {
       users_seq: selectedUser.users_seq,
       ...editForm
     });

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
          role: editForm.role 
        } : emp
      ));
      setSelectedUser(prev => ({
         ...prev, 
         name: editForm.name, 
         dept_name: editForm.dept_name,
         rank_name: editForm.rank_name, 
         dept_seq: editForm.dept_seq,
         rank_seq: editForm.rank_seq,
         role: editForm.role 
      }));
      setIsDetailEditing(false);
    }).catch(err => {
      console.error("수정 실패:", err);
      alert("정보 수정 중 오류가 발생했습니다.");
    });
  };

  // 상태 변경 핸들러
  const handleStatusChange = (e, upUsersSeq, newStatus) => {
    e.stopPropagation(); // 행 클릭 이벤트 방지

    // 서버로 보낼 상태값과 UI에 표시할 한글 상태값 매핑
    const statusMap = {
      'ACTIVE': '재직',
      'INACTIVE': '휴직',
      'REJECTED': '퇴사'
    };
    const koreanStatus = statusMap[newStatus] || newStatus;

    updateUsersState(upUsersSeq, newStatus).then(() => {
      setEmployees(prev => prev.map(emp => 
        emp.users_seq === upUsersSeq ? { ...emp, status: koreanStatus } : emp
      ));
      setEditingId(null); // 수정 완료 후 버튼 숨김
      if (selectedUser?.users_seq === upUsersSeq) {
        setSelectedUser(prev => ({ ...prev, status: koreanStatus }));
      }
    });
  };

  return (
    <div className={`h-full flex flex-col bg-white font-sans overflow-hidden ${selectedUser ? 'p-0 md:p-8' : 'p-6 md:p-8'}`}>
      
      {/* [1] 헤더 영역 */}
      <div className={`mb-6 flex-shrink-0 ${selectedUser ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">직원 관리</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">등록된 직원 인적사항 및 재직 상태를 확인하고 관리할 수 있습니다.</p>
      </div>

      {/* [2] 필터 탭 & 검색창 라인 */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-[#F0F4FF] flex-shrink-0 overflow-x-auto no-scrollbar">
          {['전체', '재직', '휴직', '퇴사'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 md:px-4 py-2 text-[0.6875rem] md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-[#3530B8] text-white shadow-md' 
                  : 'text-gray-500 hover:text-[#3530B8] hover:bg-[#F0F4FF]'
              }`}
            >
              {tab} <span className={`ml-1 ${activeTab === tab ? 'opacity-80' : 'text-gray-400'}`}>({counts[tab]})</span>
            </button>
          ))}
        </div>

        <div className="relative group w-full md:w-72 flex-shrink-0">
          <input 
            type="text" 
            placeholder="사번, 이름, 부서로 검색" 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl 
            focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-sm text-gray-700 shadow-sm"/>
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3530B8] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* [3] 메인 콘텐츠 영역 */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        
        {/* 좌측 테이블 카드 */}
        <div className={`flex flex-col bg-white border border-slate-100 rounded-[32px] 
          shadow-sm overflow-hidden transition-all duration-500 min-h-0 ${selectedUser ? 'hidden md:flex md:flex-[0.7]' : 'flex-1'}`}>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0">
            <table className="w-full text-left border-collapse block sm:table mt-6">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-slate-100 hidden sm:table-row">
                  <th className="pb-4 pl-2 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-12">사번</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-16">이름</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-24">아이디</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-32">부서</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-14">직급</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center w-16">권한</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center w-16">상태</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-28">입사일</th>
                  <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center w-24">관리</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100 sm:divide-slate-50/60 block sm:table-row-group">
                {filteredEmployees.map((emp) => (
                  <tr 
                    key={emp.users_seq} 
                    onClick={() => { setSelectedUser(emp); setIsDetailEditing(false); }}
                    className={`hover:bg-slate-50/40 transition-colors block sm:table-row py-4 sm:py-0 border-b border-slate-50 sm:border-none
                       relative cursor-pointer ${selectedUser?.users_seq === emp.users_seq ? 'bg-[#F0F4FF] hover:bg-[#F0F4FF]' : ''}`}>
                    
                    <td className="py-1 sm:py-4 pl-2 text-xs font-bold text-slate-400 font-mono block sm:table-cell sm:text-slate-700 sm:align-middle">
                      <span className="inline sm:hidden text-[0.625rem] font-medium text-slate-300 mr-1">사번</span>
                      {emp.users_seq}
                    </td>

                    {/* 이름, 아이디 (모바일에서 한 줄) */}
                    <td className="py-1 sm:py-4 pl-4 sm:pl-0 text-sm sm:text-xs font-semibold sm:font-bold text-slate-800 sm:text-slate-700 inline-block sm:table-cell whitespace-nowrap align-baseline sm:align-middle">
                      {emp.name}
                    </td>
                    <td className="py-1 sm:py-4 pl-1 sm:pl-0 text-[10px] text-slate-400 font-mono inline-block sm:table-cell sm:text-left whitespace-nowrap align-baseline sm:align-middle">
                      {emp.id}
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
                    <td className="py-1 sm:py-4 pl-1 sm:pl-0 text-left sm:text-center inline-block sm:table-cell sm:align-middle">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[0.625rem] font-bold ${
                        emp.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-600 border border-purple-100'
                          : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                        {emp.role}
                      </span>
                    </td>

                    <td className="py-1 sm:py-4 pl-4 sm:pl-0 text-left sm:text-center block sm:table-cell mobile-status-badge absolute right-4 top-8 sm:static sm:align-middle">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-center whitespace-nowrap ${
                        emp.status === '재직' ? 'bg-[#F0FDF4] text-[#10B981]' : 
                        emp.status === '휴직' ? 'bg-[#FFF9F0] text-[#FF9800]' : 
                        'bg-[#FFF0F0] text-[#FF4D4F]'
                      }`}>
                        {emp.status}
                      </span>
                    </td>

                    <td className="py-1 sm:py-4 pl-4 sm:pl-0 text-[0.6875rem] sm:text-xs text-slate-400 font-mono block sm:table-cell sm:align-middle">
                      <span className="inline sm:hidden text-slate-300 mr-1">입사일:</span>
                      {emp.hire_date ? String(emp.hire_date).split(' ')[0] : ''}
                    </td>

                    <td className="pt-2 pb-1 sm:py-4 pl-4 sm:pl-0 text-left sm:text-center block sm:table-cell mobile-edit-btn">
                      {editingId === emp.users_seq ? (
                        <div className="flex gap-1 justify-center">
                          <button 
                            onClick={(e) => handleStatusChange(e, emp.users_seq, 'ACTIVE')}
                            className="px-2.5 py-0.5 text-[10px] font-semibold text-[#10B981] bg-white 
                            border border-[#10B981]/30 hover:bg-[#10B981] hover:text-white rounded-full transition-all text-center whitespace-nowrap">
                            재직
                          </button>
                          <button 
                            onClick={(e) => handleStatusChange(e, emp.users_seq, 'INACTIVE')}
                            className="px-2.5 py-0.5 text-[10px] font-semibold text-[#FF9800] bg-white 
                            border border-[#FF9800]/30 hover:bg-[#FF9800] hover:text-white rounded-full transition-all text-center whitespace-nowrap">
                            휴직
                          </button>
                          <button 
                            onClick={(e) => handleStatusChange(e, emp.users_seq, 'REJECTED')}
                            className="px-2.5 py-0.5 text-[10px] font-semibold text-[#FF4D4F] bg-white 
                            border border-[#FF4D4F]/30 hover:bg-[#FF4D4F] hover:text-white rounded-full transition-all text-center whitespace-nowrap">
                            퇴사
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(emp.users_seq);
                          }}
                          className="px-3 py-1 text-[0.6875rem] font-bold text-slate-500 bg-white 
                          border border-slate-200 hover:bg-slate-50 hover:text-[#3530B8] hover:border-[#3530B8]/30 rounded-full transition-all w-auto sm:w-full max-w-[4.5rem]">
                          수정
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-50 flex-shrink-0">
            <Pagination />
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
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="text-xl font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 outline-none focus:border-[#3530B8]"
                  />
                ) : (
                  <h3 className="text-xl font-bold text-slate-900">{selectedUser.name}</h3>
                )}
                <p className="text-sm text-[#3530B8] font-bold mt-1">{selectedUser.dept_name} · {selectedUser.rank_name}</p>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h4 className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider mb-4">인적 사항</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">사번</span>
                      <span className="text-xs font-bold text-slate-700">{selectedUser.users_seq}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">아이디</span>
                      <span className="text-xs font-bold text-slate-700">{selectedUser.id}</span>
                    </div>

                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h4 className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider mb-4">근무 정보</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">재직 상태</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-center whitespace-nowrap ${
                        selectedUser.status === '재직' ? 'bg-[#F0FDF4] text-[#10B981]' : 
                        selectedUser.status === '휴직' ? 'bg-[#FFF9F0] text-[#FF9800]' : 
                        'bg-[#FFF0F0] text-[#FF4D4F]'}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">부서</span>
                      {isDetailEditing ? (
                        <div className="relative custom-dropdown w-40">
                          <div 
                            onClick={() => { setIsDeptOpen(!isDeptOpen); setIsRankOpen(false); setIsPermissionOpen(false); }}
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
                                    setEditForm(prev => ({ ...prev, dept_name: dept.dept_name, dept_seq: dept.dept_seq }));
                                    setIsDeptOpen(false); 
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
                      <span className="text-xs text-slate-500">직급</span>
                      {isDetailEditing ? (
                        <div className="relative custom-dropdown w-40">
                          <div 
                            onClick={() => { setIsRankOpen(!isRankOpen); setIsDeptOpen(false); setIsPermissionOpen(false); }}
                            className={`w-full px-3 py-1.5 bg-white border ${isRankOpen ? 'border-[#3530B8] ring-2 ring-[#3530B8]/5' : 'border-gray-200'} rounded-lg text-[0.6875rem] font-bold transition-all cursor-pointer flex justify-between items-center text-slate-700`}
                          >
                            <span>{editForm.rank_name}</span>
                            <svg className={`w-3 h-3 text-gray-400 transition-transform ${isRankOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {isRankOpen && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                              {rankList.map((rank, idx) => (
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
                        <span className="text-xs font-bold text-slate-700">{selectedUser.rank_name}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">권한</span>
                      {isDetailEditing ? (
                        <div className="relative custom-dropdown w-40">
                          <div 
                            onClick={() => { setIsPermissionOpen(!isPermissionOpen); setIsDeptOpen(false); setIsRankOpen(false); }}
                            className={`w-full px-3 py-1.5 bg-white border ${isPermissionOpen ? 'border-[#3530B8] ring-2 ring-[#3530B8]/5' : 'border-gray-200'} rounded-lg text-[0.6875rem] font-bold transition-all cursor-pointer flex justify-between items-center text-slate-700`}
                          >
                            <span>{editForm.role}</span>
                            <svg className={`w-3 h-3 text-gray-400 transition-transform ${isPermissionOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {isPermissionOpen && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                              {permissionList.map((perm, idx) => (
                                <div 
                                  key={idx}
                                  onClick={() => { 
                                    setEditForm(prev => ({ ...prev, role: perm }));
                                    setIsPermissionOpen(false); 
                                  }}
                                  className="px-3 py-2 text-[0.625rem] hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer font-bold border-b border-gray-50 last:border-0"
                                >
                                  {perm}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[0.625rem] font-bold ${
                          selectedUser.role === 'ADMIN' 
                            ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                            : 'bg-slate-50 text-slate-500 border border-slate-100'
                        }`}>
                          {selectedUser.role}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">입사일</span>
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
                  <button 
                    onClick={handleDetailEdit}
                    className="flex-[2] py-3 bg-[#3530B8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#3530B8]/20 hover:bg-[#2a2696] transition-all">
                    정보 수정
                  </button>
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
