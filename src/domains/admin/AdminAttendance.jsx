import React, { useState } from 'react';
import Pagination from '../../components/common/Pagination';

const AdminAttendance = () => {
  // 현재 선택된 페이지 탭 (근무시간 정정 / 연장근무 관리)
  const [activePageTab, setActivePageTab] = useState('근무시간 정정');
  // 현재 선택된 처리 상태 탭 (전체 / 대기 / 승인 / 반려)
  const [activeStatusTab, setActiveStatusTab] = useState('전체');
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);

  // UI 확인용 하드코딩 더미 데이터
  const dummyData = [
    {
      id: 1,
      applicant: '홍길동',
      deptRank: '개발팀 / 대리',
      targetDate: '2026-06-10',
      originalTime: '18:30',
      requestedTime: '18:00',
      reason: '병원 진료로 인한 조기 출근 및 조기 퇴근 희망합니다.',
      manager: '이순신',
      status: '대기',
    },
    {
      id: 2,
      applicant: '김철수',
      deptRank: '인사팀 / 사원',
      targetDate: '2026-06-11',
      originalTime: '19:00',
      requestedTime: '18:00',
      reason: '가족 행사 참여로 인한 시간 조정 요청',
      manager: '강감찬',
      status: '승인',
    },
    {
      id: 3,
      applicant: '이영희',
      deptRank: '디자인팀 / 과장',
      targetDate: '2026-06-12',
      originalTime: '19:30',
      requestedTime: '18:00',
      reason: '개인 사정으로 인한 조퇴 신청',
      manager: '유관순',
      status: '반려',
    },
  ];

  // 각 상태별 개수 (더미)
  const statusCounts = {
    전체: 12,
    대기: 5,
    승인: 4,
    반려: 3,
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
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
          {['전체', '대기', '승인', '반려'].map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatusTab(status)}
              className={`px-3 md:px-4 py-2 text-[0.6875rem] md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeStatusTab === status
                  ? 'bg-[#3530B8] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#3530B8] hover:bg-[#F0F4FF]'
              }`}
            >
              {status} <span className={`ml-1 ${activeStatusTab === status ? 'opacity-80' : 'text-gray-400'}`}>({statusCounts[status]})</span>
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
                    <th className="pb-4 pl-2 text-[0.6875rem] font-bold text-slate-400 tracking-wider">부서/직급</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider">변경 희망 일자</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider">기존 시간</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider">변경 요청 시간</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider">사유</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider">관리자</th>
                    <th className="pb-4 pl-5 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center">상태</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center">관리</th>
                  </>
                ) : (
                  <>
                    <th className="pb-4 pl-3 text-[0.6875rem] font-bold text-slate-400 tracking-wider">신청자</th>
                    <th className="pb-4 pl-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider">부서/직급</th>
                    <th className="pb-4 pl-5 text-[0.6875rem] font-bold text-slate-400 tracking-wider">연장 근무 날짜</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider">시작 시간</th>
                    <th className="pb-4 pl-3 text-[0.6875rem] font-bold text-slate-400 tracking-wider">종료 시간</th>
                    <th className="pb-4 pl-9 text-[0.6875rem] font-bold text-slate-400 tracking-wider">사유</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider">관리자</th>
                    <th className="pb-4 pl-15 text-[0.6875rem] font-bold text-slate-400 tracking-wider">상태</th>
                    <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center">관리</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dummyData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                    신청 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                dummyData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                    {activePageTab === '근무시간 정정' ? (
                      <>
                        <td className="py-4 pl-2 text-sm font-bold text-slate-800">{item.applicant}</td>
                        <td className="py-4 text-xs text-slate-500 font-medium">{item.deptRank}</td>
                        <td className="py-4 text-[0.6875rem] text-slate-400 font-mono">{item.targetDate}</td>
                        <td className="py-4 pl-1 text-xs text-[#3530B8] font-bold">{item.originalTime}</td>
                        <td className="py-4 pl-4 text-xs text-[#3530B8] font-bold">{item.requestedTime}</td>
                        <td className="py-4 text-xs text-slate-500 max-w-xs truncate" title={item.reason}>
                          {item.reason}
                        </td>
                        <td className="py-4 text-xs text-slate-600 font-medium">{item.manager}</td>
                        <td className="py-4 pl-5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === '대기' ? 'bg-[#FFF9F0] text-[#FF9800]' :
                            item.status === '승인' ? 'bg-[#F0FDF4] text-[#10B981]' :
                            'bg-[#FFF0F0] text-[#FF4D4F]'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 pl-2 text-sm font-bold text-slate-800">{item.applicant}</td>
                        <td className="py-4 pl-2 text-xs text-slate-500 font-medium">{item.deptRank}</td>
                        <td className="py-4 pl-5 text-[0.6875rem] text-slate-400 font-mono">{item.targetDate}</td>
                        <td className="py-4 pl-1.5 text-xs text-[#3530B8] font-bold">{item.originalTime}</td>
                        <td className="py-4 pl-4 text-xs text-[#3530B8] font-bold">{item.requestedTime}</td>
                        <td className="py-4 pl-9 text-xs text-slate-500 w-130 truncate" title={item.reason}>
                          {item.reason}
                        </td>
                        <td className="py-4 text-xs text-slate-600 font-medium">{item.manager}</td>
                        <td className="py-4 pl-13">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === '대기' ? 'bg-[#FFF9F0] text-[#FF9800]' :
                            item.status === '승인' ? 'bg-[#F0FDF4] text-[#10B981]' :
                            'bg-[#FFF0F0] text-[#FF4D4F]'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="px-3 py-1 text-[10px] font-bold text-[#10B981] bg-white border border-[#10B981] rounded-lg hover:bg-[#F0FDF4] transition-all cursor-pointer">
                          승인
                        </button>
                        <button className="px-3 py-1 text-[10px] font-bold text-[#FF4D4F] bg-white border border-[#FF4D4F] rounded-lg hover:bg-[#FFF0F0] transition-all cursor-pointer">
                          반려
                        </button>
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
            count={5} // 예시 페이지 수
            page={currentPage}
            onChange={handlePageChange}
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
