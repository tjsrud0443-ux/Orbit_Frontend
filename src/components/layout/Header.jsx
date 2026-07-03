import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';
import useNotificationStore from '../../store/useNotificationStore';
import { useEffect, useRef, useState } from 'react';
import { getMyNotiList, getNotiDocType, getNotiProjectSeq, updateReadNoti } from '../../api/notificationApi';
import { toast } from 'react-toastify';

const Header = ({ onMenuClick }) => {
  const token = useAuthStore(state => state.token);
  const user = useUserStore(state => state.user);
  const notifications = useNotificationStore(state => state.notifications);
  const setNotifications = useNotificationStore(state => state.setNotifications);
  const readNoti = useNotificationStore(state => state.readNoti);

  const navi = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const notiTypeLabel = {
    PROJECT: "[프로젝트]",
    TASK: "[업무]",
    TASK_DELETE: "[업무 삭제]",
    MEETING: "[회의]",
    APPROVAL: "[결재 요청]",
    APPROVED: "[결재 승인]",
    REJECTED: "[결재 반려]"
  };

  // 타입별 라벨 색상
  const notiTypeColor = {
    PROJECT: "text-blue-600",
    TASK: "text-amber-600",
    TASK_DELETE: "text-slate-500",
    MEETING: "text-purple-600",
    APPROVAL: "text-slate-600",
    APPROVED: "text-green-600",
    REJECTED: "text-red-600",
  };

  // 타입별 점(dot) 색상
  const notiDotColor = {
    PROJECT: "bg-blue-500",
    TASK: "bg-amber-500",
    TASK_DELETE: "bg-slate-400",
    MEETING: "bg-purple-500",
    APPROVAL: "bg-slate-400",
    APPROVED: "bg-green-500",
    REJECTED: "bg-red-500",
  };

  useEffect(() => {
    getMyNotiList().then(resp => {
      setNotifications(resp.data);
    });
  }, [setNotifications]);

  // 바깥 영역 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setOpen(prev => !prev);
  }

  const handleNotiClick = async (noti) => {
    setOpen(false); // 알림 클릭 시 드롭다운 닫기

    try {
      if (noti.read_yn === "N") {
        await updateReadNoti(noti.noti_seq);
        readNoti(noti.noti_seq);
      }

      switch (noti.ref_type) {

        // 프로젝트 알림
        case "PROJECT":
          navi(`/projects?projectSeq=${noti.ref_seq}`);
          break;

        // 칸반 담당자 지정 알림
        case "TASK":
          const projectResp = await getNotiProjectSeq(noti.ref_seq);
          const projectSeq = projectResp.data;

          if (!projectSeq) {
            toast.warning("삭제되었거나 접근할 수 없는 업무입니다.");
            return;
          }

          navi(`/kanban/${projectSeq}?taskSeq=${noti.ref_seq}`);
          break;

        case "TASK_DELETE":
          break;

        // 결재 요청 알림
        case "APPROVAL":
        case "APPROVED":
        case "REJECTED":
          const DocTypeResp = await getNotiDocType(noti.ref_seq);
          const docType = DocTypeResp.data;

          if (!docType) {
            toast.warning("삭제되었거나 접근할 수 없는 결재 문서입니다.");
            return;
          }

          navi(`/approval/detail/${docType}/${noti.ref_seq}`);
          break;

        // 미팅 참석 알림
        case "MEETING":
          navi(`/calendar`);
          break;

        default:
          break;

      }
    } catch (e) {
      console.error(e);
      toast.warning("삭제되었거나 접근할 수 없는 알림입니다.");
    }
  }

  const noReadCount = notifications.filter(
    noti => noti.read_yn === "N").length;

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center
      justify-between lg:justify-end px-4 lg:px-6 shrink-0">

      <button
        className="p-2 lg:hidden text-slate-600 hover:bg-slate-50 rounded-md"
        onClick={onMenuClick}
      >☰</button>

      <div className="flex items-center gap-4 lg:gap-5 text-slate-500">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleBellClick}
            className="relative hover:text-slate-800 cursor-pointer"
          >
            <FontAwesomeIcon
              icon={faBell}
              className="text-lg text-slate-500"
            />

            {noReadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center
                  bg-red-500 text-[9px] text-white font-bold px-1 rounded-full">
                {noReadCount > 99 ? '99+' : noReadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute top-11 right-[-120px] md:right-0 w-70 md:w-80 bg-white border border-slate-200
              rounded-xl shadow-lg z-50 overflow-hidden">

              {/* 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800">알림</span>
                <span className="text-xs text-slate-400">안 읽음 {noReadCount}건</span>
              </div>

              {/* 목록 (최대 5개 노출 후 스크롤) */}
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-400">
                  새로운 알림이 없습니다.
                </div>
              ) : (
                <div className="max-h-[380px] overflow-y-auto
                      [scrollbar-width:thin] 
                      [scrollbar-color:#e2e8f0_transparent]
                      [&::-webkit-scrollbar]:w-1.5
                      [&::-webkit-scrollbar-track]:bg-transparent
                      [&::-webkit-scrollbar-thumb]:bg-slate-200
                      [&::-webkit-scrollbar-thumb]:rounded-full
                      hover:[&::-webkit-scrollbar-thumb]:bg-slate-100">
                  {notifications.map(noti => (
                    <button
                      key={noti.noti_seq}
                      onClick={() => handleNotiClick(noti)}
                      className="w-full h-[76px] text-left flex items-center gap-3 px-4
                        border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                    >
                      {/* 타입별 점 */}
                      <span
                        className={`shrink-0 w-2 h-2 rounded-full ${notiDotColor[noti.noti_type] || 'bg-slate-400'}`}
                      />

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span
                          className={`text-[11px] font-semibold ${notiTypeColor[noti.noti_type] || 'text-slate-600'}`}
                        >
                          {notiTypeLabel[noti.noti_type] || noti.noti_type}
                        </span>
                        <p className="text-sm text-slate-700 truncate">
                          {noti.content}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {noti.created_at}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Link
          to="/mypage"
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg
            hover:bg-slate-50 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center
            font-bold text-sm text-slate-600 overflow-hidden shrink-0
            group-hover:ring-2 group-hover:ring-[#DDE8FF]">
            {
              user?.sysname && <img
                src={`https://api.sukong.shop/file/profile/view?sysname=${user?.sysname}&token=${token}`}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            }
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 group-hover:text-[#3530B8]">{user?.name}</span>
            <p className="text-[10px] text-slate-400 -mt-0.5">{user?.dept_name}</p>
          </div>
        </Link>
      </div>
    </header>
  );
};
export default Header;
