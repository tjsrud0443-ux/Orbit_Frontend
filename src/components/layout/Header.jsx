import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';
import useNotificationStore from '../../store/useNotificationStore';
import { useEffect, useState } from 'react';
import { getMyNotiList, getNotiDocType, getNotiProjectSeq } from '../../api/notificationApi';

const Header = ({ onMenuClick }) => {
  const token = useAuthStore(state => state.token);
  const user = useUserStore(state => state.user);
  const notifications = useNotificationStore(state => state.notifications);
  const setNotifications = useNotificationStore(state => state.setNotifications);
  const navi = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getMyNotiList().then(resp => {
      setNotifications(resp.data);
    });
  }, [setNotifications]);

  const handleBellClick = () => {
    setOpen(prev => !prev);
  }

  const handleNotiClick = async (noti) => {
    switch (noti.ref_type) {

      // 프로젝트 알림
      case "PROJECT":
        navi(`/projects?projectSeq=${noti.ref_seq}`);
        break;

      // 칸반 담당자 지정 알림
      case "TASK":
        const projectResp = await getNotiProjectSeq(noti.ref_seq);
        const projectSeq = projectResp.data;

        navi(`/kanban/${projectSeq}?taskSeq=${noti.ref_seq}`);
        break;

      // 결재 요청 알림
      case "APPROVAL":
      case "APPROVED":
      case "REJECTED":
        const DocTypeResp = await getNotiDocType(noti.ref_seq);
        const docType = DocTypeResp.data;
        
        navi(`/approval/detail/${docType}/${noti.ref_seq}`);
        break;

      // // 미팅 참석 알림
      // case "MEETING":
      //   toast(noti.content, {
      //     icon: () => "📅"
      //   });
      //   break;

      default:
        break;

    }
  }
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center
      justify-between lg:justify-end px-4 lg:px-6 shrink-0">

      <button
        className="p-2 lg:hidden text-slate-600 hover:bg-slate-50 rounded-md"
        onClick={onMenuClick}
      >☰</button>

      <div className="flex items-center gap-4 lg:gap-5 text-slate-500">
        <div className="relative">
          <button
            onClick={handleBellClick}
            className="relative hover:text-slate-800 cursor-pointer"
          >
            <FontAwesomeIcon
              icon={faBell}
              className="text-lg text-slate-500"
            />

            <span
              className="absolute -top-1 -right-1 bg-red-500 text-[8px] text-white font-bold px-1 rounded-full">
              {notifications.length}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 top-10 w-60 bg-white border rounded-lg shadow-1g z-50">
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  알림이 없습니다.
                </div>
              ) : (
                notifications.map(noti => (
                  <div key={noti.noti_seq} className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleNotiClick(noti)}>
                    <div className="font-medium">
                      {noti.noti_type}
                    </div>

                    <div className="text-sm">
                      {noti.content}
                    </div>

                    <div className="text-xs text-gray-400">
                      {noti.created_at}
                    </div>
                  </div>
                ))
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
            <img
              src={`http://localhost/file/profile/view?sysname=${user?.sysname}&token=${token}`}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
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