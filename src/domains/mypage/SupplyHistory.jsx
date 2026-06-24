import React, { useState, useEffect } from 'react';
import Pagination from '../../components/common/Pagination';
import MobilePagination from '../../components/common/MobilePagination';
import { getMySupplyRequest, deleteMySupplyRequest } from './mypageApi';
import useLoadingStore from '../../store/useLoadingStore';
import { alertSuccess, alertError, alertConfirm } from '../../utils/alert';

const PAGE_SIZE = 8;

// ─── 상태 뱃지 ──────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    'APPROVED': { label: '승인', bg: 'bg-[#F0FDF4]', color: 'text-[#10B981]', border: 'border-[#A7F3D0]' },
    'PENDING':  { label: '대기', bg: 'bg-[#FFF9F0]', color: 'text-[#FF9800]', border: 'border-[#FFD9A0]' },
    'REJECTED': { label: '반려', bg: 'bg-[#FFF0F0]', color: 'text-[#FF4D4F]', border: 'border-[#FFBCBC]' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[12px] font-semibold border ${s.bg} ${s.color} ${s.border} tracking-tight`}>
      {s.label}
    </span>
  );
};

// ─── 비품 목록 요약 ────────────
const ItemSummary = ({ items }) => {
  if (!items || items.length === 0) return <span className="text-sm font-bold text-gray-400">품목 없음</span>;
  const first = items[0]?.supply_name ?? '';
  const truncated = first.length > 14 ? first.slice(0, 14) + '…' : first;
  const extraCount = items.length - 1;
  const extra = extraCount > 0 ? ` 외 ${extraCount}건` : '';
  return (
    <div className="min-w-0">
      <span className="hidden md:inline text-sm font-bold text-gray-700">
        {truncated}
        {extra && <span className="text-gray-400 text-xs font-normal ml-1">{extra}</span>}
      </span>
      <span className="md:hidden flex flex-col min-w-0">
        <span className="text-sm font-bold text-gray-700 truncate">{first}</span>
        {extraCount > 0 && (
          <span className="mt-0.5 text-xs font-normal text-gray-400">외 {extraCount}건</span>
        )}
      </span>
    </div>
  );
};

const SupplyHistory = () => {
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  const loadRequests = () => {
    showLoading();
    getMySupplyRequest()
      .then(resp => {
        setRequests(resp.data);
      })
      .catch(err => console.error("비품 신청 내역 로드 실패:", err))
      .finally(() => {
        hideLoading();
      });
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const totalPages = Math.ceil(requests.length / PAGE_SIZE);
  const pagedData = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleDeleteRequest = async (req_seq) => {
    const result = await alertConfirm('정말 취소하시겠습니까?', '취소 후 복구는 불가합니다.');
    if (result.isConfirmed) {
      showLoading();
      try {
        await deleteMySupplyRequest(req_seq);
        hideLoading();
        await alertSuccess('취소 완료', '신청 취소가 완료되었습니다.');
        setSelectedRequest(null);
        loadRequests();
      } catch (err) {
        console.error('비품 신청 삭제 실패:', err);
        hideLoading();
        await alertError('삭제 실패', '삭제에 실패했습니다.');
      } finally {
        hideLoading();
      }
    }
  };

  return (
    <div className={`h-full flex flex-col ${selectedRequest ? 'p-0 md:p-8' : 'p-6 md:p-8'} font-sans overflow-hidden bg-[#FFFFFF]`}>
      
      {/* Header Section */}
      <div className={`mb-6 flex-shrink-0 ${selectedRequest ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">비품 신청 내역</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
          나의 비품 신청 목록을 확인하고 관리할 수 있습니다.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        
        {/* List Section */}
        <div className={`flex flex-col bg-white rounded-[2rem] border border-[#F0F4FF] shadow-sm overflow-hidden transition-all duration-500 min-h-0 ${selectedRequest ? 'hidden md:flex md:flex-[0.6]' : 'flex-1'}`}>
          <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_0.8fr] px-6 py-4 pr-[calc(1.5rem+0.25rem)] border-b border-gray-50 text-[0.6875rem] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">
            <div className="pl-4">비품명</div>
            <div>수령 희망 날짜</div>
            <div className="pl-1">승인 상태</div>
            <div className="text-center">관리</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {pagedData.length > 0 ? (
              pagedData.map((req) => (
                <div 
                  key={req.req_seq}
                  className={`flex md:grid md:grid-cols-[1.5fr_1fr_1fr_0.8fr] px-4 md:px-6 py-4 items-center border-b border-gray-50/50 transition-colors ${selectedRequest?.req_seq === req.req_seq ? 'bg-[#F0F4FF]' : ''}`}
                >
                  {/* Mobile & PC Info */}
                  <div className="flex-1 min-w-0 md:block pl-4">
                    <ItemSummary items={req.items} />
                  </div>
                  <div className="hidden md:block text-xs text-gray-500">{req.req_date}</div>
                  <div className="hidden md:block">
                    <StatusBadge status={req.status} />
                  </div>

                  {/* Mobile Info Overlay */}
                  <div className="md:hidden flex-1 min-w-0 mx-2">
                    <div className="text-[10px] text-gray-500">{req.req_date}</div>
                    <div className="mt-1">
                      <StatusBadge status={req.status} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex justify-center">
                    <button 
                      onClick={() => setSelectedRequest(req)}
                      className="px-2.5 py-1.5 text-[0.625rem] md:text-xs font-bold text-[#3530B8] bg-[#F0F4FF] rounded-lg hover:bg-[#3530B8] hover:text-white transition-all"
                    >
                      상세보기
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-sm font-bold">신청 내역이 없습니다.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-50 flex-shrink-0">
            <MobilePagination count={totalPages} page={page} onChange={handlePageChange} />
            <div className="hidden md:block">
              <Pagination count={totalPages} page={page} onChange={handlePageChange} />
            </div>
          </div>
        </div>

        {/* Detail View Section */}
        {selectedRequest && (
          <div className={`flex flex-col bg-white rounded-none md:rounded-[2rem] border-0 md:border border-[#F0F4FF] shadow-sm overflow-hidden animate-in slide-in-from-right duration-500 flex-1 md:flex-[0.4] md:max-h-full`}>
            <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">신청 상세 내역</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6 custom-scrollbar space-y-6 ">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 text-left">신청 정보</h3>
                <div className="bg-[#F8FAFF] rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100/50 pb-2">
                    <span className="text-xs font-medium text-gray-500">신청일</span>
                    <span className="text-xs font-bold text-gray-800">{selectedRequest.req_date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">처리 상태</span>
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 text-left">신청 비품 목록 ({selectedRequest.items?.length || 0}종)</h3>
                <div className="border border-gray-100 rounded-2xl overflow-hidden flex flex-col">
                  {/* Table Header - Separated to avoid scrollbar overlap */}
                  <div className="bg-gray-50 border-b border-gray-100 flex-shrink-0">
                    <table className="w-full text-xs table-fixed">
                      <thead>
                        <tr className="text-gray-500 font-bold">
                          <th className="py-3 px-4 text-left w-[70%]">비품명</th>
                          <th className="py-3 px-4 text-right pr-[calc(1rem+0.25rem)]">수량</th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  {/* Table Body - Scrollable */}
                  <div className="max-h-32 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <table className="w-full text-xs table-fixed">
                      <tbody>
                        {selectedRequest.items?.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-50 last:border-0">
                            <td className="py-3 px-4 text-gray-700 font-bold text-left w-[70%] truncate">{item.supply_name}</td>
                            <td className="py-3 px-4 text-gray-500 font-bold text-right">{item.ea}개</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 text-left">신청 사유</h3>
                <div className="bg-gray-50 rounded-2xl p-5 max-h-32 overflow-y-auto custom-scrollbar">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedRequest.reason || '입력된 사유가 없습니다.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'REJECTED') && (
                <div className="pt-1">
                  <button 
                    onClick={() => handleDeleteRequest(selectedRequest.req_seq)}
                    className="w-full py-4 bg-red-50 text-red-500 text-sm font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                    신청 취소
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar { scrollbar-gutter: stable; }
        .custom-scrollbar::-webkit-scrollbar { width: 0.25rem; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 0.625rem; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
    </div>
  );
};

export default SupplyHistory;
