import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './domains/auth/Login';
import Signup from './domains/auth/Signup';
import Calendar from './domains/schedules/Calendar';
import Departments from './domains/departments/Departments';
import Layout from './components/layout/Layout';
import './App.css';
import Main from './domains/main/Main';
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
import ApprovalMypage from './domains/approval/ApprovalMypage';
import ApprovalInbox from './domains/approval/ApprovalInbox';
import ApprovalCc from './domains/approval/ApprovalCc';
import ApprovalTemp from './domains/approval/ApprovalTemp';
import ProjectsList from './domains/projects/ProjectsList';
import DocumentsList from './domains/documents/DocumentsList';
import MinutesList from './domains/meetingMinutes/MinutesList';
import MinutesDetail from './domains/meetingMinutes/MinutesDetail';
import MeetingRooms from './domains/meetingRooms/MeetingRooms';
import SupplyRequest from './domains/supply/SupplyRequest';
import BoardList from './domains/board/BoardList';
import BoardWrite from './domains/board/BoardWrite';
import BoardDetail from './domains/board/BoardDetail';
import AiChat from './domains/aiChat/AiChat';

function App() {
  return (
    <Router>
      <Routes>
        {/* 기본 경로를 /login으로 리다이렉트 (선택 사항) */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 1. 레이아웃이 적용되지 않는 독립된 페이지 (인증 관련) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 2. 사이드바와 헤더가 전체적으로 공통 적용되는 페이지 묶음 */}
        <Route element={<Layout />}>
          <Route path="/main" element={<Main />} />
          <Route path="/departments" element={<Departments />} />

          <Route path="/approval" element={<ApprovalHome />} />
          <Route path="/approvalMypage" element={<ApprovalMypage />} />
          <Route path="/approvalInbox" element={<ApprovalInbox />} />
          <Route path="/approvalCc" element={<ApprovalCc />} />
          <Route path="/approvalTemp" element={<ApprovalTemp />} />

          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/documents" element={<DocumentsList />} />
          <Route path="/calendar" element={<Calendar />} />

          <Route path="/meetingMinutes" element={<MinutesList />} />
          <Route path="/meetingMinutesDetail" element={<MinutesDetail />} />

          <Route path="/meetingRooms" element={<MeetingRooms />} />
          <Route path="/supply" element={<SupplyRequest />} />

          <Route path="/board" element={<BoardList />} />
          <Route path="/boardWrite" element={<BoardWrite />} />
          <Route path="/boardDetail" element={<BoardDetail />} />

          <Route path="/aiChat" element={<AiChat />} />

          <Route path="/adminMain" element={<AdminMain />} />
          <Route path="/adminUsers" element={<AdminUsers />} />
          <Route path="/adminDepartments" element={<AdminDept />} />
          <Route path="/adminSignup" element={<AdminSignup />} />
          <Route path="/adminSupply" element={<AdminSupply />} />
          <Route path="/adminSupplyRequest" element={<AdminSupplyReq />} />
          <Route path="/adminSupplyRental" element={<AdminSupplyRental />} />
          <Route path="/adminMeetingRoom" element={<AdminMeetingRooms />} />
          <Route path="/adminDocument" element={<AdminDocuments />} />
          <Route path="/adminQna" element={<AdminQna />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
