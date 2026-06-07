import React, { useState, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faPlus, faTimes, faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import { useDropzone } from 'react-dropzone';
import { addMeetingRoom, deleteMeetingRoom, editMeetingRoom, getAllRooms } from './adminApi';
import useAuthStore from '../../store/authStore';

const AdminMeetingRooms = () => {
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    room_seq: "",
    room_name: "",
    max_people: "",
    oriname: "",
    sysname: "",
    room_floor: ""
  });

  const token = useAuthStore(state => state.token);

  const loadRooms = () => {
    getAllRooms().then(resp => {
      setRooms(resp.data);
    }).catch(err => console.error("회의실 목록 로드 실패:", err));
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const onDrop = useCallback(acceptedFiles => {
    setUploadedFiles(acceptedFiles);
    if (acceptedFiles.length > 0) {
      setErrors(prev => ({ ...prev, image: null }));
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
    maxFiles: 1,
    multiple: false
  });

  const handleAddClick = () => {
    setIsAddMode(true);
    setSelectedRoom(null);
    setUploadedFiles([]);
    setPreviewImage(null);
    setErrors({});
    setFormData({
      room_seq: "",
      room_name: "",
      max_people: "",
      oriname: "",
      sysname: "",
      room_floor: ""
    });
  };

  const handleEditClick = (room) => {
    setIsAddMode(true);
    setSelectedRoom(room);
    setUploadedFiles([]);
    setPreviewImage(room.sysname ? `http://localhost/file/profile/view?sysname=${room.sysname}&token=${token}` : null);
    setErrors({});
    setFormData({
      room_seq: room.room_seq,
      room_name: room.room_name,
      max_people: room.max_people,
      oriname: room.oriname,
      sysname: room.sysname,
      room_floor: room.room_floor
    });
  };

  const handleClosePanel = () => {
    setIsAddMode(false);
    setSelectedRoom(null);
  };

  const handleDelete = async (seq) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteMeetingRoom(seq);
        alert('삭제가 완료되었습니다.');
        loadRooms();
      } catch (error) {
        console.error('회의실 삭제 실패', error);
        alert('회의실 삭제에 실패했습니다.');
      }
    }
  };

  const handleChange = (e) => {
    const {name, value} = e.target;
    setFormData(prev => ({...prev, [name]:value}));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }

  const handleComplete = async () => {
    const newErrors = {};
    if (!previewImage && uploadedFiles.length === 0) {
      newErrors.image = "회의실 사진을 첨부해주세요.";
    }
    if (!formData.room_name || !formData.room_name.trim()) {
      newErrors.room_name = "회의실명을 입력해주세요.";
    }
    if (!formData.max_people) {
      newErrors.max_people = "1 이상의 숫자를 입력해주세요.";
    } else if (!/^[1-9][0-9]*$/.test(formData.max_people.toString())) {
      newErrors.max_people = "1 이상의 숫자만 입력해주세요.";
    }
    if (!formData.room_floor || !formData.room_floor.trim()) {
      newErrors.room_floor = "위치를 입력해주세요.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data = new FormData();
    data.append('input', new Blob([JSON.stringify(formData)], { type: 'application/json' }));
    if (uploadedFiles.length > 0) {
      data.append('file', uploadedFiles[0]);
    }

    try {
      if (selectedRoom) {
        await editMeetingRoom(data);
      } else {
        await addMeetingRoom(data);
      }
      alert(selectedRoom ? "회의실 정보가 수정되었습니다." : "회의실이 등록되었습니다.");
      loadRooms();
      setIsAddMode(false);
      setSelectedRoom(null);
      setErrors({});
    } catch (error) {
      console.error('회의실 처리 실패', error);
      alert(selectedRoom ? "회의실 수정에 실패했습니다." : "회의실 등록에 실패했습니다.");
    }
    
  }

  return (
    <div className={`h-full flex flex-col ${isAddMode ? 'p-0 md:p-8' : 'p-6 md:p-8'} font-sans overflow-hidden bg-white`}>
      
      {/* 헤더 영역 */}
      <div className={`mb-6 flex-shrink-0 ${isAddMode ? 'hidden md:block' : 'block'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">회의실 관리</h1>
            <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">
              회의실 정보를 확인하고 관리할 수 있습니다.
            </p>
          </div>
          <button 
            onClick={handleAddClick}
            className="px-4 py-2 bg-[#3530B8] text-white text-sm font-bold rounded-xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            회의실 추가
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        
        {/* 목록 섹션 */}
        <div className={`flex flex-col bg-white rounded-[2rem] border border-[#F0F4FF] shadow-sm overflow-hidden transition-all duration-500 min-h-0 ${isAddMode ? 'hidden md:flex md:flex-[0.6]' : 'flex-1'}`}>
          <div className="hidden md:grid grid-cols-[1.2fr_1.2rem_1fr_1fr_0.8fr] md:grid-cols-[1.2fr_1fr_1fr_0.5fr_1fr] px-6 py-4 border-b border-gray-50 text-[0.6875rem] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">
            <div className="text-center">회의실</div>
            <div>회의실명</div>
            <div>허용 인원수</div>
            <div>위치</div>
            <div className="text-center">관리</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {rooms.map((room) => (
              <div 
                key={room.room_seq}
                className="flex md:grid md:grid-cols-[1.2fr_1fr_1fr_0.5fr_1fr] px-4 md:px-6 py-6 items-center border-b border-gray-50/50"
              >
                {/* 회의실 사진 */}
                <div className="flex-shrink-0 md:flex md:justify-center mr-4 md:mr-0">
                  <div className="w-24 h-16 md:w-32 md:h-20 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shadow-sm">
                    {room.sysname ? (
                      <img src={`http://localhost/file/profile/view?sysname=${room.sysname}&token=${token}`} 
                        alt={room.room_name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* 회의실명 */}
                <div className="flex-1 md:block text-sm font-bold text-gray-700 truncate">
                  {room.room_name}
                  <div className="md:hidden text-[0.6875rem] text-gray-500 font-medium mt-1">
                    인원: {room.max_people}명 | 위치: {room.room_floor}
                  </div>
                </div>

                {/* 허용 인원수 (PC 전용) */}
                <div className="hidden md:block text-sm text-gray-500 font-medium pl-3">
                  {room.max_people}명
                </div>

                {/* 위치 (PC 전용) */}
                <div className="hidden md:block text-sm text-gray-500 font-medium">
                  {room.room_floor}
                </div>

                {/* 관리 버튼 */}
                <div className="flex-shrink-0 ml-3 md:ml-0 flex justify-center gap-2">
                  <button 
                    onClick={() => handleEditClick(room)}
                    className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-[#3530B8] transition-all flex items-center justify-center cursor-pointer"
                    title="수정"
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-xs" />
                  </button>
                  <button 
                    onClick={() => handleDelete(room.room_seq)}
                    className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center cursor-pointer"
                    title="삭제"
                  >
                    <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* 추가/수정 패널 섹션 */}
        {isAddMode && (
          <div className={`flex flex-col bg-white rounded-none md:rounded-[2rem] border-0 md:border border-[#F0F4FF] shadow-sm overflow-hidden min-h-0 animate-in slide-in-from-right duration-500 flex-1 md:flex-[0.4]`}>
            <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">{selectedRoom ? '회의실 수정' : '회의실 추가'}</h2>
              <button onClick={handleClosePanel} className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
              {/* 사진 첨부 영역 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">회의실 사진</label>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer h-52 overflow-hidden
                    ${errors.image ? 'border-rose-500 bg-rose-50' : isDragActive ? 'border-[#3530B8] bg-[#3530B8]/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <input {...getInputProps()} />
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                        <FontAwesomeIcon icon={faCloudUploadAlt} className="text-xl" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-700">사진을 첨부하세요</p>
                        <p className="text-[0.625rem] mt-1 text-gray-400">드래그하거나 클릭하여 업로드</p>
                      </div>
                    </>
                  )}
                </div>
                {errors.image && <p className="text-xs text-rose-500 ml-1 mt-1">{errors.image}</p>}
              </div>

              {/* 입력 창들 */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">회의실명</label>
                  <input 
                    type="text"
                    value={formData.room_name}
                    onChange={handleChange}
                    name="room_name"
                    placeholder="회의실 이름을 입력하세요"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-4 outline-none transition-all text-sm font-medium ${errors.room_name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/5' : 'border-gray-100 focus:border-[#3530B8] focus:ring-[#3530B8]/5'}`}
                  />
                  {errors.room_name && <p className="text-xs text-rose-500 ml-1 mt-1">{errors.room_name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">허용 인원수</label>
                  <input 
                    type="number"
                    value={formData.max_people}
                    onChange={handleChange}
                    name="max_people"
                    placeholder="최대 수용 인원을 입력하세요"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-4 outline-none transition-all text-sm font-medium ${errors.max_people ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/5' : 'border-gray-100 focus:border-[#3530B8] focus:ring-[#3530B8]/5'}`}
                  />
                  {errors.max_people && <p className="text-xs text-rose-500 ml-1 mt-1">{errors.max_people}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">위치</label>
                  <input 
                    type="text"
                    value={formData.room_floor}
                    onChange={handleChange}
                    name="room_floor"
                    placeholder="회의실 위치를 입력하세요 (예: 12층)"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-4 outline-none transition-all text-sm font-medium ${errors.room_floor ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/5' : 'border-gray-100 focus:border-[#3530B8] focus:ring-[#3530B8]/5'}`}
                  />
                  {errors.room_floor && <p className="text-xs text-rose-500 ml-1 mt-1">{errors.room_floor}</p>}
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="p-6 border-t border-gray-50 flex gap-3 flex-shrink-0 bg-white">
              <button 
                onClick={handleClosePanel}
                className="flex-1 py-4 border-2 border-gray-100 text-gray-500 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
              >
                취소
              </button>
              <button 
                onClick={handleComplete}
                className="flex-[2] py-4 bg-[#3530B8] text-white text-sm font-bold rounded-2xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all cursor-pointer"
              >
                {selectedRoom ? '수정 완료' : '등록'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
    </div>
  );
};

export default AdminMeetingRooms;
