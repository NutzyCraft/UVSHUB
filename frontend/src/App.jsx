import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing      from './pages/home/Landing';
import Courses      from './pages/home/Courses';
import Instructors  from './pages/home/Instructors';
import CourseDetail from './pages/home/CourseDetail';
import StudentLogin from './pages/student/StudentLogin';
import StudentRegister from './pages/student/StudentRegister';
import StudentHome from './pages/student/StudentHome';
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomCursor from './components/ui/CustomCursor';

function App() {
  return (
    <BrowserRouter>
      <CustomCursor />
      <Routes>
        <Route path="/"            element={<Landing />}      />
        <Route path="/courses"     element={<Courses />}      />
        <Route path="/instructors" element={<Instructors />}  />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/student/login"    element={<StudentLogin />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/home"     element={<StudentHome />} />
        <Route path="/admin/dashboard"  element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
