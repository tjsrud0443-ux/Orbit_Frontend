import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { addDept, delDept, updateDept } from './adminApi';
import { alertSuccess, alertConfirm, alertWarning } from '../../utils/alert';

const AdminDept = () => {
  // --- 1. Data States ---
  const [fullTree, setFullTree] = useState({
    root: null,
    nodeMap: {}
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 드롭다운 상태 추가

  // --- 2. UI States ---
  const sidePanelRef = useRef(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [formMode, setFormMode] = useState(null);
  const [panelTitle, setPanelTitle] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [formData, setFormData] = useState({
    dept_name: '',
    dept_code: '',
    parent_dept_seq: '',
    dept_type: "",
    auth_group: ""
  });
  const [errors, setErrors] = useState({});

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

  useEffect(() => {
    if (formMode === 'CREATE_HQ') setPanelTitle('본부 생성');
    else if (formMode === 'CREATE_SUB') setPanelTitle('부서 생성');
    else if (formMode === 'EDIT') setPanelTitle('정보 수정');
    setErrors({});
  }, [formMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isTrigger = event.target.closest('.action-trigger');
      if (sidePanelRef.current && !sidePanelRef.current.contains(event.target) && !isTrigger) {
        handleCloseForm();
      }
    };
    if (formMode) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [formMode]);

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
    if (node.deptName === '대표이사실') return 1;
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

  const openCreateHq = () => {
    setFormMode('CREATE_HQ');
    setFormData({ dept_name: '', dept_code: '', parent_dept_seq: null, auth_group: 'ROLE_USER' });
    setSelectedNode(null);
  };

  const openCreateSub = () => {
    setFormMode('CREATE_SUB');
    setFormData({ dept_name: '', dept_code: '', parent_dept_seq: null, auth_group: 'ROLE_USER' });
    setSelectedNode(null);
  };

  const openEdit = (node) => {
    setFormMode('EDIT');
    setSelectedNode(node);
    setFormData({
      dept_seq: node.deptSeq,
      dept_name: node.deptName,
      dept_code: node.deptCode,
      parent_dept_seq: node.parentDeptSeq,
      auth_group: node.auth_group
    });
  };

  const handleCloseForm = () => {
    setFormMode(null);
    setSelectedNode(null);
    setErrors({});
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!formData.dept_name) {
      newErrors.dept_name = `${formMode === 'CREATE_HQ' ? '본부명' : '부서명'}을 입력해주세요.`;
    } else if (!/^[ㄱ-ㅎㅏ-ㅣ가-힣]+$/.test(formData.dept_name)) {
      newErrors.dept_name = "한글만 입력 가능합니다.";
    }

    if (!formData.dept_code) {
      newErrors.dept_code = "부서 코드를 입력해주세요.";
    } else if (!/^[A-Z]+$/.test(formData.dept_code)) {
      newErrors.dept_code = "영문(대문자)만 입력 가능합니다.";
    }

    if (formMode === 'CREATE_SUB' && !formData.parent_dept_seq) {
      newErrors.parent_dept_seq = "상위 본부를 선택해주세요.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let payload = { ...formData };

    if (formMode === 'CREATE_HQ') {
      payload.parent_dept_seq = 2;
      payload.dept_type = 'HQ';
    } else if (formMode === 'CREATE_SUB') {
      payload.dept_type = "SUB";
    }


    if (formMode === 'EDIT') {
      const result = await alertConfirm('수정 확인', '정말 수정하시겠습니까?');
      if (!result.isConfirmed) return;

      await updateDept(formData);
      const resp = await getGroup();
      setFullTree({
        root: resp.data.root,
        nodeMap: resp.data.nodeMap
      });
      setEmployees(resp.data.users);
      if (resp.data.root) {
        setExpandedNodes(new Set([resp.data.root.deptSeq]));
      }
      setLoading(false);

    } else {
      await addDept(payload);
      const resp = await getGroup();
      setFullTree({
        root: resp.data.root,
        nodeMap: resp.data.nodeMap
      });
      setEmployees(resp.data.users);
      if (resp.data.root) {
        setExpandedNodes(new Set([resp.data.root.deptSeq]));
      }
      setLoading(false);
    }

    await alertSuccess(
      `${formMode === 'EDIT' ? '수정' : '생성'} 완료`,
      `${formMode === 'EDIT' ? '수정이' : '생성이'} 완료되었습니다.`
    );
    handleCloseForm();
  };

  const handleDelete = async (node) => {
    if (node.children && node.children.length > 0) {
      await alertWarning('삭제 불가', '하위 부서가 존재하여 삭제할 수 없습니다.<br>하위 부서를 먼저 삭제해주세요.');
      return;
    }

    const count = getDeptMemberCount(node);
    if (count > 0) {
      await alertWarning('삭제 불가', '본부 또는 부서 내에 소속된 직원이 존재하여<br>삭제할 수 없습니다.');
      return;
    }
    
    const result = await alertConfirm(
      `[ ${node.deptName} ] 을(를)<br>정말 삭제하시겠습니까?`,
      '삭제 후 복구는 불가합니다.'
    );

    if (result.isConfirmed) {
      await delDept(node.deptSeq);
      await alertSuccess('삭제 완료', '삭제가 완료되었습니다.');
      
      const resp = await getGroup();
      setFullTree({
        root: resp.data.root,
        nodeMap: resp.data.nodeMap
      });
      setEmployees(resp.data.users);
      if (resp.data.root) {
        setExpandedNodes(new Set([resp.data.root.deptSeq]));
      }
      setLoading(false);
    }
  };

  const renderRows = (node, level = 0) => {
    if (!node) return null;
    const isExpanded = expandedNodes.has(node.deptSeq);
    const hasChildren = node.children && node.children.length > 0;
    const memberCount = getDeptMemberCount(node);
    const displayName = level === 0 ? '(주)Lunex Soft (본사)' : node.deptName;

    return (
      <React.Fragment key={node.deptSeq}>
        <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
          <td className="py-4 pl-6 pr-4">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              <div
                className={`w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-slate-100 rounded mr-2 ${!hasChildren && 'invisible'}`}
                onClick={() => toggleNode(node.deptSeq)}
              >
                <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} className="text-[10px] text-slate-400" />
              </div>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${level === 0 ? 'bg-indigo-50 text-[#3530B8]' : 'bg-slate-100 text-slate-500'}`}>
                  <FontAwesomeIcon icon={level === 0 ? faBuilding : faLayerGroup} className="text-xs" />
                </div>
                <span className={`text-sm ${level === 0 ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                  {displayName}
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
          <td className="py-4 pl-4 pr-20 text-right">
            <div className="flex justify-end gap-2">
              {(level !== 0 && node.auth_group === 'ROLE_USER' && node.deptSeq !== 4) && (
                <>
                  <button onClick={() => openEdit(node)} className="action-trigger w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-[#3530B8] transition-all flex items-center justify-center cursor-pointer" title="수정"><FontAwesomeIcon icon={faEdit} className="text-xs" /></button>
                  <button onClick={() => handleDelete(node)} className="action-trigger w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center cursor-pointer" title="삭제"><FontAwesomeIcon icon={faTrashAlt} className="text-xs" /></button>
                </>
              )}
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && node.children.map(child => renderRows(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
      <div className="p-8 lg:p-10 pb-4 px-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-[#1a1c3d] tracking-tight">부서 관리</h1>
          <p className="text-sm text-[#8a92a6] font-medium">그룹웨어 조직 체계와 부서 정보를 구성하고 관리합니다.</p>
        </div>
        <div className="flex justify-end gap-3 shrink-0">
          <button onClick={openCreateHq} className="action-trigger px-3 sm:px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] sm:text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer whitespace-nowrap flex-shrink-0"><FontAwesomeIcon icon={faPlus} className="text-[#3530B8]" /> 본부 생성</button>
          <button onClick={openCreateSub} className="action-trigger px-3 sm:px-4 py-2.5 bg-[#3530B8] text-white rounded-xl text-[11px] sm:text-xs font-bold hover:bg-[#2a2594] transition-all flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-100 cursor-pointer whitespace-nowrap flex-shrink-0"><FontAwesomeIcon icon={faPlus} /> 부서 생성</button>
        </div>
      </div>

      <div className="flex-1 flex px-8 lg:px-10 pb-8 lg:pb-10 gap-6 overflow-hidden">
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full transition-all duration-500">
          <div className="overflow-y-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse min-w-[600px] table-fixed text-[#1a1c3d]">
              <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-4 pl-6 pr-4 w-[40%]">부서</th>
                  <th className="py-4 px-4 w-[25%]">부서 코드</th>
                  <th className="py-4 px-4 w-[15%]">총 인원</th>
                  <th className="py-4 pl-4 pr-27 w-[20%] text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fullTree.root ? renderRows(fullTree.root, 0) : <tr><td colSpan="4" className="py-20 text-center text-slate-300 italic text-sm">등록된 부서 정보가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <aside
          ref={sidePanelRef}
          className={`bg-white border border-slate-200 rounded-2xl shadow-xl z-40 transition-all duration-500 ease-in-out flex flex-col overflow-hidden self-start
            ${formMode ? 'w-[320px] lg:w-[380px] opacity-100 translate-x-0 ml-0' : 'w-0 opacity-0 translate-x-10 ml-[-24px] pointer-events-none'}
          `}
          style={{ height: formMode ? 'auto' : '0', maxHeight: '70%', minHeight: formMode ? '400px' : '0' }}
        >
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <h2 className="text-base font-bold text-slate-800">{panelTitle}</h2>
            <button onClick={handleCloseForm} className="w-8 h-8 rounded-full hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center cursor-pointer"><FontAwesomeIcon icon={faTimes} className="text-xs" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {formMode === 'CREATE_SUB' && (
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">상위 본부 선택</label>
                <div
                  className={`w-full h-10 px-3 bg-white border ${errors.parent_dept_seq ? 'border-red-500' : 'border-slate-200'} rounded-xl text-xs text-gray-500 flex items-center justify-between cursor-pointer transition-all hover:border-[#3530B8]`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {formData.parent_dept_seq ? Object.values(fullTree.nodeMap).find(n => n.deptSeq == formData.parent_dept_seq)?.deptName : "본부를 선택하세요"}
                  <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-slate-400" />
                </div>
                {errors.parent_dept_seq && <p className="text-[9px] text-red-500 font-medium ml-1">{errors.parent_dept_seq}</p>}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.15)] z-50 overflow-hidden border border-slate-100">
                    {Object.values(fullTree.nodeMap).filter(node => node.parentDeptSeq === 2).map(dept => (
                      <div
                        key={dept.deptSeq}
                        className="px-4 py-3 text-xs text-slate-600 hover:bg-[#F0F4FF] hover:text-[#3530B8] active:bg-[#F0F4FF] active:text-[#3530B8] cursor-pointer transition-colors"
                        onClick={() => {
                          setFormData({ ...formData, parent_dept_seq: dept.deptSeq });
                          setIsDropdownOpen(false);
                          setErrors(prev => ({ ...prev, parent_dept_seq: null }));
                        }}
                      >
                        {dept.deptName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{formMode === 'CREATE_HQ' ? '본부명' : '부서명'}</label>
              <input
                type="text"
                placeholder="예: 개발본부, 인사팀"
                maxLength={20}
                className={`w-full h-10 px-3 bg-slate-50 border ${errors.dept_name ? 'border-red-500' : 'border-slate-200'} rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3530B8]/20 focus:border-[#3530B8] transition-all`}
                value={formData.dept_name}
                onChange={(e) => {
                  setFormData({ ...formData, dept_name: e.target.value.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣]/g, "") });
                  if (errors.dept_name) setErrors(prev => ({ ...prev, dept_name: null }));
                }}
              />
              {errors.dept_name && <p className="text-[9px] text-red-500 font-medium ml-1">{errors.dept_name}</p>}
              <div className="flex items-center justify-between gap-1.5 text-[9px] text-slate-400 font-medium ml-1">
                <div className="flex items-center gap-1.5"><FontAwesomeIcon icon={faInfoCircle} className="text-[#3530B8]/50" /> <span>한글만 입력 가능</span></div>
                <span>{formData.dept_name.length}/20</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">부서 코드</label>
              <input
                type="text"
                placeholder="예: DEPT"
                maxLength={5}
                className={`w-full h-10 px-3 bg-slate-50 border ${errors.dept_code ? 'border-red-500' : 'border-slate-200'} rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3530B8]/20 focus:border-[#3530B8] transition-all font-mono`}
                value={formData.dept_code}
                onChange={(e) => {
                  setFormData({ ...formData, dept_code: e.target.value.replace(/[^A-Z]/g, "") });
                  if (errors.dept_code) setErrors(prev => ({ ...prev, dept_code: null }));
                }}
              />
              {errors.dept_code && <p className="text-[9px] text-red-500 font-medium ml-1">{errors.dept_code}</p>}
              <div className="flex items-center justify-between gap-1.5 text-[9px] text-slate-400 font-medium ml-1">
                <div className="flex items-center gap-1.5"><FontAwesomeIcon icon={faInfoCircle} className="text-[#3530B8]/50" /> <span>영문(대문자)만 입력 가능</span></div>
                <span>{formData.dept_code.length}/5</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">부서 권한</label>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center
                    ${formData.auth_group === 'ROLE_USER' ? 'bg-[#3530B8] text-white border-[#3530B8]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#3530B8]'}`}
                  onClick={() => setFormData({ ...formData, auth_group: 'ROLE_USER' })}
                >
                  일반 부서
                </div>
                <div
                  value="ROLE_HR_ADMIN"
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center
                    ${formData.auth_group === 'ROLE_HR_ADMIN' ? 'bg-[#3530B8] text-white border-[#3530B8]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#3530B8]'}`}
                  onClick={() => setFormData({ ...formData, auth_group: 'ROLE_HR_ADMIN' })}
                >
                  인사 관리
                </div>
                <div
                  value="ROLE_GA_ADMIN"
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center
                    ${formData.auth_group === 'ROLE_GA_ADMIN' ? 'bg-[#3530B8] text-white border-[#3530B8]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#3530B8]'}`}
                  onClick={() => setFormData({ ...formData, auth_group: 'ROLE_GA_ADMIN' })}
                >
                  총무 관리
                </div>
                <div
                  value="ROLE_FN_ADMIN"
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center
                    ${formData.auth_group === 'ROLE_FN_ADMIN' ? 'bg-[#3530B8] text-white border-[#3530B8]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#3530B8]'}`}
                  onClick={() => setFormData({ ...formData, auth_group: 'ROLE_FN_ADMIN' })}
                >
                  재무 관리
                </div>
                <div
                  value="ROLE_SUPER_ADMIN"
                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center
                    ${formData.auth_group === 'ROLE_SUPER_ADMIN' ? 'bg-[#3530B8] text-white border-[#3530B8]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#3530B8]'}`}
                  onClick={() => setFormData({ ...formData, auth_group: 'ROLE_SUPER_ADMIN' })}
                >
                  총괄 관리자
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-2 shrink-0 mt-auto">
            <button onClick={handleCloseForm} className="flex-1 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer">취소</button>
            <button onClick={handleSave} className="flex-[1.5] h-10 bg-[#3530B8] text-white rounded-xl text-xs font-bold hover:bg-[#2a2594] transition-all shadow-md shadow-indigo-100 cursor-pointer">저장하기</button>
          </div>
        </aside>
      </div >

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E0; }
      `}</style>
    </div >
  );
};

export default AdminDept;

