import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faChevronRight,
  faChevronDown,
  faUsers,
  faUser,
  faLayerGroup,
  faBuilding,
  faSitemap,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { getGroup } from './departmentsApi';
import useAuthStore from '../../store/authStore';
import useLoadingStore from '../../store/useLoadingStore';

// // Position Rank for Sorting (Lower number = Higher rank)

const POSITION_RANK = {
  '대표이사': 1, '본부장': 3, '부서장': 4, '차장': 5, '과장': 6, '대리': 7, '사원': 8
};



const getRank = (pos) => POSITION_RANK[pos] || 99;

const OrgNode = ({ node, isChild = false }) => {
  const token = useAuthStore(state => state.token);

  const isMember = !!node.id;
  const isRoot = node.parentDeptSeq === null && !isMember;

  let displayNode = node;
  let subMembers = [...(node.members || [])].sort((a, b) => getRank(a.position) - getRank(b.position));
  let subDepts = [...(node.children || [])].sort((a, b) => (a.deptSeq - b.deptSeq));

  if (!isMember && subMembers.length > 0) {
    const [first, ...rest] = subMembers;
    displayNode = {
      ...first,
      deptName: node.deptName,
      parentDeptSeq: node.parentDeptSeq,
    };
    subMembers = rest;
  }

  const profileImg = displayNode.sysname || displayNode.sysName;

  return (
    <div className="flex flex-col items-center relative lg:scale-100 origin-top">
      {/* Node Card */}
      <div className={`
        relative z-10 flex items-center p-2.5 px-3 min-w-[150px] lg:p-1.5 lg:px-2.5 lg:min-w-[130px] rounded-lg border-2 transition-all gap-2 lg:gap-1.5
        ${isRoot
          ? 'bg-[#3530B8] border-[#3530B8] text-white shadow-lg scale-105'
          : 'bg-white border-[#DDE8FF] text-gray-800 shadow-sm hover:border-[#3530B8]'}
      `}>
        <div className={`
          w-9 h-9 lg:w-8 lg:h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden
          ${isRoot ? 'bg-white/20 text-white' : 'bg-[#F0F4FF] text-[#3530B8]'}
        `}>
          {profileImg ? (
            <img
              src={`http://localhost/file/profile/view?sysname=${profileImg}&token=${token}`}
              alt={displayNode.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <FontAwesomeIcon
              icon={isRoot && !isMember && !node.members?.length ? faBuilding : (isMember || displayNode.id ? faUser : faUsers)}
              className="text-xs lg:text-[10px]"
            />
          )}
        </div>
        <div className="text-left">
          <p className={`text-[10px] lg:text-[8px] opacity-70 mb-0 ${isRoot ? 'text-white' : 'text-[#3530B8] font-bold'}`}>
            {displayNode.deptName}
          </p>
          <p className="text-xs lg:text-[10px] font-extrabold leading-tight">
            {displayNode.name || (isRoot && !displayNode.id ? '본사' : '')}
          </p>
          <p className={`text-[9px] lg:text-[8px] mt-0 ${isRoot ? 'text-white/60' : 'text-gray-400'}`}>
            {displayNode.position || (displayNode.name ? '-' : '')}
          </p>
        </div>
      </div>

      {/* Children Section */}
      {(subMembers.length > 0 || subDepts.length > 0) && (
        <div className="flex flex-col items-center w-full">
          {/* 1. Members Chain (Straight Vertical) */}
          {subMembers.length > 0 && (
            <div className="flex flex-col items-center">
              {subMembers.map((member) => (
                <div key={member.id} className="flex flex-col items-center">
                  <div className="w-0.5 h-8 lg:h-5 bg-[#DDE8FF]" />
                  <OrgNode
                    node={{
                      ...member,
                      deptName: node.deptName,
                      parentDeptSeq: node.deptSeq,
                      children: []
                    }}
                    isChild={true}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 2. Sub-Departments (Horizontal Branching on Desktop, Vertical on Mobile) */}
          {subDepts.length > 0 && (
            <div className="flex flex-col items-center w-full">
              {/* Line down from parent to the branch */}
              <div className="w-0.5 h-8 lg:h-5 bg-[#DDE8FF]" />

              <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center">
                {subDepts.map((child, idx) => (
                  <div key={child.deptSeq} className="relative flex flex-col items-center px-4 lg:px-1.5">
                    {/* Horizontal Connector Line (Desktop Only) */}
                    {subDepts.length > 1 && (
                      <div className={`hidden lg:block absolute top-0 h-0.5 bg-[#DDE8FF] 
                        ${idx === 0 ? 'left-1/2 w-1/2' : idx === subDepts.length - 1 ? 'right-1/2 w-1/2' : 'w-full'}
                      `} />
                    )}

                    {/* Vertical Connector down to node */}
                    <div className="w-0.5 h-8 lg:h-5 bg-[#DDE8FF] relative z-10" />

                    <OrgNode node={child} isChild={true} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Sidebar Item Component for Hierarchical Toggle
const SidebarItem = ({ node, level = 0, selectedDept, onSelect, nodeMap }) => {
  const [isOpen, setIsOpen] = useState(level < 1); // Open top levels by default
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedDept === node.deptSeq;

  return (
    <div className="flex flex-col">
      <div
        className={`
          group flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer mb-0.5
          ${isSelected ? 'bg-[#3530B8] text-white font-bold shadow-md' : 'text-gray-600 hover:bg-gray-100'}
        `}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        <div
          className="w-4 h-4 flex items-center justify-center cursor-pointer hover:bg-black/5 rounded"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {hasChildren && (
            <FontAwesomeIcon
              icon={isOpen ? faChevronDown : faChevronRight}
              className={`text-[10px] ${isSelected ? 'text-white' : 'text-gray-400'}`}
            />
          )}
        </div>

        <div
          className="flex-1 flex items-center gap-2"
          onClick={() => onSelect(node.deptSeq)}
        >
          <FontAwesomeIcon
            icon={node.parentDeptSeq === null ? faBuilding : (level === 1 ? faUsers : faLayerGroup)}
            className={isSelected ? 'text-white' : 'text-[#3530B8]/60'}
          />
          <span className="truncate">{node.deptName}</span>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="flex flex-col">
          {node.children.map(child => (
            <SidebarItem
              key={child.deptSeq}
              node={child}
              level={level + 1}
              selectedDept={selectedDept}
              onSelect={onSelect}
              nodeMap={nodeMap}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 3. Employee List Component (Table View)
const EmployeeList = ({ employees = [], deptSeqs = [], deptSeq, deptCode, deptName, searchTerm = "" }) => {
  const filteredEmployees = useMemo(() => {
    let list = [...employees];

    // 1. Filter by Dept if specified
    if (deptCode !== 'ROOT' && deptSeqs.length > 0) {
      if (deptCode === "CEO") {
        list = list.filter(emp => emp.deptSeq === deptSeqs[0]);
      } else {
        // 일반 부서들은 기존대로 하위 팀/부서원들까지 전부 묶어서 출력
        list = list.filter(emp => deptSeqs.includes(emp.deptSeq));
      }
    }

    // 2. Filter by Search Term (Name, Position, or Department)
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter(emp =>
        emp.name.toLowerCase().includes(lowerSearch) ||
        emp.position.toLowerCase().includes(lowerSearch) ||
        emp.id.toLowerCase().includes(lowerSearch) ||
        emp.deptName.toLowerCase().includes(lowerSearch)
      );
    }

    return list;
  }, [employees, deptSeqs, deptCode, searchTerm]);


  const token = useAuthStore(state => state.token);
  return (
    // 목록형 조직도
    <div className="bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">이름</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">소속(부서)</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">직급</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">전화번호</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">출근상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#DDE8FF] text-[#3530B8] flex items-center justify-center text-xs font-bold transition-all overflow-hidden">
                        <img
                          src={`http://localhost/file/profile/view?sysname=${emp.sysname}&token=${token}`}
                          alt={emp.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-700">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{emp.deptName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{emp.position}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.phone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`
                        text-[10px] font-bold rounded-md
                        ${emp.attendanceStatus === '근무중' ? 'px-2 py-1 border bg-[#F0FDF4] text-[#10B981] border-[#F0FDF4]'
                          : emp.attendanceStatus === '퇴근' ? 'px-2 py-1 border bg-[#FFF9F0] text-[#FF9800] border-[#FFF9F0]'
                            : emp.attendanceStatus === '연차' ||
                              emp.attendanceStatus === '오전반차' ||
                              emp.attendanceStatus === '오후반차' ? 'px-2 py-1 border bg-blue-50 text-blue-600 border-blue-50'
                              : ''}
                        `}>{emp.attendanceStatus}</span>

                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center text-gray-400 text-sm">
                  해당 부서에 등록된 임직원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Departments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  const token = useAuthStore(state => state.token);
  const sidebarRef = useRef(null);
  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        if (!event.target.closest('.sidebar-toggle')) {
          setIsSidebarOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  // 1. Initial Static Data
  const [fullTree, setFullTree] = useState({
    root: null,
    nodeMap: {}
  })
  const [employees, setEmployees] = useState([]);

  const allDeptSeq = (node) => {
    const result = [node.deptSeq];

    if (node.children?.length) {
      node.children.forEach(child => {
        result.push(...allDeptSeq(child));
      })
    }
    return result;
  }

  useEffect(() => {
    showLoading();
    getGroup().then(resp => {
      setFullTree({
        root: resp.data.root,
        nodeMap: resp.data.nodeMap
      });

      setEmployees(
        resp.data.users
      )
      hideLoading();
    })
      .catch(error => {
        console.log("조직도 로딩 실패", error)
      })
  }, []);

  // Selected department details
  const currentDeptInfo = useMemo(() => {
    if (selectedDept === 'ALL') return null;
    return fullTree.nodeMap[selectedDept];
  }, [selectedDept, fullTree]);

  const selectDeptSeq = useMemo(() => {
    if (selectedDept === 'ALL') return [];
    if (!currentDeptInfo) return [];
    return allDeptSeq(currentDeptInfo);
  }, [selectedDept, currentDeptInfo]);

  // Header search results filtering (Employees + Departments)
  const headerResults = useMemo(() => {
    if (!headerSearch.trim()) return { employees: [], depts: [] };
    const lower = headerSearch.toLowerCase();

    const matchedEmployees = employees.filter(emp =>
      emp.name.toLowerCase().includes(lower) ||
      emp.position.toLowerCase().includes(lower)
    );

    const matchedDepts = Object.values(fullTree.nodeMap).filter(dept =>
      dept.deptName.toLowerCase().includes(lower)
    );

    return { employees: matchedEmployees, depts: matchedDepts };
  }, [headerSearch, employees, fullTree.nodeMap]);

  return (
    <div className="flex h-full bg-[#F8FAFC] font-sans overflow-hidden relative">

      {/* 1. Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. Sidebar (Overlay on Mobile, Inline on Desktop) */}
      <aside
        ref={sidebarRef}
        className={`
  bg-white border-r border-gray-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden
  
  /* 💻 데스크톱: 유저님이 원래 만드신 완벽한 레이아웃 그대로 고정 */
  lg:relative lg:inset-auto lg:translate-x-0
  ${isSidebarOpen ? 'lg:w-64' : 'lg:w-0'}
  
  /* 📱 모바일: 데스크톱에 절대 영향을 주지 않도록 fixed와 정렬 분리 */
  fixed inset-y-0 left-0 z-50
  ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}
`}>
        {/* 💡 [핵심 교정] lg:w-64로 데스크톱 크기를 꽉 잡아두고, 모바일(w-0)일 때만 내부 콘텐츠가 숨겨지도록 처리 */}
        <div className="w-full lg:w-64 flex flex-col h-full shrink-0">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FontAwesomeIcon icon={faSitemap} className="text-[#3530B8]" />
              조직 구조
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 lg:hidden"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-4 space-y-1">
            <button
              onClick={() => {
                setSelectedDept('ALL');
                setSearchTerm('');
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-4 ${selectedDept === 'ALL' ? 'bg-[#3530B8] text-white font-bold shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
              >
              <FontAwesomeIcon icon={faLayerGroup} />
              전체 조직도
            </button>

            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] px-3 mb-2">DEPARTMENTS</div>

            {fullTree.root && (
              <SidebarItem
                node={fullTree.root}
                selectedDept={selectedDept}
                onSelect={(id) => {
                  setSelectedDept(id);
                  setSearchTerm('');
                }}
                nodeMap={fullTree.nodeMap}
              />
            )}
          </nav>
        </div>
      </aside>

      {/* 3. Main Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 lg:gap-4 text-sm w-full">
            {/* Hamburger for Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="sidebar-toggle lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-gray-400 hidden sm:inline">인사 관리</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 text-[10px] hidden sm:inline" />
              <span className="font-bold text-gray-700 shrink-0 max-w-[80px] sm:max-w-none truncate">
                {searchTerm.trim()
                  ? `"${searchTerm}" 검색 결과`
                  : (selectedDept === 'ALL' ? '전체 조직도' : currentDeptInfo?.deptName)}
              </span>
            </div>

            {/* Unified Search Bar */}
            <div className="flex-1 max-w-[300px] ml-2 lg:ml-4 relative">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="이름/부서 검색"
                  className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#3530B8]/20"
                  value={headerSearch}
                  onChange={(e) => {
                    setHeaderSearch(e.target.value);
                    setIsHeaderSearchOpen(true);
                  }}
                  onFocus={() => setIsHeaderSearchOpen(true)}
                />
              </div>

              {/* Dropdown Results */}
              {isHeaderSearchOpen && headerSearch.trim() && (
                <>
                  <div className="fixed inset-0 z-50" onClick={() => setIsHeaderSearchOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[60] max-h-[350px] overflow-y-auto custom-scrollbar">

                    {/* Department Results Section */}
                    {headerResults.depts.length > 0 && (
                      <div className="p-2 bg-gray-50/50 border-b border-gray-100">
                        <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">부서</p>
                        {headerResults.depts.map((dept) => (
                          <div
                            key={dept.deptSeq}
                            className="p-2 hover:bg-[#3530B8] hover:text-white rounded-lg flex items-center gap-3 cursor-pointer group transition-colors"
                            onClick={() => {
                              setSelectedDept(dept.deptSeq);
                              setSearchTerm(''); // Show all members in dept
                              setHeaderSearch('');
                              setIsHeaderSearchOpen(false);
                            }}
                          >
                            <FontAwesomeIcon icon={faUsers} className="text-[#3530B8] group-hover:text-white text-xs shrink-0" />
                            <span className="text-xs font-bold truncate">{dept.deptName}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Employee Results Section */}
                    <div className="p-2">
                      {headerResults.employees.length > 0 ? (
                        <>
                          <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">임직원</p>
                          {headerResults.employees.map((emp) => (
                            <div
                              key={emp.id}
                              className="p-2 hover:bg-gray-50 rounded-lg flex items-center gap-3 cursor-pointer"
                              onClick={() => {
                                setSelectedDept(emp.deptSeq);
                                setSearchTerm(emp.name); // Isolate this person
                                setHeaderSearch('');
                                setIsHeaderSearchOpen(false);
                              }}
                            >
                              <div className="w-8 h-8 rounded-full bg-[#DDE8FF] overflow-hidden shrink-0">
                                <img
                                  src={`http://localhost/file/profile/view?sysname=${emp.sysname}&token=${token}`}
                                  className="w-full h-full object-cover"
                                  alt={emp.name}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">{emp.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">{emp.deptName} · {emp.position}</p>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : headerResults.depts.length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-400">결과가 없습니다.</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-2 ml-2 shrink-0">
              {/* Back to Full Tree Button */}
              <button
                onClick={() => {
                  setSelectedDept('ALL');
                  setSearchTerm('');
                  setHeaderSearch('');
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-[#3530B8] hover:text-white rounded-lg transition-all text-xs font-bold"
                title="전체 조직도 보기"
              >
                <FontAwesomeIcon icon={faLayerGroup} />
                <span className="hidden sm:inline">전체 조직도</span>
              </button>

              {/* Sidebar Toggle Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="sidebar-toggle flex items-center gap-2 px-3 py-1.5 bg-[#F0F4FF] text-[#3530B8] hover:bg-[#3530B8] hover:text-white rounded-lg transition-all text-xs font-bold"
              >
                <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faSitemap} />
                <span className="hidden sm:inline">조직 구조</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          {searchTerm.trim() ? (
            /* CASE 0: Search Mode (Global Results) */
            <div className="w-full">
              <EmployeeList
                employees={employees}
                deptSeq="ALL"
                deptName="전체"
                searchTerm={searchTerm}
              />
            </div>
          ) : selectedDept === 'ALL' ? (
            /* CASE 1: Full Org Chart (Visual) */
            <div className="inline-block min-w-full p-2 lg:p-4">
              <div className="flex justify-center min-w-max pb-20 pt-4">
                {fullTree.root && <OrgNode node={fullTree.root} />}
              </div>
            </div>
          ) : (
            /* CASE 2: Single Department / Team (List View) */
            <div className="w-full">
              {currentDeptInfo && (
                <EmployeeList
                  employees={employees}
                  deptSeq={currentDeptInfo.deptSeq}
                  deptCode={currentDeptInfo.deptCode}
                  deptName={currentDeptInfo.deptName}
                  deptSeqs={selectDeptSeq}
                  searchTerm={searchTerm}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
    </div>
  );
};

export default Departments;
