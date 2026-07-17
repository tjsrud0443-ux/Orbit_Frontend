import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import { getMyDraftDoc, getPageMyDoneDoc } from './approvalApi';
import useAuthStore from '../../store/authStore';
import useLoadingStore from '../../store/useLoadingStore';
import usePageInfoStore from '../../store/usePageInfoStore';

// --- Sub Components ---

const StatusBadge = ({ status, type = 'personal' }) => {
  const styles = {
    'DRAFT':'bg-[#FFF9F0] text-[#FF9800] border-[#FFF9F0]',
    'IN_PROGRESS': 'bg-[#FFF9F0] text-[#FF9800] border-[#FFF9F0]',
    'APPROVED': 'bg-[#F0FDF4] text-[#10B981] border-[#F0FDF4]',
    'REJECTED': 'bg-[#FFF0F0] text-[#FF4D4F] border-[#FFF0F0]'
  };

  const documentStatusText = {
    'DRAFT':'결재 진행',
    'IN_PROGRESS': '결재 진행',
    'APPROVED': '최종 승인',
    'REJECTED': '최종 반려'
  };

  const personalStatusText = {
    'IN_PROGRESS': '결재 대기',
    'APPROVED': '승인',
    'REJECTED': '반려'
  };

  const statusText = type === 'document' ? documentStatusText : personalStatusText;

  return (
    <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold border whitespace-nowrap ${styles[status] || 'bg-gray-50 text-gray-600'}`}>
      {statusText[status] || status}
    </span>
  );
};

const DocumentTable = ({ data, onDetailClick, showPagination = true, count = 0, page = 1, setPage = () => { } }) => {
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

  return (
    <>
      <div className="overflow-x-auto custom-scrollbar min-h-[376px]">
        <table className="w-full min-w-[1000px] md:min-w-full text-left border-collapse md:table-fixed">
          <thead>
            <tr className="bg-white text-gray-400 text-[0.8125rem] font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="pl-4 md:pl-6 pr-3 py-3 w-[27%] whitespace-nowrap">제목</th>
              <th className="px-3 py-3 w-[15%] whitespace-nowrap">문서 종류</th>
              <th className="px-3 py-3 w-[13%] whitespace-nowrap">기안자</th>
              <th className="px-3 py-3 text-center w-[12%] whitespace-nowrap">기안일</th>
              <th className="px-3 py-3 text-center w-[11%] whitespace-nowrap">문서 상태</th>
              <th className="px-3 py-3 text-center w-[11%] whitespace-nowrap">개인 상태</th>
              <th className="px-3 py-3 text-center w-[11%] whitespace-nowrap">상세보기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayData.map((doc) => (
              <tr key={doc.doc_seq} className="transition-colors">
                <td className="pl-4 md:pl-6 pr-3 py-4 text-sm font-bold text-gray-700 truncate whitespace-nowrap">{doc.title}</td>
                <td className="px-3 py-4 text-xs font-medium text-gray-500 truncate whitespace-nowrap">{docTypeText[doc.doc_type] || doc.doc_type}</td>
                <td className="px-3 py-4 truncate whitespace-nowrap">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-slate-200 flex items-center justify-center text-[9px] md:text-[10px] overflow-hidden aspect-square">
                      {
                        doc?.sysname &&
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL}/file/profile/view?sysname=${doc?.sysname}&token=${token}`}
                          alt={doc.name}
                          className="w-full h-full object-cover"
                        />
                      }
                    </div>
                    <span className="text-xs font-bold text-gray-600 truncate">{doc.name}</span>
                  </div>
                </td>
                <td className="px-3 py-4 text-xs font-medium text-gray-400 text-center truncate whitespace-nowrap">{doc.created_at?.substring(0, 10)}</td>
                <td className="px-3 py-4 text-center whitespace-nowrap">
                  <StatusBadge status={doc.status} type="document" />
                </td>
                <td className="px-3 py-4 text-center whitespace-nowrap">
                  <StatusBadge status={doc.my_approval_status} type="personal" />
                </td>
                <td className="px-3 py-4 text-center whitespace-nowrap">
                  <button
                    onClick={() => onDetailClick(doc)}
                    className="text-xs font-bold text-[#3530B8] bg-[#F0F4FF] px-4 py-2 rounded-lg hover:bg-[#3530B8] hover:text-white transition-all"
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

const ApprovalInbox = () => {
  const { pages } = usePageInfoStore();
  const navigate = useNavigate();
  const location = useLocation();
  const initialQuery = useMemo(() => new URLSearchParams(location.search), []);
  const initialTab = initialQuery.get('tab') === 'DONE' ? 'DONE' : 'PENDING';
  const initialDraftPage = Math.max(Number(initialQuery.get('draftPage')) || 1, 1);
  const initialDonePage = Math.max(Number(initialQuery.get('donePage')) || 1, 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('전체 문서');
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const dropdownRef = useRef(null);
  const itemsPerPage = 5;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [draftPage, setDraftPage] = useState(initialDraftPage);

  const currentPageInfo = pages.find(p => p.page_code === 'ApprovalInbox');
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

  const docTypeMap = {
    '일반품의서': 'GENERAL',
    '지출결의서': 'PAYMENT',
    '휴가신청서': 'VACATION',
    '구매신청서': 'PURCHASE'
  };

  // ?곸꽭 蹂닿린 踰꾪듉 ?대┃ ??ApprovalDetail ?섏씠吏濡??대룞
  const handleOpenDetail = (doc) => {
    // ApprovalDetail.jsx??寃쎈줈 洹쒖튃???곕씪 /approval/detail/:type/:docId 濡??대룞
    navigate(`/approval/detail/${doc.doc_type}/${doc.doc_seq}`);
  };

  const filterDocuments = (docs) => {
    return docs.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const docTypeText = {
        'VACATION': '휴가신청서',
        'PAYMENT': '지출결의서',
        'GENERAL': '일반품의서',
        'PURCHASE': '구매신청서'
      }

      const matchesType =
        selectedType === '전체 문서' ||
        selectedType === '전체' ||
        doc.doc_type === docTypeMap[selectedType];

      return matchesSearch && matchesType;
    });
  };

  const [draftDocument, setDraftDocuments] = useState([]);
  const [doneDocument, setDoneDocument] = useState([]);
  const [doneDocumentPage, setDoneDocumentPage] = useState(initialDonePage);
  const [doneDocumentCount, setDoneDocumentCount] = useState(0);
  const [doneDocumentTotalCount, setDoneDocumentTotalCount] = useState(0);
  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  useEffect(() => {
    showLoading();
    getMyDraftDoc().then(resp => {
      setDraftDocuments(resp.data);
      hideLoading();
    })
  }, []);

  useEffect(() => {
    getPageMyDoneDoc(doneDocumentPage, searchTerm, docTypeMap[selectedType] || selectedType).then(resp => {
      setDoneDocument(resp.data.list);
      setDoneDocumentCount(Math.ceil(resp.data.count / 5));
      setDoneDocumentTotalCount(resp.data.count);
    })
  }, [doneDocumentPage, searchTerm, selectedType])

  const updateQuery = (next = {}) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', next.activeTab || activeTab);
    params.set('draftPage', String(next.draftPage || draftPage));
    params.set('donePage', String(next.donePage || doneDocumentPage));
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

  const handleDonePageChange = (page) => {
    setDoneDocumentPage(page);
    updateQuery({ donePage: page });
  };

  const resetPages = () => {
    setDraftPage(1);
    setDoneDocumentPage(1);
    updateQuery({ draftPage: 1, donePage: 1 });
  };

  const filteredDraftDocuments = useMemo(() => filterDocuments(draftDocument), [draftDocument, searchTerm, selectedType]);
  const paginatedDraftDocuments = useMemo(() => {
    const start = (draftPage - 1) * itemsPerPage;
    return filteredDraftDocuments.slice(start, start + itemsPerPage);
  }, [filteredDraftDocuments, draftPage]);

  const tabs = [
    {
      label: '결재 대기중',
      status: 'PENDING',
      count: filteredDraftDocuments.length,
      data: paginatedDraftDocuments,
      pageCount: Math.ceil(filteredDraftDocuments.length / itemsPerPage),
      page: draftPage,
      setPage: handleDraftPageChange,
    },
    {
      label: '결재 완료',
      status: 'DONE',
      count: doneDocumentTotalCount,
      data: doneDocument,
      pageCount: doneDocumentCount,
      page: doneDocumentPage,
      setPage: handleDonePageChange,
    },
  ];
  const activeTabData = tabs.find(tab => tab.status === activeTab) || tabs[0];

  return (
    <div className="flex-1 bg-white py-8 px-1 md:px-7 overflow-y-auto md:overflow-hidden custom-scrollbar">
      <div className="max-w-[1450px] mx-auto w-full flex flex-col h-full">

        {/* Title & Description */}
        <div className="mb-6 px-4 md:px-2 flex-shrink-0">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{currentPageInfo?.page_name}</h1>
            <p className="text-xs text-slate-500 font-medium">{currentPageInfo?.page_info}</p>
          </div>

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

          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto focus-within:ring-2 focus-within:ring-[#3530B8]/20 focus-within:border-[#3530B8] transition-all">
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setIsTypeOpen(!isTypeOpen)}
                className="px-3 py-1.5 text-xs bg-slate-50 border-none rounded-lg text-slate-400 font-medium cursor-pointer outline-none flex items-center justify-between min-w-[100px]"
              >
                <span>{selectedType}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`ml-2 text-[10px] transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} />
              </div>
              {isTypeOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                  {['전체 문서', '일반품의서', '지출결의서', '휴가신청서', '구매신청서'].map((type) => (
                    <div
                      key={type}
                      onClick={() => {
                        setSelectedType(type);
                        resetPages();
                        setIsTypeOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:bg-[#F0F4FF] hover:text-[#3530B8] active:bg-[#F0F4FF] active:text-[#3530B8] cursor-pointer transition-colors"
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>
            <div className="relative flex-1 md:w-56">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="문서 제목 검색"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); resetPages(); }}
                className="w-full pl-9 pr-3 py-1.5 text-xs border-none focus:ring-0 placeholder:text-slate-400 outline-none bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 md:overflow-y-auto md:min-h-0 custom-scrollbar">
          <DocumentTable
            title="결재 완료"
            data={activeTabData.data}
            onDetailClick={handleOpenDetail}
            count={activeTabData.pageCount}
            page={activeTabData.page}
            setPage={activeTabData.setPage}
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

export default ApprovalInbox;


