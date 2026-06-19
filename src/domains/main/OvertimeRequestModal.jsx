import React, { useState, useEffect } from 'react';
import { maxios } from '../../api/axiosConfig';
import Calendar from '../../components/common/Calendar';
import TimePicker from '../../components/common/TimePicker';
import { getMyCheckinList, insertOvertimeReq } from './mainApi';
import { alertWarning, alertSuccess, alertError } from '../../utils/alert';

const OvertimeRequestModal = ({ onClose }) => {
  const [date, setDate] = useState('');
  const [startTime] = useState('18:00');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 출근 기록 조회
  useEffect(() => {
    getMyCheckinList(yearMonth).then((resp) => {
      const map = {};
      resp.data.forEach((item) => {
        map[item.WORK_DATE] = item.ATTENDANCE_SEQ;
      });
      setAttendanceMap(map);
    }).catch((err) => {
        console.error('출근 기록 조회 실패:', err);
      });
  }, [yearMonth]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !endTime) {
      alertWarning('정보 미입력', '날짜와 시간을 모두 선택해주세요.');
      return;
    }

    const attendanceSeq = attendanceMap[date];
    if (!attendanceSeq) {
      alertWarning('신청 불가', '출근 기록이 없는 날짜에는 신청이 불가합니다.');
      return;
    }

    insertOvertimeReq({
      attendance_seq: attendanceSeq,
      work_date: date,
      start_dt: `${date} ${startTime}:00`,
      end_dt: `${date} ${endTime}:00`,
      reason,
    }).then(() => {
        alertSuccess('신청 완료', '연장근무 신청이 완료되었습니다.');
        onClose();
      })
      .catch((err) => {
        console.error(err);
        alertError('오류 발생', '신청 중 오류가 발생했습니다.');
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
            <h2 className="text-xl font-bold text-gray-900">연장근무 신청</h2>
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
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">연장근무 일자</label>
              <div 
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm cursor-pointer flex justify-between items-center bg-white"
              >
                <span className={date ? 'text-gray-900' : 'text-gray-400'}>
                  {date || '날짜 선택'}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {showCalendar && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowCalendar(false)}
                  />
                  <div className="[&>div]:!top-full [&>div]:!bottom-auto [&>div]:!mt-1 [&>div]:!mb-0">
                    <Calendar 
                      value={date} 
                      onChange={(d) => {
                        if (attendanceMap[d]) {
                          setDate(d);
                        } else {
                          alertWarning('선택 불가', '출근 기록이 없는 날짜는 선택이 불가합니다.');
                        }
                      }} 
                      onClose={() => setShowCalendar(false)}
                      onMonthChange={(ym) => setYearMonth(ym)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">시작 시간</label>
                <input 
                  type="text" 
                  value={startTime}
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-500 font-medium"
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">종료 시간</label>
                <TimePicker
                  value={endTime}
                  onChange={(time) => setEndTime(time)}
                  placeholder="시간 선택"
                  disableMinutes={true} 
                  minHour={19}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">신청 사유</label>
              <textarea 
                required
                placeholder="연장근무 사유를 입력해주세요. (최대 30자)"
                value={reason}
                onChange={(e) => {
                  if (e.target.value.length <= 30) setReason(e.target.value);
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all custom-scrollbar py-3"
              />
              <p className={`text-right text-[10px] mt-1 ${reason.length >= 25 ? 'text-red-400' : 'text-gray-400'}`}>
                {reason.length} / 30자
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

export default OvertimeRequestModal;
