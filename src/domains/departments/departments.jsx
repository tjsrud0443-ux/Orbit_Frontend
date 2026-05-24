import React, { useState, useMemo, useEffect } from 'react';
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


// 2. Visual Org Chart Node Component
const OrgNode = ({ node }) => {
  const isRoot = node.parentDeptSeq === null;

  return (
    <div className="flex flex-col items-center relative">
      {/* Node Card */}
      <div className={`
        relative z-10 flex items-center p-2.5 px-3 min-w-[140px] rounded-xl border-2 transition-all gap-2
        ${isRoot
          ? 'bg-[#3530B8] border-[#3530B8] text-white shadow-xl scale-110'
          : 'bg-white border-[#DDE8FF] text-gray-800 shadow-sm hover:border-[#3530B8]'}
      `}>
        <div className={`
          w-9 h-9 rounded-full flex items-center justify-center shrink-0
          ${isRoot ? 'bg-white/20 text-white' : 'bg-[#F0F4FF] text-[#3530B8]'}
        `}>
          <FontAwesomeIcon icon={node.parentDeptSeq === null ? faBuilding : faUser} className="text-sm" />
        </div>
        <div className="text-left">
          <p className={`text-[10px] opacity-70 mb-0.5 ${isRoot ? 'text-white' : 'text-[#3530B8] font-bold'}`}>
            {node.deptName}
          </p>
          <p className="text-xs font-extrabold leading-tight">
            {node.name || '본사'}
          </p>
          <p className={`text-[9px] mt-0.5 ${isRoot ? 'text-white/60' : 'text-gray-400'}`}>
            {node.position || '-'}
          </p>
        </div>
      </div>

      {/* Connection Lines */}
      {node.children && node.children.length > 0 && (
        <>
          {/* Vertical Line Down from current node */}
          <div className="w-0.5 h-6 bg-[#DDE8FF]" />

          <div className="flex gap-4">
            {node.children.map((child, idx) => (
              <div
                key={child.deptSeq}
                className={`
                  relative flex flex-col items-center
                  ${node.children.length > 1 ? "before:content-[''] before:absolute before:top-0 before:h-0.5 before:bg-[#DDE8FF]" : ""}
                  ${node.children.length > 1 && idx === 0 ? "before:w-1/2 before:right-0" : ""}
                  ${node.children.length > 1 && idx === node.children.length - 1 ? "before:w-1/2 before:left-0" : ""}
                  ${node.children.length > 1 && idx > 0 && idx < node.children.length - 1 ? "before:w-full" : ""}
                `}
              >
                {/* Small Vertical line connecting to horizontal bar */}
                <div className="w-0.5 h-3 bg-[#DDE8FF]" />
                <OrgNode node={child} />
              </div>
            ))}
          </div>
        </>
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
const EmployeeList = ({ employees = [], deptSeq, deptCode, deptName, searchTerm = "" }) => {
  const filteredEmployees = useMemo(() => {
    let list = [...employees];

    // 1. Filter by Dept if specified
    if (deptSeq !== 'ALL' && deptCode !== 'ROOT') {
      list = list.filter(emp => emp.deptSeq === deptSeq);
    }

    // 2. Filter by Search Term (Name or Position)
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter(emp =>
        emp.name.toLowerCase().includes(lowerSearch) ||
        emp.position.toLowerCase().includes(lowerSearch) ||
        emp.id.toLowerCase().includes(lowerSearch)
      );
    }

    return list;
  }, [employees, deptSeq, deptCode, searchTerm]);

  
  const token = useAuthStore(state => state.token);
  return (
    // 목록형 조직도
    <div className="bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
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
                <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#DDE8FF] text-[#3530B8] flex items-center justify-center text-xs font-bold group-hover:bg-[#3530B8] group-hover:text-white transition-all overflow-hidden">
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
                        px-2 py-1  text-[10px] font-bold rounded-md border 
                        ${emp.attendanceStatus === '근무중' ? 'bg-[#F0FDF4] text-[#10B981] border-[#F0FDF4]'
                          : emp.attendanceStatus === '퇴근' ? 'bg-[#FFF9F0] text-[#FF9800] border-[#FFF9F0]'
                            : 'bg-[#FFF0F0] text-[#FF4D4F] border-[#FFF0F0]'}
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

  // 1. Initial Static Data
  const [fullTree, setFullTree] = useState({
    root: null,
    nodeMap: {}
  })

  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    getGroup().then(resp => {
      setFullTree({
        root: resp.data.root,
        nodeMap: resp.data.nodeMap
      });

      setEmployees(
        resp.data.users
      )
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


  return (
    <div className="flex h-full bg-[#F8FAFC] font-sans overflow-hidden relative">

      {/* 1. Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. Left Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faSitemap} className="text-[#3530B8]" />
            조직 구조
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="p-6 pt-4">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="부서/이름 검색"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3530B8]/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 pt-0 space-y-1">
          <button
            onClick={() => {
              setSelectedDept('ALL');
              setSearchTerm('');
              setIsSidebarOpen(false);
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
                setIsSidebarOpen(false);
              }}
              nodeMap={fullTree.nodeMap}
            />
          )}
        </nav>
      </aside>

      {/* 3. Main Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 hidden sm:inline">인사 관리</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 text-[10px] hidden sm:inline" />
              <span className="font-bold text-gray-700">
                {selectedDept === 'ALL' ? '전체 조직도' : currentDeptInfo?.deptName}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-auto bg-white">
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
            <div className="inline-block min-w-full p-4 lg:p-10">
              <div className="flex justify-center min-w-max pb-20 pt-10">
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
                  deptCode={currentDeptInfo?.deptCode}
                  deptName={currentDeptInfo.deptName}
                  searchTerm={searchTerm}
                />
              )}
            </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default Departments;
