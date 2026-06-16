import React, { useState, useMemo, useEffect } from 'react';
import Pagination from '../../components/common/Pagination';
import { getSupplyRentalList, updateRentalStatus } from './adminApi';
import { alertSuccess, alertConfirm } from '../../utils/alert';

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
  const [rentals, setRentals] = useState([]);
  const [tabCounts, setTabCounts] = useState({ 전체: 0, 대여중: 0, 반납완료: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [refresh, setRefresh] = useState(0);
  
  // 모바일 여부 및 페이지당 아이템 수 관리
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const perPage = 8;
  const selectedItem = rentals.find(r => r.id === selectedId) || null;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedId(null);
    setTotalPages(1);
  };

  const handleRowClick = (id) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  useEffect(() => {
    getSupplyRentalList({
        page,
        size: perPage,
        keyword,
        status: activeTab === '전체' ? '' : activeTab === '대여중' ? 'RENTING' : 'RETURNED'
    }).then(res => {
        const { list, totalPages: newTotalPages, totalCount, rentingCount, returnedCount } = res.data;
        const mapped = list.map(item => {         
          return{
            id: item.rental_seq,
            supply_seq: item.supply_seq,
            name: item.supply_name,
            cat: item.category,
            code: item.supply_code,
            dept: item.dept_name,
            user: item.name,
            ea: item.ea,  
            loanDate: item.rental_date,
            retDate: item.return_date,
            status: item.return_date ? '반납완료' : '대여중'}
        });
        setRentals(mapped);
        setTotalPages(newTotalPages);
        setTabCounts({
            전체: totalCount,
            대여중: rentingCount,
            반납완료: returnedCount
        });
    }).catch(err => console.error(err));
}, [page, keyword, activeTab, refresh, perPage]);

const handleReturn = async () => {
  const result = await alertConfirm('반납 처리하시겠습니까?', '처리 후 변경은 불가합니다.');
  if (!result.isConfirmed) return;

  try {
    await updateRentalStatus({
      rental_seq: selectedItem.id,
      supply_seq: selectedItem.supply_seq,
      ea: selectedItem.ea,
    });
    await alertSuccess('처리 완료', '반납 처리가 완료되었습니다.');
    setSelectedId(null);
    setRefresh(prev => prev + 1);//강제 새로고침ㄴ
  } catch (err) {
    console.error(err);
  }
};
  return (
    <div className={`w-full h-full bg-white font-sans flex flex-col overflow-hidden ${selectedId ? 'p-0 md:p-8' : 'p-4 md:p-8'}`}>

      {/* 헤더 */}
      <div className={`mb-3 md:mb-7 shrink-0 ${selectedId ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-[1.25rem] md:text-[1.5rem] font-bold text-slate-900 mb-0.5 md:mb-1 tracking-tight">비품 대여 현황</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 hidden sm:block">현재 대여 중인 비품 목록과 반납 내역을 확인할 수 있습니다.</p>
      </div>

      {/* 필터 탭 & 검색창 라인 */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6 shrink-0 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        {/* 탭 */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-[#F0F4FF] w-fit shrink-0 overflow-x-auto no-scrollbar">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`px-3 py-1.5 md:py-2 text-[0.6875rem] md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap
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
            className="w-full pl-10 pr-4 py-2 bg-white md:py-2.5 border border-gray-200 rounded-xl
              focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all
              placeholder:text-gray-300 text-xs md:text-sm text-gray-700 shadow-sm"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
      </div>

      {/* 본문 레이아웃 */}
      <div className={`flex-1 flex min-h-0 overflow-hidden transition-all duration-500 ${selectedId ? 'gap-5' : 'gap-0'}`}>

        {/* 목록 카드 */}
        <div className={`bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm p-4 md:p-6 flex flex-col min-h-0 overflow-hidden transition-all duration-500 ${selectedId ? 'hidden md:flex md:flex-[3.5]' : 'flex-1'}`}>

          {/* 테이블 */}
          <div className="rounded-xl border border-gray-100 flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 flex flex-col min-h-0 overflow-x-auto custom-scrollbar">
              <div className="min-w-[700px] md:min-w-0 flex-1 flex flex-col">
                {/* 헤더 */}
                <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100 shrink-0">
                  {['대여일', '대여자', '비품명', '비품코드', '상태'].map((h, i) => (
                    <div
                      key={h}
                      className={`py-3 md:py-4 px-4 text-[0.6rem] md:text-[0.68rem] font-extrabold text-gray-400 uppercase tracking-wider
                        ${i === 0 ? 'col-span-2' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-3' : i === 3 ? 'col-span-2' : 'col-span-2 text-center'}`}
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* 바디 */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {rentals.length > 0 ? rentals.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleRowClick(item.id)}
                      className={`grid grid-cols-12 border-b border-gray-50 last:border-0 items-center transition-colors h-11 md:h-[12.5%] cursor-pointer
                        ${selectedId === item.id ? 'bg-indigo-50/60' : 'hover:bg-gray-50/60'}`}
                    >
                      <div className="col-span-2 px-4">
                        <span className="text-[10px] md:text-xs text-gray-500">{item.loanDate}</span>
                      </div>
                      <div className="col-span-3 px-4 flex items-baseline gap-1.5 overflow-hidden">
                        <p className="text-xs md:text-sm font-bold text-gray-800 truncate whitespace-nowrap">{item.user}</p>
                        <p className="text-[9px] md:text-[10px] text-gray-400 whitespace-nowrap truncate">{item.dept}</p>
                      </div>
                      <div className="col-span-3 px-4">
                        <p className="text-xs md:text-sm font-bold text-gray-800 truncate" title={item.name}>{item.name}</p>
                      </div>
                      <div className="col-span-2 px-4">
                        <span className="text-[10px] md:text-xs font-mono text-gray-500">{item.code}</span>
                      </div>
                      <div className="col-span-2 px-4 flex justify-center">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  )) : (
                    <div className="h-full flex items-center justify-center text-xs md:text-sm text-gray-400 font-bold">
                      {activeTab === '전체' ? '대여 내역이 없습니다.' : `${activeTab} 상태의 대여 내역이 없습니다.`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 md:pt-4 shrink-0">
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
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 pt-1 pb-0.5 rounded-full bg-indigo-100 text-indigo-600">{selectedItem.cat}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-500">{selectedItem.ea}개</span>
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
                      <p className="text-[10px] text-gray-400 mb-1">반납일</p>
                      <p className="text-xs font-bold text-gray-700">{selectedItem.retDate ?? '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 관리 버튼 (필요 시) */}
              <div className="flex gap-3 pt-6 shrink-0">
                {selectedItem.status === '대여중' && selectedItem.cat !== '사무용품' && (
                  <button onClick={handleReturn}
                    className="flex-1 py-3 bg-[#3530B8] text-white text-sm font-bold rounded-2xl hover:bg-[#2a2696] transition-all shadow-lg shadow-[#3530B8]/20"
                  >
                    반납 처리
                  </button>
                )}
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
