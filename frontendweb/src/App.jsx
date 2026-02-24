import React, { useState, useEffect } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OnboardingScreen } from './components/OnboardingScreen';
import { LoginPage } from './components/LoginPage';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ProfilePage } from './components/ProfilePage';
import { NotificationsPage } from './components/NotificationsPage';
import { ContactUsPage } from './components/ContactUsPage';
import { MyCoursesPage } from './components/MyCoursesPage';
import { CourseDetailPage } from './components/CourseDetailPage';
import { QuizTakingPage } from './components/QuizTakingPage';
import { DoubtsPage } from './components/DoubtsPage';
import { CurriculumManagementPage } from './components/CurriculumManagementPage';
import { AttendanceMarkingPage } from './components/AttendanceMarkingPage';
import { CourseCatalogPage } from './components/CourseCatalogPage';

import { QuizResultPage } from './components/QuizResultPage';
import { ClassroomPage } from './components/ClassroomPage';

// Admin Pages
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminTeachers } from './admin/AdminTeachers';
import { AdminStudents } from './admin/AdminStudents';
import { AdminUserDetail } from './admin/AdminUserDetail';
import { AdminCourses } from './admin/AdminCourses';
import { AdminEnrollments } from './admin/AdminEnrollments';
import { AdminProfile } from './admin/AdminProfile';
import { AdminAnnouncements } from './admin/AdminAnnouncements';
import { AdminPremium } from './admin/AdminPremium';

import api from './api';

function App() {
    const [currentPage, setCurrentPage] = useState('onboarding');
    const [userRole, setUserRole] = useState('student');
    const [userData, setUserData] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [quizResult, setQuizResult] = useState(null);
    const [selectedCourseTitle, setSelectedCourseTitle] = useState('');

    // Admin-specific state
    const [adminSelectedUserId, setAdminSelectedUserId] = useState(null);
    const [adminSelectedUserType, setAdminSelectedUserType] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

        if (token) {
            // Attempt background auto-login
            api.get('auth/profile/')
                .then(res => {
                    if (res.data && res.data.data) {
                        const user = res.data.data.user || res.data.data;
                        setUserData(user);
                        if (user.role) setUserRole(user.role.toLowerCase());
                        setCurrentPage('dashboard');
                    } else if (hasSeenOnboarding) {
                        setCurrentPage('login');
                    }
                })
                .catch(err => {
                    // Token expired or invalid
                    if (hasSeenOnboarding) setCurrentPage('login');
                })
                .finally(() => {
                    setIsInitializing(false);
                });
        } else {
            // No token exists, decide between onboarding and login
            if (hasSeenOnboarding) {
                setCurrentPage('login');
            }
            setIsInitializing(false);
        }
    }, []);

    if (isInitializing) {
        return (
            <div className="splash-screen">
                <div className="splash-glow"></div>
                <div className="splash-content">
                    <div className="splash-orb">
                        <div className="splash-orb-inner">M</div>
                    </div>
                    <h1 className="splash-title">MentiQ</h1>
                    <p className="splash-subtitle">Preparing your workspace...</p>
                    <div className="splash-loader">
                        <div className="splash-loader-bar"></div>
                    </div>
                </div>
            </div>
        );
    }

    const handleOnboardingFinish = () => {
        localStorage.setItem('hasSeenOnboarding', 'true');
        setCurrentPage('login');
    };

    const handleLoginSuccess = (userObj) => {
        if (userObj) {
            if (userObj.role) setUserRole(userObj.role.toLowerCase());
            setUserData(userObj);
        }
        setCurrentPage('dashboard');
    }

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await api.post('auth/logout/', { refresh: refreshToken });
            }
        } catch (err) {
            // Proceed with local logout even if backend call fails
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUserData(null);
        setCurrentPage('login');
    }

    // Admin navigation handler
    const handleAdminNavigate = (page, id, type) => {
        if (page === 'admin_user_detail' && id) {
            setAdminSelectedUserId(id);
            setAdminSelectedUserType(type || 'student');
        }
        setCurrentPage(page);
    };

    if (currentPage === 'onboarding') {
        return <OnboardingScreen onFinish={handleOnboardingFinish} />;
    }

    if (currentPage === 'login') {
        return <LoginPage onBack={handleLoginSuccess} />;
    }

    const isAdmin = userRole === 'admin';
    const isAdminPage = currentPage.startsWith('admin');

    // Determine which pages should hide the header
    const hideHeaderPages = ['profile', 'notifications', 'contact', 'classroom', 'courses', 'doubts', 'curriculum_management', 'attendance', 'course_catalog'];
    const shouldHideHeader = hideHeaderPages.includes(currentPage) || isAdminPage;

    return (
        <>
            <Sidebar
                onOpenContact={() => setCurrentPage('contact')}
                onGoHome={() => setCurrentPage('dashboard')}
                onOpenCourses={() => setCurrentPage('courses')}
                onOpenClassroom={() => setCurrentPage('classroom')}
                onOpenDoubts={() => setCurrentPage('doubts')}
                onLogout={handleLogout}
                currentPage={currentPage}
                userRole={userRole}
                // Admin navigation
                onOpenAdminTeachers={() => setCurrentPage('admin_teachers')}
                onOpenAdminStudents={() => setCurrentPage('admin_students')}
                onOpenAdminCourses={() => setCurrentPage('admin_courses')}
                onOpenAdminAnnouncements={() => setCurrentPage('admin_announcements')}
                onOpenAdminPremium={() => setCurrentPage('admin_premium')}
            />
            <div className={`main-content ${currentPage === 'classroom' ? 'classroom-mode' : ''}`}>
                {!shouldHideHeader && (
                    <Header
                        onGetStarted={() => setCurrentPage('login')}
                        userData={userData}
                        isLoggedIn={!!userData}
                        onOpenProfile={() => setCurrentPage('profile')}
                        onOpenNotifications={() => setCurrentPage('notifications')}
                        currentPage={currentPage}
                        userRole={userRole}
                    />
                )}

                {/* ══════════ ADMIN PAGES ══════════ */}
                {currentPage === 'dashboard' && isAdmin ? (
                    <AdminDashboard
                        onNavigate={handleAdminNavigate}
                    />
                ) : currentPage === 'admin_teachers' ? (
                    <AdminTeachers
                        onBack={() => setCurrentPage('dashboard')}
                        onViewDetail={(id, type) => handleAdminNavigate('admin_user_detail', id, type)}
                    />
                ) : currentPage === 'admin_students' ? (
                    <AdminStudents
                        onBack={() => setCurrentPage('dashboard')}
                        onViewDetail={(id, type) => handleAdminNavigate('admin_user_detail', id, type)}
                    />
                ) : currentPage === 'admin_user_detail' ? (
                    <AdminUserDetail
                        userId={adminSelectedUserId}
                        userType={adminSelectedUserType}
                        onBack={() => setCurrentPage(adminSelectedUserType === 'teacher' ? 'admin_teachers' : 'admin_students')}
                    />
                ) : currentPage === 'admin_courses' ? (
                    <AdminCourses
                        onBack={() => setCurrentPage('dashboard')}
                    />
                ) : currentPage === 'admin_enrollments' ? (
                    <AdminEnrollments
                        onBack={() => setCurrentPage('dashboard')}
                    />
                ) : currentPage === 'admin_add_teacher' ? (
                    <AdminTeachers
                        onBack={() => setCurrentPage('dashboard')}
                        onViewDetail={(id, type) => handleAdminNavigate('admin_user_detail', id, type)}
                    />
                ) : currentPage === 'admin_add_student' ? (
                    <AdminStudents
                        onBack={() => setCurrentPage('dashboard')}
                        onViewDetail={(id, type) => handleAdminNavigate('admin_user_detail', id, type)}
                    />
                ) : currentPage === 'admin_announcements' ? (
                    <AdminAnnouncements
                        onBack={() => setCurrentPage('dashboard')}
                    />
                ) : currentPage === 'admin_premium' ? (
                    <AdminPremium />

                    /* ══════════ EXISTING PAGES ══════════ */
                ) : currentPage === 'profile' ? (
                    isAdmin ? (
                        <AdminProfile
                            userData={userData}
                            onBackToDashboard={() => setCurrentPage('dashboard')}
                            onLogout={handleLogout}
                            onUpdateProfile={(newProfile) => setUserData({ ...userData, ...newProfile })}
                        />
                    ) : (
                        <ProfilePage
                            userData={userData}
                            onBackToDashboard={() => setCurrentPage('dashboard')}
                            onLogout={handleLogout}
                            onUpdateProfile={(newProfile) => setUserData({ ...userData, ...newProfile })}
                        />
                    )
                ) : currentPage === 'notifications' ? (
                    <NotificationsPage onBack={() => setCurrentPage('dashboard')} />
                ) : currentPage === 'contact' ? (
                    <ContactUsPage onBack={() => setCurrentPage('dashboard')} userData={userData} />
                ) : currentPage === 'courses' ? (
                    <MyCoursesPage
                        onBack={() => setCurrentPage('dashboard')}
                        onSelectCourse={(id) => {
                            setSelectedCourseId(id);
                            setCurrentPage(userRole === 'teacher' ? 'curriculum_management' : 'course_detail');
                        }}
                        onBrowseCourses={() => setCurrentPage('course_catalog')}
                        userRole={userRole}
                    />
                ) : currentPage === 'classroom' ? (
                    <ClassroomPage onBack={() => setCurrentPage('dashboard')} userRole={userRole} />
                ) : currentPage === 'doubts' ? (
                    <DoubtsPage onBack={() => setCurrentPage('dashboard')} userRole={userRole} />
                ) : currentPage === 'course_detail' ? (
                    <CourseDetailPage
                        courseId={selectedCourseId}
                        onBack={() => setCurrentPage('dashboard')}
                        onTakeQuiz={(id) => { setSelectedQuizId(id); setCurrentPage('quiz'); }}
                    />
                ) : currentPage === 'quiz' ? (
                    <QuizTakingPage
                        quizId={selectedQuizId}
                        onBack={() => setCurrentPage('course_detail')}
                        onComplete={(result) => { setQuizResult(result); setCurrentPage('quiz_result'); }}
                    />
                ) : currentPage === 'quiz_result' ? (
                    <QuizResultPage
                        result={quizResult}
                        quizId={selectedQuizId}
                        onBack={() => setCurrentPage('course_detail')}
                        onRetake={() => setCurrentPage('quiz')}
                    />
                ) : currentPage === 'curriculum_management' ? (
                    <CurriculumManagementPage
                        courseId={selectedCourseId}
                        onBack={() => setCurrentPage('courses')}
                    />
                ) : currentPage === 'attendance' ? (
                    <AttendanceMarkingPage
                        courseId={selectedCourseId}
                        courseTitle={selectedCourseTitle}
                        onBack={() => setCurrentPage('dashboard')}
                    />
                ) : currentPage === 'course_catalog' ? (
                    <CourseCatalogPage
                        onBack={() => setCurrentPage('dashboard')}
                        onEnrollSuccess={(courseId) => {
                            setSelectedCourseId(courseId);
                            setCurrentPage('course_detail');
                        }}
                    />
                ) : userRole === 'teacher' ? (
                    <TeacherDashboard
                        userData={userData}
                        userRole={userRole}
                        onMarkAttendance={(id, title) => {
                            setSelectedCourseId(id);
                            setSelectedCourseTitle(title);
                            setCurrentPage('attendance');
                        }}
                    />
                ) : (
                    <StudentDashboard
                        userData={userData}
                        userRole={userRole}
                        onSeeAllCourses={() => setCurrentPage('courses')}
                        onContinueCourse={(id) => { setSelectedCourseId(id); setCurrentPage('course_detail'); }}
                    />
                )}
            </div>
        </>
    );
}

export default App;
