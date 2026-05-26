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
import MyPage from './domains/mypage/MyPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import GeneralForm from './domains/approval/forms/GeneralForm';
import PaymentForm from './domains/approval/forms/PaymentForm';
import PurchaseForm from './domains/approval/forms/PurchaseForm';
import VacationForm from './domains/approval/forms/VacationForm';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 레이아웃(사이드바+헤더) 내부 페이지 */}
        <Route element={<Layout />}>
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/main" element={<Main />} />
          <Route path="/departments" element={<Departments />} />

          <Route path="/approval" element={<ApprovalHome />} />
          <Route path="/approvalMypage" element={<ApprovalMypage />} />
          <Route path="/approvalInbox" element={<ApprovalInbox />} />
          <Route path="/approvalCc" element={<ApprovalCc />} />
          <Route path="/approvalTemp" element={<ApprovalTemp />} />

          <Route path="/approval/write/general" element={<GeneralForm isReadOnly={false} />} />
          <Route path="/approval/detail/general/:seq" element={<GeneralForm isReadOnly={true} />} />

          <Route path="/approval/write/payment" element={<PaymentForm isReadOnly={false} />} />
          <Route path="/approval/detail/payment/:seq" element={<PaymentForm isReadOnly={true} />} />

          <Route path="/approval/write/purchase" element={<PurchaseForm isReadOnly={false} />} />
          <Route path="/approval/detail/purchase/:seq" element={<PurchaseForm isReadOnly={true} />} />

          <Route path="/approval/write/vacation" element={<VacationForm isReadOnly={false} />} />
          <Route path="/approval/detail/vacation/:seq" element={<VacationForm isReadOnly={true} />} />

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

          <Route element={<ProtectedRoute
            allow={[
              { type: "dept", value: "인사팀" },
              { type: "rank", value: "대표" }
            ]} />}>
            <Route path="/adminUsers" element={<AdminUsers />} />
            <Route path="/adminDepartments" element={<AdminDept />} />
            <Route path="/adminSignup" element={<AdminSignup />} />
          </Route>

          <Route element={<ProtectedRoute
            allow={[
              { type: "dept", value: "총무팀" },
              { type: "rank", value: "대표" }
            ]} />}>
            <Route path="/adminSupply" element={<AdminSupply />} />
            <Route path="/adminSupplyRequest" element={<AdminSupplyReq />} />
            <Route path="/adminSupplyRental" element={<AdminSupplyRental />} />
            <Route path="/adminMeetingRoom" element={<AdminMeetingRooms />} />
          </Route>

          <Route element={<ProtectedRoute
            allow={[
              { type: "rank", value: "부서장" },
              { type: "rank", value: "본부장" },
              { type: "rank", value: "대표" }
            ]} />}>
            <Route path="/adminDocument" element={<AdminDocuments />} />
            <Route path="/adminQna" element={<AdminQna />} />
          </Route>
          
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
