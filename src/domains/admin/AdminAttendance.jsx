import React, { useEffect, useState } from 'react';
import Pagination from '../../components/common/Pagination';
import useLoadingStore from '../../store/useLoadingStore';
import { getAllCheckoutRQ, getAllOvertimeRQ } from './adminApi';

const AdminAttendance = () => {
  // 페이지 탭 (근무시간 정정 / 연장근무 관리)
  const [activePageTab, setActivePageTab] = useState('근무시간 정정');
  // 처리 상태 탭 (전체 / 대기 / 승인 / 반려)
  const [activeStatusTab, setActiveStatusTab] = useState('전체');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabCount, setTabCount] = useState({TOTAL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0});
  const [checkoutRequest, setCheckoutRequest] = useState([]);
  const [overtimeRequest, setOvertimeRequest] = useState([]);

  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  const statusMap = {
    '전체': 'TOTAL',
    '대기': 'PENDING',
    '승인': 'APPROVED',
    '반려': 'REJECTED'
  };

  const tabKeyMap = {
    '전체': 'TOTAL',
    '대기': 'PENDING',
    '승인': 'APPROVED',
    '반려': 'REJECTED'
  };

  const tabs = ['전체', '대기', '승인', '반려'];

  const loadRequest = async () => {
    try {
      showLoading();
      if (activePageTab === '근무시간 정정') {
        const checkoutReq = await getAllCheckoutRQ(page, statusMap[activeStatusTab]);
        setCheckoutRequest(checkoutReq.data.list);
        const calculatedPages = Math.ceil(checkoutReq.data.count / 10);
        setTotalPages(calculatedPages === 0 ? 1 : calculatedPages);
        setTabCount(checkoutReq.data.tabCount);
      } 
      if (activePageTab === '연장근무 관리') {
        const overtimeReq = await getAllOvertimeRQ(page, statusMap[activeStatusTab]);
        setOvertimeRequest(overtimeReq.data.list);
        const calculatedPages = Math.ceil(overtimeReq.data.count / 10);
        setTotalPages(calculatedPages === 0 ? 1 : calculatedPages);
        setTabCount(overtimeReq.data.tabCount);
      }
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    loadRequest();
  }, [page, activePageTab, activeStatusTab]);

  const handleStatusTabClick = (tab) => {
    setActiveStatusTab(tab);
    setPage(1);
  };

  return (
    <div className="h-full flex flex-col bg-white font-sans p-6 md:p-8">
      
      {/* [1] 헤더 영역 */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">
          {activePageTab === '근무시간 정정' ? '근무시간 정정 신청 관리' : '연장근무 신청 관리'}
        </h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
          {activePageTab === '근무시간 정정' 
            ? '임직원의 근무시간 정정 신청 내역을 확인하고 관리할 수 있습니다.' 
            : '임직원들의 연장근무 신청 내역을 확인하고 관리할 수 있습니다.'}
        </p>
      </div>

      {/* [2] 탭 영역 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
        {/* 왼쪽: 페이지 이동 탭 */}
        <div className="flex items-center gap-2 border-b border-gray-100 w-full md:w-auto">
          {['근무시간 정정', '연장근무 관리'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActivePageTab(tab)}
              className={`px-4 py-2 text-sm font-bold transition-all relative whitespace-nowrap ${
                activePageTab === tab
                  ? 'text-[#3530B8]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
              {activePageTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3530B8]" />
              )}
            </button>
          ))}
        </div>

        {/* 오른쪽: 처리 상태 필터 탭 */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-[#F0F4FF] flex-shrink-0 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleStatusTabClick(tab)}
              className={`px-3 md:px-4 py-2 text-[0.6875rem] md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeStatusTab === tab
                  ? 'bg-[#3530B8] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#3530B8] hover:bg-[#F0F4FF]'
              }`}
            >
              {tab} <span className={`ml-1 ${activeStatusTab === tab ? 'opacity-80' : 'text-gray-400'}`}>({tabCount[tabKeyMap[tab]]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* [3] 목록 영역 */}
      <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden min-h-0">
        <div className="flex-1 overflow-auto p-6 pt-0 custom-scrollbar">
          <table className="w-full text-left border-collapse mt-6 min-w-[1100px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-100">
                {activePageTab === '근무시간 정정' ? (
                  <>
                    <th className="pb-4 pl-3 text-[0.6875rem] font-bold text-slate-400 tracking-wider">신청자</th>
                    <th className="pb-4 pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider">부서/직급</th>
                    <th className="pb-4 pl-12 text-[0.6875rem] font-bold text-slate-400 tracking-wider">변경 희망 일자</th>
                    <th className="pb-4 pl-7 text-[0.6875rem] font-bold text-slate-400 tracking-wider">기존 시간</th>
                    <th className="pb-4 pl-7 text-[0.6875rem] font-bold text-slate-400 tracking-wider">변경 요청 시간</th>
                    <th className="pb-4 pl-20 text-[0.6875rem] font-bold text-slate-400 tracking-wider">사유</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider">관리자</th>
                    <th className="pb-4 pl-15 text-[0.6875rem] font-bold text-slate-400 tracking-wider">상태</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center">관리</th>
                  </>
                ) : (
                  <>
                    <th className="pb-4 pl-3 text-[0.6875rem] font-bold text-slate-400 tracking-wider">신청자</th>
                    <th className="pb-4 pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider">부서/직급</th>
                    <th className="pb-4 pl-12 text-[0.6875rem] font-bold text-slate-400 tracking-wider">연장 근무 날짜</th>
                    <th className="pb-4 pl-7 text-[0.6875rem] font-bold text-slate-400 tracking-wider">시작 시간</th>
                    <th className="pb-4 pl-7 text-[0.6875rem] font-bold text-slate-400 tracking-wider">종료 시간</th>
                    <th className="pb-4 pl-20 text-[0.6875rem] font-bold text-slate-400 tracking-wider">사유</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider">관리자</th>
                    <th className="pb-4 pl-15 text-[0.6875rem] font-bold text-slate-400 tracking-wider">상태</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center">관리</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activePageTab === '근무시간 정정' ? checkoutRequest : overtimeRequest).length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                    신청 내역이 없습니다.
                  </td>
                </tr>
              ) : activePageTab === '근무시간 정정' ? (
                  checkoutRequest.map((req) => (
                    <tr key={req.checkout_seq} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 pl-2 text-sm font-bold text-slate-800">{req.name}</td>
                      <td className="py-4 pl-6 text-xs text-slate-500 font-medium">{req.dept_name} / {req.rank_name}</td>
                      <td className="py-4 pl-13 text-[0.6875rem] text-slate-400 font-mono">{req.checkout_date.split(" ")[0]}</td>
                      <td className="py-4 pl-8 text-xs text-[#3530B8] font-bold">{req.checkout_date.substring(11,16)}</td>
                      <td className="py-4 pl-11 text-xs text-[#3530B8] font-bold">{req.req_check_out.substring(11,16)}</td>
                      <td className="py-4 pl-19 text-xs text-slate-500 w-130 truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      {
                        req.approver_name ?
                        <td className="py-4 text-xs text-slate-600 font-medium">{req.approver_name}</td>
                        :
                        <td className="py-4 pl-3 text-xs text-slate-600 font-medium">-</td>
                      }
                      <td className="py-4 pl-13">
                        {
                          req.status === 'PENDING' ? 
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF9F0] text-[#FF9800]">대기</span>
                          :
                          req.status === 'APPROVED' ? 
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0FDF4] text-[#10B981]">승인</span>
                          :
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF0F0] text-[#FF4D4F]">반려</span>
                        }
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex justify-center gap-2">
                          {
                            req.status === 'PENDING' ?
                            <>
                            <button className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg hover:bg-[#F0FDF4] transition-all cursor-pointer">
                              승인
                            </button>
                            <button className="px-3 py-1 text-[10px] font-bold text-[#FF4D4F] bg-white border border-[#FF4D4F] rounded-lg hover:bg-[#FFF0F0] transition-all cursor-pointer">
                              반려
                            </button>
                            </>
                            :
                            req.status === 'APPROVED' ?
                            <>
                            <button className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg hover:bg-[#F0FDF4] transition-all cursor-pointer">
                              승인됨
                            </button>
                            </>
                            :
                            <button className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg hover:bg-[#F0FDF4] transition-all cursor-pointer">
                              반려됨
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                    overtimeRequest.map((req) => (
                      <tr key={req.overtime_seq} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 pl-2 text-sm font-bold text-slate-800">{req.name}</td>
                          <td className="py-4 pl-6 text-xs text-slate-500 font-medium">{req.dept_name} / {req.rank_name}</td>
                          <td className="py-4 pl-13 text-[0.6875rem] text-slate-400 font-mono">{req.work_date.split(" ")[0]}</td>
                          <td className="py-4 pl-8 text-xs text-[#3530B8] font-bold">{req.start_dt.substring(11, 16)}</td>
                          <td className="py-4 pl-8 text-xs text-[#3530B8] font-bold">{req.end_dt.substring(11, 16)}</td>
                          <td className="py-4 pl-19 text-xs text-slate-500 w-130 truncate" title={req.reason}>
                            {req.reason}
                          </td>
                          {
                            req.approver_name ?
                            <td className="py-4 text-xs text-slate-600 font-medium">{req.approver_name}</td>
                            :
                            <td className="py-4 pl-3 text-xs text-slate-600 font-medium">-</td>
                          }
                          <td className="py-4 pl-13">
                            {
                              req.status === 'PENDING' ? 
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF9F0] text-[#FF9800]">대기</span>
                              :
                              req.status === 'APPROVED' ? 
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0FDF4] text-[#10B981]">승인</span>
                              :
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF0F0] text-[#FF4D4F]">반려</span>
                            }
                          </td>
                          <td className="py-4 text-center">
                          <div className="flex justify-center gap-2">
                            {
                              req.status === 'PENDING' ?
                              <>
                              <button className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg hover:bg-[#F0FDF4] transition-all cursor-pointer">
                                승인
                              </button>
                              <button className="px-3 py-1 text-[10px] font-bold text-[#FF4D4F] bg-white border border-[#FF4D4F] rounded-lg hover:bg-[#FFF0F0] transition-all cursor-pointer">
                                반려
                              </button>
                              </>
                              :
                              req.status === 'APPROVED' ?
                              <>
                              <button className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg hover:bg-[#F0FDF4] transition-all cursor-pointer">
                                승인됨
                              </button>
                              </>
                              :
                              <button className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg hover:bg-[#F0FDF4] transition-all cursor-pointer">
                                반려됨
                              </button>
                            }
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 영역 */}
        <div className="border-t border-gray-50 bg-white rounded-b-[32px] py-2">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, page) => setPage(page)}
          />
        </div>
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

export default AdminAttendance;
