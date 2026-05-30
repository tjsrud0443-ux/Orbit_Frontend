import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faCheckCircle, 
  faTimesCircle, 
  faUser,
  faSignature,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';

// --- Dummy Data ---
// typeKey는 ApprovalDetail.jsx의 URL 파라미터 및 경로 인식 로직에 맞춤
const PENDING_DOCUMENTS = [
  { id: 1, title: '2024년 상반기 사무용품 구매 신청', type: '구매신청서', typeKey: 'purchase', drafter: '김철수 대리', date: '2024-05-20', status: '결재 대기' },
  { id: 2, title: '연차 휴가 신청서 (6/1 ~ 6/3)', type: '휴가신청서', typeKey: 'vacation', drafter: '이영희 사원', date: '2024-05-22', status: '결재 대기' },
  { id: 3, title: '영업부 외부 미팅 비용 정산', type: '지출결의서', typeKey: 'payment', drafter: '박지민 과장', date: '2024-05-23', status: '결재 대기' },
  { id: 4, title: '신규 프로젝트 추진 기안문', type: '일반품의서', typeKey: 'general', drafter: '최동현 차장', date: '2024-05-24', status: '결재 대기' },
  { id: 5, title: '출장 보고서 및 비용 정산', type: '지출결의서', typeKey: 'payment', drafter: '정수빈 사원', date: '2024-05-25', status: '결재 대기' },
];

const COMPLETED_DOCUMENTS = [
  { id: 101, title: '개발팀 신규 서버 도입 건', type: '구매신청서', typeKey: 'purchase', drafter: '강하늘 과장', date: '2024-05-10', status: '결재 완료' },
  { id: 102, title: '재택근무 신청 (5/15)', type: '휴가신청서', typeKey: 'vacation', drafter: '오진우 대리', date: '2024-05-12', status: '반려' },
  { id: 103, title: '마케팅 협력업체 계약 검토', type: '일반품의서', typeKey: 'general', drafter: '한소희 대리', date: '2024-05-15', status: '결재 완료' },
];

// --- Sub Components ---

const StatusBadge = ({ status }) => {
  const styles = {
    '결재 대기': 'bg-[#FFF9F0] text-[#FF9800] border-[#FFF9F0]',
    '결재 완료': 'bg-[#F0FDF4] text-[#10B981] border-[#F0FDF4]',
    '반려': 'bg-[#FFF0F0] text-[#FF4D4F] border-[#FFF0F0]'
  };

  return (
    <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold border whitespace-nowrap ${styles[status] || 'bg-gray-50 text-gray-600'}`}>
      {status}
    </span>
  );
};

const DocumentTable = ({ title, data, onDetailClick, showPagination = true }) => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const count = Math.ceil(data.length / itemsPerPage);

  // 페이지네이션 비활성화 시 전체 데이터 표시, 활성화 시 슬라이싱
  const displayData = showPagination 
    ? data.slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : data;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3">
      <div className="pl-4 md:pl-6 pr-4 py-3 border-b border-slate-100 bg-white">
        <h3 className="text-base md:text-lg font-bold text-slate-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] md:min-w-full text-left border-collapse md:table-fixed">
          <thead>
            <tr className="bg-white text-gray-400 text-[0.8125rem] font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="pl-4 md:pl-6 pr-3 py-3 w-[35%] whitespace-nowrap">제목</th>
              <th className="px-3 py-3 w-[18%] whitespace-nowrap">문서 종류</th>
              <th className="px-3 py-3 w-[15%] whitespace-nowrap">기안자</th>
              <th className="px-3 py-3 text-center w-[14%] whitespace-nowrap">기안일</th>
              <th className="px-3 py-3 text-center w-[10%] whitespace-nowrap">결재 상태</th>
              <th className="px-3 py-3 text-center w-[8%] whitespace-nowrap">상세보기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayData.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="pl-4 md:pl-6 pr-3 py-4 text-xs font-bold text-gray-700 truncate whitespace-nowrap">{doc.title}</td>
                <td className="px-3 py-4 text-xs font-medium text-gray-500 truncate whitespace-nowrap">{doc.type}</td>
                <td className="px-3 py-4 truncate whitespace-nowrap">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-slate-200 flex items-center justify-center text-[9px] md:text-[10px]">
                      <FontAwesomeIcon icon={faUser} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-600 truncate">{doc.drafter}</span>
                  </div>
                </td>
                <td className="px-3 py-4 text-xs font-medium text-gray-400 text-center truncate whitespace-nowrap">{doc.date}</td>
                <td className="px-3 py-4 text-center whitespace-nowrap">
                  <StatusBadge status={doc.status} />
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
                <td colSpan="6" className="py-10 text-center text-gray-400 text-[0.7rem] font-bold">해당 문서가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <div className="py-2 scale-95 origin-center">
          <Pagination count={count} page={page} onChange={(_, value) => setPage(value)} />
        </div>
      )}
    </div>
  );
};

const ApprovalInbox = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('전체');

  // 상세 보기 버튼 클릭 시 ApprovalDetail 페이지로 이동
  const handleOpenDetail = (doc) => {
    // ApprovalDetail.jsx의 경로 규칙에 따라 /approval/detail/:type/:docId 로 이동
    navigate(`/approval/detail/${doc.typeKey}/${doc.id}`);
  };

  const filterDocuments = (docs) => {
    return docs.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === '전체 문서' || selectedType === '전체' || doc.type === selectedType;
      return matchesSearch && matchesType;
    });
  };

  return (
    <div className="flex-1 bg-white overflow-y-auto p-5 lg:p-6">
      <div className="max-w-[1440px] mx-auto space-y-10">
        
        {/* Title & Description */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">결재할 문서함</h1>
            <p className="text-xs text-slate-500 font-medium">나의 승인을 기다리는 문서와 이미 처리된 문서를 확인하세요.</p>
          </div>
          
          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto focus-within:ring-2 focus-within:ring-[#3530B8]/20 focus-within:border-[#3530B8] transition-all">
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border-none rounded-lg focus:ring-0 text-slate-600 font-medium cursor-pointer outline-none"
            >
              <option>전체 문서</option>
              <option>일반품의서</option>
              <option>지출결의서</option>
              <option>휴가신청서</option>
              <option>구매신청서</option>
            </select>
            <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>
            <div className="relative flex-1 md:w-56">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input 
                type="text" 
                placeholder="문서 제목 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border-none focus:ring-0 placeholder:text-slate-400 outline-none bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          <DocumentTable 
            title="결재 대기중" 
            data={filterDocuments(PENDING_DOCUMENTS)} 
            onDetailClick={handleOpenDetail} 
            showPagination={false}
          />
          <DocumentTable 
            title="결재 완료" 
            data={filterDocuments(COMPLETED_DOCUMENTS)} 
            onDetailClick={handleOpenDetail} 
          />
        </div>
      </div>
    </div>
  );
};

export default ApprovalInbox;
