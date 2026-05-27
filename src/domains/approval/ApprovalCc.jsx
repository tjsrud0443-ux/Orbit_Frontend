import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';

// --- Dummy Data ---
const CC_DOCUMENTS = [
  { id: 201, title: '2024년 2분기 마케팅 예산 편성 안', type: '일반기안서', typeKey: 'general', drafter: '홍길동 과장', date: '2024-05-20', status: '결재 대기' },
  { id: 202, title: '신규 협력업체 계약 검토 요청', type: '일반기안서', typeKey: 'general', drafter: '이몽룡 대리', date: '2024-05-21', status: '진행 중' },
  { id: 203, title: '영업부 하반기 전략 회의 비용', type: '지출결의서', typeKey: 'payment', drafter: '성춘향 팀장', date: '2024-05-22', status: '결재 완료' },
  { id: 204, title: '전사 하계 워크숍 장소 선정', type: '구매신청서', typeKey: 'purchase', drafter: '임꺽정 차장', date: '2024-05-23', status: '반려' },
  { id: 205, title: 'IT 자산 교체 주기 변경 기안', type: '일반기안서', typeKey: 'general', drafter: '장길산 대리', date: '2024-05-24', status: '결재 완료' },
  { id: 206, title: '법인카드 부정 사용 방지 가이드라인', type: '일반기안서', typeKey: 'general', drafter: '홍길동 과장', date: '2024-05-25', status: '반려' },
];

// --- Sub Components ---

const StatusBadge = ({ status }) => {
  const styles = {
    '결재 대기': 'bg-[#FFF9F0] text-[#FF9800] border-[#FFF9F0]',
    '결재 완료': 'bg-[#F0FDF4] text-[#10B981] border-[#F0FDF4]',
    '반려': 'bg-[#FFF0F0] text-[#FF4D4F] border-[#FFF0F0]',
    '진행 중': 'bg-blue-50 text-blue-600 border-blue-50',
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

  const displayData = showPagination 
    ? data.slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : data;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3">
      <div className="pl-4 md:pl-6 pr-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-base md:text-lg font-bold text-slate-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] md:min-w-full text-left border-collapse md:table-fixed">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] md:text-xs uppercase tracking-wider">
              <th className="pl-4 md:pl-6 pr-3 py-3 font-bold w-[35%] whitespace-nowrap">제목</th>
              <th className="px-3 py-3 font-bold w-[18%] whitespace-nowrap">문서 종류</th>
              <th className="px-3 py-3 font-bold w-[15%] whitespace-nowrap">기안자</th>
              <th className="px-3 py-3 font-bold w-[14%] text-center whitespace-nowrap">기안일</th>
              <th className="px-3 py-3 font-bold text-center w-[10%] whitespace-nowrap">결재 상태</th>
              <th className="px-3 py-3 font-bold text-center w-[8%] whitespace-nowrap">상세보기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayData.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="pl-4 md:pl-6 pr-3 py-4 text-[12px] md:text-sm font-semibold text-slate-800 truncate whitespace-nowrap">{doc.title}</td>
                <td className="px-3 py-4 text-[12px] md:text-sm text-slate-600 truncate whitespace-nowrap">{doc.type}</td>
                <td className="px-3 py-4 text-[12px] md:text-sm text-slate-600 truncate whitespace-nowrap">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-slate-200 flex items-center justify-center text-[9px] md:text-[10px]">
                      <FontAwesomeIcon icon={faUser} className="text-slate-400" />
                    </div>
                    <span className="truncate">{doc.drafter}</span>
                  </div>
                </td>
                <td className="px-3 py-4 text-[12px] md:text-sm text-slate-500 text-center truncate whitespace-nowrap">{doc.date}</td>
                <td className="px-3 py-4 text-center whitespace-nowrap">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="px-3 py-4 text-center whitespace-nowrap">
                  <button 
                    onClick={() => onDetailClick(doc)}
                    className="px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-100 whitespace-nowrap"
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
            {displayData.length === 0 && (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-400 text-xs">해당 문서가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showPagination && count > 0 && (
        <div className="py-2 scale-95 origin-center">
          <Pagination count={count} page={page} onChange={(_, value) => setPage(value)} />
        </div>
      )}
    </div>
  );
};

const ApprovalCc = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('전체');

  const handleOpenDetail = (doc) => {
    navigate(`/approval/detail/${doc.typeKey}/${doc.id}`);
  };

  const filterDocuments = (docs, status) => {
    return docs.filter(doc => {
      const matchesStatus = doc.status === status;
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === '전체 문서' || selectedType === '전체' || doc.type === selectedType;
      return matchesStatus && matchesSearch && matchesType;
    });
  };

  return (
    <div className="flex-1 bg-white overflow-y-auto p-5 lg:p-6">
      <div className="max-w-[1440px] mx-auto space-y-10">
        
        {/* Title & Description */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">참조된 문서함</h1>
            <p className="text-xs text-slate-500 font-medium">나에게 참조된 문서들의 결재 상태를 확인하세요.</p>
          </div>
          
          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto focus-within:ring-2 focus-within:ring-[#3530B8]/20 focus-within:border-[#3530B8] transition-all">
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border-none rounded-lg focus:ring-0 text-slate-600 font-medium cursor-pointer outline-none"
            >
              <option>전체 문서</option>
              <option>일반기안서</option>
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
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
              검색
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          <DocumentTable 
            title="결재 대기중" 
            data={filterDocuments(CC_DOCUMENTS, '결재 대기')} 
            onDetailClick={handleOpenDetail} 
            showPagination={false}
          />
          <DocumentTable 
            title="결재 진행 중" 
            data={filterDocuments(CC_DOCUMENTS, '진행 중')} 
            onDetailClick={handleOpenDetail} 
            showPagination={false}
          />
          <DocumentTable 
            title="결재 완료" 
            data={filterDocuments(CC_DOCUMENTS, '결재 완료')} 
            onDetailClick={handleOpenDetail} 
            showPagination={true}
          />
          <DocumentTable 
            title="결재 반려" 
            data={filterDocuments(CC_DOCUMENTS, '반려')} 
            onDetailClick={handleOpenDetail} 
            showPagination={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ApprovalCc;
