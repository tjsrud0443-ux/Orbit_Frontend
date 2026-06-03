import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faEllipsisV,
  faPlus,
  faFileAlt,
  faTimes,
  faPaperclip,
  faTrashCan,
  faBars,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { IMAGES } from '../../images/images';
import { getDetailChat, inputMsg, insertQuestion, sideChatTitleList } from './aiChatApi';
import { getGroup } from '../departments/departmentsApi';

const AiChat = () => {
  // --- 1. States ---
  const [messages, setMessages] = useState([
    { id: Date.now(), role: 'AI', content: '안녕하세요! Orbit 사내 업무지원 AI 비서입니다. 인사, 규정, 복리후생 등 궁금하신 내용을 질문해주세요.', isTyping: false }
  ]);

  // 🔥 구조 변경: input 상태는 단순 문자열(String)로 관리하는 것이 정석입니다!
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
  const [deptList, setDeptList] = useState([]);

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
    if (deleteTarget) {
      setChatHistory(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      setIsDeleteConfirmOpen(true);
    }
  };

  const handleNewChat = () => {
    setCurrentChatSeq(null);
    setMessages([
      {
        id: Date.now(),
        role: 'AI',
        content: '안녕하세요! Orbit 사내 업무지원 AI 비서입니다. 인사, 규정, 복리후생 등 궁금하신 내용을 질문해주세요.',
        isTyping: false
      }
    ]);

    setIsMobileSidebarOpen(false)
  }

  // 🔥 백엔드 릴레이션 매핑의 핵심 핸들러 리팩토링
  const handleSend = () => {
    if (!input.trim()) return;

    // 1. 사용자가 입력한 내용을 화면 말풍선에 먼저 즉시 추가합니다.
    const userMessageId = Date.now();
    const newUserMessage = {
      id: userMessageId,
      role: 'USER',
      content: input.trim()
    };

    // 2. AI가 답변을 생각하는 동안 보여줄 임시 '타이핑 중...' 말풍선 추가
    const aiMessageId = userMessageId + 1;
    setMessages(prev => [...prev, newUserMessage, { id: aiMessageId, role: 'AI', content: '데이터를 분석하고 있습니다...', isTyping: true }]);

    // 3. 백엔드로 보낼 파라미터 구조 정의 (스프링 @RequestParam 스펙 매칭)
    const chatData = {
      chat_seq: currentChatSeq !== null ? currentChatSeq : 0,
      role: 'USER',
      content: input.trim()
    };

    const currentInput = input.trim();
    setInput(""); // 전송 버튼을 누르는 즉시 입력창 비우기

    // 4. Axios API 호출 실행
    inputMsg(chatData)
      .then(resp => {
        // 백엔드에서 받아온 찐 제미나이 텍스트 답변 데이터 (resp.data)
        const aiResponseText = resp.data.aiAnswer;

        if (!currentChatSeq) {
          setCurrentChatSeq(resp.data.chat_seq);

          sideChatTitleList().then(resp => {
            setChatHistory(resp.data);
          });
        }
        // 특정 키워드나 조건(예: '죄송합니다' 등)이 답변에 포함되면 관리자 문의 버튼 띄우기 세팅
        const needInquiryButton = aiResponseText.includes("찾지 못했습니다") || aiResponseText.includes("죄송합니다");

        // 5. '타이핑 중...' 이었던 봇의 말풍선 내용을 찐 답변 내용으로 변경하고 타이핑 효과 가동
        setMessages(prev => prev.map(msg => {
          if (msg.id === aiMessageId) {
            return { ...msg, content: "", isTyping: true, showInquiry: needInquiryButton };
          }
          return msg;
        }));

        // 텍스트가 부드럽게 출력되는 타이핑 연출기 실행
        typeEffect(aiMessageId, aiResponseText, needInquiryButton);
      })
      .catch(err => {
        console.error("AI 통신 실패:", err);
        setMessages(prev => prev.map(msg => {
          if (msg.id === aiMessageId) {
            return { ...msg, content: "서버와의 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.", isTyping: false };
          }
          return msg;
        }));
      });
  };

  const detailChat = (chat_seq) => {
    getDetailChat(chat_seq).then(resp => {
      setCurrentChatSeq(chat_seq);
      setMessages(resp.data);
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
              content: fullText,      // 찐 최종 텍스트 강제 고정
              isTyping: false,     // 타이핑 종료 마크 
              showInquiry: showInquiry // 관리자 문의 버튼 유무 바인딩
            };
          }
          return msg;
        }));
      }
    }, 10); // 타다닥 박히는 부드러운 속도감
  };

  const handleInsertQuestion = () => {
    insertQuestion(setSelectedDept).then(resp => {
      console.log("DB insert 완료")
    })
  }
  // --- Sidebar Component ---
  const SidebarContent = () => (
    <div className="flex flex-col h-full p-6 bg-[#f4f7fc]">
      <button onClick={handleNewChat} className="w-full bg-[#3530B8] text-white rounded-xl py-3 font-bold text-sm mb-8 hover:bg-[#2a2594] transition-all">
        <FontAwesomeIcon icon={faPlus} className="mr-2" /> 새 대화 시작
      </button>
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-xs font-bold text-[#8a92a6] uppercase mb-4 px-2">최근 대화</h3>
        {chatHistory.map(chat => (
          <div key={chat.chat_seq} className="relative group flex items-center justify-between p-3 rounded-lg hover:bg-white transition-all cursor-pointer">
            <span onClick={() => detailChat(chat.chat_seq)} className="text-sm font-medium text-[#1a1c3d] truncate">{chat.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === chat.chat_seq ? null : chat.chat_seq); }}
              className="md:opacity-0 md:group-hover:opacity-100 text-[#8a92a6]"
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
            {activeMenuId === chat.chat_seq && (
              <div className="absolute right-0 top-10 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20">
                <button onClick={() => { setDeleteTarget(chat); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  <FontAwesomeIcon icon={faTrashCan} /> 삭제
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-auto pt-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#edf2f9]">
          <img src={IMAGES.AI_CHAT} alt="AI 검색 안내" className="w-full h-auto" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex w-full h-full bg-white overflow-hidden rounded-[2.5rem] border border-[#edf2f9] shadow-lg">
      {/* 1. Desktop Sidebar */}
      <div className="hidden md:flex w-1/4 h-full border-r border-[#edf2f9]">
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

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-4 rounded-2xl ${msg.role === 'USER' ? 'bg-[#3530B8] text-white' : 'bg-[#f4f7fc] text-[#1a1c3d]'}`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>

                {/* 관리자 문의하기 컴포넌트 유동 제어 */}
                {msg.showInquiry && (
                  <button onClick={() => setIsModalOpen(true)} className="mt-3 text-xs bg-white text-[#3530B8] px-3 py-1.5 rounded-lg font-bold border border-[#3530B8] hover:bg-slate-50">
                    담당 부서에 문의하기
                  </button>
                )}

                {/* 임베딩 출처 메타데이터 바인딩 연동 문서 구역 */}
                {!msg.isTyping && msg.role === 'AI' && !msg.showInquiry && (
                  <div className="mt-4 pt-3 border-t border-[#edf2f9] flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-[#8a92a6] truncate"><FontAwesomeIcon icon={faFileAlt} className="mr-1.5" /> 사내_업무_규정_통합본.pdf</span>
                    <button className="text-[10px] bg-white border border-[#edf2f9] px-2 py-1 rounded hover:bg-slate-50 transition-colors flex-shrink-0">📄 다운로드</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* 입출력 입력창 섹션 */}
        <div className="p-6 border-t border-[#edf2f9] flex-shrink-0">
          <div className="flex items-center gap-3 bg-[#f4f7fc] p-2 rounded-xl">
            <button className="text-[#8a92a6] px-3"><FontAwesomeIcon icon={faPaperclip} /></button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent py-2 text-sm outline-none"
              placeholder="인사, 연차, 회사 복리후생에 대해 질문해보세요..."
            />
            <button onClick={handleSend} className="bg-[#3530B8] text-white w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[#2a2594] transition-all">
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      </div>

      {/* --- Modals (삭제 및 관리자 문의 팝업 마크업 유지) --- */}
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
              <button onClick={() => { setIsModalOpen(false); setIsDropdownOpen(false); }}><FontAwesomeIcon icon={faTimes} /></button>
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
                <div className="absolute top-full left-0 w-full bg-white border border-[#edf2f9] rounded-lg mt-1 shadow-lg z-[70] max-h-48 overflow-y-auto">
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

            <textarea className="w-full p-3 border border-[#edf2f9] rounded-lg mb-4 text-sm h-32" placeholder="AI가 답변하지 못한 상세 문의 내용을 작성해주시면 담당자가 검토 후 그룹웨어로 답변을 드립니다."></textarea>
            <div className="flex gap-2">
              <button onClick={() => { setIsModalOpen(false); setIsDropdownOpen(false); }} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-slate-100">취소</button>
              <button onClick={handleInsertQuestion} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-[#3530B8] text-white">제출</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChat;