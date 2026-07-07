import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './domains/auth/Login';
import Signup from './domains/auth/Signup';
import Calendar from './domains/schedules/Calendar';
import Departments from './domains/departments/departments';
import Layout from './components/layout/Layout';
import Main from './domains/main/Main';
import AdminAttendance from './domains/admin/AdminAttendance';
import AdminSignup from './domains/admin/AdminSignup';
import AdminMain from './domains/admin/AdminMain';
import AdminUsers from './domains/admin/AdminUsers';
import AdminDept from './domains/admin/AdminDept';
import AdminSupply from './domains/admin/AdminSupply';
import AdminSupplyReq from './domains/admin/AdminSupplyReq';
import AdminSupplyRental from './domains/admin/AdminSupplyRental';
import AdminMeetingRooms from './domains/admin/AdminMeetingRooms';
import AdminDocuments from './domains/admin/AdminDocuments';
import AdminQna from './domains/admin/AdminQna';
import ApprovalHome from './domains/approval/ApprovalHome';
import ApprovalMyPage from './domains/approval/ApprovalMyPage';
import ApprovalInbox from './domains/approval/ApprovalInbox';
import ApprovalCc from './domains/approval/ApprovalCc';
import ApprovalTemp from './domains/approval/ApprovalTemp';
import ProjectsList from './domains/projects/ProjectsList';
import Kanban from './domains/projects/Kanban';
import DocumentsList from './domains/documents/DocumentsList';
import MinutesList from './domains/meetingMinutes/MinutesList';
import MeetingRooms from './domains/meetingRooms/MeetingRooms';
import SupplyRequest from './domains/supply/SupplyRequest';
import BoardList from './domains/board/BoardList';
import BoardWrite from './domains/board/BoardWrite';
import BoardDetail from './domains/board/BoardDetail';
import AiChat from './domains/aiChat/AiChat';
import CertificationList from './domains/certificate/CertificationList';
import MyPage from './domains/mypage/MyPage';
import MyPageEdit from './domains/mypage/MyPageEdit';
import ProtectedRoute from './components/common/ProtectedRoute';
import ApprovalDetail from './domains/approval/ApprovalDetail';
import FindId from './domains/auth/FindId';
import FindPw from './domains/auth/FindPw';
import QnaHistory from './domains/mypage/QnaHistory';
import RoomHistory from './domains/mypage/RoomHistory';
import SupplyHistory from './domains/mypage/SupplyHistory';
import useLoadingStore from './store/useLoadingStore';
import Loading from './components/common/Loading';
import NotificationProvider from "./components/websocket/NotificationProvider";
import { ToastContainer, Zoom, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css';
import { useEffect, useState } from 'react';
import AdminCompanyInfo from './domains/admin/AdminCompanyInfo';

function App() {
  const loading = useLoadingStore(state => state.loading);
  const loadingType = useLoadingStore(state => state.loadingType);
  const [isMobile, setIsMobile] = useState(window.matchMedia("(max-width:768px)").matches);

  useEffect(() => {
    const media = window.matchMedia("(max-width:768px)");
    const handler = (e) => { setIsMobile(e.matches) };
    media.addEventListener("change", handler);
    return () => { media.removeEventListener("change", handler); }
  }, []);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <Loading type={loadingType} />
        </div>
      )}
      <ToastContainer
        position={isMobile ? "top-center" : "bottom-right"}
        transition={isMobile ? Slide : Zoom}
        limit={isMobile ? 1 : undefined}
        draggable={isMobile ? "touch" : true}
        draggableDirection={isMobile ? "y" : "x"}
        autoClose={3000}
        hideProgressBar
        toastClassName="customToast"
      />
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/findId" element={<FindId />} />
            <Route path="/findPw" element={<FindPw />} />

            {/* 레이아웃(사이드바+헤더) 내부 페이지 */}
            <Route element={<Layout />}>
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/mypage/edit" element={<MyPageEdit />} />
              <Route path="/qnaHistory" element={<QnaHistory />} />
              <Route path="/roomHistory" element={<RoomHistory />} />
              <Route path="/supplyHistory" element={<SupplyHistory />} />
              <Route path="/main" element={<Main />} />
              <Route path="/departments" element={<Departments />} />

              <Route path="/approval" element={<ApprovalHome />} />
              <Route path="/approvalMypage" element={<ApprovalMyPage />} />
              <Route path="/approvalInbox" element={<ApprovalInbox />} />
              <Route path="/approvalCc" element={<ApprovalCc />} />
              <Route path="/approvalTemp" element={<ApprovalTemp />} />

              {/* 리팩토링된 통합 결재 상세/작성 페이지 */}
              <Route path="/approval/write/:type" element={<ApprovalDetail />} />
              <Route path="/approval/detail/:type/:docSeq" element={<ApprovalDetail />} />

              <Route path="/projects" element={<ProjectsList />} />
              <Route path="/kanban/:projectSeq" element={<Kanban />} />
              <Route path="/documents" element={<DocumentsList />} />
              <Route path="/calendar" element={<Calendar />} />

              <Route path="/meetingMinutes" element={<MinutesList />} />

              <Route path="/meetingRooms" element={<MeetingRooms />} />
              <Route path="/supply" element={<SupplyRequest />} />

              <Route path="/board" element={<BoardList />} />
              <Route path="/boardWrite" element={<BoardWrite />} />
              <Route path="/boardWrite/:seq" element={<BoardWrite />} />
              <Route path="/boardDetail/:seq" element={<BoardDetail />} />

              <Route path="/aiChat" element={<AiChat />} />

              <Route path="/certificate" element={<CertificationList />} />

              <Route element={<ProtectedRoute
                allow={[{ type: "group", value: "ROLE_SUPER_ADMIN" }]} />}>
                <Route path="/adminMain" element={<AdminMain />} />
                <Route path="/adminCompanyInfo" element={<AdminCompanyInfo />} />
              </Route>

              <Route element={<ProtectedRoute
                allow={[{ type: "group", value: "ROLE_HR_ADMIN" }]} />}>
                <Route path="/adminUsers" element={<AdminUsers />} />
                <Route path="/adminDepartments" element={<AdminDept />} />
                <Route path="/adminSignup" element={<AdminSignup />} />
                <Route path="/adminAttendance" element={<AdminAttendance />} />
              </Route>

              <Route element={<ProtectedRoute
                allow={[{ type: "group", value: "ROLE_GA_ADMIN" }]} />}>
                <Route path="/adminSupply" element={<AdminSupply />} />
                <Route path="/adminSupplyRequest" element={<AdminSupplyReq />} />
                <Route path="/adminSupplyRental" element={<AdminSupplyRental />} />
                <Route path="/adminMeetingRoom" element={<AdminMeetingRooms />} />
              </Route>

              <Route element={<ProtectedRoute
                allow={[
                  { type: "rank", value: "부서장" },
                  { type: "rank", value: "본부장" }
                ]} />}>
                <Route path="/adminDocument" element={<AdminDocuments />} />
                <Route path="/adminQna" element={<AdminQna />} />
              </Route>

            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </>
  );
}

export default App;