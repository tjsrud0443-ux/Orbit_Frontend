import React, { useState, useMemo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrashAlt,
  faChevronDown,
  faChevronRight,
  faBuilding,
  faUsers,
  faLayerGroup,
  faTimes,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { getGroup } from '../departments/departmentsApi';

const AdminDept = () => {
  // --- 1. Data States ---
  const [fullTree, setFullTree] = useState({
    root: null,
    nodeMap: {}
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 2. UI States ---
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [formMode, setFormMode] = useState(null); // 'CREATE_HQ', 'CREATE_SUB', 'EDIT'
  const [selectedNode, setSelectedNode] = useState(null);
  const [formData, setFormData] = useState({
    deptName: '',
    deptCode: '',
    parentDeptSeq: ''
  });

  // --- 3. Initial Data Fetch ---
  useEffect(() => {
    getGroup()
      .then(resp => {
        setFullTree({
          root: resp.data.root,
          nodeMap: resp.data.nodeMap
        });
        setEmployees(resp.data.users);
        if (resp.data.root) {
          setExpandedNodes(new Set([resp.data.root.deptSeq]));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("조직도 로딩 실패", err);
        setLoading(false);
      });
  }, []);

  // --- 4. Helper Logic ---
  const getAllChildDeptSeqs = (node) => {
    const result = [node.deptSeq];
    if (node.children?.length) {
      node.children.forEach(child => {
        result.push(...getAllChildDeptSeqs(child));
      });
    }
    return result;
  };

  const getDeptMemberCount = (node) => {
    const allSeqs = getAllChildDeptSeqs(node);
    return employees.filter(emp => allSeqs.includes(emp.deptSeq)).length;
  };

  const toggleNode = (deptSeq) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(deptSeq)) {
      newExpanded.delete(deptSeq);
    } else {
      newExpanded.add(deptSeq);
    }
    setExpandedNodes(newExpanded);
  };

  // --- 5. Form Handlers ---
  const openCreateHq = () => {
    setFormMode('CREATE_HQ');
    setFormData({ deptName: '', deptCode: '', parentDeptSeq: null });
    setSelectedNode(null);
  };

  const openCreateSub = () => {
    setFormMode('CREATE_SUB');
    setFormData({ deptName: '', deptCode: '', parentDeptSeq: '' });
    setSelectedNode(null);
  };

  const openEdit = (node) => {
    setFormMode('EDIT');
    setSelectedNode(node);
    setFormData({
      deptName: node.deptName,
      deptCode: node.deptCode,
      parentDeptSeq: node.parentDeptSeq
    });
  };

  const handleCloseForm = () => {
    setFormMode(null);
    setSelectedNode(null);
  };

  const handleSave = () => {
    if (!formData.deptName || !formData.deptCode) {
      alert("부서명과 부서 코드를 입력해주세요.");
      return;
    }
    if (formMode === 'CREATE_SUB' && !formData.parentDeptSeq) {
        alert("상위 본부를 선택해주세요.");
        return;
    }
    alert(`${formMode === 'EDIT' ? '수정' : '생성'}되었습니다. (서버 연동 시 실제 반영됩니다)`);
    handleCloseForm();
  };

  const handleDelete = (node) => {
    const count = getDeptMemberCount(node);
    if (count > 0) {
      alert("부서 내에 소속된 사원이 존재하여 삭제할 수 없습니다.");
      return;
    }
    if (window.confirm(`[${node.deptName}] 부서를 삭제하시겠습니까?`)) {
      alert("삭제되었습니다. (서버 연동 시 실제 반영됩니다)");
    }
  };

  // --- 6. Table Row Renderer ---
  const renderRows = (node, level = 0) => {
    if (!node) return null;
    const isExpanded = expandedNodes.has(node.deptSeq);
    const hasChildren = node.children && node.children.length > 0;
    const memberCount = getDeptMemberCount(node);

    return (
      <React.Fragment key={node.deptSeq}>
        <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
          <td className="py-4 pl-6 pr-4">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              <div 
                className={`w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-slate-100 rounded mr-2 ${!hasChildren && 'invisible'}`}
                onClick={() => toggleNode(node.deptSeq)}
              >
                <FontAwesomeIcon 
                  icon={isExpanded ? faChevronDown : faChevronRight} 
                  className="text-[10px] text-slate-400"
                />
              </div>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${level === 0 ? 'bg-indigo-50 text-[#3530B8]' : 'bg-slate-100 text-slate-500'}`}>
                  <FontAwesomeIcon icon={level === 0 ? faBuilding : faLayerGroup} className="text-xs" />
                </div>
                <span className={`text-sm ${level === 0 ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                  {node.deptName}
                </span>
              </div>
            </div>
          </td>
          <td className="py-4 px-4 text-xs font-mono text-slate-400 font-bold tracking-wider">
            {node.deptCode}
          </td>
          <td className="py-4 px-4">
            <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-slate-300 text-[10px]" />
                <span className="text-sm font-bold text-slate-600">{memberCount}명</span>
            </div>
          </td>
          <td className="py-4 pl-4 pr-6 text-right">
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => openEdit(node)}
                className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-[#3530B8] transition-all flex items-center justify-center cursor-pointer"
                title="수정"
              >
                <FontAwesomeIcon icon={faEdit} className="text-xs" />
              </button>
              <button 
                onClick={() => handleDelete(node)}
                className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center cursor-pointer"
                title="삭제"
              >
                <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
              </button>
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && node.children.map(child => renderRows(child, level + 1))}
      </React.Fragment>
    );
  };

  if (loading) return (
    <div className="flex-1 bg-[#F8FAFC] flex items-center justify-center h-screen">
        <div className="text-slate-400 animate-pulse font-bold">조직 데이터를 불러오는 중...</div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#F8FAFC] flex flex-col h-screen overflow-hidden">
      
      {/* Header Section */}
      <div className="p-8 lg:p-10 pb-4 flex items-end justify-between px-10">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-[#1a1c3d] tracking-tight">부서 관리</h1>
          <p className="text-sm text-[#8a92a6] font-medium">그룹웨어 조직 체계와 부서 정보를 구성하고 관리합니다.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={openCreateHq}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} className="text-[#3530B8]" />
            본부 생성
          </button>
          <button 
            onClick={openCreateSub}
            className="px-4 py-2.5 bg-[#3530B8] text-white rounded-xl text-xs font-bold hover:bg-[#2a2594] transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} />
            부서 생성
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex px-8 lg:px-10 pb-8 lg:pb-10 gap-6 overflow-hidden">
        
        {/* Left: Department List Table */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full transition-all duration-500">
          <div className="overflow-y-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse min-w-[600px] table-fixed text-[#1a1c3d]">
              <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-4 pl-6 pr-4 w-[40%]">부서</th>
                  <th className="py-4 px-4 w-[25%]">부서 코드</th>
                  <th className="py-4 px-4 w-[15%]">총 인원</th>
                  <th className="py-4 pl-4 pr-6 w-[20%] text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fullTree.root ? renderRows(fullTree.root) : (
                  <tr>
                    <td colSpan="4" className="py-20 text-center text-slate-300 italic text-sm">등록된 부서 정보가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Side Panel */}
        <aside 
          className={`bg-white border border-slate-200 rounded-2xl shadow-xl z-40 transition-all duration-500 ease-in-out flex flex-col overflow-hidden self-start
            ${formMode ? 'w-[320px] lg:w-[380px] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10 pointer-events-none'}
          `}
          style={{ height: formMode ? 'auto' : '0', maxHeight: '70%', minHeight: formMode ? '400px' : '0' }}
        >
          {/* Panel Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <h2 className="text-base font-bold text-slate-800">
              {formMode === 'CREATE_HQ' ? '본부 생성' : 
               formMode === 'CREATE_SUB' ? '부서 생성' : 
               '정보 수정'}
            </h2>
            <button 
              onClick={handleCloseForm}
              className="w-8 h-8 rounded-full hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center cursor-pointer"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {formMode === 'CREATE_SUB' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">상위 본부 선택</label>
                <select 
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3530B8]/20 focus:border-[#3530B8] transition-all cursor-pointer"
                  value={formData.parentDeptSeq || ''}
                  onChange={(e) => setFormData({...formData, parentDeptSeq: e.target.value})}
                >
                  <option value="">본부를 선택하세요</option>
                  {Object.values(fullTree.nodeMap)
                    .filter(node => node.parentDeptSeq === fullTree.root.deptSeq)
                    .map(dept => (
                      <option key={dept.deptSeq} value={dept.deptSeq}>{dept.deptName}</option>
                    ))
                  }
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                  {formMode === 'CREATE_HQ' ? '본부명' : '부서명'}
              </label>
              <input 
                type="text" 
                placeholder="예: 개발본부, 인사팀"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3530B8]/20 focus:border-[#3530B8] transition-all"
                value={formData.deptName}
                onChange={(e) => setFormData({...formData, deptName: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">부서 코드</label>
              <input 
                type="text" 
                placeholder="예: DEPT-001"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3530B8]/20 focus:border-[#3530B8] transition-all font-mono"
                value={formData.deptCode}
                onChange={(e) => setFormData({...formData, deptCode: e.target.value})}
              />
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium ml-1">
                <FontAwesomeIcon icon={faInfoCircle} className="text-[#3530B8]/50" />
                <span>영문, 숫자, '-' 만 입력 가능</span>
              </div>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-2 shrink-0 mt-auto">
            <button 
              onClick={handleCloseForm}
              className="flex-1 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
            >
              취소
            </button>
            <button 
              onClick={handleSave}
              className="flex-[1.5] h-10 bg-[#3530B8] text-white rounded-xl text-xs font-bold hover:bg-[#2a2594] transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              저장하기
            </button>
          </div>
        </aside>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E0; }
      `}</style>
    </div>
  );
};

export default AdminDept;
