import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import { getMyDoc, getPageMyDoc } from './approvalApi';
import useAuthStore from '../../store/authStore';
import useLoadingStore from '../../store/useLoadingStore';
import usePageInfoStore from '../../store/usePageInfoStore';

// 결재선
const ApprovalLineStack = ({ line }) => {
  const displayLimit = 3;
  const displayLine = line.slice(0, displayLimit);
  const remainingCount = line.length > displayLimit ? line.length - displayLimit : 0;
  const token = useAuthStore(state => state.token);

  return (
    <div className="flex items-center">
      <div className="flex items-center -space-x-2">
        {displayLine.map((lineUser, index) => (
          <div
            key={index}
            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shadow-sm overflow-hidden relative group"
            title={`${lineUser.name} ${lineUser.rank_name}`}
          >
            <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-[10px] md:text-[11px] font-bold text-indigo-600 uppercase">
              {
                lineUser?.sysname &&
                <img src={`${import.meta.env.VITE_API_BASE_URL}/file/profile/view?sysname=${lineUser?.sysname}&token=${token}`}
                  alt={lineUser?.name}
                  className="w-full h-full object-cover"
                />
              }
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center shadow-sm z-10">
            <span className="text-[9px] md:text-[10px] font-bold text-indigo-600">+{remainingCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 결재 상태
const StatusBadge = ({ status }) => {
  const styles = {
    'DRAFT': 'bg-[#FFF9F0] text-[#FF9800] border-[#FFF9F0]',
    'APPROVED': 'bg-[#F0FDF4] text-[#10B981] border-[#F0FDF4]',
    'REJECTED': 'bg-[#FFF0F0] text-[#FF4D4F] border-[#FFF0F0]',
    'IN_PROGRESS': 'bg-blue-50 text-blue-600 border-blue-50',
  };

  const statusText = {
    'DRAFT': '결재 대기',
    'IN_PROGRESS': '진행 중',
    'APPROVED': '결재 완료',
    'REJECTED': '반려'
  };

  return (
    <span className={`text-[11px] px-2 py-0.5 md:px-2.5 md:py-1 rounded-full font-bold border whitespace-nowrap ${styles[status] || 'bg-gray-50 text-gray-600'}`}>
      {statusText[status] || status}
    </span>
  );
};

// 현재 결재자
const DocumentTable = ({ data, onDetailClick, showPagination = true, approverLabel = '현재 결재자', count = 0, page = 1, setPage = () => { } }) => {
  const token = useAuthStore(state => state.token);
  const displayData = data;

  const docTypeText = {
    'VACATION': '휴가신청서',
    'PAYMENT': '지출결의서',
    'GENERAL': '일반품의서',
    'PURCHASE': '구매신청서'
  }
  const mobilePageNumbers = (() => {
    if (count <= 0) return [];
    const maxVisible = 5;
    const start = Math.max(1, Math.min(page - 2, count - maxVisible + 1));
    const end = Math.min(count, start + maxVisible - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  })();
  const hasPaginationData = displayData.length > 0 && count > 0;

  const approverName = (doc) => {
    const currentApprover = doc.approvers?.find(
      app => app.status === 'IN_PROGRESS'
    )
    if (currentApprover) {
      return `${currentApprover.name} ${currentApprover.rank_name}`;
    }

    const rejectedApprover = doc.approvers?.find(
      app => app.status === 'REJECTED' && app.reject_reason
    )
    if (rejectedApprover) {
      return `${rejectedApprover.name} ${rejectedApprover.rank_name}`;
    }

    const approvedApprover = [...(doc.approvers)]
      .reverse()
      .find(
        app => app.status === 'APPROVED'
      )
    if (approvedApprover) {
      return `${approvedApprover.name} ${approvedApprover.rank_name}`;
    }
    return "";
  }
  return (
    <>
      <div className="overflow-x-auto custom-scrollbar min-h-[376px]">
        <table className="w-full min-w-[1100px] md:min-w-full text-left border-collapse md:table-fixed">
          <thead>
            <tr className="bg-white text-gray-400 text-[0.8125rem] font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="pl-4 md:pl-6 pr-3 py-3 font-bold w-[22%] whitespace-nowrap">제목</th>
              <th className="px-3 py-3 font-bold w-[11%] whitespace-nowrap">문서 종류</th>
              <th className="px-3 py-3 font-bold w-[12%] whitespace-nowrap">기안자</th>
              <th className="px-3 py-3 font-bold w-[18%] whitespace-nowrap">결재선</th>
              <th className="px-3 py-3 font-bold w-[12%] whitespace-nowrap">{approverLabel}</th>
              <th className="px-3 py-3 font-bold text-center w-[10%] whitespace-nowrap">결재 상태</th>
              <th className="px-3 py-3 font-bold text-center w-[11%] whitespace-nowrap">상세보기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayData.map((doc) => (
              <tr key={doc.doc_seq} className="transition-colors">
                <td className="pl-4 md:pl-6 pr-3 py-4 text-sm font-bold text-gray-700 truncate whitespace-nowrap">{doc.title}</td>
                <td className="px-3 py-4 text-xs font-medium text-gray-500 truncate whitespace-nowrap">{docTypeText[doc.doc_type] || doc.doc_type}</td>
                <td className="px-3 py-4 truncate whitespace-nowrap">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-bold text-gray-600 truncate">{doc.name}</span>
                  </div>
                </td>
                <td className="px-3 py-4">
                  <ApprovalLineStack line={doc.approvers || []} />
                </td>
                <td className="px-3 py-4 text-xs font-bold text-gray-600 truncate whitespace-nowrap">
                  {approverName(doc)}
                </td>
                <td className="px-2 py-0.5 text-[11px] text-center whitespace-nowrap">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="px-3 py-4 text-center whitespace-nowrap">
                  <button
                    onClick={() => onDetailClick(doc)}
                    className="text-[11px] font-bold text-[#3530B8] bg-[#F0F4FF] px-4 py-2 rounded-lg hover:bg-[#3530B8] hover:text-white transition-all"
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
            {displayData.length === 0 && (
              <tr>
                <td colSpan="7" className="py-10 text-center text-gray-400 text-[0.8rem] font-bold">해당 문서가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <div className="hidden md:block py-2 scale-95 origin-center min-h-[48px]">
          {count > 0 ? (
            <Pagination count={count} page={page} onChange={(_, value) => setPage(value)} />
          ) : (
            <div className="h-8" />
          )}
        </div>
      )}
      {showPagination && (
        <div className="md:hidden py-5 flex items-center justify-center gap-1.5">
          <button
            type="button"
            disabled={!hasPaginationData || page <= 1}
            onClick={() => hasPaginationData && page > 1 && setPage(page - 1)}
            className="w-8 h-8 rounded-xl border border-[rgba(0,0,0,0.23)] text-xs font-bold text-[rgba(0,0,0,0.87)] transition-colors hover:bg-[#F0F4FF] hover:text-[#3530B8] disabled:opacity-[0.38] disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[rgba(0,0,0,0.87)]"
          >
            &lt;
          </button>
          {mobilePageNumbers.map(pageNumber => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={`w-8 h-8 rounded-xl border text-xs font-bold transition-colors ${page === pageNumber ? 'bg-[#3530B8] border-[#3530B8] text-white hover:bg-[#2a2594]' : 'border-[rgba(0,0,0,0.23)] text-[rgba(0,0,0,0.87)] hover:bg-[#F0F4FF] hover:text-[#3530B8]'}`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            disabled={!hasPaginationData || page >= count}
            onClick={() => hasPaginationData && page < count && setPage(page + 1)}
            className="w-8 h-8 rounded-xl border border-[rgba(0,0,0,0.23)] text-xs font-bold text-[rgba(0,0,0,0.87)] transition-colors hover:bg-[#F0F4FF] hover:text-[#3530B8] disabled:opacity-[0.38] disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[rgba(0,0,0,0.87)]"
          >
            &gt;
          </button>
        </div>
      )}
    </>
  );
};

// 결재문서 출력 -> 결재문서 디테일로 이동
const ApprovalMyPage = () => {
  const { pages } = usePageInfoStore();
  const navigate = useNavigate();
  const location = useLocation();
  const initialQuery = useMemo(() => new URLSearchParams(location.search), []);
  const initialTab = ['DRAFT', 'IN_PROGRESS', 'APPROVED', 'REJECTED'].includes(initialQuery.get('tab')) ? initialQuery.get('tab') : 'DRAFT';
  const initialDraftPage = Math.max(Number(initialQuery.get('draftPage')) || 1, 1);
  const initialProgressPage = Math.max(Number(initialQuery.get('progressPage')) || 1, 1);
  const initialApprovedPage = Math.max(Number(initialQuery.get('approvedPage')) || 1, 1);
  const initialRejectedPage = Math.max(Number(initialQuery.get('rejectedPage')) || 1, 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('전체 문서');
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const dropdownRef = useRef(null);
  const itemsPerPage = 5;
  const [activeTab, setActiveTab] = useState(initialTab);
  const currentPageInfo = pages.find(p => p.page_code === 'ApprovalMyPage');

  const docTypeMap = {
    '일반품의서': 'GENERAL',
    '지출결의서': 'PAYMENT',
    '휴가신청서': 'VACATION',
    '구매신청서': 'PURCHASE'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTypeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [documents, setDocuments] = useState([]);

  const [draftPage, setDraftPage] = useState(initialDraftPage);
  const [progressPage, setProgressPage] = useState(initialProgressPage);

  const [approvedDocs, setApprovedDocs] = useState([]);
  const [approvedPage, setApprovedPage] = useState(initialApprovedPage);
  const [approvedCount, setApprovedCount] = useState(0);
  const [approvedTotalCount, setApprovedTotalCount] = useState(0);

  const [rejectedDocs, setRejectedDocs] = useState([]);
  const [rejectedPage, setRejectedPage] = useState(initialRejectedPage);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [rejectedTotalCount, setRejectedTotalCount] = useState(0);

  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  useEffect(() => {
    showLoading();
    getMyDoc().then(resp => {
      setDocuments(resp.data);
      hideLoading();
    })
  }, [])

  useEffect(() => {
    getPageMyDoc("APPROVED", approvedPage, searchTerm, docTypeMap[selectedType] || selectedType).then(resp => {
      setApprovedDocs(resp.data.list);
      setApprovedCount(Math.ceil(resp.data.count / 5));
      setApprovedTotalCount(resp.data.count);
    })
  }, [approvedPage, searchTerm, selectedType]);

  useEffect(() => {
    getPageMyDoc("REJECTED", rejectedPage, searchTerm, docTypeMap[selectedType] || selectedType).then(resp => {
      setRejectedDocs(resp.data.list);
      setRejectedCount(Math.ceil(resp.data.count / 5));
      setRejectedTotalCount(resp.data.count);
    })
  }, [rejectedPage, searchTerm, selectedType]);

  const handleOpenDetail = (doc) => {
    navigate(`/approval/detail/${doc.doc_type}/${doc.doc_seq}`);
  };

  const resetPages = () => {
    setDraftPage(1);
    setProgressPage(1);
    setApprovedPage(1);
    setRejectedPage(1);
    updateQuery({ draftPage: 1, progressPage: 1, approvedPage: 1, rejectedPage: 1 });
  };

  const updateQuery = (next = {}) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', next.activeTab || activeTab);
    params.set('draftPage', String(next.draftPage || draftPage));
    params.set('progressPage', String(next.progressPage || progressPage));
    params.set('approvedPage', String(next.approvedPage || approvedPage));
    params.set('rejectedPage', String(next.rejectedPage || rejectedPage));
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    updateQuery({ activeTab: tab });
  };

  const handleDraftPageChange = (page) => {
    setDraftPage(page);
    updateQuery({ draftPage: page });
  };

  const handleProgressPageChange = (page) => {
    setProgressPage(page);
    updateQuery({ progressPage: page });
  };

  const handleApprovedPageChange = (page) => {
    setApprovedPage(page);
    updateQuery({ approvedPage: page });
  };

  const handleRejectedPageChange = (page) => {
    setRejectedPage(page);
    updateQuery({ rejectedPage: page });
  };

  const getFilteredData = (dataList) => {
    return dataList.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === '전체 문서' || selectedType === '전체' || doc.doc_type === docTypeMap[selectedType];
      return matchesSearch && matchesType;
    });
  };

  const filterDocuments = (status) => {
    return getFilteredData(documents.filter(doc => doc.status === status));
  };

  const draftDocs = useMemo(() => filterDocuments('DRAFT'), [documents, searchTerm, selectedType]);
  const progressDocs = useMemo(() => filterDocuments('IN_PROGRESS'), [documents, searchTerm, selectedType]);
  const paginatedDraftDocs = useMemo(() => {
    const start = (draftPage - 1) * itemsPerPage;
    return draftDocs.slice(start, start + itemsPerPage);
  }, [draftDocs, draftPage]);
  const paginatedProgressDocs = useMemo(() => {
    const start = (progressPage - 1) * itemsPerPage;
    return progressDocs.slice(start, start + itemsPerPage);
  }, [progressDocs, progressPage]);

  const tabs = [
    {
      label: '결재 대기중',
      status: 'DRAFT',
      count: draftDocs.length,
      data: paginatedDraftDocs,
      pageCount: Math.ceil(draftDocs.length / itemsPerPage),
      page: draftPage,
      setPage: handleDraftPageChange,
      approverLabel: '현재 결재자',
    },
    {
      label: '결재 진행중',
      status: 'IN_PROGRESS',
      count: progressDocs.length,
      data: paginatedProgressDocs,
      pageCount: Math.ceil(progressDocs.length / itemsPerPage),
      page: progressPage,
      setPage: handleProgressPageChange,
      approverLabel: '현재 결재자',
    },
    {
      label: '결재 완료',
      status: 'APPROVED',
      count: approvedTotalCount,
      data: approvedDocs,
      pageCount: approvedCount,
      page: approvedPage,
      setPage: handleApprovedPageChange,
      approverLabel: '최종 결재자',
    },
    {
      label: '결재 반려',
      status: 'REJECTED',
      count: rejectedTotalCount,
      data: rejectedDocs,
      pageCount: rejectedCount,
      page: rejectedPage,
      setPage: handleRejectedPageChange,
      approverLabel: '최종 결재자',
    },
  ];
  const activeTabData = tabs.find(tab => tab.status === activeTab) || tabs[0];

  return (
    <div className="flex-1 bg-white py-8 px-1 md:px-7 overflow-y-auto md:overflow-hidden custom-scrollbar">
      <div className="max-w-[1450px] mx-auto w-full flex flex-col h-full">
        <div className="mb-6 px-4 md:px-2 flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-bold text-[#121331] tracking-tight">{currentPageInfo?.page_name}</h1>
          <p className="text-xs md:text-sm text-[#8a92a6] mt-1">{currentPageInfo?.page_info}</p>
        </div>

        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-[#edf2f9] p-3 md:p-8 flex flex-col flex-1 md:overflow-hidden min-h-0">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex bg-white rounded-2xl shadow-sm border border-[#edf2f9] p-1 w-full md:w-fit items-center flex-shrink-0 overflow-x-auto custom-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.status}
                  type="button"
                  onClick={() => handleTabChange(tab.status)}
                  className={`flex-1 md:flex-none px-2 md:px-6 py-1.5 rounded-xl text-[11px] md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.status ? 'bg-[#3530B8] text-white shadow-sm' : 'bg-white text-[#8a92a6] hover:bg-[#F0F4FF] hover:text-[#3530B8]'}`}
                >
                  {tab.label}
                  <span className="ml-1.5">({tab.count})</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-end md:items-center">
              <div className="flex gap-2 w-full md:w-auto justify-end">
                <div className="relative w-fit md:w-auto" ref={dropdownRef}>
                  <div
                    onClick={() => setIsTypeOpen(!isTypeOpen)}
                    className="bg-[#f4f7fc] px-4 h-[40px] rounded-xl text-xs text-[#8a92a6] outline-none cursor-pointer flex items-center justify-between gap-3 whitespace-nowrap"
                  >
                    <span>{selectedType}</span>
                    <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {isTypeOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-[#edf2f9] rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                      {['전체 문서', '일반품의서', '지출결의서', '휴가신청서', '구매신청서'].map((type) => (
                        <div
                          key={type}
                          onClick={() => {
                            setSelectedType(type);
                            resetPages();
                            setIsTypeOpen(false);
                          }}
                          className="px-4 py-2.5 text-xs text-[#8a92a6] hover:bg-[#F0F4FF] hover:text-[#3530B8] active:bg-[#F0F4FF] active:text-[#3530B8] cursor-pointer transition-colors whitespace-nowrap"
                        >
                          {type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative flex items-center flex-1 md:w-56">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-4 text-[#8a92a6] text-xs" />
                  <input
                    type="text"
                    placeholder="문서 제목 검색"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); resetPages(); }}
                    className="pl-12 pr-4 h-[40px] bg-[#f4f7fc] rounded-xl text-sm w-full outline-none placeholder:text-[#8a92a6]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 md:overflow-y-auto md:min-h-0 custom-scrollbar">
            <DocumentTable
              data={activeTabData.data}
              count={activeTabData.pageCount}
              page={activeTabData.page}
              setPage={activeTabData.setPage}
              onDetailClick={handleOpenDetail}
              showPagination={true}
              approverLabel={activeTabData.approverLabel}
            />
          </div>
        </div>
      </div>
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

export default ApprovalMyPage;
