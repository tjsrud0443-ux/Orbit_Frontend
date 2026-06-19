// DraftModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const DraftModal = ({ onClose }) => {
  const navi = useNavigate();

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-2xl aspect-square md:aspect-auto rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-10 md:p-10 pt-14 pb-14 px-10">
          <div className="flex justify-between items-center mb-5 md:mb-8">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">어떤 양식으로 작성하시겠어요?</h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5 md:gap-6 max-w-[280px] md:max-w-none mx-auto">
            {draftForms.map((form, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  onClose();
                  navi(form.path);
                }}
                className={`${form.color} p-4 md:p-8 rounded-2xl md:rounded-[2rem] cursor-pointer hover:scale-[1.03] hover:shadow-xl transition-all border border-black/5 flex flex-col items-center text-center aspect-square justify-center group`}
              >
                <div className={`${form.iconBg} ${form.iconColor} w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-3xl flex items-center justify-center mb-2 md:mb-5 shadow-sm group-hover:scale-110 transition-transform`}>
                  <div className="scale-75 md:scale-100">{form.icon}</div>
                </div>
                <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-1 md:mb-2">{form.title}</h3>
                <p className="hidden md:block text-xs font-bold text-gray-500 leading-relaxed whitespace-pre-line">
                  {form.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};

export default DraftModal;