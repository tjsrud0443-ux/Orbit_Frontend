import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faEllipsisV,
  faPlus,
  faFileAlt,
  faTimes,
  faTrashCan,
  faBars,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { IMAGES } from '../../images/images';
import { deleteChat, getDetailChat, inputMsg, insertQuestion, sideChatTitleList } from './aiChatApi';
import { getGroup } from '../departments/departmentsApi';
import useAuthStore from '../../store/authStore';

const AiChat = () => {
  // --- 1. States ---
  const [messages, setMessages] = useState([
    { id: Date.now(), role: 'AI', content: '안녕하세요! Orbit AI 비서입니다.\n회사 문서와 회의록을 기반으로 필요한 정보를 찾아 답변해 드립니다. 궁금하신 내용을 질문해 주세요!', isTyping: false }
  ]);

  const [input, setInput] = useState("");
  const [currentChatSeq, setCurrentChatSeq] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const scrollRef = useRef(null);

  // 커스텀 드롭다운 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [inputQuestion, setInputQuestion] = useState("");
  const [deptList, setDeptList] = useState([]);
  const token = useAuthStore(state => state.token);
  // --- 2. Effects ---
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClick = () => {
      setActiveMenuId(null);
      setIsDropdownOpen(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // 부서 목록 가져오기
  useEffect(() => {
    getGroup().then(resp => {
      if (resp.data && resp.data.nodeMap) {
        const depts = Object.values(resp.data.nodeMap)
          .filter(dept => dept.deptName.endsWith("팀"));
        setDeptList(depts);
      }
    }).catch(err => {
      console.error("부서 목록 로딩 실패:", err);
    });
  }, []);

  useEffect(() => {
    sideChatTitleList().then(resp => {
      setChatHistory(resp.data);
    })
  }, []);

  // --- 3. Handlers ---
  const handleDelete = () => {
    deleteChat(deleteTarget.chat_seq).then(resp => {
      setDeleteTarget(null);
      setIsDeleteConfirmOpen(true);

      sideChatTitleList().then(resp => {
        setChatHistory(resp.data);
      })

      if (deleteTarget.chat_seq === currentChatSeq) {
        setMessages([
          {
            id: Date.now(),
            role: 'AI',
            content: '안녕하세요! Orbit AI 비서입니다.\n회사 문서와 회의록을 기반으로 필요한 정보를 찾아 답변해 드립니다. 궁금하신 내용을 질문해 주세요!',
            isTyping: false
          }
        ]);
        setIsMobileSidebarOpen(false)
      }
    });
  };

  const handleNewChat = () => {
    setCurrentChatSeq(null);
    setMessages([
      {
        id: Date.now(),
        role: 'AI',
        content: '안녕하세요! Orbit AI 비서입니다.\n회사 문서와 회의록을 기반으로 필요한 정보를 찾아 답변해 드립니다. 궁금하신 내용을 질문해 주세요!',
        isTyping: false
      }
    ]);
    setIsMobileSidebarOpen(false)
  }

  // 백엔드 릴레이션 매핑의 핵심 핸들러 리팩토링
  const handleSend = () => {
    if (!input.trim()) return;

    const userMessageId = Date.now();
    const newUserMessage = {
      id: userMessageId,
      role: 'USER',
      content: input.trim()
    };

    const aiMessageId = userMessageId + 1;
    setMessages(prev => [...prev, newUserMessage, { id: aiMessageId, role: 'AI', content: '데이터를 분석하고 있습니다...', isTyping: true }]);

    const chatData = {
      chat_seq: currentChatSeq !== null ? currentChatSeq : 0,
      role: 'USER',
      content: input.trim()
    };

    const currentInput = input.trim();
    setInput("");

    inputMsg(chatData)
      .then(resp => {
        const aiResponseText = resp.data.aiAnswer;
        const sourceFileName = resp.data.resultSources || [];
        console.log("출처 문서", resp.data)

        if (!currentChatSeq) {
          setCurrentChatSeq(resp.data.chat_seq);
          sideChatTitleList().then(resp => {
            setChatHistory(resp.data);
          });
        }

        // 키워드 조건 판단
        const needInquiryButton = aiResponseText.includes("찾지 못했습니다") || aiResponseText.includes("죄송합니다");

        setMessages(prev => prev.map(msg => {
          if (msg.id === aiMessageId) {
            return { ...msg, content: "", isTyping: true, showInquiry: needInquiryButton, sourceFileName: sourceFileName };
          }
          return msg;
        }));

        typeEffect(aiMessageId, aiResponseText, needInquiryButton);
      })
      .catch(err => {
        console.error("AI 통신 실패:", err);
        setMessages(prev => prev.map(msg => {
          if (msg.id === aiMessageId) {
            return { ...msg, content: "서버와의 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.", isTyping: false };
          }
          return msg;
        }));
      });
  };

  // 🔥 [수정] 과거 대화 이력 클릭 시 버튼 유무 바인딩 추가
  const detailChat = (chat_seq) => {
    getDetailChat(chat_seq).then(resp => {
      setCurrentChatSeq(chat_seq);

      const mappedMessages = resp.data.map(msg => {
        if (msg.role === 'AI' && msg.content) {
          const needInquiryButton = msg.content.includes("찾지 못했습니다") || msg.content.includes("죄송합니다");
          
          return {
            ...msg,
            showInquiry: needInquiryButton,
            isInquiryComplete: msg.status === 'PENDING', // 백엔드 스펙에 맞게 조정 가능
            sourceFileName : msg.resultSources || []
          };
        }
        return msg;
      });

      setMessages(mappedMessages);
      setIsMobileSidebarOpen(false);
    })
      .catch(err => {
        console.error("과거 대화 이력 로딩 실패", err);
      });
  };

  const typeEffect = (id, fullText, showInquiry) => {
    let i = 0;
    const interval = setInterval(() => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === id) {
          return {
            ...msg,
            content: fullText.substring(0, i),
            isTyping: true
          };
        }
        return msg;
      }));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
        setMessages(prev => prev.map(msg => {
          if (msg.id === id) {
            return {
              ...msg,
              content: fullText,
              isTyping: false,
              showInquiry: showInquiry,
              isInquiryComplete: false // 초기값은 미완료
            };
          }
          return msg;
        }));
      }
    }, 10);
  };

  // 🔥 [수정] 문의 제출 성공 시 메시지 상태 변경
  const handleInsertQuestion = () => {
    if (!selectedDept) {
      alert("부서를 선택해 주세요.");
      return;
    }
    if (!inputQuestion.trim()) {
      alert("문의 내용을 작성해 주세요.");
      return;
    }

    const dept = {
      category: selectedDept.deptName,
      question: inputQuestion,
      dept_seq: selectedDept.deptSeq,
      chat_seq: currentChatSeq
    };

    insertQuestion(dept).then(resp => {
      alert('담당 부서로 문의가 안전하게 접수되었습니다.');

      // 현재 UI 화면의 메시지 중, '문의하기'가 활성화되어 있던 메시지 상태를 '문의 완료'로 변경
      setMessages(prev => prev.map(msg => {
        if (msg.role === 'AI' && msg.showInquiry) {
          return { ...msg, isInquiryComplete: true };
        }
        return msg;
      }));

      // 인풋 초기화 및 모달 닫기
      setInputQuestion("");
      setSelectedDept(null);
      setIsModalOpen(false);
      setIsDropdownOpen(false);
    }).catch(err => {
      console.error("문의 접수 실패:", err);
    });
  }

  // --- Sidebar Component ---
  const SidebarContent = () => (
    <div className="flex flex-col h-full p-6 bg-[#f4f7fc]">
      <button onClick={handleNewChat} className="w-full bg-[#3530B8] text-white rounded-xl py-3 font-bold text-sm mb-8 hover:bg-[#2a2594] transition-all">
        <FontAwesomeIcon icon={faPlus} className="mr-2" /> 새 대화 시작
      </button>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <h3 className="text-xs font-bold text-[#8a92a6] uppercase mb-4 px-2">최근 대화</h3>
        {chatHistory.map(chat => (
          <div
            key={chat.chat_seq}
            onClick={() => detailChat(chat.chat_seq)}
            className="relative group flex items-center justify-between p-3 rounded-lg hover:bg-white transition-all cursor-pointer"
          >
            <span className="text-sm font-medium text-[#1a1c3d] truncate flex-1 min-w-0 mr-2">{chat.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === chat.chat_seq ? null : chat.chat_seq); }}
              className="md:opacity-0 md:group-hover:opacity-100 text-[#8a92a6] flex-shrink-0"
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
            {activeMenuId === chat.chat_seq && (
              <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-10 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20">
                <button onClick={() => { setDeleteTarget(chat); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  <FontAwesomeIcon icon={faTrashCan} /> 삭제
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-auto pt-6">
        <div className="bg-white p-1 rounded-xl shadow-sm border border-[#edf2f9]">
          <img src={IMAGES.AI_CHAT} alt="AI 검색 안내" className="w-full h-auto" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex w-full h-full bg-white overflow-hidden rounded-[2.5rem] border border-[#edf2f9] shadow-lg">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes dot-pulse {
          0%, 33.3% { content: '.'; }
          33.4%, 66.6% { content: '..'; }
          66.7%, 100% { content: '...'; }
        }
        .dot-animate::after {
          content: '.';
          animation: dot-pulse 3s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}</style>
      {/* 1. Desktop Sidebar */}
      <div className="hidden md:flex md:w-80 flex-shrink-0 h-full border-r border-[#edf2f9]">
        <SidebarContent />
      </div>

      {/* 2. Mobile Sidebar Overlay */}
      <div className={`md:hidden absolute inset-0 z-50 transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileSidebarOpen(false)} />
        <div className={`absolute left-0 top-0 w-3/4 h-full transform transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent />
        </div>
      </div>

      {/* 3. Main Chat Feed */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="p-6 border-b border-[#edf2f9] flex-shrink-0 flex items-center">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden text-[#3530B8] text-xl mr-4">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <h2 className="text-2xl font-extrabold text-[#1a1c3d]">Orbit AI 업무비서</h2>
        </div>

        <div key={currentChatSeq || 'new'} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`max-w-[70%] p-4 rounded-2xl ${msg.role === 'USER' ? 'bg-[#3530B8] text-white' : 'bg-[#f4f7fc] text-[#1a1c3d]'}`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content === '데이터를 분석하고 있습니다...' ? (
                    <span>데이터를 분석하고 있습니다<span className="dot-animate"></span> 🤖</span>
                  ) : (
                    msg.content
                  )}
                </div>

                {/* 🔥 [수정] 관리자 문의하기 컴포넌트 유동 제어 및 문의 완료 분기 처리 */}
                {msg.showInquiry && (
                  msg.isInquiryComplete ? (
                    // 문의 완료된 상태의 UI 버튼 (클릭 불가 스타일)
                    <button disabled className="mt-3 text-xs bg-gray-200 text-gray-500 px-3 py-1.5 rounded-lg font-bold border border-gray-300 cursor-not-allowed">
                      ✓ 문의 완료
                    </button>
                  ) : (
                    // 아직 문의하지 않은 상태의 버튼
                    <button onClick={() => setIsModalOpen(true)} className="mt-3 text-xs bg-white text-[#3530B8] px-3 py-1.5 rounded-lg font-bold border border-[#3530B8] hover:bg-slate-50">
                      담당 부서에 문의하기
                    </button>
                  )
                )}

                {/* 임베딩 출처 메타데이터 바인딩 연동 문서 구역 */}
                {msg.sourceFileName?.map(source => (
                  <div key={source.rag_doc_seq} className="mt-4 pt-3 border-t border-[#edf2f9] flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                    <span className="text-xs font-medium text-[#8a92a6] whitespace-normal md:truncate min-w-0">
                      <FontAwesomeIcon icon={faFileAlt} className="mr-1.5" />
                      {source.file_name}
                    </span>
                    <a href={`http://localhost/file/download/${source.sysname}?token=${token}`} download className="self-end md:self-auto">
                      <button className="text-[10px] font-medium bg-white border border-[#edf2f9] px-2 py-1 rounded hover:bg-[#F0F4FF] transition-colors flex-shrink-0 cursor-pointer">
                        📄 다운로드
                      </button>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* 입출력 입력창 섹션 */}
        <div className="p-6 border-t border-[#edf2f9] flex-shrink-0">
          <div className="flex items-center gap-3 px-6 bg-[#f4f7fc] p-2 rounded-xl">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent py-2 text-sm outline-none"
              placeholder="문서나 회의록에 대해 궁금한 내용을 질문해보세요..."
            />
            <button onClick={handleSend} className="bg-[#3530B8] text-white w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#2a2594] transition-all">
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      </div>

      {/* --- Modals --- */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white p-8 rounded-2xl w-[350px] shadow-2xl">
            <h3 className="font-bold text-lg mb-4 text-center">정말 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">"{deleteTarget.title}" 대화가<br />영구적으로 삭제됩니다.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-slate-100 hover:bg-slate-200 transition-all">취소</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-all">삭제</button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white p-8 rounded-2xl w-[300px] shadow-2xl text-center">
            <h3 className="font-bold text-lg mb-4">삭제 완료</h3>
            <p className="text-sm text-gray-500 mb-6">대화 목록이 삭제되었습니다.</p>
            <button onClick={() => setIsDeleteConfirmOpen(false)} className="w-full py-2.5 rounded-lg font-bold text-sm bg-[#3530B8] hover:bg-[#2a2594] text-white transition-all">확인</button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white p-8 rounded-2xl w-[400px] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">담당 부서(관리자) 문의</h3>
              <button onClick={() => { setIsModalOpen(false); setIsDropdownOpen(false); setSelectedDept(null); }}><FontAwesomeIcon icon={faTimes} /></button>
            </div>

            {/* Custom Dropdown */}
            <div className="relative mb-4">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="w-full p-3 border border-[#edf2f9] rounded-lg text-sm cursor-pointer flex justify-between items-center bg-white"
              >
                <span className={selectedDept ? "text-slate-700" : "text-slate-400"}>
                  {selectedDept?.deptName || "부서 선택"}
                </span>
                <FontAwesomeIcon icon={isDropdownOpen ? faChevronUp : faChevronDown} className="text-slate-400 text-xs" />
              </div>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full bg-white border border-[#edf2f9] rounded-lg mt-1 shadow-lg z-[70] max-h-48 overflow-y-auto custom-scrollbar">
                  {deptList.map(dept => (
                    <div
                      key={dept.deptSeq}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDept(dept);
                        setIsDropdownOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:bg-[#F0F4FF] hover:text-[#3530B8] active:bg-[#F0F4FF] active:text-[#3530B8] cursor-pointer transition-colors"
                    >
                      {dept.deptName}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <textarea value={inputQuestion} onChange={(e) => setInputQuestion(e.target.value)} className="w-full p-3 border border-[#edf2f9] rounded-lg mb-4 text-sm h-32" placeholder="AI가 답변하지 못한 상세 문의 내용을 작성해주시면 담당자가 검토 후 그룹웨어로 답변을 드립니다."></textarea>
            <div className="flex gap-2">
              <button onClick={() => { setIsModalOpen(false); setIsDropdownOpen(false); setSelectedDept(null); }} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-slate-100">취소</button>
              <button onClick={handleInsertQuestion} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-[#3530B8] text-white">제출</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChat;