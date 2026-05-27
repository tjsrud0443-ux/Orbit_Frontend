import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faEllipsisV, 
  faPlus, 
  faRobot, 
  faFileAlt, 
  faTimes,
  faPaperclip,
  faTrashCan
} from '@fortawesome/free-solid-svg-icons';
import { IMAGES } from '../../images/images';

const AiChat = () => {
  // --- 1. States ---
  const [userRole] = useState('사원'); // 권한 모킹: '사원', '팀장', '관리자'
  const [messages, setMessages] = useState([{ id: 1, sender: 'AI', text: '안녕하세요! Orbit AI입니다. 궁금하신 내용을 질문해주세요.', isTyping: false }]);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: '연차 신청 방법 문의' },
    { id: 2, title: '프로젝트 A 일정 관련' }
  ]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollRef = useRef(null);

  // --- 2. Effects ---
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // --- 3. Handlers ---
  const handleDelete = () => {
    if (deleteTarget) {
      setChatHistory(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      setIsDeleteConfirmOpen(true);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: 'USER', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // 가상 AI 답변 로직
    setTimeout(() => {
      let aiText = `질문하신 [${userMsg.text}]에 대한 답변입니다.\n1. 관련 문서 확인 결과 규정 12조에 해당합니다.\n2. 자세한 사항은 인사팀에 문의하세요.`;
      
      // 권한 분기 모킹
      if (userMsg.text.includes('연봉') && userRole === '사원') {
        aiText = "해당 정보는 [팀장] 이상 권한만 열람할 수 있습니다. 권한을 확인해 주세요.";
      }

      const aiMsg = { 
        id: Date.now() + 1, 
        sender: 'AI', 
        text: '', 
        fullText: aiText, 
        isTyping: true,
        showInquiry: aiText.includes('권한') || userMsg.text.includes('모르는 질문')
      };
      setMessages(prev => [...prev, aiMsg]);
      typeEffect(aiMsg.id, aiText);
    }, 1000);
  };

  const typeEffect = (id, fullText) => {
    let i = 0;
    const interval = setInterval(() => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === id) return { ...msg, text: fullText.substring(0, i), isTyping: i < fullText.length };
        return msg;
      }));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 30);
  };

  return (
    <div className="flex w-full h-full bg-white overflow-hidden">
      {/* Sidebar (25%) */}
      <div className="w-1/4 bg-[#f4f7fc] p-6 flex flex-col border-r border-[#edf2f9]">
        <button className="w-full bg-[#3530B8] text-white rounded-xl py-3 font-bold text-sm mb-8 hover:bg-[#2a2594] transition-all">
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> 새 대화 시작
        </button>
        
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold text-[#8a92a6] uppercase mb-4 px-2">최근 대화</h3>
          {chatHistory.map(chat => (
            <div key={chat.id} className="relative group flex items-center justify-between p-3 rounded-lg hover:bg-white transition-all cursor-pointer">
              <span className="text-sm font-medium text-[#1a1c3d] truncate">{chat.title}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === chat.id ? null : chat.id); }} 
                className="opacity-0 group-hover:opacity-100 text-[#8a92a6]"
              >
                <FontAwesomeIcon icon={faEllipsisV} />
              </button>
              {activeMenuId === chat.id && (
                <div className="absolute right-0 top-10 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20">
                  <button 
                    onClick={() => { setDeleteTarget(chat); setActiveMenuId(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                   <FontAwesomeIcon icon={faTrashCan }/> 삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Banner Area */}
        <div className="mt-auto pt-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#edf2f9]">
                <img 
                  src={IMAGES.AI_CHAT}
                  alt="AI 검색 안내" 
                  className="w-full h-auto"
                />
            </div>
        </div>
      </div>

      {/* Main Chat (75%) */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-6 border-b border-[#edf2f9] flex-shrink-0">
          <h2 className="text-2xl font-extrabold text-[#1a1c3d]">AI 챗봇</h2>
        </div>
        
        {/* Chat Feed - Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-4 rounded-2xl ${msg.sender === 'USER' ? 'bg-[#3530B8] text-white' : 'bg-[#f4f7fc] text-[#1a1c3d]'}`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                {msg.showInquiry && (
                  <button onClick={() => setIsModalOpen(true)} className="mt-3 text-xs bg-white text-[#3530B8] px-3 py-1.5 rounded-lg font-bold border border-[#3530B8]">
                    관리자에게 문의하기
                  </button>
                )}
                {!msg.isTyping && msg.sender === 'AI' && (
                  <div className="mt-4 pt-3 border-t border-[#edf2f9] flex items-center justify-between">
                    <span className="text-xs font-medium text-[#8a92a6]"><FontAwesomeIcon icon={faFileAlt} className="mr-1.5"/> 사내규정_v2.pdf</span>
                    <button className="text-[10px] bg-white border border-[#edf2f9] px-2 py-1 rounded hover:bg-slate-50 transition-colors">📄 다운로드</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="p-6 border-t border-[#edf2f9] flex-shrink-0">
          <div className="flex items-center gap-3 bg-[#f4f7fc] p-2 rounded-xl">
            <button className="text-[#8a92a6] px-3"><FontAwesomeIcon icon={faPaperclip}/></button>
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent py-2 text-sm outline-none"
              placeholder="질문을 입력하세요..."
            />
            <button onClick={handleSend} className="bg-[#3530B8] text-white w-10 h-10 rounded-lg"><FontAwesomeIcon icon={faPaperPlane}/></button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-[350px] shadow-2xl">
            <h3 className="font-bold text-lg mb-4 text-center">정말 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">"{deleteTarget.title}" 대화가 영구적으로 삭제됩니다.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-slate-100 hover:bg-slate-200 transition-all">취소</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-all">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Completion Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-[300px] shadow-2xl text-center">
            <h3 className="font-bold text-lg mb-4">삭제 완료</h3>
            <p className="text-sm text-gray-500 mb-6">대화 목록이 삭제되었습니다.</p>
            <button onClick={() => setIsDeleteConfirmOpen(false)} className="w-full py-2.5 rounded-lg font-bold text-sm bg-[#3530B8] hover:bg-[#2a2594] text-white transition-all">확인</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-[400px] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">관리자에게 문의</h3>
              <button onClick={() => setIsModalOpen(false)}><FontAwesomeIcon icon={faTimes}/></button>
            </div>
            <select className="w-full p-3 border border-[#edf2f9] rounded-lg mb-4 text-sm">
              <option>인사</option><option>재무</option><option>기획</option><option>자산</option>
            </select>
            <textarea className="w-full p-3 border border-[#edf2f9] rounded-lg mb-4 text-sm h-32" placeholder="질문 내용을 입력하세요."></textarea>
            <div className="flex gap-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-slate-100">취소</button>
              <button onClick={() => { alert('제출되었습니다.'); setIsModalOpen(false); }} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-[#3530B8] text-white">제출</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChat;
