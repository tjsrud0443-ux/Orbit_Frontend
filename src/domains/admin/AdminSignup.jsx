import { useEffect, useState, useRef } from 'react';
import Pagination from '../../components/common/Pagination';
import MobilePagination from '../../components/common/MobilePagination';
import { approveUserSignup, getAllRequest, getDeptList, getHrInfo, getRankList, getUserInfo, rejectUserSignup } from './adminApi';
import useAuthStore from '../../store/authStore';
import Calendar from '../../components/common/Calendar';
import useLoadingStore from '../../store/useLoadingStore';
import { alertSuccess } from '../../utils/alert';

const AdminSignup = () => {
  const [activeTab, setActiveTab] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [allInfo, setAllInfo] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [tabCount, setTabCount] = useState({ TOTAL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [deptList, setDeptList] = useState([]);
  const [rankList, setRankList] = useState([]);
  const [errors, setErrors] = useState({ dept: '', rank: '', hireDate: '' });

  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isRankOpen, setIsRankOpen] = useState(false);
  const [hireDate, setHireDate] = useState('');
  const [selectedDept, setSelectedDept] = useState({ dept_seq: null, dept_name: '부서 또는 본부를 선택하세요' });
  const [selectedRank, setSelectedRank] = useState({ rank_seq: null, rank_name: '직급을 선택하세요' });
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRejectSuccess, setIsRejectSuccess] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);
  const deptRef = useRef(null);
  const rankRef = useRef(null);

  const token = useAuthStore(state => state.token);
  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  const statusMap = {
    '전체': 'TOTAL',
    '승인 대기': 'PENDING',
    '승인 완료': 'APPROVED',
    '반려': 'REJECTED'
  };

  const tabKeyMap = {
    '전체': 'TOTAL',
    '승인 대기': 'PENDING',
    '승인 완료': 'APPROVED',
    '반려': 'REJECTED'
  };

  const tabs = ['전체', '승인 대기', '승인 완료', '반려'];
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const loadList = () => {
    if (!searchTerm) showLoading();
    getAllRequest(page, statusMap[activeTab], searchTerm).then(resp => {
      setAllInfo(resp.data.list);
      const calculatedPages = Math.ceil(resp.data.count / 10);
      setTotalPages(calculatedPages === 0 ? 1 : calculatedPages);
      setTabCount(resp.data.tabCount);
    }).finally(() => {
      if (!searchTerm) hideLoading();
    });
  };

  useEffect(() => {
    getDeptList().then(resp => setDeptList(resp.data));
    getRankList().then(resp => setRankList(resp.data));
  }, [])

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    } else {
      loadList();
    }
  }, [searchTerm, activeTab]);

  useEffect(() => {
    loadList();
  }, [page]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
      if (deptRef.current && !deptRef.current.contains(event.target)) {
        setIsDeptOpen(false);
      }
      if (rankRef.current && !rankRef.current.contains(event.target)) {
        setIsRankOpen(false);
      }
    };

    if (isCalendarOpen || isDeptOpen || isRankOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen, isDeptOpen, isRankOpen]);

  const handleUserClick = (info) => {
    setSelectedUser(info.signup_seq);
    setErrors({ dept: '', rank: '', hireDate: '' });
    setHireDate('');
    setSelectedDept({ dept_seq: null, dept_name: '부서 또는 본부를 선택하세요' });
    setSelectedRank({ rank_seq: null, rank_name: '직급을 선택하세요' });

    getUserInfo(info.signup_seq).then(resp => {
      const basicInfo = resp.data;
      if (info.status === 'APPROVED') {
        getHrInfo(basicInfo.id).then(hrResp => {
          setUserInfo({ ...basicInfo, ...hrResp.data, status: basicInfo.status });
        });
      } else {
        setUserInfo(basicInfo);
      }
    });
  };

  const handleApprove = () => {
    const newErrors = { dept: '', rank: '', hireDate: '' };
    let isValid = true;

    if (selectedDept.dept_seq === null) {
      newErrors.dept = '부서를 선택해 주세요.';
      isValid = false;
    }
    if (selectedRank.rank_seq === null) {
      newErrors.rank = '직급을 선택해 주세요.';
      isValid = false;
    }
    if (!hireDate) {
      newErrors.hireDate = '입사일자를 선택해 주세요.';
      isValid = false;
    }

    if (selectedDept.dept_seq !== null && selectedRank.rank_seq !== null) {
      if (selectedDept.dept_seq === 2 && selectedRank.rank_seq !== 1) {
        newErrors.rank = '대표이사실은 대표 직급만 선택 가능합니다.';
        isValid = false;
      } else if (selectedDept.dept_seq !== 2 && selectedRank.rank_seq === 1) {
        newErrors.rank = '대표 직급은 대표이사실에서만 선택 가능합니다.';
        isValid = false;
      } else if (selectedDept.dept_name.includes('본부') && selectedRank.rank_name !== '본부장') {
        newErrors.rank = '본부는 본부장 직급만 선택 가능합니다.';
        isValid = false;
      } else if (!selectedDept.dept_name.includes('본부') && selectedRank.rank_name === '본부장') {
        newErrors.rank = '본부장 직급은 본부에서만 선택 가능합니다.';
        isValid = false;
      }
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    const approvalData = {
      signup_seq: selectedUser,
      dept_seq: selectedDept.dept_seq,
      rank_seq: selectedRank.rank_seq,
      hire_date: hireDate
    };

    approveUserSignup(approvalData).then(resp => {
      alertSuccess('승인 완료', '회원가입 승인이 완료되었습니다.');
      setSelectedUser(null);
      setHireDate('');
      setSelectedDept({ dept_seq: null, dept_name: '부서 또는 본부를 선택하세요' });
      setSelectedRank({ rank_seq: null, rank_name: '직급을 선택하세요' });
      setErrors({ dept: '', rank: '', hireDate: '' });

      loadList();
    })
  };

  const handleReject = () => {
    setIsRejectModalOpen(true);
  };

  const performReject = () => {
    rejectUserSignup(selectedUser).then(resp => {
      setIsRejectSuccess(true);
      setTimeout(() => {
        setIsRejectModalOpen(false);
        setIsRejectSuccess(false);
        setSelectedUser(null);
        loadList();
      }, 1500);
    });
  };

  return (
    <div className={`h-full flex flex-col ${selectedUser ? 'p-0 md:p-8' : 'p-6 md:p-8'} font-sans overflow-hidden bg-[#FFFFFF]`}>

      {/* Rejection Confirmation Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {!isRejectSuccess ? (
              <>
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">신청 반려 확인</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    정말 이 회원의 가입 신청을 반려하시겠습니까?<br />반려된 신청은 되돌릴 수 없습니다.
                  </p>
                </div>
                <div className="flex border-t border-gray-50">
                  <button
                    onClick={() => setIsRejectModalOpen(false)}
                    className="flex-1 py-4 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-colors border-r border-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={performReject}
                    className="flex-1 py-4 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    반려하기
                  </button>
                </div>
              </>
            ) : (
              <div className="p-10 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">반려 완료</h3>
                <p className="text-sm text-gray-500">성공적으로 반려 처리되었습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Section - Fixed height */}
      <div className={`mb-6 flex-shrink-0 ${selectedUser ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">회원가입 관리</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
          신규 회원가입 신청 내역을 확인하고 승인, 반려할 수 있습니다.
        </p>
      </div>

      {/* Filters and Search Section - Fixed height */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="grid grid-cols-4 gap-1 w-full md:w-auto md:flex md:gap-0 bg-white p-1 rounded-2xl shadow-sm border border-[#F0F4FF] flex-shrink-0 md:overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`px-1 md:px-4 py-2 rounded-xl text-[0.5625rem] md:text-sm font-bold transition-all whitespace-nowrap min-w-0 md:flex-shrink-0 ${activeTab === tab
                  ? 'bg-[#3530B8] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#3530B8] hover:bg-[#F0F4FF]'
                }`}
            >
              {tab} <span className={`ml-1 opacity-70 ${activeTab === tab ? 'text-white' : 'text-gray-400'}`}>
                ({tabCount[tabKeyMap[tab]]})
              </span>
            </button>
          ))}
        </div>

        <div className="relative group w-full md:w-72 flex-shrink-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="이름으로 검색"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-sm text-gray-700 shadow-sm"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3530B8] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Area - Flexible height to prevent outer scroll */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">

        {/* List Section */}
        <div className={`flex flex-col bg-white rounded-[2rem] border border-[#F0F4FF] shadow-sm overflow-hidden transition-all duration-500 min-h-0 ${selectedUser ? 'hidden md:flex md:flex-[0.6]' : 'flex-1'}`}>
          <div className="hidden md:grid grid-cols-6 px-6 py-4 border-b border-gray-50 text-[0.6875rem] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">
            <div className="text-center">프로필</div>
            <div>이름</div>
            <div>아이디</div>
            <div>전화번호</div>
            <div>가입일</div>
            <div className="text-center">상태</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* --- 데이터 맵핑 시작 위치 --- */}
            {
              allInfo.map((info, item) => (
                <div
                  key={item}
                  onClick={() => handleUserClick(info)}
                  className={`flex md:grid md:grid-cols-6 px-4 md:px-6 py-3.5 items-center cursor-pointer hover:bg-[#F8FAFF] transition-colors border-b border-gray-50/50 ${selectedUser === info.signup_seq ? 'bg-[#F0F4FF]' : ''}`}
                >
                  {/* Profile Section - Column 1 on PC */}
                  <div className="flex-shrink-0 md:flex md:justify-center mr-4 md:mr-0">
                    <div className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-[#DDE8FF] flex items-center justify-center overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                      {info.sysname ? (
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL}/file/profile/view?sysname=${info.sysname}&token=${token}`}
                          className="w-full h-full object-cover"
                          alt="Profile"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-[#3530B8]/40" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      )}
                    </div>
                  </div>

                  {/* PC ONLY: Columns 2, 3, 4, 5 */}
                  <div className="hidden md:block text-xs font-bold text-gray-700 truncate">{info.name}</div>
                  <div className="hidden md:block text-[0.6875rem] text-gray-500 truncate">{info.id}</div>
                  <div className="hidden md:block text-[0.6875rem] text-gray-500 font-medium truncate">{info.phone}</div>
                  <div className="hidden md:block text-[0.6875rem] text-gray-400 truncate">{info.signup_at.split(" ")[0]}</div>

                  {/* MOBILE ONLY: Middle Info Section */}
                  <div className="flex-1 min-w-0 md:hidden">
                    <div className="flex items-baseline gap-2">
                      <div className="text-xs font-bold text-gray-700 truncate">{info.name}</div>
                      <div className="text-[0.625rem] text-gray-500 truncate">{info.id}</div>
                    </div>
                    <div className="flex flex-col mt-0.5">
                      <div className="text-[0.625rem] text-gray-500 font-medium">{info.phone}</div>
                      <div className="text-[0.625rem] text-gray-400 mt-0.5">{info.signup_at.split(" ")[0]}</div>
                    </div>
                  </div>

                  {/* Status Section - Column 6 on PC */}
                  <div className="flex-shrink-0 ml-3 md:ml-0 md:flex md:justify-center">
                    {
                      info.status === "PENDING" ?
                        <span className="px-2.5 py-0.5 bg-[#FFF9F0] text-[#FF9800] text-[0.625rem] font-bold rounded-full text-center whitespace-nowrap">승인 대기</span>
                        :
                        info.status === "APPROVED" ?
                          <span className="px-2.5 py-0.5 bg-[#F0FDF4] text-[#10B981] text-[0.625rem] font-bold rounded-full text-center whitespace-nowrap">승인 완료</span>
                          :
                          <span className="px-2.5 py-0.5 bg-[#FFF0F0] text-[#FF4D4F] text-[0.625rem] font-bold rounded-full text-center whitespace-nowrap">반려</span>
                    }
                  </div>
                </div>
              ))}
            {/* --- 데이터 맵핑 끝 위치 --- */}
          </div>

          {/* Pagination Component */}
          <div className="border-t border-gray-50 flex-shrink-0">
            <MobilePagination count={totalPages} page={page} onChange={(e, page) => setPage(page)} />
            <div className="hidden md:block">
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, page) => setPage(page)}
              />
            </div>
          </div>
        </div>

        {/* Detail View Section */}
        {selectedUser && (
          <div className={`flex flex-col bg-white rounded-none md:rounded-[2rem] border-0 md:border border-[#F0F4FF] shadow-sm overflow-hidden min-h-0 animate-in slide-in-from-right duration-500 ${selectedUser ? 'flex-1 md:flex-[0.4]' : 'hidden'}`}>
            <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">신청 정보 상세</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {/* Profile Header */}
              <div className="flex items-center gap-5 mb-8 bg-[#F8FAFF] p-6 rounded-2xl border border-[#F0F4FF] flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-white border-2 border-[#DDE8FF] shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                  {userInfo.sysname ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}/file/profile/view?sysname=${userInfo.sysname}&token=${token}`}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  ) : (
                    <svg className="w-10 h-10 text-[#3530B8]/30" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  )}
                </div>
                <div className="min-w-0 overflow-hidden">
                  <h2 className="text-xl font-bold text-gray-900 truncate">{userInfo.name}</h2>
                </div>
              </div>

              {/* Applicant Info Section */}
              <div className="space-y-4 mb-8 flex-shrink-0">
                <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">인적 사항</h3>
                <div className="bg-[#F8FAFF] rounded-2xl p-5 space-y-4">
                  {[
                    { label: '전화번호', value: userInfo.phone },
                    { label: '아이디', value: userInfo.id },
                    { label: '주민등록번호', value: userInfo.ssn_masked },
                    { label: '주소', value: `${userInfo.address1} ${userInfo.address2}` },
                    { label: '이메일 주소', value: userInfo.email },
                    { label: '가입신청일', value: userInfo.signup_at?.split(" ")[0] }
                  ].map((info, idx) => (
                    <div key={idx} className="flex justify-between items-start border-b border-gray-100/50 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs font-medium text-gray-500 flex-shrink-0 mr-4">{info.label}</span>
                      <span className="text-xs font-bold text-gray-800 text-right break-all">{info.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Assignment Section */}
              {(userInfo.status === 'APPROVED' || userInfo.status === 'PENDING') && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">인사 정보 {userInfo.status === 'APPROVED' ? '상세' : '설정'}</h3>
                  <div className="space-y-3">
                    {userInfo.status === 'APPROVED' ? (
                      <div className="bg-[#F8FAFF] rounded-2xl p-5 space-y-4">
                        {[
                          { label: '부서', value: userInfo.dept_name },
                          { label: '직급', value: userInfo.rank_name },
                          { label: '입사일자', value: userInfo.hire_date?.split(" ")[0] }
                        ].map((info, idx) => (
                          <div key={idx} className="flex justify-between items-start border-b border-gray-100/50 pb-2 last:border-0 last:pb-0">
                            <span className="text-xs font-medium text-gray-500 flex-shrink-0 mr-4">{info.label}</span>
                            <span className="text-xs font-bold text-gray-800 text-right break-all">{info.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="relative" ref={deptRef}>
                          <label className="block text-[0.6875rem] font-bold text-gray-600 mb-1 ml-1">부서 배정</label>
                          <div
                            onClick={() => { setIsDeptOpen(!isDeptOpen); setIsRankOpen(false); }}
                            className={`w-full px-4 py-2.5 bg-white border ${errors.dept ? 'border-red-500' : isDeptOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-200'} rounded-xl text-xs font-medium transition-all cursor-pointer flex justify-between items-center`}
                          >
                            <span className={selectedDept.dept_seq === null ? 'text-gray-400' : 'text-gray-800'}>{selectedDept.dept_name}</span>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDeptOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                          {errors.dept && <p className="text-red-500 text-[0.625rem] mt-1 ml-1 font-medium">{errors.dept}</p>}
                          {isDeptOpen && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-32 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                              {deptList.map((dept) => (
                                <div
                                  key={dept.dept_seq}
                                  onClick={() => {
                                    setSelectedDept({ dept_seq: dept.dept_seq, dept_name: dept.dept_name });
                                    setIsDeptOpen(false);
                                    setErrors(prev => ({ ...prev, dept: '' }));
                                    setSelectedRank({ rank_seq: null, rank_name: '직급을 선택하세요' });
                                  }}
                                  className="px-4 py-2.5 text-xs hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer font-medium border-b border-gray-50 last:border-0"
                                >
                                  {dept.dept_name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="relative" ref={rankRef}>
                          <label className="block text-[0.6875rem] font-bold text-gray-600 mb-1 ml-1">직급 설정</label>
                          <div
                            onClick={() => { setIsRankOpen(!isRankOpen); setIsDeptOpen(false); }}
                            className={`w-full px-4 py-2.5 bg-white border ${errors.rank ? 'border-red-500' : isRankOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-200'} rounded-xl text-xs font-medium transition-all cursor-pointer flex justify-between items-center`}
                          >
                            <span className={selectedRank.rank_seq === null ? 'text-gray-400' : 'text-gray-800'}>{selectedRank.rank_name}</span>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isRankOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                          {errors.rank && <p className="text-red-500 text-[0.625rem] mt-1 ml-1 font-medium">{errors.rank}</p>}
                          {isRankOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-32 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                              {rankList
                                .filter(rank => {
                                  if (selectedDept.dept_seq === null) return true;
                                  if (selectedDept.dept_seq === 2) return rank.rank_seq === 1;
                                  return selectedDept.dept_name.includes('본부') ? rank.rank_name === '본부장' : (rank.rank_name !== '본부장' && rank.rank_seq !== 1);
                                })
                                .map((rank) => (
                                  <div
                                    key={rank.rank_seq}
                                    onClick={() => {
                                      setSelectedRank({ rank_seq: rank.rank_seq, rank_name: rank.rank_name });
                                      setIsRankOpen(false);
                                      setErrors(prev => ({ ...prev, rank: '' }));
                                    }}
                                    className="px-4 py-2.5 text-xs hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer font-medium border-b border-gray-50 last:border-0"
                                  >
                                    {rank.rank_name}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        <div className="relative" ref={calendarRef}>
                          <label className="block text-[0.6875rem] font-bold text-gray-600 mb-1 ml-1">입사일자</label>
                          <div
                            onClick={() => { setIsCalendarOpen(!isCalendarOpen); setIsDeptOpen(false); setIsRankOpen(false); }}
                            className={`w-full px-4 py-2.5 bg-white border ${errors.hireDate ? 'border-red-500' : isCalendarOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-200'} rounded-xl text-xs font-medium transition-all cursor-pointer flex justify-between items-center`}
                          >
                            <span className={!hireDate ? 'text-gray-400' : 'text-gray-800'}>{hireDate || '입사일자를 선택하세요'}</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          {errors.hireDate && <p className="text-red-500 text-[0.625rem] mt-1 ml-1 font-medium">{errors.hireDate}</p>}

                          {isCalendarOpen && (
                            <Calendar
                              value={hireDate}
                              onChange={(dateStr) => {
                                setHireDate(dateStr);
                                setErrors(prev => ({ ...prev, hireDate: '' }));
                              }}
                              onClose={() => setIsCalendarOpen(false)}
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Fixed height */}
            {userInfo.status === 'PENDING' && (
              <div className="p-6 border-t border-gray-50 flex gap-3 flex-shrink-0 bg-white">
                <button
                  onClick={handleReject}
                  className="flex-1 py-4 border-2 border-red-100 text-red-500 text-sm font-bold rounded-2xl hover:bg-red-50 transition-all text-center">
                  반려
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-[2] py-4 bg-[#3530B8] text-white text-sm font-bold rounded-2xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all text-center">
                  승인 완료
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 0.25rem; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 0.625rem; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
    </div>
  );
};

export default AdminSignup;
