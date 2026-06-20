import React, { useState, useMemo, useEffect } from 'react';
import { Pagination as MuiPagination, Stack } from '@mui/material';
import { getSuppyReqList, updateSupplyReqStatus } from '../admin/adminApi';
import { alertWarning, alertSuccess, alertConfirm } from '../../utils/alert';
import MobilePagination from '../../components/common/MobilePagination';

const STATUS_TABS = [
  { key: '전체', label: '전체' },
  { key: '대기', label: '대기' },
  { key: '승인', label: '승인' },
  { key: '반려', label: '반려' },
];

const StatusBadge = ({ status }) => {
  const styles = {
    '대기': 'bg-[#FFF9F0] text-[#FF9800] border border-[#FF9800]/30',
    '승인': 'bg-[#F0FDF4] text-[#10B981] border border-[#10B981]/30',
    '반려': 'bg-[#FFF0F0] text-[#FF4D4F] border border-[#FF4D4F]/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${styles[status] || ''}`}>
      {status}
    </span>
  );
};

const AdminSupplyReq = () => {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('전체');
  const [tabCounts, setTabCounts] = useState({ 전체: 0, 대기: 0, 승인: 0, 반려: 0 });
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    getSuppyReqList({ page, keyword, status: activeTab === '전체' ? '' 
      : activeTab === '대기' ? 'PENDING' 
      : activeTab === '승인' ? 'APPROVED' : 'REJECTED' }).then(resp => {
      const { list, totalPages: newTotalPages, totalCount, pendingCount, approvedCount, rejectedCount } = resp.data;

      setTabCounts({
        전체: totalCount,
        대기: pendingCount,
        승인: approvedCount,
        반려: rejectedCount
      });

      const mapped = list.map(item => ({      
        id: item.req_seq,
        users_id: item.users_id,
        requestDate: item.req_date,
        applicantName: item.user_name,
        dept: item.dept_name,
        items: item.items || [],  // 전체 비품 목록
        supplyName: (() => {
          const names = (item.items || []).map(i => i.supplyName || i.supply_name).filter(Boolean);
          if (names.length === 0) return '';
          if (names.length === 1) return names[0];
          return `${names[0]} 외 ${names.length - 1}건`;
        })(),
        useType: item.items?.[0]?.use_type || item.items?.[0]?.useType || '',
        status: item.status === 'PENDING' ? '대기'
              : item.status === 'APPROVED' ? '승인'
              : item.status === 'REJECTED' ? '반려'
              : item.status,
        reason: item.reason,
      }));
      setRequests(mapped);
      setTotalPages(newTotalPages); 
    }).catch(err => console.error(err));
  }, [page, keyword, activeTab]);

  const selectedItem = requests.find(r => r.id === selectedId) || null;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedId(null);
  };

  const handleApprove = async (id) => {
      const target = requests.find(r => r.id === id);

  const emptyItems = target.items.filter(item => item.stock_qty === 0);
  const lowItems = target.items.filter(item => item.stock_qty > 0 && item.stock_qty <= item.min_stock_qty);
  const okItems = target.items.filter(item => item.stock_qty > item.min_stock_qty);

  // ✅ 재고 없는 항목이 있으면 전체 현황 보여주고 차단
  if (emptyItems.length > 0) {
    const lines = [
      ...emptyItems.map(i => `${i.supply_name} : 재고 없음 ❌`),
      ...lowItems.map(i => ` ${i.supply_name} : 재고 부족 ⚠️`)
    ].join('<br>');
    await alertWarning('승인 불가', `${lines}<br><br>재고가 없으면 승인이 불가합니다.`);
    return;
  }

  // ✅ 재고 부족만 있으면 현황 보여주고 계속 승인 가능
  if (lowItems.length > 0) {
    const lines = [
      ...lowItems.map(i => `${i.supply_name} : 재고 부족 ⚠️`),
    ].join('<br>');
    const result = await alertConfirm('재고 부족 경고', `${lines}<br><br>그래도 승인하시겠습니까?`);
    if (!result.isConfirmed) return;
  } else {
    const result = await alertConfirm('신청을 승인하시겠습니까?', '처리 후 변경은 불가합니다.');
    if (!result.isConfirmed) return;
  }
    // const target = requests.find(r => r.id === id);
    // //재고가 0인 비품이 1개 이상 있냐
    // const emptyItems = target.items.filter(item => item.stock_qty === 0);
    // if (emptyItems.length > 0) {
    //   await alertWarning('승인 불가', '재고가 부족하여 승인이 불가합니다.');
    //   return;
    // }
    // //재고 부족
    // const lowItems = target.items.filter(item => item.stock_qty > 0 && item.stock_qty <= item.min_stock_qty);
    // if (lowItems.length > 0) {
    //   const warnings = lowItems.map(i => `• ${i.supply_name} : 재고 부족`).join('<br>');
    //   const result = await alertConfirm('재고 부족 경고', `${warnings}<br>그래도 승인하시겠습니까?`);
    //   if (!result.isConfirmed) return;
    // } else {
    //   const result = await alertConfirm('신청을 승인하시겠습니까?', '처리 후 변경은 불가합니다.');
    //   if (!result.isConfirmed) return;
    // }

    try {
      await updateSupplyReqStatus({
        req_seq: target.id,
        users_id: target.users_id,
        req_date: target.requestDate,
        status: 'APPROVED',
        items: target.items
      });
      await alertSuccess('승인 완료', '승인 처리가 완료되었습니다.');
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: '승인' } : r)
      );
    } catch (err) {
      await alertWarning('승인 불가', '재고가 부족하여 승인이 불가합니다.');
    }
  };

  const handleReject = async (id) => {
    const result = await alertConfirm('정말 반려하시겠습니까?', '처리 후 변경은 불가합니다.');
    if (!result.isConfirmed) return;

    const target = requests.find(r => r.id === id);
    try {
      await updateSupplyReqStatus({
        req_seq: target.id,
        status: 'REJECTED',
        items: target.items
      });
      await alertSuccess('반려 완료', '반려 처리가 완료되었습니다.');
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: '반려' } : r)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleRowClick = (id) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  return (
    <div className={`w-full h-full bg-white font-sans flex flex-col overflow-hidden ${selectedId ? 'p-0 md:p-8' : 'p-6 md:p-8'}`}>

      {/* 헤더 */}
      <div className={`mb-7 shrink-0 ${selectedId ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">비품 신청 관리</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500">직원들의 비품 신청 현황을 확인하고 승인 또는 반려할 수 있습니다.</p>
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
            placeholder="비품명, 신청자 검색"
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
              <div className="min-w-[800px] md:min-w-0 flex-1 flex flex-col min-h-0">
                {/* 헤더 */}
                <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100 shrink-0 sticky top-0 z-10">
                  {['수령 희망 날짜', '신청자', '비품명', '사용 구분', '상태'].map((h, i) => (
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
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  {requests.length > 0 ? requests.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleRowClick(item.id)}
                      className={`grid grid-cols-12 border-b border-gray-50 last:border-0 items-center transition-colors h-14 md:h-[12.5%] cursor-pointer
                        ${selectedId === item.id ? 'bg-indigo-50/60' : 'hover:bg-gray-50/60'}`}
                    >
                      <div className="col-span-2 px-4">
                        <span className="text-xs text-gray-500">{item.requestDate}</span>
                      </div>
                      <div className="col-span-2 px-4 flex items-baseline gap-2">
                        <p className="text-sm font-bold text-gray-800">{item.applicantName}</p>
                        <p className="text-[10px] text-gray-400 whitespace-nowrap">{item.dept}</p>
                      </div>
                      <div className="col-span-4 px-4">
                        <p className="text-sm font-bold text-gray-800 truncate" title={item.supplyName}>{item.supplyName}</p>
                      </div>
                      <div className="col-span-2 px-4">
                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-500">{item.useType}</span>
                      </div>
                      <div className="col-span-2 px-4 flex justify-center">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  )) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400 font-bold">
                      {activeTab === '전체' ? '신청 내역이 없습니다.' : `${activeTab} 상태의 신청이 없습니다.`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 shrink-0 overflow-hidden">
            <MobilePagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} />
            <div className="hidden md:block">
              <Stack spacing={2} sx={{ alignItems: 'center', py: 3, width: '100%' }}>
                <MuiPagination
                  count={totalPages}
                  page={page}
                  onChange={(_, v) => setPage(v)}
                  variant="outlined"
                  shape="rounded"
                  color="primary"
                  sx={{
                    '& .MuiPagination-ul': {
                      flexWrap: 'nowrap',
                    },
                    '& .MuiPaginationItem-root': {
                      fontFamily: 'inherit',
                      fontWeight: 'bold',
                      borderRadius: '12px',
                    },
                    '& .MuiPaginationItem-root.Mui-selected': {
                      backgroundColor: '#3530B8',
                      color: '#fff',
                    },
                    '& .MuiPaginationItem-root.Mui-selected:hover': {
                      backgroundColor: '#2a2594',
                    },
                    '& .MuiPaginationItem-root:hover': {
                      backgroundColor: '#F0F4FF',
                      color: '#3530B8',
                    },
                  }}
                />
              </Stack>
            </div>
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
                  <h3 className="text-base font-bold text-slate-900 mb-1">신청 상세</h3>
                  <p className="text-[0.7rem] text-gray-400">{selectedItem.requestDate}</p>
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
                  <p className="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">신청자</p>
                  <p className="text-sm font-bold text-gray-800">{selectedItem.applicantName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedItem.dept}</p>
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                  <p className="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2">비품 목록</p>
                  <div className="space-y-2">
                    {(selectedItem.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-sm font-bold text-gray-800">{item.supplyName || item.supply_name}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-500">{item.use_type || item.useType}</span>
                          <span className="text-xs font-bold text-gray-500">{item.ea}개</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                  <p className="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">요청 사유</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedItem.reason}
                  </p>
                </div>
              </div>

              {/* 승인/반려 버튼 */}
              {selectedItem.status === '대기' && (
                <div className="flex gap-3 pt-6 shrink-0">
                  <button
                    onClick={() => handleApprove(selectedItem.id)}
                    className="flex-1 py-3 bg-[#3530B8] text-white text-sm font-bold rounded-2xl hover:bg-[#2a2696] transition-all shadow-lg shadow-[#3530B8]/20"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => handleReject(selectedItem.id)}
                    className="flex-1 py-3 bg-white border border-red-200 text-red-500 text-sm font-bold rounded-2xl hover:bg-red-50 transition-all"
                  >
                    반려
                  </button>
                </div>
              )}
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

export default AdminSupplyReq;
