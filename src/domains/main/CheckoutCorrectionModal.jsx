import React, { useState } from 'react';
import { insertCheckoutReq } from './mainApi';
import Calendar from '../../components/common/Calendar';
import TimePicker from '../../components/common/TimePicker';

const CheckoutCorrectionModal = ({ onClose, checkOutTime, attendanceSeq }) => {
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [reason, setReason] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requestedDate || !requestedTime) {
      alert('날짜와 시간을 모두 선택해주세요.');
      return;
    }
    const formatted = `${requestedDate} ${requestedTime}:00`;
    
    const data = {
      attendance_seq: attendanceSeq,
      checkout_date: requestedDate,   // 'YYYY-MM-DD'
      req_check_out: formatted,      // 'YYYY-MM-DD HH:mm:ss'
      reason,
    };

    insertCheckoutReq(data)
      .then(() => {
        alert('퇴근 정정 신청이 완료되었습니다.');
        onClose();
      })
      .catch((err) => {
        console.error('퇴근 정정 신청 실패:', err);
        alert('신청 중 오류가 발생했습니다.');
      });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">퇴근 정정 신청</h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">실제 퇴근 시간</label>
              <input 
                type="text" 
                value={checkOutTime || '기록 없음'} 
                disabled 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">정정 날짜</label>
                <div 
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm cursor-pointer flex justify-between items-center bg-white"
                >
                  <span className={requestedDate ? 'text-gray-900' : 'text-gray-400'}>
                    {requestedDate || '날짜 선택'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {showCalendar && (
                  <Calendar 
                    value={requestedDate} 
                    onChange={(date) => setRequestedDate(date)} 
                    onClose={() => setShowCalendar(false)} 
                  />
                )}
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">정정 시간</label>
                <TimePicker
                  value={requestedTime}
                  onChange={(time) => setRequestedTime(time)}
                  placeholder="시간 선택"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">정정 사유</label>
              <textarea 
                required
                placeholder="정정 사유를 입력해주세요."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              ></textarea>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-[#3530B8] text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-[#2a2496] active:scale-[0.98] transition-all"
            >
              신청하기
            </button>
          </form>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};

export default CheckoutCorrectionModal;