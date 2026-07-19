import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faChevronRight, faTimes, faPlus, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import useLoadingStore from '../../store/useLoadingStore';
import usePageInfoStore from '../../store/usePageInfoStore';
import { getRankList, getDeptList, getApprovalLines, saveApprovalLines, deleteApprovalLine } from './adminApi';
import { alertWarning, alertConfirm, alertSuccess, alertError } from '../../utils/alert';

const CustomSelect = ({ value, options, onChange, placeholder, hasError, errorMessage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={selectRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-2 py-1.5 md:px-4 md:py-2 bg-white border ${hasError ? 'border-red-500' : 'border-gray-200'} rounded-lg text-[10px] md:text-sm font-bold text-gray-700 flex items-center justify-between cursor-pointer hover:border-[#3530B8] transition-all gap-1`}
            >
                <span className="truncate">{value ? options.find(o => o.value === value)?.label : <span className="text-gray-400">{placeholder}</span>}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`text-[8px] md:text-[10px] text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-[100] bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95">
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={`p-2 md:p-3 hover:bg-[#F0F4FF] cursor-pointer text-[10px] md:text-xs font-bold text-gray-700 border-b border-gray-50 last:border-0 ${value === opt.value ? 'bg-[#F0F4FF]' : ''}`}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
            {hasError && <p className="text-red-500 text-[10px] mt-1 ml-1">{errorMessage}</p>}
        </div>
    );
};

const AdminApprovalLine = () => {
    const { pages } = usePageInfoStore();
    const showLoading = useLoadingStore(state => state.showLoading);
    const hideLoading = useLoadingStore(state => state.hideLoading);

    const DOC_TYPES = {
        '휴가 신청서': 'VACATION',
        '지출 결의서': 'PAYMENT',
        '일반 품의서': 'GENERAL',
        '구매 신청서': 'PURCHASE'
    };
    const tabs = Object.keys(DOC_TYPES);

    const [ranks, setRanks] = useState([]);
    const [deptList, setDeptList] = useState([]);
    const [activeTab, setActiveTab] = useState('휴가 신청서');

    // 모달 관련 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRankSeq, setEditingRankSeq] = useState(null);
    const [editingRankName, setEditingRankName] = useState('');
    const [editingLines, setEditingLines] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    const [approvalLines, setApprovalLines] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                showLoading();
                const rankResp = await getRankList();
                setRanks(rankResp.data || []);
                const deptResp = await getDeptList();
                setDeptList(deptResp.data || []);
                const lineResp = await getApprovalLines(DOC_TYPES['휴가 신청서']);
                setApprovalLines(lineResp.data || []);
            } catch (err) {
                console.error("데이터 로드 실패:", err);
            } finally {
                hideLoading();
            }
        };
        fetchInitialData();
    }, []);

    const handleTabChange = async (tab) => {
        setActiveTab(tab);
        try {
            showLoading();
            const lineResp = await getApprovalLines(DOC_TYPES[tab]);
            setApprovalLines(lineResp.data || []);
        } catch (err) {
            console.error("결재선 로드 실패:", err);
        } finally {
            hideLoading();
        }
    };

    const currentPageInfo = pages.find(p => p.page_code === 'AdminApprovalLine');

    // 기안자 직급(rank)별 결재선 렌더링 함수
    const renderApprovalLine = (rankSeq) => {
        const lines = approvalLines
            .filter(line => line.doc_type === DOC_TYPES[activeTab] && line.drafter_rank_seq === rankSeq)
            .sort((a, b) => a.step_order - b.step_order);

        if (lines.length === 0) return null;

        return (
            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto no-scrollbar w-full">
                {lines.map((line, idx) => {
                    let scopeText = "";
                    if (line.approver_scope === 'DRAFTER_DEPT') {
                        scopeText = "(기안자 소속)";
                    } else if (line.approver_scope === 'SPECIFIC_DEPT') {
                        scopeText = `(${line.dept_name})`;
                    }

                    return (
                        <div key={line.step_order} className="flex items-center gap-2">
                            <span className="bg-[#F0F4FF] text-[#3530B8] text-xs font-bold px-3 py-1.5 rounded-lg border border-[#3530B8]/10 shadow-sm whitespace-nowrap">
                                {line.rank_name} {scopeText && <span className="font-medium text-[10px] ml-1 opacity-80">{scopeText}</span>}
                            </span>
                            {idx < lines.length - 1 && (
                                <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 text-[10px]" />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const handleEditClick = (rank) => {
        setEditingRankSeq(rank.rank_seq);
        setEditingRankName(rank.rank_name);
        setValidationErrors({});

        // 현재 선택된 탭과 직급의 결재선 불러오기
        const lines = approvalLines
            .filter(line => line.doc_type === DOC_TYPES[activeTab] && line.drafter_rank_seq === rank.rank_seq)
            .sort((a, b) => a.step_order - b.step_order)
            .map(line => ({ ...line }));

        setEditingLines(lines);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (doc_type, rank_seq) => {
        const result = await alertConfirm('정말 삭제하시겠습니까?', '삭제 후 복구는 불가합니다.');
        if (result.isConfirmed) {
            try {
                showLoading();
                await deleteApprovalLine(doc_type, rank_seq);
                const lineResp = await getApprovalLines(DOC_TYPES[activeTab]);
                setApprovalLines(lineResp.data || []);
                hideLoading();
                await alertSuccess('삭제 완료', '결재선 삭제가 완료되었습니다.');
            } catch (error) {
                console.error('결재선 삭제 실패:', error);
                hideLoading();
                await alertError('오류 발생', '결재선이 삭제 중 오류가 발생했습니다.');
            }
        }
    }

    const handleAddStep = () => {
        setEditingLines([
            ...editingLines,
            {
                step_order: editingLines.length + 1,
                doc_type: DOC_TYPES[activeTab],
                drafter_rank_seq: editingRankSeq,
                approver_rank_seq: null,
                approver_scope: '',
                target_dept_seq: null
            }
        ]);
    };

    const handleRemoveStep = (index) => {
        const newLines = editingLines.filter((_, idx) => idx !== index);
        // 번호 재정렬
        newLines.forEach((line, idx) => {
            line.step_order = idx + 1;
        });
        setEditingLines(newLines);
        setValidationErrors({});
    };

    const handleLineChange = (index, field, value) => {
        const newLines = [...editingLines];
        newLines[index][field] = value;
        if (field === 'approver_scope' && value !== 'SPECIFIC_DEPT') {
            newLines[index].target_dept_seq = '';
        }
        setEditingLines(newLines);
        setValidationErrors(prev => {
            const next = { ...prev };
            delete next[`${index}_${field}`];
            if (field === 'approver_scope') delete next[`${index}_target_dept_seq`];
            return next;
        });
    };

    const handleSaveLines = async () => {
        if (editingLines.length === 0) {
            alertWarning("정보 미입력", "한 단계 이상의 결재선을 지정해주세요.");
            return;
        }

        let hasError = false;
        const newErrors = {};

        editingLines.forEach((line, idx) => {
            if (!line.approver_scope) {
                newErrors[`${idx}_approver_scope`] = '검색 범위를 선택해주세요.';
                hasError = true;
            }
            if (line.approver_scope === 'SPECIFIC_DEPT' && !line.target_dept_seq) {
                newErrors[`${idx}_target_dept_seq`] = '대상 부서를 선택해주세요.';
                hasError = true;
            }
            if (!line.approver_rank_seq) {
                newErrors[`${idx}_approver_rank_seq`] = '검색 직급을 선택해주세요.';
                hasError = true;
            }
        });

        if (hasError) {
            setValidationErrors(newErrors);
            return;
        }

        try {
            showLoading();
            await saveApprovalLines(DOC_TYPES[activeTab], editingRankSeq, editingLines);
            const lineResp = await getApprovalLines(DOC_TYPES[activeTab]);
            setApprovalLines(lineResp.data || []);
            setIsModalOpen(false);
        } catch (err) {
            console.error("저장 실패:", err);
        } finally {
            hideLoading();
        }
    };

    return (
        <div className="h-full flex flex-col bg-white font-sans p-3 md:p-8">
            {/* 타이틀 영역 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4 mb-4 md:mb-6 flex-shrink-0">
                <div className="space-y-1">
                    <h1 className="text-[1.25rem] md:text-[1.5rem] font-bold text-slate-900 mb-0 md:mb-1 tracking-tight">
                        {currentPageInfo?.page_name}
                    </h1>
                    <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
                        {currentPageInfo?.page_info}
                    </p>
                </div>
            </div>

            {/* 탭 영역 */}
            <div className="flex gap-8 border-b border-gray-100 mb-6 flex-shrink-0 overflow-x-auto no-scrollbar">
                {tabs.map((tab, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleTabChange(tab)}
                        className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab
                            ? 'text-[#3530B8]'
                            : 'text-gray-400 hover:text-[#3530B8]'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#3530B8] rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* 목록 영역 */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl md:rounded-[2rem] border border-[#F0F4FF] shadow-sm overflow-hidden min-h-0">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-white border-b border-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="py-4 pl-6 md:pl-16 pr-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap w-[20%] md:w-[15%]">기안자 직급</th>
                                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[55%] md:w-[60%]">기본 결재선</th>
                                <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-[25%] md:w-[25%]">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {ranks.map((rank) => (
                                <tr key={rank.rank_seq} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 pl-6 md:pl-16 pr-4 text-sm font-bold text-slate-700 whitespace-nowrap">
                                        {rank.rank_name}
                                    </td>
                                    <td className="py-4 px-6">
                                        {renderApprovalLine(rank.rank_seq)}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEditClick(rank)}
                                                className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-[#3530B8] transition-all flex items-center justify-center cursor-pointer"
                                                title="수정"
                                            >
                                                <FontAwesomeIcon icon={faEdit} className="text-xs" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(DOC_TYPES[activeTab], rank.rank_seq)}
                                                className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center cursor-pointer"
                                                title="삭제"
                                            >
                                                <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {ranks.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="py-12 text-center text-gray-400 text-sm font-bold">
                                        등록된 직급이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 결재선 수정 모달 */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-4 md:p-6 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-[13px] sm:text-md md:text-lg font-bold text-gray-900 whitespace-nowrap md:whitespace-normal truncate">
                                {activeTab} - {editingRankName} 직급 기본 결재선 수정
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                            <div className="flex justify-end mb-2">
                                <button
                                    onClick={handleAddStep}
                                    className="text-xs font-bold text-[#3530B8] bg-[#F0F4FF] hover:bg-[#3530B8] hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    단계 추가
                                </button>
                            </div>

                            {editingLines.map((line, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#3530B8] text-white flex items-center justify-center text-xs font-bold shadow-md flex-shrink-0">
                                                {line.step_order}
                                            </div>
                                            <span className="text-xs md:text-sm font-bold text-gray-700">{line.step_order}단계 결재자</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveStep(idx)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>

                                    <div className="flex gap-2 md:gap-4">
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <label className="text-[10px] md:text-xs font-bold text-gray-400 whitespace-nowrap block truncate">검색 범위</label>
                                            <CustomSelect
                                                value={line.approver_scope}
                                                options={[
                                                    { value: 'DRAFTER_DEPT', label: '기안자의 소속 조직' },
                                                    { value: 'SPECIFIC_DEPT', label: '지정 부서' }
                                                ]}
                                                onChange={(val) => handleLineChange(idx, 'approver_scope', val)}
                                                placeholder="선택"
                                                hasError={!!validationErrors[`${idx}_approver_scope`]}
                                                errorMessage={validationErrors[`${idx}_approver_scope`]}
                                            />
                                        </div>

                                        {line.approver_scope === 'SPECIFIC_DEPT' && (
                                            <div className="flex-1 space-y-1.5 min-w-0">
                                                <label className="text-[10px] md:text-xs font-bold text-gray-400 whitespace-nowrap block truncate">대상 부서</label>
                                                <CustomSelect
                                                    value={line.target_dept_seq}
                                                    options={deptList.map(d => ({ value: d.dept_seq, label: d.dept_name }))}
                                                    onChange={(val) => handleLineChange(idx, 'target_dept_seq', val)}
                                                    placeholder="선택"
                                                    hasError={!!validationErrors[`${idx}_target_dept_seq`]}
                                                    errorMessage={validationErrors[`${idx}_target_dept_seq`]}
                                                />
                                            </div>
                                        )}

                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <label className="text-[10px] md:text-xs font-bold text-gray-400 whitespace-nowrap block truncate">검색 직급</label>
                                            <CustomSelect
                                                value={line.approver_rank_seq}
                                                options={ranks.map(r => ({ value: r.rank_seq, label: r.rank_name }))}
                                                onChange={(val) => handleLineChange(idx, 'approver_rank_seq', val)}
                                                placeholder="선택"
                                                hasError={!!validationErrors[`${idx}_approver_rank_seq`]}
                                                errorMessage={validationErrors[`${idx}_approver_rank_seq`]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {editingLines.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-[10px] sm:text-[11px] md:text-sm font-bold whitespace-nowrap md:whitespace-normal">
                                    등록된 결재선이 없습니다. 단계 추가를 눌러 설정해주세요.
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-50 flex justify-center gap-3 bg-white">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-24 py-2 border border-gray-200 text-gray-500 text-sm font-bold rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
                                취소
                            </button>
                            <button
                                onClick={handleSaveLines}
                                className="w-24 py-2 bg-[#3530B8] text-white text-sm font-bold rounded-xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all cursor-pointer">
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminApprovalLine;