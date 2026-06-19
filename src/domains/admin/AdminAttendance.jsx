import React, { useEffect, useState } from 'react';
import Pagination from '../../components/common/Pagination';
import useLoadingStore from '../../store/useLoadingStore';
import { approveCheckout, approveOvertime, getAllCheckoutRQ, getAllOvertimeRQ, rejectCheckout, rejectOvertime } from './adminApi';
import useUserStore from '../../store/userStore';
import { alertSuccess, alertError, alertConfirm } from '../../utils/alert';

const AdminAttendance = () => {
  const [activePageTab, setActivePageTab] = useState('근무시간 정정');
  const [activeStatusTab, setActiveStatusTab] = useState('전체');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabCount, setTabCount] = useState({TOTAL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0});
  const [checkoutRequest, setCheckoutRequest] = useState([]);
  const [overtimeRequest, setOvertimeRequest] = useState([]);

  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);
  const { user } = useUserStore();

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

  const handlePageTabClick = (tab) => {
    setActivePageTab(tab);
    setActiveStatusTab('전체');
    setPage(1);
  }

  const handleCheckoutApp = async (seq) => {
    const result = await alertConfirm('신청을 승인하시겠습니까?', '처리 후 변경은 불가합니다.');
    if (result.isConfirmed) {
      try {
        await approveCheckout(seq);
        await alertSuccess('승인 완료', '승인 처리가 완료되었습니다.');
        loadRequest();
      } catch (err) {
        console.error('신청 승인 실패 : ', err);
        await alertError('승인 실패', '승인 처리에 실패했습니다.');
      }
    }
  }

  const handleCheckoutRej = async (seq) => {
    const result = await alertConfirm('정말 반려하시겠습니까?', '처리 후 변경은 불가합니다.');
    if (result.isConfirmed) {
      try {
        await rejectCheckout(seq);
        await alertSuccess('반려 완료', '반려 처리가 완료되었습니다.');
        loadRequest();
      } catch(err) {
        console.error('신청 반려 실패 : ', err);
        await alertError('반려 실패', '반려 처리에 실패했습니다.');
      }
    }
  }

  const handleOvertimeApp = async (seq) => {
    const result = await alertConfirm('신청을 승인하시겠습니까?', '처리 후 변경은 불가합니다.');
    if (result.isConfirmed) {
      try {
        await approveOvertime(seq);
        await alertSuccess('승인 완료', '승인 처리가 완료되었습니다.');
        loadRequest();
      } catch (err) {
        console.error('신청 승인 실패 : ', err);
        await alertError('승인 실패', '승인 처리에 실패했습니다.');
      }
    }
  }

  const handleOvertimeRej = async (seq) => {
    const result = await alertConfirm('정말 반려하시겠습니까?', '처리 후 변경은 불가합니다.');
    if (result.isConfirmed) {
      try {
        await rejectOvertime(seq);
        await alertSuccess('반려 완료', '반려 처리가 완료되었습니다.');
        loadRequest();
      } catch (err) {
        console.error('신청 반려 실패 : ', err);
        await alertError('반려 실패', '반려 처리에 실패했습니다.');
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-white font-sans p-6 md:p-8">
      
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">
          {activePageTab === '근무시간 정정' ? '근무시간 정정 신청 관리' : '연장근무 신청 관리'}
        </h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
          {activePageTab === '근무시간 정정' 
            ? '임직원의 근무시간 정정 신청 내역을 확인하고 관리할 수 있습니다.' 
            : '임직원의 연장근무 신청 내역을 확인하고 관리할 수 있습니다.'}
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div className="flex items-center gap-2 border-b border-gray-100 w-full md:w-auto">
          {['근무시간 정정', '연장근무 관리'].map((tab) => (
            <button
              key={tab}
              onClick={() => handlePageTabClick(tab)}
              className={`px-4 py-2 text-sm font-bold transition-all relative whitespace-nowrap ${
                activePageTab === tab
                  ? 'text-[#3530B8]'
                  : 'text-gray-400 hover:text-[#3530B8]'
              }`}
            >
              {tab}
              {activePageTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3530B8]" />
              )}
            </button>
          ))}
        </div>

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

      <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden min-h-0">
        <div className="flex-1 overflow-auto p-6 pt-0 custom-scrollbar">
          <table className="w-full text-left border-collapse mt-6 min-w-[1100px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-100">
                {activePageTab === '근무시간 정정' ? (
                  <>
                    <th className="pb-4 pl-2 md:pl-3 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">신청자</th>
                    <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">부서/직급</th>
                    <th className="pb-4 pl-6 md:pl-12 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">변경 희망 일자</th>
                    <th className="pb-4 pl-3 md:pl-7 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">기존 시간</th>
                    <th className="pb-4 pl-4 md:pl-7 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">변경 요청 시간</th>
                    <th className="pb-4 pl-10 md:pl-20 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">사유</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">관리자</th>
                    <th className="pb-4 pl-10 md:pl-15 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">상태</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center whitespace-nowrap">관리</th>
                  </>
                ) : (
                  <>
                    <th className="pb-4 pl-2 md:pl-3 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">신청자</th>
                    <th className="pb-4 pl-4 md:pl-6 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">부서/직급</th>
                    <th className="pb-4 pl-6 md:pl-12 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">연장 근무 날짜</th>
                    <th className="pb-4 pl-3 md:pl-5 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">근무 종료 시간</th>
                    <th className="pb-4 pl-10 md:pl-20 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">사유</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">관리자</th>
                    <th className="pb-4 pl-10 md:pl-15 text-[0.6875rem] font-bold text-slate-400 tracking-wider whitespace-nowrap">상태</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center whitespace-nowrap">관리</th>
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
                      <td className="py-4 pl-1 md:pl-2 text-sm font-bold text-slate-800 whitespace-nowrap">{req.name}</td>
                      <td className="py-4 pl-3 md:pl-6 text-xs text-slate-500 font-medium whitespace-nowrap">{req.dept_name} / {req.rank_name}</td>
                      <td className="py-4 pl-6 md:pl-13 text-[0.6875rem] text-slate-400 font-mono whitespace-nowrap">{req.req_check_out?.split(" ")[0]}</td>
                      <td className="py-4 pl-4 md:pl-8 text-xs text-[#3530B8] font-bold whitespace-nowrap">
                        {req.checkout_date ? req.checkout_date?.substring(11,16) : '미기록'}
                      </td>
                      <td className="py-4 pl-8 md:pl-11 text-xs text-[#3530B8] font-bold whitespace-nowrap">{req.req_check_out?.substring(11,16)}</td>
                      <td className="py-4 pl-10 md:pl-19 text-xs text-slate-500 w-80 md:w-130 truncate whitespace-nowrap" title={req.reason}>
                        {req.reason}
                      </td>
                      {
                        req.approver_name ?
                        <td className="py-4 text-xs text-slate-600 font-medium whitespace-nowrap">{req.approver_name}</td>
                        :
                        <td className="py-4 pl-2 md:pl-3 text-xs text-slate-600 font-medium whitespace-nowrap">-</td>
                      }
                      <td className="py-4 pl-8 md:pl-13 whitespace-nowrap">
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
                            req.status === 'PENDING' ? (
                              user?.id !== req.users_id ? (
                              <>
                                <button 
                                  className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg hover:bg-[#F0FDF4] transition-all cursor-pointer"
                                  onClick={() => handleCheckoutApp(req.checkout_seq)}
                                >
                                  승인
                                </button>
                                <button 
                                  className="px-3 py-1 text-[10px] font-bold text-[#FF4D4F] bg-white border border-[#FF4D4F] rounded-lg hover:bg-[#FFF0F0] transition-all cursor-pointer"
                                  onClick={() => handleCheckoutRej(req.checkout_seq)}
                                >
                                  반려
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )
                          ) : req.status === 'APPROVED' ? (
                            <button className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg">
                              승인됨
                            </button>
                          ) : (
                            <button className="px-3 py-1 text-[10px] font-bold text-[#FF4D4F] bg-white border border-[#FF4D4F] rounded-lg">
                              반려됨
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                    overtimeRequest.map((req) => (
                      <tr key={req.overtime_seq} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 pl-1 md:pl-2 text-sm font-bold text-slate-800 whitespace-nowrap">{req.name}</td>
                          <td className="py-4 pl-3 md:pl-6 text-xs text-slate-500 font-medium whitespace-nowrap">{req.dept_name} / {req.rank_name}</td>
                          <td className="py-4 pl-6 md:pl-13 text-[0.6875rem] text-slate-400 font-mono whitespace-nowrap">{req.work_date?.split(" ")[0]}</td>
                          <td className="py-4 pl-7 md:pl-9 text-xs text-[#3530B8] font-bold whitespace-nowrap">{req.end_dt?.substring(11, 16)}</td>
                          <td className="py-4 pl-10 md:pl-19 text-xs text-slate-500 w-80 md:w-130 truncate whitespace-nowrap" title={req.reason}>
                            {req.reason}
                          </td>
                          {
                            req.approver_name ?
                            <td className="py-4 text-xs text-slate-600 font-medium whitespace-nowrap">{req.approver_name}</td>
                            :
                            <td className="py-4 pl-2 md:pl-3 text-xs text-slate-600 font-medium whitespace-nowrap">-</td>
                          }
                          <td className="py-4 pl-8 md:pl-13 whitespace-nowrap">
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
                              req.status === 'PENDING' ? (
                                 user?.id !== req.users_id ? (
                                  <>
                                    <button 
                                      className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg hover:bg-[#F0FDF4] transition-all cursor-pointer"
                                      onClick={() => handleOvertimeApp(req.overtime_seq)}
                                    >
                                      승인
                                    </button>
                                    <button 
                                      className="px-3 py-1 text-[10px] font-bold text-[#FF4D4F] bg-white border border-[#FF4D4F] rounded-lg hover:bg-[#FFF0F0] transition-all cursor-pointer"
                                      onClick={() => handleOvertimeRej(req.overtime_seq)}
                                    >
                                      반려
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400">-</span>
                                )
                              ) : req.status === 'APPROVED' ? (
                                <button className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg">
                                  승인됨
                                </button>
                              ) : (
                                <button className="px-3 py-1 text-[10px] font-bold text-[#FF4D4F] bg-white border border-[#FF4D4F] rounded-lg">
                                  반려됨
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
            </tbody>
          </table>
        </div>

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
