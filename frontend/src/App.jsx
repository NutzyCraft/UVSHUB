import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing      from './pages/home/Landing';
import Courses      from './pages/home/Courses';
import CourseDetail from './pages/home/CourseDetail';
import StudentLogin from './pages/student/StudentLogin';
import StudentRegister from './pages/student/StudentRegister';
import ForgotPassword from './pages/student/ForgotPassword';
import ResetPassword from './pages/student/ResetPassword';
import About from './pages/home/About';
import StudentHome from './pages/student/StudentHome';
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomCursor from './components/ui/CustomCursor';
import ThemeToggle from './components/ui/ThemeToggle';

function App() {
  return (
    <BrowserRouter>
      <CustomCursor />
      <ThemeToggle />
      <Routes>
        <Route path="/"            element={<Landing />}      />
        <Route path="/about"       element={<About />}        />
        <Route path="/courses"     element={<Courses />}      />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/student/login"    element={<StudentLogin />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/forgot-password" element={<ForgotPassword />} />
        <Route path="/student/reset-password" element={<ResetPassword />} />
        <Route path="/student/home"     element={<StudentHome />} />
        <Route path="/admin/dashboard"  element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
