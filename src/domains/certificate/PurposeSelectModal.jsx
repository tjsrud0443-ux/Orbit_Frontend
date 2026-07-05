import React, { useState } from 'react';
import { X } from 'lucide-react';
import { alertWarning } from '../../utils/alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPassport, faFileInvoiceDollar, faLandmark, faEllipsis, faMoneyCheckDollar } from '@fortawesome/free-solid-svg-icons';

const options = [
  { label: '은행 제출용', value: 'BANK', icon: <FontAwesomeIcon icon={faMoneyCheckDollar} /> },
  { label: '비자 발급용', value: 'VISA', icon: <FontAwesomeIcon icon={faPassport} /> },
  { label: '소득 증빙용', value: 'INCOME', icon: <FontAwesomeIcon icon={faFileInvoiceDollar} /> },
  { label: '공공기관 제출용', value: 'PUBLIC', icon: <FontAwesomeIcon icon={faLandmark} /> },
  { label: '기타', value: 'ETC', icon: <FontAwesomeIcon icon={faEllipsis} /> },
];

const PurposeSelectModal = ({ onClose, onConfirm }) => {
  const [selected, setSelected] = useState('');
  const [etcText, setEtcText] = useState('');

  const handleConfirm = () => {
    if (!selected) {
      alertWarning('정보 미입력', '용도를 선택해주세요.');
      return;
    }
    if (selected === 'ETC' && !etcText.trim()) {
      alertWarning('정보 미입력', '기타 용도를 입력해주세요.');
      return;
    }
    const finalPurpose = selected === 'ETC' ? etcText.trim() : options.find(o => o.value === selected)?.label;
    onConfirm(finalPurpose);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">증명서에 표시할 용도를 선택해주세요</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => (
              <label
                key={opt.value}
                className={`cursor-pointer px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-start text-sm font-semibold ${opt.value === 'ETC' ? 'col-span-2' : ''
                  } ${selected === opt.value
                    ? 'border-[#3530B8] bg-[#F0F4FF] text-[#3530B8]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-[#3530B8] hover:bg-[#F0F4FF] hover:text-[#3530B8]'
                  }`}
              >
                <input
                  type="radio"
                  name="purpose"
                  value={opt.value}
                  className="hidden"
                  checked={selected === opt.value}
                  onChange={() => setSelected(opt.value)}
                />
                <div className="flex items-center gap-3 w-full pl-2">
                  <div className="w-5 flex justify-center text-base opacity-90">{opt.icon}</div>
                  <span>{opt.label}</span>
                </div>
              </label>
            ))}
          </div>

          {selected === 'ETC' && (
            <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-200">
              <input
                type="text"
                placeholder="직접 용도를 입력해주세요"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                value={etcText}
                onChange={(e) => setEtcText(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="p-5 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            미리보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurposeSelectModal;
