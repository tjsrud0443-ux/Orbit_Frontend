import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faUser,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import { getMyDoc, getPageMyDoc } from './approvalApi';
import useAuthStore from '../../store/authStore';
import useLoadingStore from '../../store/useLoadingStore';

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
                  <img src={`https://api.sukong.shop/file/profile/view?sysname=${lineUser?.sysname}&token=${token}`}
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
const DocumentTable = ({ title, data, onDetailClick, showPagination = true, approverLabel = '현재 결재자', count = 0, page = 1, setPage = () => { } }) => {
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3">
      <div className="pl-4 md:pl-6 pr-4 py-3 border-b border-slate-100 bg-white">
        <h3 className="text-base md:text-lg font-bold text-slate-800">{title}</h3>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
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
      {showPagination && count > 0 && (
        <div className="hidden md:block py-2 scale-95 origin-center">
          <Pagination count={count} page={page} onChange={(_, value) => setPage(value)} />
        </div>
      )}
      {showPagination && (
        <div className="md:hidden py-5 flex items-center justify-center gap-1.5">
          <button
            type="button"
            disabled={!hasPaginationData || page <= 1}
            onClick={() => hasPaginationData && page > 1 && setPage(page - 1)}
            className="w-8 h-8 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 transition-colors hover:bg-[#F0F4FF] hover:text-[#3530B8] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500"
          >
            &lt;
          </button>
          {mobilePageNumbers.map(pageNumber => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={`w-8 h-8 rounded-xl border text-xs font-bold transition-colors ${page === pageNumber ? 'bg-[#3530B8] border-[#3530B8] text-white hover:bg-[#2a2594]' : 'border-slate-200 text-slate-500 hover:bg-[#F0F4FF] hover:text-[#3530B8]'}`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            disabled={!hasPaginationData || page >= count}
            onClick={() => hasPaginationData && page < count && setPage(page + 1)}
            className="w-8 h-8 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 transition-colors hover:bg-[#F0F4FF] hover:text-[#3530B8] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

// 결재문서 출력 -> 결재문서 디테일로 이동
const ApprovalMyPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('전체 문서');
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const [approvedDocs, setApprovedDocs] = useState([]);
  const [approvedPage, setApprovedPage] = useState(1);
  const [approvedCount, setApprovedCount] = useState(0);

  const [rejectedDocs, setRejectedDocs] = useState([]);
  const [rejectedPage, setRejectedPage] = useState(1);
  const [rejectedCount, setRejectedCount] = useState(0);

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
    })
  }, [approvedPage, searchTerm, selectedType]);

  useEffect(() => {
    getPageMyDoc("REJECTED", rejectedPage, searchTerm, docTypeMap[selectedType] || selectedType).then(resp => {
      setRejectedDocs(resp.data.list);
      setRejectedCount(Math.ceil(resp.data.count / 5));
    })
  }, [rejectedPage, searchTerm, selectedType]);

  const handleOpenDetail = (doc) => {
    navigate(`/approval/detail/${doc.doc_type}/${doc.doc_seq}`);
  };

  const docTypeMap = {
    '일반품의서': 'GENERAL',
    '지출결의서': 'PAYMENT',
    '휴가신청서': 'VACATION',
    '구매신청서': 'PURCHASE'
  };

  const getFilteredData = (dataList) => {
    return dataList.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const docTypeText = {
        'VACATION': '휴가신청서',
        'PAYMENT': '지출결의서',
        'GENERAL': '일반품의서',
        'PURCHASE': '구매신청서'
      }
      const matchesType = selectedType === '전체 문서' || selectedType === '전체' || doc.doc_type === docTypeMap[selectedType];
      return matchesSearch && matchesType;
    });
  };

  const filterDocuments = (status) => {
    return getFilteredData(documents.filter(doc => doc.status === status));
  };

  return (
    <div className="flex-1 bg-white md:overflow-hidden flex flex-col p-5 lg:p-6 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col h-full space-y-10">

        {/* Title & Description */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 flex-shrink-0">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">나의 전자결재</h1>
            <p className="text-xs text-slate-500 font-medium">전자결재 문서의 진행 현황과 상세 정보를 확인하세요.</p>
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
                        setApprovedPage(1); 
                        setRejectedPage(1); 
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
                placeholder="문서 제목 검색..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setApprovedPage(1); setRejectedPage(1); }}
                className="w-full pl-9 pr-3 py-1.5 text-xs border-none focus:ring-0 placeholder:text-slate-400 outline-none bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-1">
          <DocumentTable
            title="결재 대기중"
            data={filterDocuments('DRAFT')}
            onDetailClick={handleOpenDetail}
            showPagination={false}
          />
          <DocumentTable
            title="결재 진행 중"
            data={filterDocuments('IN_PROGRESS')}
            onDetailClick={handleOpenDetail}
            showPagination={false}
          />
          <DocumentTable
            title="결재 완료"
            data={approvedDocs}
            count={approvedCount}
            page={approvedPage}
            setPage={setApprovedPage}
            onDetailClick={handleOpenDetail}
            showPagination={true}
            approverLabel="최종 결재자"
          />
          <DocumentTable
            title="결재 반려"
            data={rejectedDocs}
            count={rejectedCount}
            page={rejectedPage}
            setPage={setRejectedPage}
            onDetailClick={handleOpenDetail}
            showPagination={true}
            approverLabel="최종 결재자"
          />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
    </div>
  );
};

export default ApprovalMyPage;
