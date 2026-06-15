import React, { useState, useEffect, useRef } from 'react';
import { getMyCheckoutList, insertCheckoutReq } from './mainApi';
import TimePicker from '../../components/common/TimePicker';

const CheckoutCorrectionModal = ({ onClose }) => {
  const [attendanceList, setAttendanceList] = useState([]);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [requestedTime, setRequestedTime] = useState('');
  const [reason, setReason] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const formatCheckOut = (checkOut) => {
    if (!checkOut) return '미기록';
    const cleaned = checkOut.replace('T', ' ').split('.')[0];
    const d = new Date(cleaned);
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  };

  useEffect(() => {
    getMyCheckoutList()
      .then(resp => {
        const sorted = (resp.data || []).sort((a, b) => new Date(b.work_date) - new Date(a.work_date));
        setAttendanceList(sorted);
      })
      .catch(err => console.error('목록 로드 실패:', err));
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAttendance = (a) => {
    setSelectedAttendance(a);
    setIsDropdownOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedAttendance || !requestedTime) {
      alert('정정할 날짜와 시간을 모두 선택해주세요.');
      return;
    }
    const formatted = `${selectedAttendance.work_date} ${requestedTime}:00`;
    const data = {
      attendance_seq: selectedAttendance.attendance_seq,
      checkout_date: selectedAttendance.check_out.replace('T', ' ').split('.')[0],
      req_check_out: formatted,
      reason,
    };
    console.log(selectedAttendance.work_date);
    insertCheckoutReq(data).then(() => {
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
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px; /* 여백 확보를 위해 조금 더 넓힘 */
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E5E7EB;
          border-radius: 10px;
          border: 3px solid white; /* 여백을 2px에서 3px로 증가 */
          background-clip: padding-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #D1D5DB;
        }
      `}</style>
      <div
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">퇴근 정정 신청</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* 커스텀 드롭다운 */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">정정 대상 날짜</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full px-4 py-3 border rounded-2xl text-sm flex justify-between items-center bg-white transition-all
                    ${isDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 hover:border-indigo-300'}`}
                >
                  <span className={selectedAttendance ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {selectedAttendance
                      ? `${formatDate(selectedAttendance.work_date)}`
                      : '정정할 날짜를 선택하세요'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                    <div className="max-h-52 overflow-y-auto custom-scrollbar py-2">
                      {attendanceList.length === 0 ? (
                        <div className="px-4 py-4 text-sm text-gray-400 text-center">기록이 없습니다</div>
                      ) : (
                        attendanceList.map((a, idx) => (
                          <button
                            key={a.attendance_seq}
                            type="button"
                            onClick={() => handleSelectAttendance(a)}
                            className={`w-full px-4 py-3 text-left flex justify-between items-center transition-colors
                              ${selectedAttendance?.attendance_seq === a.attendance_seq
                                ? 'bg-indigo-50'
                                : 'hover:bg-gray-50'}
                              ${idx !== attendanceList.length - 1 ? 'border-b border-gray-50' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${a.check_out ? 'bg-emerald-400' : 'bg-rose-300'}`} />
                              <span className={`text-sm font-semibold ${selectedAttendance?.attendance_seq === a.attendance_seq ? 'text-indigo-700' : 'text-gray-700'}`}>
                                {formatDate(a.work_date)}
                              </span>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-xl font-bold ${a.check_out ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-400'}`}>
                              {formatCheckOut(a.check_out)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 실제 퇴근시간 + 정정 요청시간 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">실제 퇴근 시간</label>
                <input
                  type="text"
                  value={selectedAttendance ? formatCheckOut(selectedAttendance.check_out) : '기록 없음'}
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-500 font-medium"
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">정정 요청 시간</label>
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
                placeholder="정정 사유를 입력해주세요. (최대 330자)"
                value={reason}
                onChange={(e) => {
                  if (e.target.value.length <= 330) setReason(e.target.value);
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all custom-scrollbar py-3"
              />
              <p className={`text-right text-[10px] mt-1 ${reason.length >= 300 ? 'text-red-400' : 'text-gray-400'}`}>
                {reason.length} / 330자
              </p>
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