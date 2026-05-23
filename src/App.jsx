import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './domains/auth/Login';
import Signup from './domains/auth/Signup';
import Calendar from './domains/schedules/Calendar';
import Departments from './domains/departments/Departments';
import Layout from './components/layout/Layout';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* 기본 경로를 /login으로 리다이렉트 (선택 사항) */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 1. 레이아웃이 적용되지 않는 독립된 페이지 (인증 관련) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/*Calendar*/}
        <Route path="/calendar" element={<Calendar />} />
       
        {/* 2. 사이드바와 헤더가 전체적으로 공통 적용되는 페이지 묶음 */}
        <Route element={<Layout />}>
          {/*Departments*/}
          <Route path="/departments" element={<Departments />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
