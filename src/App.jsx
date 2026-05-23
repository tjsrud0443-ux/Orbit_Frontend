import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './domains/auth/Login';
import Signup from './domains/auth/Signup';
import Calendar from './domains/schedules/Calendar';
import Departments from './domains/departments/Departments';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* 기본 경로를 /login으로 리다이렉트 (선택 사항) */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 인증 관련 경로 */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/*Calendar*/}
        <Route path="/calendar" element={<Calendar/>}/>

        {/*Departments*/}
        <Route path="/departments" element={<Departments />} />
      </Routes>
    </Router>
  );
}

export default App;
