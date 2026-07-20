import { useState } from 'react';
import Pagination from '../../components/common/Pagination';
import MobilePagination from '../../components/common/MobilePagination';

const AdminCertRequest = () => {
  const [activeStatusTab, setActiveStatusTab] = useState('전체');
  const [page, setPage] = useState(1);
  const [totalPages] = useState(1);
  const [certRequests] = useState([]);

  const tabKeyMap = {
    '전체': 'TOTAL',
    '대기': 'PENDING',
    '승인': 'APPROVED',
    '반려': 'REJECTED'
  };

  const tabs = ['전체', '대기', '승인', '반려'];
  const tabCount = { TOTAL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };

  const handleStatusTabClick = (tab) => {
    setActiveStatusTab(tab);
    setPage(1);
  };

  const renderStatusBadge = (status) => {
    if (status === 'PENDING') {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF9F0] text-[#FF9800]">대기</span>;
    }

    if (status === 'APPROVED') {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0FDF4] text-[#10B981]">승인</span>;
    }

    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF0F0] text-[#FF4D4F]">반려</span>;
  };

  const renderAction = (request) => {
    if (request.status === 'PENDING') {
      return (
        <>
          <button className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg hover:bg-[#F0FDF4] transition-all cursor-pointer">
            승인
          </button>
          <button className="px-3 py-1 text-[10px] font-bold text-[#FF4D4F] bg-white border border-[#FF4D4F] rounded-lg hover:bg-[#FFF0F0] transition-all cursor-pointer">
            반려
          </button>
        </>
      );
    }

    if (request.status === 'APPROVED') {
      return (
        <button className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg">
          승인됨
        </button>
      );
    }

    return (
      <button className="px-3 py-1 text-[10px] font-bold text-[#FF4D4F] bg-white border border-[#FF4D4F] rounded-lg">
        반려됨
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white font-sans p-6 md:p-8">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">
          증명서 발급 신청 관리
        </h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
          증명서 발급 신청 내역을 확인하고 승인 또는 반려할 수 있습니다.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-6 flex-shrink-0">
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-[#F0F4FF] flex-shrink-0 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleStatusTabClick(tab)}
              className={`px-3 md:px-4 py-2 text-[0.6875rem] md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${activeStatusTab === tab
                ? 'bg-[#3530B8] text-white shadow-md'
                : 'text-gray-500 hover:text-[#3530B8] hover:bg-[#F0F4FF]'
                }`}
            >
              {tab} <span className={`ml-1 ${activeStatusTab === tab ? 'opacity-80' : 'text-gray-400'}`}>({tabCount[tabKeyMap[tab]]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden min-h-0">
        <div className="flex-1 overflow-auto p-6 pt-0 custom-scrollbar">
          <table className="w-full text-left border-collapse mt-6 min-w-[1360px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-100">
                <th className="pb-4 pl-2 md:pl-3 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">신청자</th>
                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">부서/직급</th>
                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">증명서 유형</th>
                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">신청 사유</th>
                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">신청일시</th>
                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">처리 관리자</th>
                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">상태</th>
                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">처리일시</th>
                <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">출력기한</th>
                <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400 text-sm">
                    신청 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                certRequests.map((request) => (
                  <tr key={request.cert_request_seq} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 pl-1 md:pl-2 text-sm font-bold text-slate-800 whitespace-nowrap">{request.name}</td>
                    <td className="py-4 pl-3 md:pl-6 text-xs text-slate-500 font-medium whitespace-nowrap">{request.dept_name} / {request.rank_name}</td>
                    <td className="py-4 pl-4 md:pl-6 text-xs text-[#3530B8] font-bold whitespace-nowrap">{request.cert_type_name}</td>
                    <td className="py-4 pl-4 md:pl-6 text-xs text-slate-500 w-64 truncate whitespace-nowrap" title={request.reason}>{request.reason}</td>
                    <td className="py-4 pl-4 md:pl-6 text-[0.6875rem] text-slate-400 font-mono whitespace-nowrap">{request.requested_at}</td>
                    <td className="py-4 pl-4 md:pl-6 text-xs text-slate-600 font-medium whitespace-nowrap">{request.approver_name || '-'}</td>
                    <td className="py-4 pl-4 md:pl-6 whitespace-nowrap">{renderStatusBadge(request.status)}</td>
                    <td className="py-4 pl-4 md:pl-6 text-[0.6875rem] text-slate-400 font-mono whitespace-nowrap">{request.processed_at || '-'}</td>
                    <td className="py-4 pl-4 md:pl-6 text-[0.6875rem] text-slate-400 font-mono whitespace-nowrap">{request.print_deadline || '-'}</td>
                    <td className="py-4 text-center">
                      <div className="flex justify-center gap-2">
                        {renderAction(request)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-50 bg-white rounded-b-[32px] py-2">
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

      <style dangerouslySetInnerHTML={{
        __html: `
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

export default AdminCertRequest;
