import React from 'react';
import approval_img from '../../assets/approval_img.png';
import { useNavigate } from 'react-router-dom';

const ApprovalHome = () => {

  const navi = useNavigate();
  const [isDraftModalOpen, setIsDraftModalOpen] = React.useState(false);

  const recentDocuments = [
    { title: '2026년 상반기 성과급 지급 신청의 건', type: '지출결의서', date: '2026-05-25', status: '진행 중', approver: '김철수 팀장' },
    { title: '신규 프로젝트 "오르빗" 서버 도입 기안', type: '품의서', date: '2026-05-24', status: '결재 대기', approver: '이영희 본부장' },
    { title: '6월 부서 운영비 정기 집행 요청', type: '지출결의서', date: '2026-05-24', status: '결재 완료', approver: '박지민 대표' },
    { title: '비품(노트북 및 모니터) 교체 신청', type: '품의서', date: '2026-05-23', status: '반려', approver: '최유진 팀장' },
    { title: '여름 시즌 마케팅 캠페인 예산 상신', type: '지출결의서', date: '2026-05-21', status: '결재 완료', approver: '박지민 대표' }
  ];

  const statusItems = [
    { 
      label: '결재 대기', 
      count: 5, 
      desc: '내가 결재할 문서', 
      color: 'amber',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      label: '진행 중', 
      count: 3, 
      desc: '결재 진행 중인 문서', 
      color: 'blue',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 11.5L20 4l-7.5 16-2.5-6L4 11.5z" />
        </svg>
      )
    },
    { 
      label: '결재 완료', 
      count: 12, 
      desc: '최종 승인된 문서', 
      color: 'green',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    { 
      label: '반려', 
      count: 1, 
      desc: '반려 처리된 문서', 
      color: 'red',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 10h10a5 5 0 015 5v1a2 2 0 01-2 2H5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M7 6L3 10l4 4" />
        </svg>
      )
    }
  ];

  const cardStyles = {
    amber: { bg: 'bg-[#FFF9F0]/80', border: 'border-[#FFECB3]/80', iconBg: 'bg-[#FFECB3]/40', text: 'text-[#FF9800]', icon: 'text-[#FF9800]' },
    blue: { bg: 'bg-[#F0F7FF]/80', border: 'border-[#D1E9FF]/80', iconBg: 'bg-[#D1E9FF]/40', text: 'text-[#007BFF]', icon: 'text-[#007BFF]' },
    green: { bg: 'bg-[#F0FDF4]/80', border: 'border-[#BBF7D0]/80', iconBg: 'bg-[#BBF7D0]/40', text: 'text-[#10B981]', icon: 'text-[#10B981]' },
    red: { bg: 'bg-[#FFF1F0]/80', border: 'border-[#FFCCC7]/80', iconBg: 'bg-[#FFCCC7]/40', text: 'text-[#FF4D4F]', icon: 'text-[#FF4D4F]' }
  };

  const handleAllDoc = () => {
    navi("/approvalMypage");
  }

  const draftForms = [
    { 
      title: '휴가신청서', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      desc: '연차, 반차 등\n휴가 신청을 위한 양식',
      color: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-500',
      path: '/approval/write/vacation'
    },
    { 
      title: '지출결의서', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      desc: '업무 관련 지출에 대한\n결의 및 비용 처리 양식',
      color: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
      path: '/approval/write/payment'
    },
    { 
      title: '일반품의서', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      desc: '업무 진행 및 운영 관련 등\n다양한 사항에 대한 승인 요청 양식',
      color: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-500',
      path: '/approval/write/general'
    },
    { 
      title: '구매신청서', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      desc: '비품 및 업무용 물품 구매를 위한\n신청 및 승인 요청 양식',
      color: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-500',
      path: '/approval/write/purchase'
    }
  ];

  return (
    <div className="p-4 md:p-8 font-sans bg-white min-h-screen overflow-hidden relative">
      
      {/* Draft Selection Modal */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">어떤 양식으로 작성하시겠어요?</h2>
                <button 
                  onClick={() => setIsDraftModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {draftForms.map((form, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setIsDraftModalOpen(false);
                      navi(form.path);
                    }}
                    className={`${form.color} p-8 rounded-[2rem] cursor-pointer hover:scale-[1.03] hover:shadow-xl transition-all border border-black/5 flex flex-col items-center text-center aspect-square justify-center group`}
                  >
                    <div className={`${form.iconBg} ${form.iconColor} w-16 h-16 rounded-3xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform`}>
                      {form.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{form.title}</h3>
                    <p className="text-xs font-bold text-gray-500 leading-relaxed whitespace-pre-line">
                      {form.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Overlay click to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setIsDraftModalOpen(false)}></div>
        </div>
      )}

      <div className="max-w-[100rem] mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex-shrink-0 px-2">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">전자결재 홈</h1>
          <p className="text-sm text-gray-500 font-medium">
            전자결재 현황을 한눈에 확인하고 빠르게 업무를 처리하세요.
          </p>
        </div>

        {/* Dashboard Top Area */}
        <div className="flex flex-col xl:flex-row gap-4 items-stretch">
          
          {/* Status Grid (75%) */}
          <div className="xl:w-3/4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusItems.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => navi(item.label === '결재 대기' ? '/approvalInbox' : '/approvalMypage')}
                className={`${cardStyles[item.color].bg} ${cardStyles[item.color].border} p-5 rounded-[2rem] border-2 shadow-sm flex flex-col justify-between transition-all hover:shadow-md cursor-pointer group`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${cardStyles[item.color].iconBg} flex items-center justify-center flex-shrink-0`}>
                    <div className={cardStyles[item.color].icon}>{item.icon}</div>
                  </div>
                  <div className="flex flex-col items-start translate-x-1">
                    <span className="text-[0.8125rem] font-bold text-gray-800 mb-1">{item.label}</span>
                    <span className={`text-3xl font-bold ${cardStyles[item.color].text}`}>
                      {item.count}<span className="text-sm font-bold ml-1">건</span>
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center">
                  <p className="text-[0.6875rem] font-bold text-gray-400">{item.desc}</p>
                  <span className="text-gray-300 font-bold text-base group-hover:text-gray-500 transition-colors">&gt;</span>
                </div>
              </div>
            ))}
          </div>

          {/* New Draft Box (25%) */}
          <div className="xl:w-1/4 bg-[#3530B8] rounded-[2rem] p-6 shadow-xl shadow-[#3530B8]/20 flex relative overflow-hidden group hover:bg-[#2a2594] transition-all min-h-[160px]">
             <div className="flex flex-col justify-between h-full z-10 w-full">
                <div>
                  <h2 className="text-white text-lg font-bold mb-1.5">새 기안 작성</h2>
                  <p className="text-white/60 text-[0.6875rem] font-medium leading-relaxed">
                    문서를 새로 작성하여 결재를 요청하세요.
                  </p>
                </div>
                <button 
                  onClick={() => setIsDraftModalOpen(true)}
                  className="bg-white text-[#3530B8] py-2 px-4 rounded-xl font-bold text-[0.6875rem] flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors w-fit shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  기안 작성하기
                </button>
             </div>
             {/* Illustration Image */}
             <div className="absolute -right-4 -bottom-6 w-36 h-36 opacity-90 group-hover:scale-110 transition-transform duration-500 ease-out pointer-events-none">
                <img src={approval_img} alt="Approval Illustration" className="w-full h-full object-contain filter drop-shadow-2xl" />
             </div>
          </div>
        </div>

        {/* Recent Documents Area */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex-1 h-[28.75rem] mb-4 flex flex-col">
          <div className="p-6 px-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-900">최근 문서 목록</h2>
            <button 
              onClick={handleAllDoc}
              className="text-xs font-bold text-[#3530B8] bg-[#F0F4FF] px-4 py-2 rounded-lg hover:bg-[#3530B8] hover:text-white transition-all">
              전체보기
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 px-10 py-4 border-b border-gray-50 text-[0.8125rem] font-bold text-gray-400 bg-gray-50/10 flex-shrink-0">
            <div className="col-span-4">제목</div>
            <div className="col-span-2 text-center">문서 종류</div>
            <div className="col-span-2 text-center">기안일</div>
            <div className="col-span-2 text-center">결재 상태</div>
            <div className="col-span-2 text-center">현재 결재자</div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* --- 데이터 매핑 시작 위치 --- */}
            {
              recentDocuments.map((doc, idx) => (
                <div key={idx} className="grid grid-cols-12 px-10 py-5 border-b border-gray-50 items-center hover:bg-gray-50/50 transition-colors cursor-pointer group">
                  <div className="col-span-4 text-sm font-bold text-gray-700 group-hover:text-[#3530B8] transition-colors truncate pr-4">
                    {doc.title}
                  </div>
                  <div className="col-span-2 text-center text-xs font-medium text-gray-500">
                    {doc.type}
                  </div>
                  <div className="col-span-2 text-center text-xs font-medium text-gray-400">
                    {doc.date}
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`px-2.5 py-0.5 text-[0.625rem] font-bold rounded-full ${
                      doc.status === '진행 중' ? 'bg-blue-50 text-blue-600' :
                      doc.status === '결재 대기' ? 'bg-amber-50 text-amber-600' :
                      doc.status === '결재 완료' ? 'bg-green-50 text-green-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                      <svg className="w-full h-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-gray-600 truncate">{doc.approver}</span>
                  </div>
                </div>
              ))
            }
            
            {/* Empty State (데이터가 없을 때만 표시) */}
            {recentDocuments.length === 0 && (
              <div className="p-20 flex flex-col items-center justify-center text-gray-400">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-gray-300 tracking-tight">최근에 상신하거나 수신한 문서가 없습니다.</p>
              </div>
            )}
            {/* --- 데이터 매핑 끝 위치 --- */}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ApprovalHome;
