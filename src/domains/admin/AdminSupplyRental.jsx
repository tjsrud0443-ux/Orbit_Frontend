import React, { useState, useMemo } from 'react';
import Pagination from '../../components/common/Pagination';

const ITEMS = [
  { id: 1, name: '노트북 (MacBook Pro 14)', cat: '전자기기', code: 'EQP-0001', dept: '개발팀', user: '이서연', loanDate: '2024-05-20', retDate: '2024-05-27', status: '대여중' },
  { id: 2, name: '모니터 (LG 27인치)', cat: '전자기기', code: 'EQP-0002', dept: '디자인팀', user: '박지훈', loanDate: '2024-05-18', retDate: '2024-05-25', status: '반납완료' },
  { id: 3, name: '키보드 (로지텍 K780)', cat: '전자기기', code: 'EQP-0003', dept: '기획팀', user: '최유리', loanDate: '2024-05-17', retDate: '2024-05-24', status: '대여중' },
  { id: 4, name: '의자 (시디즈 T50)', cat: '사무기기', code: 'EQP-0004', dept: '경영지원팀', user: '김민수', loanDate: '2024-05-16', retDate: '2024-05-23', status: '반납완료' },
  { id: 5, name: '마우스 (로지텍 MX Master 3)', cat: '전자기기', code: 'EQP-0005', dept: '개발팀', user: '이서연', loanDate: '2024-05-15', retDate: '2024-05-22', status: '대여중' },
  { id: 6, name: '빔 프로젝터 (EPSON)', cat: '전자기기', code: 'EQP-0006', dept: '회의지원팀', user: '정하늘', loanDate: '2024-05-14', retDate: '2024-05-21', status: '반납완료' },
  { id: 7, name: '태블릿 (iPad Air)', cat: '전자기기', code: 'EQP-0007', dept: '디자인팀', user: '강진우', loanDate: '2024-06-01', retDate: '2024-06-08', status: '대여중' },
  { id: 8, name: '데스크 스탠드', cat: '사무기기', code: 'EQP-0008', dept: '기획팀', user: '홍길동', loanDate: '2024-06-02', retDate: '2024-06-09', status: '대여중' },
  { id: 9, name: '웹캠 (Logitech C920)', cat: '전자기기', code: 'EQP-0009', dept: '개발팀', user: '김철수', loanDate: '2024-06-03', retDate: '2024-06-10', status: '대여중' },
  { id: 10, name: '헤드셋 (Bose 700)', cat: '전자기기', code: 'EQP-0010', dept: '영업팀', user: '이영희', loanDate: '2024-06-04', retDate: '2024-06-11', status: '반납완료' },
];

const PER_PAGE = 8;

const STATUS_TABS = [
  { key: '전체', label: '전체' },
  { key: '대여중', label: '대여중' },
  { key: '반납완료', label: '반납완료' },
];

const StatusBadge = ({ status }) => {
  const styles = {
    '대여중': 'bg-[#FFF9F0] text-[#FF9800] border border-[#FF9800]/30',
    '반납완료': 'bg-[#F0FDF4] text-[#10B981] border border-[#10B981]/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${styles[status] || ''}`}>
      {status}
    </span>
  );
};

const AdminSupplyRental = () => {
  const [activeTab, setActiveTab] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const filteredItems = useMemo(() => {
    return ITEMS.filter(item => {
      const matchTab = activeTab === '전체' || item.status === activeTab;
      const matchKeyword = item.name.toLowerCase().includes(keyword.toLowerCase()) || 
                           item.user.toLowerCase().includes(keyword.toLowerCase()) ||
                           item.code.toLowerCase().includes(keyword.toLowerCase());
      return matchTab && matchKeyword;
    });
  }, [activeTab, keyword]);

  const totalPages = Math.ceil(filteredItems.length / PER_PAGE);
  const pageItems = filteredItems.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const tabCounts = useMemo(() => ({
    전체: ITEMS.length,
    대여중: ITEMS.filter(i => i.status === '대여중').length,
    반납완료: ITEMS.filter(i => i.status === '반납완료').length,
  }), []);

  const selectedItem = ITEMS.find(r => r.id === selectedId) || null;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedId(null);
  };

  const handleRowClick = (id) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  return (
    <div className={`w-full h-full bg-white font-sans flex flex-col overflow-hidden ${selectedId ? 'p-0 md:p-8' : 'p-6 md:p-8'}`}>

      {/* 헤더 */}
      <div className={`mb-7 shrink-0 ${selectedId ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">비품 대여 현황</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500">현재 대여 중인 비품 목록과 반납 내역을 확인할 수 있습니다.</p>
      </div>

      {/* 필터 탭 & 검색창 라인 */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        {/* 탭 */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-[#F0F4FF] w-fit shrink-0 overflow-x-auto no-scrollbar">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`px-3 py-2 text-[0.6875rem] md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap
                ${activeTab === key
                  ? 'bg-[#3530B8] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#3530B8] hover:bg-[#F0F4FF]'}`}
            >
              {label}
              <span className={`ml-1 ${activeTab === key ? 'opacity-80' : 'text-gray-400'}`}>
                ({tabCounts[key] ?? 0})
              </span>
            </button>
          ))}
        </div>

        {/* 검색 */}
        <div className="relative w-full md:w-72 shrink-0">
          <input
            type="text"
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
            placeholder="비품명, 대여자, 코드 검색"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl
              focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all
              placeholder:text-gray-300 text-sm text-gray-700 shadow-sm"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
      </div>

      {/* 본문 레이아웃 */}
      <div className={`flex-1 flex min-h-0 overflow-hidden transition-all duration-500 ${selectedId ? 'gap-5' : 'gap-0'}`}>

        {/* 목록 카드 */}
        <div className={`bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 flex flex-col min-h-0 overflow-hidden transition-all duration-500 ${selectedId ? 'hidden md:flex md:flex-[3.5]' : 'flex-1'}`}>

          {/* 테이블 */}
          <div className="rounded-xl border border-gray-100 flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 flex flex-col min-h-0 overflow-x-auto custom-scrollbar">
              <div className="min-w-[800px] md:min-w-0 flex-1 flex flex-col">
                {/* 헤더 */}
                <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100 shrink-0">
                  {['대여일', '대여자', '비품명', '비품코드', '상태'].map((h, i) => (
                    <div
                      key={h}
                      className={`py-4 px-4 text-[0.68rem] font-extrabold text-gray-400 uppercase tracking-wider
                        ${i === 0 ? 'col-span-2' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-4' : i === 3 ? 'col-span-2' : 'col-span-2 text-center'}`}
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* 바디 */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {pageItems.length > 0 ? pageItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleRowClick(item.id)}
                      className={`grid grid-cols-12 border-b border-gray-50 last:border-0 items-center transition-colors h-14 md:h-[12.5%] cursor-pointer
                        ${selectedId === item.id ? 'bg-indigo-50/60' : 'hover:bg-gray-50/60'}`}
                    >
                      <div className="col-span-2 px-4">
                        <span className="text-xs text-gray-500">{item.loanDate}</span>
                      </div>
                      <div className="col-span-2 px-4 flex items-baseline gap-2">
                        <p className="text-sm font-bold text-gray-800">{item.user}</p>
                        <p className="text-[10px] text-gray-400 whitespace-nowrap">{item.dept}</p>
                      </div>
                      <div className="col-span-4 px-4">
                        <p className="text-sm font-bold text-gray-800 truncate" title={item.name}>{item.name}</p>
                      </div>
                      <div className="col-span-2 px-4">
                        <span className="text-xs font-mono text-gray-500">{item.code}</span>
                      </div>
                      <div className="col-span-2 px-4 flex justify-center">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  )) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400 font-bold">
                      {activeTab === '전체' ? '대여 내역이 없습니다.' : `${activeTab} 상태의 대여 내역이 없습니다.`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 shrink-0">
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
            />
          </div>
        </div>

        {/* 우측 상세 패널 */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden
          ${selectedId ? 'flex-1 md:flex-[1.5] opacity-100' : 'flex-none w-0 h-0 opacity-0 pointer-events-none'}`}>
          {selectedItem && (
            <div className="bg-white rounded-none md:rounded-[32px] border-0 md:border border-slate-100 shadow-sm p-6 h-full flex flex-col">

              {/* 패널 헤더 */}
              <div className="flex items-start justify-between mb-5 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">대여 상세</h3>
                  <p className="text-[0.7rem] text-gray-400">ID: {selectedItem.code}</p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 상태 뱃지 */}
              <div className="mb-5 shrink-0">
                <StatusBadge status={selectedItem.status} />
              </div>

              {/* 상세 내용 */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 min-h-0">

                <div>
                  <p className="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">대여자</p>
                  <p className="text-sm font-bold text-gray-800">{selectedItem.user}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedItem.dept}</p>
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                  <p className="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2">비품 정보</p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-sm font-bold text-gray-800 mb-1">{selectedItem.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{selectedItem.cat}</span>
                      <span className="text-xs font-mono text-gray-400">{selectedItem.code}</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                  <p className="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2">대여 일정</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-gray-400 mb-1">대여일</p>
                      <p className="text-xs font-bold text-gray-700">{selectedItem.loanDate}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-gray-400 mb-1">반납예정일</p>
                      <p className="text-xs font-bold text-gray-700">{selectedItem.retDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 관리 버튼 (필요 시) */}
              <div className="flex gap-3 pt-6 shrink-0">
                {selectedItem.status === '대여중' && (
                  <button
                    className="flex-1 py-3 bg-[#3530B8] text-white text-sm font-bold rounded-2xl hover:bg-[#2a2696] transition-all shadow-lg shadow-[#3530B8]/20"
                  >
                    반납 처리
                  </button>
                )}
                <button
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-all"
                >
                  수정
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default AdminSupplyRental;
