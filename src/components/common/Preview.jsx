import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Loader2 } from 'lucide-react';
import { renderAsync } from 'docx-preview';
import { alertError } from '../../utils/alert';

const DocumentPreviewModal = ({ sysname, mimeType, title, token, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewType, setPreviewType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileBuffer, setFileBuffer] = useState(null);
  const docxContainerRef = useRef(null);

  useEffect(() => {
    const fileUrl = (sysname && sysname !== 'undefined')
      ? `${import.meta.env.VITE_API_BASE_URL}/file/preview/${encodeURIComponent(sysname)}?token=${token}` : '';

    if (mimeType === 'application/pdf' || sysname?.toLowerCase().endsWith('.pdf')) {
      setPreviewType('pdf');
      setPreviewUrl(fileUrl);
    } else if (
      sysname?.toLowerCase().endsWith('.docx') ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      setPreviewType('docx');
      setIsLoading(true);
      fetch(fileUrl)
        .then(res => res.arrayBuffer())
        .then(buf => setFileBuffer(buf))
        .catch(() => {
          alertError('로딩 실패', '문서 미리보기를 불러오는 중 오류가 발생했습니다.');
          onClose();
        });
    } else if (mimeType === 'text/plain' || sysname?.toLowerCase().endsWith('.txt')) {
      setPreviewType('txt');
      setIsLoading(true);
      fetch(fileUrl)
        .then(res => res.text())
        .then(text => {
          setFileBuffer(text);
          setIsLoading(false);
        });
    }
  }, [sysname, mimeType, token]);

  useEffect(() => {
    if (previewType === 'docx' && fileBuffer && docxContainerRef.current) {
      const timer = setTimeout(async () => {
        try {
          docxContainerRef.current.innerHTML = '';
          await renderAsync(fileBuffer, docxContainerRef.current, docxContainerRef.current, {
            className: 'docx-rendered-page',
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false,
          });
        } catch {
          docxContainerRef.current.innerHTML = `<p class="p-6 text-center text-red-500 text-sm">문서를 출력하지 못했습니다.</p>`;
        } finally {
          setIsLoading(false);
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [previewType, fileBuffer]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col border border-gray-100">
        {/* 모달 헤더 */}
        <div className="p-5 border-b flex justify-between items-center bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2 truncate pr-4">
            <span className="bg-[#3530B8] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {previewType === 'docx' ? 'DOCX 뷰어' : previewType === 'pdf' ? 'PDF 뷰어' : ''}
            </span>
            <h2 className="text-sm md:text-base font-bold text-gray-800 truncate">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center border border-gray-100 cursor-pointer"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* 문서 출력 영역 (Ref가 바인딩되는 곳) */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6 custom-scrollbar flex justify-center items-start">
          <div className="w-full max-w-4xl bg-white shadow-md rounded-xl p-4 md:p-8 min-h-full docx-preview-parent overflow-x-auto break-words relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center rounded-xl min-h-[300px]">
                <Loader2 className="w-8 h-8 text-[#3530B8] animate-spin mb-3" />
                <p className="text-xs text-gray-400 font-medium">문서를 안전하게 불러오는 중입니다...</p>
              </div>
            )}
            {previewType === 'docx' ? (
              <div ref={docxContainerRef} className="mx-auto min-w-[800px] sm:min-w-0" />
            ) : previewType === 'pdf' && previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-[70vh] rounded-xl border-0 bg-white shadow-inner"
                title={title}
              />
            ) : previewType === 'txt' ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono p-4">{fileBuffer}</pre>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;