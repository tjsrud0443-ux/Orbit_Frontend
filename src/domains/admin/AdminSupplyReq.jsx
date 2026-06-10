import React, { useState, useMemo, useEffect } from 'react';
import Pagination from '../../components/common/Pagination';

const PER_PAGE = 8;

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
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  // TODO: 실제 API로 교체
  useEffect(() => {
    // getSupplyRequests().then(res => setRequests(res.data));
  }, []);

  const tabCounts = useMemo(() => {
    const counts = { 전체: requests.length };
    STATUS_TABS.slice(1).forEach(({ key }) => {
      counts[key] = requests.filter(r => r.status === key).length;
    });
    return counts;
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const matchTab = activeTab === '전체' || r.status === activeTab;
      const matchKeyword =
        r.supplyName?.toLowerCase().includes(keyword.toLowerCase()) ||
        r.applicantName?.toLowerCase().includes(keyword.toLowerCase());
      return matchTab && matchKeyword;
    });
  }, [requests, activeTab, keyword]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleApprove = (id) => {
    setRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: '승인' } : r)
    );
  };

  const handleReject = (id) => {
    setRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: '반려' } : r)
    );
  };

  return (
    <div className="w-full h-full bg-white p-6 md:p-8 font-sans flex flex-col overflow-hidden">

      {/* 헤더 */}
      <div className="mb-7 shrink-0">
        <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">비품 신청 관리</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500">직원들의 비품 신청 현황을 확인하고 승인 또는 반려할 수 있습니다.</p>
      </div>

      {/* 카드 */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* 탭 */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-[#F0F4FF] w-fit mb-5 shrink-0">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`px-4 py-2 text-[0.6875rem] md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap
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
        <div className="relative w-full md:w-72 mb-5 shrink-0">
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

        {/* 테이블 */}
        <div className="rounded-xl border border-gray-100 flex-1 flex flex-col overflow-hidden min-h-0">

          {/* 헤더 */}
          <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100 shrink-0">
            {['신청일', '신청자', '비품명', '사용 구분', '상태', '관리'].map((h, i) => (
              <div
                key={h}
                className={`py-4 px-4 text-[0.68rem] font-extrabold text-gray-400 uppercase tracking-wider
                  ${i === 0 ? 'col-span-2' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-4' : i === 3 ? 'col-span-2' : i === 4 ? 'col-span-1 text-center' : 'col-span-1 text-center'}`}
              >
                {h}
              </div>
            ))}
          </div>

          {/* 바디 */}
          <div className="flex-1 overflow-hidden min-h-0">
            {paginated.length > 0 ? paginated.map(item => (
              <div key={item.id} className="grid grid-cols-12 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50/60 transition-colors h-[12.5%]">

                {/* 신청일 */}
                <div className="col-span-2 px-4">
                  <span className="text-xs text-gray-500">{item.requestDate}</span>
                </div>

                {/* 신청자 */}
                <div className="col-span-2 px-4">
                  <p className="text-sm font-bold text-gray-800">{item.applicantName}</p>
                  <p className="text-[10px] text-gray-400">{item.dept}</p>
                </div>

                {/* 비품명 */}
                <div className="col-span-4 px-4">
                  <p className="text-sm font-bold text-gray-800 truncate" title={item.supplyName}>{item.supplyName}</p>
                </div>

                {/* 사용 구분 */}
                <div className="col-span-2 px-4">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-500">
                    {item.useType}
                  </span>
                </div>

                {/* 상태 */}
                <div className="col-span-1 px-4 flex justify-center">
                  <StatusBadge status={item.status} />
                </div>

                {/* 관리 버튼 */}
                <div className="col-span-1 px-4 flex items-center justify-center gap-1.5">
                  {item.status === '대기' ? (
                    <>
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 bg-white border border-emerald-300 rounded-full hover:bg-emerald-50 transition-colors shadow-sm whitespace-nowrap"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleReject(item.id)}
                        className="px-2.5 py-1 text-[10px] font-bold text-red-500 bg-white border border-red-200 rounded-full hover:bg-red-50 transition-colors shadow-sm whitespace-nowrap"
                      >
                        반려
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-300 font-bold">-</span>
                  )}
                </div>
              </div>
            )) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400 font-bold">
                {activeTab === '전체' ? '신청 내역이 없습니다.' : `${activeTab} 상태의 신청이 없습니다.`}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 shrink-0">
          <Pagination
            count={Math.ceil(filtered.length / PER_PAGE)}
            page={page}
            onChange={(_, v) => setPage(v)}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminSupplyReq;
