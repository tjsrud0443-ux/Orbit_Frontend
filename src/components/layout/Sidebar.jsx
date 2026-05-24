import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import OrbitLogo from '../../assets/Orbit_Logo.png';
import OrbitTitle from '../../assets/Orbit_title.png';
import {
  faHouse, faFolderOpen, faCalendar,
  faFileLines, faComments
} from '@fortawesome/free-regular-svg-icons';
import {
  faSitemap, faFileSignature, faDiagramProject,
  faDoorOpen, faRobot, faBox, faChevronDown, faChevronUp
} from '@fortawesome/free-solid-svg-icons';

const menuItems = [
  { name: '홈',            path: '/main',           icon: faHouse },
  { name: '조직도',        path: '/departments',    icon: faSitemap },
  { 
    name: '전자 결재', 
    icon: faFileSignature,
    subItems: [
      { name: '전자결재 홈',   path: '/approval' },
      { name: '나의 전자결재', path: '/approval/mypage' },
      { name: '결재할 문서함', path: '/approval/inbox' },
      { name: '참조 문서함',   path: '/approval/cc' },
      { name: '임시 문서함',   path: '/approval/temp' },
    ]
  },
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
  const [isApprovalOpen, setIsApprovalOpen] = useState(location.pathname.startsWith('/approval'));

  useEffect(() => {
    if (location.pathname.startsWith('/approval')) {
      setIsApprovalOpen(true);
    }
  }, [location.pathname]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-[#F8FAFC] border-r border-slate-200
        flex flex-col py-4 pl-3 pr-4 shrink-0 h-full transition-transform duration-300
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="relative flex items-center justify-start mb-1 py-2 pl-1">
            <div className="flex items-center gap-2">
              <img src={OrbitLogo} alt="Orbit Logo" className="w-12 h-12 object-contain" />
              <img src={OrbitTitle} alt="Orbit" className="h-6 object-contain mt-1" />
            </div>
          </div>
          <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
            {menuItems.map((item, idx) => {
              if (item.subItems) {
                const isSubItemActive = item.subItems.some(sub => location.pathname === sub.path);
                return (
                  <div key={idx} className="flex flex-col">
                    <button
                      onClick={() => setIsApprovalOpen(!isApprovalOpen)}
                      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full
                        ${isSubItemActive
                          ? 'bg-[#DDE8FF] text-[#3530B8] font-bold'
                          : 'text-slate-600 hover:bg-[#DDE8FF] hover:text-[#3530B8] font-semibold'}`}>
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      <FontAwesomeIcon icon={isApprovalOpen ? faChevronUp : faChevronDown} className="w-3 h-3" />
                    </button>
                    {isApprovalOpen && (
                      <div className="mt-1 ml-4 border-l-2 border-slate-100 pl-4 space-y-1">
                        {item.subItems.map((sub, subIdx) => {
                          const isCurrent = location.pathname === sub.path;
                          return (
                            <Link
                              key={subIdx}
                              to={sub.path}
                              onClick={onClose}
                              className={`block py-1.5 text-xs transition-all
                                ${isCurrent
                                  ? 'text-[#3530B8] font-bold'
                                  : 'text-slate-500 hover:text-[#3530B8] font-medium'}`}>
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isCurrent = location.pathname === item.path;
              return (
                <Link
                  key={idx}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                    ${isCurrent
                      ? 'bg-[#DDE8FF] text-[#3530B8] font-bold'
                      : 'text-slate-600 hover:bg-[#DDE8FF] hover:text-[#3530B8] font-semibold'}`}>
                  <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 pt-3 border-t border-slate-100 shrink-0">
            <button className="flex items-center justify-center gap-2 w-full px-2 py-2
              text-xs font-medium text-slate-400 hover:text-[#3530B8] hover:border-[#3530B8] 
              active:text-[#3530B8] active:border-[#3530B8] active:bg-[#DDE8FF] transition-colors
              cursor-pointer border border-slate-200 rounded-lg bg-transparent">
              로그아웃
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;