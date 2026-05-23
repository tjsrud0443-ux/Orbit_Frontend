import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse, faFolderOpen, faCalendar,
  faFileLines, faComments
} from '@fortawesome/free-regular-svg-icons';
import {
  faSitemap, faFileSignature, faDiagramProject,
  faDoorOpen, faRobot, faBox
} from '@fortawesome/free-solid-svg-icons';

const menuItems = [
  { name: '홈',            path: '/main',           icon: faHouse },
  { name: '조직도',        path: '/departments',    icon: faSitemap },
  { name: '전자 결재',     path: '/approval',       icon: faFileSignature },
  { name: '프로젝트 관리', path: '/projects',       icon: faDiagramProject },
  { name: '자료실',        path: '/documents',      icon: faFolderOpen },
  { name: '캘린더',        path: '/calendar',       icon: faCalendar },
  { name: '회의록',        path: '/meetingMinutes', icon: faFileLines },
  { name: '회의실 예약',   path: '/meetingRooms',   icon: faDoorOpen },
  { name: '비품 신청',     path: '/supply',         icon: faBox },
  { name: '사내 게시판',   path: '/board',          icon: faComments },
  { name: 'AI 챗봇',      path: '/aiChat',          icon: faRobot },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-48 bg-white border-r border-slate-200
        flex flex-col p-3 shrink-0 h-full transition-transform duration-300
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-6 h-6 bg-[#3530B8] rounded-md flex items-center justify-center font-black text-white text-xs">M</div>
              <span className="text-base font-bold text-slate-900 tracking-tight">Orbit</span>
            </div>
            <button
              className="p-2 lg:hidden text-slate-400 hover:text-slate-800"
              onClick={onClose}
            >✕</button>
          </div>

          <nav className="space-y-0.5 flex-1 overflow-y-auto pr-1">
            {menuItems.map((item, idx) => {
              const isCurrent = location.pathname === item.path;
              return (
                <Link
                  key={idx}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-all
                    ${isCurrent
                      ? 'bg-[#DDE8FF] text-[#3530B8] font-bold'
                      : 'text-slate-600 hover:bg-[#DDE8FF] hover:text-[#3530B8] font-semibold'}`}
                >
                  <FontAwesomeIcon icon={item.icon} className="w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-2 pt-3 border-t border-slate-100 shrink-0">
            <button className="flex items-center justify-center gap-2 w-full px-2 py-1.5
              text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors
              cursor-pointer border border-slate-200 rounded-lg bg-white">
              로그아웃
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;