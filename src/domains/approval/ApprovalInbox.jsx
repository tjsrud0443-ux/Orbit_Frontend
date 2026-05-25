import React, { useState } from 'react';
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
const PENDING_DOCUMENTS = [
  { id: 1, title: '2024년 상반기 사무용품 구매 신청', type: '구매신청서', drafter: '김철수 대리', date: '2024-05-20', status: '진행중' },
  { id: 2, title: '연차 휴가 신청서 (6/1 ~ 6/3)', type: '휴가신청서', drafter: '이영희 사원', date: '2024-05-22', status: '대기중' },
  { id: 3, title: '영업부 외부 미팅 비용 정산', type: '지출결의서', drafter: '박지민 과장', date: '2024-05-23', status: '대기중' },
  { id: 4, title: '신규 프로젝트 추진 기안문', type: '일반기안서', drafter: '최동현 차장', date: '2024-05-24', status: '대기중' },
  { id: 5, title: '출장 보고서 및 비용 정산', type: '지출결의서', drafter: '정수빈 사원', date: '2024-05-25', status: '대기중' },
];

const COMPLETED_DOCUMENTS = [
  { id: 101, title: '개발팀 신규 서버 도입 건', type: '구매신청서', drafter: '강하늘 과장', date: '2024-05-10', status: '승인완료' },
  { id: 102, title: '재택근무 신청 (5/15)', type: '휴가신청서', drafter: '오진우 대리', date: '2024-05-12', status: '반려' },
  { id: 103, title: '마케팅 협력업체 계약 검토', type: '일반기안서', drafter: '한소희 대리', date: '2024-05-15', status: '승인완료' },
];

const APPROVAL_LINE = [
  { step: 1, role: '검토', name: '박상무', status: '완료', date: '2024-05-21' },
  { step: 2, role: '심사', name: '최전무', status: '진행중', date: '-' },
  { step: 3, role: '승인', name: '이대표', status: '대기', date: '-' },
];

// --- Sub Components ---

const StatusBadge = ({ status }) => {
  const styles = {
    '대기중': 'bg-[#FFF9F0] text-[#FF9800] border-[#FFF9F0]',
    '승인완료': 'bg-[#F0FDF4] text-[#10B981] border-[#F0FDF4]',
    '반려': 'bg-[#FFF0F0] text-[#FF4D4F] border-[#FFF0F0]',
    '진행중': 'bg-amber-50 text-amber-600 border-amber-200',
  };

  return (
    <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold border ${styles[status] || 'bg-gray-50 text-gray-600'}`}>
      {status}
    </span>
  );
};

const DocumentTable = ({ title, data, onDetailClick }) => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const count = Math.ceil(data.length / itemsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3">
      <div className="pl-4 md:pl-6 pr-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-base md:text-lg font-bold text-slate-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] md:min-w-full text-left border-collapse md:table-fixed">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] md:text-xs uppercase tracking-wider">
              <th className="pl-4 md:pl-6 pr-3 py-3 font-bold w-[35%]">제목</th>
              <th className="px-3 py-3 font-bold w-[18%]">문서 종류</th>
              <th className="px-3 py-3 font-bold w-[15%]">기안자</th>
              <th className="px-3 py-3 font-bold w-[14%] text-center">기안일</th>
              <th className="px-3 py-3 font-bold text-center w-[10%]">결재 상태</th>
              <th className="px-3 py-3 font-bold text-center w-[8%]">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="pl-4 md:pl-6 pr-3 py-4 text-[12px] md:text-sm font-semibold text-slate-800 truncate">{doc.title}</td>
                <td className="px-3 py-4 text-[12px] md:text-sm text-slate-600 truncate">{doc.type}</td>
                <td className="px-3 py-4 text-[12px] md:text-sm text-slate-600 truncate">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-slate-200 flex items-center justify-center text-[9px] md:text-[10px]">
                      <FontAwesomeIcon icon={faUser} className="text-slate-400" />
                    </div>
                    <span className="truncate">{doc.drafter}</span>
                  </div>
                </td>
                <td className="px-3 py-4 text-[12px] md:text-sm text-slate-500 text-center truncate">{doc.date}</td>
                <td className="px-3 py-4 text-center">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="px-3 py-4 text-center">
                  <button 
                    onClick={() => onDetailClick(doc)}
                    className="px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-100 whitespace-nowrap"
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="py-2 scale-95 origin-center">
        <Pagination count={count} page={page} onChange={(_, value) => setPage(value)} />
      </div>
    </div>
  );
};

const DetailModal = ({ isOpen, onClose, document }) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!isOpen) return null;

  const handleRejectClick = () => setIsRejecting(true);
  const handleCancelReject = () => {
    setIsRejecting(false);
    setRejectReason('');
  };

  const handleCompleteAction = () => {
    alert(isRejecting ? `반려 처리되었습니다. 사유: ${rejectReason}` : '승인 처리되었습니다.');
    onClose();
    setIsRejecting(false);
    setRejectReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl max-h-[95vh] md:max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="pl-4 md:pl-8 pr-4 md:pr-6 py-4 md:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div>
            <span className="text-[10px] md:text-xs font-bold text-indigo-600 uppercase tracking-widest mb-0.5 block">Document Detail</span>
            <h2 className="text-base md:text-xl font-bold text-slate-800 line-clamp-1">{document?.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
            <FontAwesomeIcon icon={faTimesCircle} className="text-lg md:text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
          {/* Approval Line - Scrollable on mobile */}
          <div className="flex justify-end overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0">
            <div className="flex items-center gap-0 min-w-max">
              {APPROVAL_LINE.map((step, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="w-28 md:w-32 border border-slate-300 rounded overflow-hidden text-center bg-white shadow-sm">
                    <div className="bg-slate-100 text-[9px] md:text-[10px] font-bold py-1 md:py-1.5 border-b border-slate-300">{step.role}</div>
                    <div className="py-1.5 md:py-2 px-1">
                      <div className="text-xs md:text-sm font-bold text-slate-700">{step.name}</div>
                      <div className={`text-[9px] md:text-[10px] mt-0.5 md:mt-1 ${step.status === '완료' ? 'text-green-600 font-bold' : step.status === '진행중' ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                        {step.status === '완료' ? (
                          <div className="flex flex-col items-center">
                            <FontAwesomeIcon icon={faSignature} className="text-slate-300 mb-0.5" />
                            <span>{step.date}</span>
                          </div>
                        ) : step.status}
                      </div>
                    </div>
                  </div>
                  {idx < APPROVAL_LINE.length - 1 && (
                    <div className="w-4 md:w-6 h-[1px] bg-slate-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Document Content */}
          <div className="border border-slate-200 rounded-lg p-4 md:p-6 bg-white shadow-inner min-h-[300px] md:min-h-[350px]">
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
              {/* Responsive Grid for Document Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-y border-slate-200">
                <div className="col-span-1 bg-slate-50 p-2 md:p-3 text-[12px] md:text-sm font-bold text-slate-600 border-r border-slate-200">기안부서</div>
                <div className="col-span-1 p-2 md:p-3 text-[12px] md:text-sm text-slate-700 border-r md:border-r border-slate-200">운영지원팀</div>
                <div className="col-span-1 bg-slate-50 p-2 md:p-3 text-[12px] md:text-sm font-bold text-slate-600 border-t md:border-t-0 border-r border-slate-200">기안일</div>
                <div className="col-span-1 p-2 md:p-3 text-[12px] md:text-sm text-slate-700 border-t md:border-t-0">{document?.date}</div>
              </div>
              <div className="grid grid-cols-4 border-b border-slate-200">
                <div className="col-span-1 bg-slate-50 p-2 md:p-3 text-[12px] md:text-sm font-bold text-slate-600 border-r border-slate-200">문서분류</div>
                <div className="col-span-3 p-2 md:p-3 text-[12px] md:text-sm text-slate-700">{document?.type}</div>
              </div>

              <div className="mt-4 md:mt-6">
                <h4 className="text-sm md:text-base font-bold text-slate-800 mb-2 md:mb-3 border-l-4 border-indigo-500 pl-2 md:pl-3">문서 본문</h4>
                <div className="text-[12px] md:text-sm text-slate-600 leading-relaxed space-y-3 md:space-y-4">
                  <p>1. 목 적: {document?.title}와 관련하여 다음과 같이 보고 드립니다.</p>
                  <p>2. 상세 내용:</p>
                  <p className="bg-slate-50 p-3 md:p-4 rounded-md border border-slate-100 italic">
                    "본 문서는 시스템 테스트를 위한 더미 데이터입니다. 실제 인트라넷 환경에서는 API를 통해 해당 기안서의 상세 내역이 출력됩니다."
                  </p>
                  <p>3. 기대 효과:</p>
                  <ul className="list-disc list-inside space-y-1 md:space-y-2 ml-1 md:ml-2">
                    <li>업무 효율성 증대 및 프로세스 간소화</li>
                    <li>차주 월요일까지 최종 완료 예정</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 md:px-6 py-4 md:py-6 border-t border-slate-100 bg-slate-50/50">
          <div className="max-w-4xl mx-auto">
            {isRejecting && (
              <div className="mb-3 md:mb-4 animate-in slide-in-from-bottom-2 duration-300">
                <label className="block text-xs md:text-sm font-bold text-red-600 mb-1 md:mb-1.5">반려 사유 입력</label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="반려 사유를 상세히 입력해 주세요."
                  className="w-full h-20 md:h-24 p-3 md:p-4 border-2 border-red-100 rounded-xl focus:outline-none focus:border-red-300 bg-red-50/30 text-[12px] md:text-sm transition-all resize-none"
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2 md:gap-3">
              {!isRejecting ? (
                <>
                  <button onClick={onClose} className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-[12px] md:text-sm text-slate-500 hover:bg-slate-200 transition-colors">취소</button>
                  <button onClick={handleRejectClick} className="px-5 md:px-7 py-2 md:py-2.5 rounded-xl font-bold text-[12px] md:text-sm text-red-600 border-2 border-red-100 hover:bg-red-50 transition-all flex items-center gap-1.5 md:gap-2">
                    <FontAwesomeIcon icon={faTimesCircle} /> 반려
                  </button>
                  <button onClick={handleCompleteAction} className="px-6 md:px-10 py-2 md:py-2.5 rounded-xl font-bold text-[12px] md:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-1.5 md:gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} /> 승인
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleCancelReject} className="px-5 md:px-7 py-2 md:py-2.5 rounded-xl font-bold text-[12px] md:text-sm text-slate-600 border-2 border-slate-200 hover:bg-slate-100 transition-all">취소</button>
                  <button 
                    onClick={handleCompleteAction}
                    disabled={!rejectReason.trim()}
                    className={`px-6 md:px-10 py-2 md:py-2.5 rounded-xl font-bold text-[12px] md:text-sm text-white shadow-lg transition-all flex items-center gap-1.5 md:gap-2 ${
                      rejectReason.trim() ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-slate-300 cursor-not-allowed shadow-none'
                    }`}
                  >
                    완료
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApprovalInbox = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('전체');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetail = (doc) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  const filterDocuments = (docs) => {
    return docs.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === '전체 문서' || selectedType === '전체' || doc.type === selectedType;
      return matchesSearch && matchesType;
    });
  };

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-5 lg:p-6">
      <div className="max-w-[1440px] mx-auto space-y-10">
        
        {/* Title & Description */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">결재할 문서함</h1>
            <p className="text-xs text-slate-500 font-medium">나의 승인을 기다리는 문서와 이미 처리된 문서 목록입니다.</p>
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
            data={filterDocuments(PENDING_DOCUMENTS)} 
            onDetailClick={handleOpenDetail} 
          />
          <DocumentTable 
            title="결재 완료" 
            data={filterDocuments(COMPLETED_DOCUMENTS)} 
            onDetailClick={handleOpenDetail} 
          />
        </div>
      </div>

      {/* Modal Overlay */}
      <DetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        document={selectedDoc} 
      />
    </div>
  );
};

export default ApprovalInbox;
