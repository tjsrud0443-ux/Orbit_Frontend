import React, { useState } from 'react';

const AdminSignup = () => {
  const [activeTab, setActiveTab] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Mock stats
  const stats = {
    전체: 12,
    '승인 대기': 5,
    '승인 완료': 4,
    '거절': 3
  };

  const tabs = ['전체', '승인 대기', '승인 완료', '거절'];

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-8 font-sans overflow-hidden">
      
      {/* Header Section - Fixed height */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">회원가입 관리</h1>
        <p className="text-sm text-gray-500">
          신규 회원가입 신청 내역을 확인하고 승인, 거절할 수 있습니다.
        </p>
      </div>

      {/* Filters and Search Section - Fixed height */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-[#F0F4FF] flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#3530B8] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#3530B8] hover:bg-[#F0F4FF]'
              }`}
            >
              {tab} <span className={`ml-1 opacity-70 ${activeTab === tab ? 'text-white' : 'text-gray-400'}`}>
                ({stats[tab]})
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
        <div className={`flex flex-col bg-white rounded-[32px] border border-[#F0F4FF] shadow-sm overflow-hidden transition-all duration-500 min-h-0 ${selectedUser ? 'flex-[0.6]' : 'flex-1'}`}>
          <div className="grid grid-cols-6 px-6 py-4 border-b border-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">
            <div className="text-center">프로필</div>
            <div>이름</div>
            <div>아이디</div>
            <div>전화번호</div>
            <div>가입일</div>
            <div className="text-center">상태</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* --- 데이터 맵핑 시작 위치 --- */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((item) => (
              <div 
                key={item}
                onClick={() => handleUserClick({ id: item })}
                className={`grid grid-cols-6 px-6 py-3.5 items-center cursor-pointer hover:bg-[#F8FAFF] transition-colors border-b border-gray-50/50 ${selectedUser?.id === item ? 'bg-[#F0F4FF]' : ''}`}
              >
                <div className="flex justify-center">
                  <div className="w-9 h-9 rounded-full bg-[#DDE8FF] flex items-center justify-center overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    <svg className="w-5 h-5 text-[#3530B8]/40" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-700">홍길동</div>
                <div className="text-[11px] text-gray-500">hong123</div>
                <div className="text-[11px] text-gray-500 font-medium">010-1234-5678</div>
                <div className="text-[11px] text-gray-400">2024.03.20</div>
                <div className="flex justify-center">
                   <span className="px-2.5 py-0.5 bg-[#F0F4FF] text-[#3530B8] text-[10px] font-bold rounded-full text-center">승인 대기</span>
                </div>
              </div>
            ))}
            {/* --- 데이터 맵핑 끝 위치 --- */}
          </div>

          {/* Pagination - Fixed height */}
          <div className="px-6 py-4 border-t border-gray-50 bg-white flex justify-center items-center gap-2 flex-shrink-0">
            <button className="p-1.5 text-gray-400 hover:text-[#3530B8] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex gap-1">
              {[1, 2, 3].map((num) => (
                <button key={num} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${num === 1 ? 'bg-[#3530B8] text-white shadow-md' : 'text-gray-400 hover:bg-[#F0F4FF]'}`}>{num}</button>
              ))}
            </div>
            <button className="p-1.5 text-gray-400 hover:text-[#3530B8] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* Detail View Section */}
        {selectedUser && (
          <div className={`flex flex-col bg-white rounded-[32px] border border-[#F0F4FF] shadow-sm overflow-hidden min-h-0 animate-in slide-in-from-right duration-500 ${selectedUser ? 'flex-[0.4]' : 'hidden'}`}>
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
                    <svg className="w-10 h-10 text-[#3530B8]/30" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <h2 className="text-xl font-bold text-gray-900 truncate">홍길동</h2>
                  </div>
                </div>

                {/* Applicant Info Section */}
                <div className="space-y-4 mb-8 flex-shrink-0">
                  <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">인적 사항</h3>
                  <div className="bg-[#F8FAFF] rounded-2xl p-5 space-y-4">
                    {[
                      { label: '전화번호', value: '010-1234-5678' },
                      { label: '아이디', value: 'hong123' },
                      { label: '주민등록번호', value: '980101-1******' },
                      { label: '주소', value: '서울특별시 강남구 테헤란로 123' },
                      { label: '이메일 주소', value: 'hong@orbit.com' },
                      { label: '가입신청일', value: '2024.03.20 14:30' }
                    ].map((info, idx) => (
                      <div key={idx} className="flex justify-between items-start border-b border-gray-100/50 pb-2 last:border-0 last:pb-0">
                        <span className="text-xs font-medium text-gray-500 flex-shrink-0 mr-4">{info.label}</span>
                        <span className="text-xs font-bold text-gray-800 text-right break-all">{info.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Assignment Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase ml-1">인사 정보 설정</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1 ml-1">부서 배정</label>
                      <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-[#3530B8] outline-none transition-all">
                        <option>부서를 선택하세요</option>
                        <option>개발팀</option>
                        <option>디자인팀</option>
                        <option>기획팀</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1 ml-1">직급 설정</label>
                      <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-[#3530B8] outline-none transition-all">
                        <option>직급을 선택하세요</option>
                        <option>사원</option>
                        <option>대리</option>
                        <option>과장</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1 ml-1">입사일자</label>
                      <input type="date" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-[#3530B8] outline-none transition-all" />
                    </div>
                  </div>
                </div>
             </div>

             {/* Action Buttons - Fixed height */}
             <div className="p-6 border-t border-gray-50 flex gap-3 flex-shrink-0 bg-white">
                <button className="flex-1 py-4 border-2 border-red-100 text-red-500 text-sm font-bold rounded-2xl hover:bg-red-50 transition-all text-center">반려</button>
                <button className="flex-[2] py-4 bg-[#3530B8] text-white text-sm font-bold rounded-2xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all text-center">승인 완료</button>
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

export default AdminSignup;
