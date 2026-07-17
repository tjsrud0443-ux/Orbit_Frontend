import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse, faFolderOpen, faCalendar, faComments, faBuilding
} from '@fortawesome/free-regular-svg-icons';
import {
  faSitemap, faFileSignature, faDiagramProject,
  faRobot, faChevronDown, faChevronUp,
  faSliders, faUserShield, faAddressCard, faDesktop,
  faFileShield, faUserCheck, faFilePen
} from '@fortawesome/free-solid-svg-icons';
import useAuthStore from '../../store/authStore';
import { IMAGES } from '../../images/images';
import useUserStore from '../../store/userStore';
import useDepartmentsStore from '../../store/useDepartmentsStore';

// 직원 사이드바
const generalMenuItems = [
  { name: '홈', path: '/main', icon: faHouse },
  { name: '조직도', path: '/departments', icon: faSitemap },
  {
    name: '전자 결재',
    path: '/approval',
    navigateOnClick: true,
    icon: faFileSignature,
    subItems: [
      { name: '내가 올린 기안', path: '/approvalMypage' },
      { name: '내가 결재할 기안', path: '/approvalInbox' },
      { name: '참조 문서함', path: '/approvalCc' },
      { name: '임시 문서함', path: '/approvalTemp' },
    ]
  },
  {
    name: '인사 관리',
    icon: faAddressCard,
    authGroups: ['ROLE_HR_ADMIN'],
    subItems: [
      { name: '직원 관리', path: '/adminUsers' },
      { name: '부서 관리', path: '/adminDepartments' },
      { name: '직급 관리', path: '/adminRank' },
      { name: '회원가입 관리', path: '/adminSignup' },
      { name: '근태 관리', path: '/adminAttendance' },
      { name: '연차 관리', path: '/adminLeave' }
    ]
  },
  {
    name: '자산 관리',
    icon: faDesktop,
    authGroups: ['ROLE_GA_ADMIN'],
    subItems: [
      { name: '비품 관리', path: '/adminSupply' },
      { name: '비품 신청 관리', path: '/adminSupplyRequest' },
      { name: '비품 대여이력 관리', path: '/adminSupplyRental' },
      { name: '회의실 관리', path: '/adminMeetingRoom' },
    ]
  },
  {
    name: '일정 · 회의',
    icon: faCalendar,
    subItems: [
      { name: '캘린더', path: '/calendar' },
      { name: '회의록', path: '/meetingMinutes' },
      { name: '회의실 예약', path: '/meetingRooms' },
    ]
  },
  {
    name: '신청 · 자료',
    icon: faFolderOpen,
    subItems: [
      { name: '비품 신청', path: '/supply' },
      { name: '증명서 발급', path: '/certificate' },
      { name: '자료실', path: '/documents' }
    ]
  },
  { name: '프로젝트 관리', path: '/projects', icon: faDiagramProject },
  { name: '사내 게시판', path: '/board', icon: faComments },
  { name: 'AI 챗봇', path: '/aiChat', icon: faRobot },
  {
    name: '문서 · AI 관리',
    icon: faFileShield,
    subItems: [
      { name: '문서 관리', path: '/adminDocument' },
      { name: 'AI 미답변 질문 관리', path: '/adminQna' }
    ]
  }
];

// 관리자 사이드바
const adminMenuItems = [
  { name: '관리자 홈', path: '/adminMain', icon: faHouse },
  { name: '회사 정보', path: '/adminCompanyInfo', icon: faBuilding },
  {
    name: '인사 관리',
    icon: faAddressCard,
    subItems: [
      { name: '직원 관리', path: '/adminUsers' },
      { name: '부서 관리', path: '/adminDepartments' },
      { name: '직급 관리', path: '/adminRank' },
      { name: '회원가입 관리', path: '/adminSignup' },
      { name: '근태 관리', path: '/adminAttendance' },
      { name: '연차 관리', path: '/adminLeave' }
    ]
  },
  {
    name: '자산 관리',
    icon: faDesktop,
    subItems: [
      { name: '비품 관리', path: '/adminSupply' },
      { name: '비품 신청 관리', path: '/adminSupplyRequest' },
      { name: '비품 대여이력 관리', path: '/adminSupplyRental' },
      { name: '회의실 관리', path: '/adminMeetingRoom' }
    ]
  },
  {
    name: '문서 · AI 관리',
    icon: faFileShield,
    subItems: [
      { name: '문서 관리', path: '/adminDocument' },
      { name: 'AI 미답변 질문 관리', path: '/adminQna' },
    ]
  },
  { name: '결재선 관리', path: '/adminApprovalLine', icon: faUserCheck },
  { name: '페이지 안내 문구 관리', path: '/adminPageInfo', icon: faFilePen }
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navi = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const [openMenuName, setOpenMenuName] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const user = useUserStore(state => state.user);
  const clearDepartments = useDepartmentsStore(state => state.clearAll);

  const currentMenuPool = isAdminMode ? adminMenuItems : generalMenuItems;

  const handleLogout = () => {
    clearDepartments();
    logout();
    navi("/");
  }

  const handleToggleMenu = (menuName) => {
    setOpenMenuName(prev => prev === menuName ? null : menuName);
  };

  const isAdminUser = user?.auth_group === 'ROLE_SUPER_ADMIN';

  const hasMenuAccess = (item) => {
    if (isAdminMode) {
      return isAdminUser;
    }

    if (item.authGroups) {
      return item.authGroups.includes(user?.auth_group);
    }

    if (item.rank) {
      return item.rank.includes(user?.rank_name);
    }

    return true;
  };

  const filteredMenuItems = currentMenuPool.filter(hasMenuAccess);

  const isPathActive = (path) => {
    if (!path) return false;

    if (path === '/projects') {
      return location.pathname === '/projects' || location.pathname.startsWith('/kanban/');
    }

    if (path === '/approval') {
      return location.pathname === '/approval'
        || location.pathname.startsWith('/approval/write/')
        || location.pathname.startsWith('/approval/detail/');
    }

    return location.pathname === path;
  };

  useEffect(() => {
    const currentActiveMenu = filteredMenuItems.find(item => {
      if (!item.subItems) {
        return false;
      }

      const isParentActive =
        item.navigateOnClick &&
        item.path &&
        isPathActive(item.path);

      const isChildActive =
        item.subItems.some(sub => isPathActive(sub.path));

      return isParentActive || isChildActive;
    });

    if (currentActiveMenu) {
      setOpenMenuName(currentActiveMenu.name);
    } else {
      setOpenMenuName(null);
    }
  }, [
    location.pathname,
    isAdminMode,
    user?.auth_group,
    user?.rank_name,
    user?.role
  ]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-[#F8FAFC] border-r border-slate-200
        flex flex-col py-4 pl-3 pr-4 shrink-0 h-full transition-transform duration-300
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">

          <div className="relative flex items-center justify-between mb-1 py-2 pl-1">
            <div className="flex items-center gap-2">
              <Link to="/main"><img src={IMAGES.ORBTI_LOGO} alt="Orbit Logo" className="w-12 h-12 object-contain" /></Link>
              <Link to="/main"><img src={IMAGES.ORBTI_TITLE} alt="Orbit" className="h-6 object-contain mt-1" /></Link>
            </div>
            {isAdminMode && (
              <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded border border-red-200 mr-1">
                Admin
              </span>
            )}
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {filteredMenuItems.map((item, idx) => {
              if (item.subItems) {
                const isSubItemActive = item.subItems.some(sub => isPathActive(sub.path));
                const isCurrentMenuOpen = openMenuName === item.name;

                return (
                  <div key={idx} className="flex flex-col">
                    <button
                      onClick={() => {
                        if (item.navigateOnClick && item.path) {
                          setOpenMenuName(item.name);
                          if (location.pathname !== item.path) {
                            navi(item.path);
                          }
                          onClose?.();
                          return;
                        }
                        handleToggleMenu(item.name);
                      }}
                      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full cursor-pointer
                        ${isSubItemActive
                          ? 'bg-[#DDE8FF] text-[#3530B8] font-bold'
                          : 'text-slate-600 hover:bg-[#DDE8FF] hover:text-[#3530B8] font-semibold'}`}>
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      <FontAwesomeIcon icon={isCurrentMenuOpen ? faChevronUp : faChevronDown} className="w-3 h-3" />
                    </button>

                    {isCurrentMenuOpen && (
                      <div className="mt-1 ml-4 border-l-2 border-slate-100 pl-4 space-y-1">
                        {item.subItems.map((sub, subIdx) => {
                          const isCurrent = isPathActive(sub.path);
                          return (
                            <Link
                              key={subIdx}
                              to={sub.path}
                              onClick={onClose}
                              className={`block py-1.5 text-xs transition-all
                                ${isCurrent
                                  ? 'text-[#3530B8] font-bold'
                                  : 'text-slate-500 hover:text-[#3530B8] font-medium'}`}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isCurrent = isPathActive(item.path);
              return (
                <Link
                  key={idx}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                    ${isCurrent
                      ? 'bg-[#DDE8FF] text-[#3530B8] font-bold'
                      : 'text-slate-600 hover:bg-[#DDE8FF] hover:text-[#3530B8] font-semibold'}`}
                >
                  <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 pt-3 border-t border-slate-100 shrink-0 space-y-1.5">
            {user?.auth_group === 'ROLE_SUPER_ADMIN' && (
              <button
                onClick={() => {
                  const nextAdminMode = !isAdminMode;
                  setIsAdminMode(nextAdminMode);
                  setOpenMenuName(null);
                  navi(nextAdminMode ? '/adminMain' : '/main');
                }}
                className={`flex items-center justify-center gap-2 w-full px-2 py-2 text-xs font-bold hover:border-[#3530B8] transition-colors cursor-pointer border rounded-lg
                  ${isAdminMode
                    ? ' text-white bg-[#3530B8]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-[#3530B8]'}`}
              >
                <FontAwesomeIcon icon={isAdminMode ? faSliders : faUserShield} className="text-sm" />
                {isAdminMode ? '일반 사내페이지 전환' : '관리자페이지 전환'}
              </button>
            )}

            <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-2 py-2 text-xs font-medium text-slate-400 hover:text-[#3530B8] hover:border-[#3530B8] transition-colors cursor-pointer border border-slate-200 rounded-lg bg-transparent">
              로그아웃
            </button>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
        `}} />
      </aside>
    </>
  );
};

export default Sidebar;