import { useAuthStore } from '@/store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '@/constants/theme';

// Screens - using absolute imports
// Student screens
import BrowseCoursesScreen from '@/app/screens/student/BrowseCoursesScreen';
import BrowseLiveClassesScreen from '@/app/screens/student/BrowseLiveClassesScreen';
import StudentHomeScreen from '@/app/screens/student/StudentHomeScreen';
import StudentProgressScreen from '@/app/screens/student/StudentProgressScreen';
import StudentVideoLecturesScreen from '@/app/screens/student/StudentVideoLecturesScreen';

// Teacher screens
import CreateAnnouncementScreen from '@/app/screens/teacher/CreateAnnouncementScreen';
import CreateCourseScreen from '@/app/screens/teacher/CreateCourseScreen';
import CreateLessonScreen from '@/app/screens/teacher/CreateLessonScreen';
import CreateLiveClassScreen from '@/app/screens/teacher/CreateLiveClassScreen';
import CreateQuizScreen from '@/app/screens/teacher/CreateQuizScreen';
import ManageLessonsScreen from '@/app/screens/teacher/ManageLessonsScreen';
import ManageLiveClassesScreen from '@/app/screens/teacher/ManageLiveClassesScreen';
import ManageQuizzesScreen from '@/app/screens/teacher/ManageQuizzesScreen';
import ManageVideoLecturesScreen from '@/app/screens/teacher/ManageVideoLecturesScreen';
import MyCoursesScreen from '@/app/screens/teacher/MyCoursesScreen';
import TeacherHomeScreen from '@/app/screens/teacher/TeacherHomeScreen';
import TeacherProgressScreen from '@/app/screens/teacher/TeacherProgressScreen';

// Shared screens
import AboutScreen from '@/app/screens/shared/AboutScreen';
import AnnouncementsScreen from '@/app/screens/shared/AnnouncementsScreen';
import CourseDetailScreen from '@/app/screens/shared/CourseDetailScreen';
import LessonDetailScreen from '@/app/screens/shared/LessonDetailScreen';
import ProfileScreen from '@/app/screens/shared/ProfileScreen';
import QuizResultScreen from '@/app/screens/shared/QuizResultScreen';
import QuizScreen from '@/app/screens/shared/QuizScreen';
import NotificationSettingsScreen from './screens/shared/NotificationSettingsScreen';
import SecurityScreen from '@/app/screens/shared/SecurityScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Student Navigation Stack
function StudentStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
      <Stack.Screen name="BrowseCourses" component={BrowseCoursesScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="QuizResult" component={QuizResultScreen} />
      <Stack.Screen name="StudentVideoLectures" component={StudentVideoLecturesScreen} />
    </Stack.Navigator>
  );
}

// Profile Navigation Stack (for both Student and Teacher)
function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
    </Stack.Navigator>
  );
}

// Teacher Navigation Stack
function TeacherStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="TeacherHome" component={TeacherHomeScreen} />
      <Stack.Screen name="MyCourses" component={MyCoursesScreen} />
      <Stack.Screen name="CreateCourse" component={CreateCourseScreen} />
      <Stack.Screen name="CreateAnnouncement" component={CreateAnnouncementScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="ManageLessons" component={ManageLessonsScreen} />
      <Stack.Screen name="CreateLesson" component={CreateLessonScreen} />
      <Stack.Screen name="ManageQuizzes" component={ManageQuizzesScreen} />
      <Stack.Screen name="CreateQuiz" component={CreateQuizScreen} />
      <Stack.Screen name="ManageLiveClasses" component={ManageLiveClassesScreen} />
      <Stack.Screen name="CreateLiveClass" component={CreateLiveClassScreen} />
      <Stack.Screen name="ManageVideoLectures" component={ManageVideoLecturesScreen} />
    </Stack.Navigator>
  );
}

// Student Tab Navigator
function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarStyle: {
          borderTopColor: Colors.light.divider,
          backgroundColor: Colors.light.surface,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={StudentStack}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="school-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="LiveClassesTab"
        component={BrowseLiveClassesScreen}
        options={{
          tabBarLabel: 'Live',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="video-wireless-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="AnnouncementsTab"
        component={AnnouncementsScreen}
        options={{
          tabBarLabel: 'Updates',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={StudentProgressScreen}
        options={{
          tabBarLabel: 'My Stats',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-timeline-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Teacher Live Classes Stack
function TeacherLiveClassesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ManageLiveClassesMain" component={ManageLiveClassesScreen} />
      <Stack.Screen name="CreateLiveClass" component={CreateLiveClassScreen} />
    </Stack.Navigator>
  );
}

// Teacher Announcements Stack
function TeacherAnnouncementsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AnnouncementsMain" component={AnnouncementsScreen} />
      <Stack.Screen name="CreateAnnouncement" component={CreateAnnouncementScreen} />
    </Stack.Navigator>
  );
}

// Teacher Tab Navigator
function TeacherTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarStyle: {
          borderTopColor: Colors.light.divider,
          backgroundColor: Colors.light.surface,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={TeacherStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="LiveClassesTab"
        component={TeacherLiveClassesStack}
        options={{
          tabBarLabel: 'Live Class',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="video-account" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="AnnouncementsTab"
        component={TeacherAnnouncementsStack}
        options={{
          tabBarLabel: 'Updates',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell-ring" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={TeacherProgressScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-box" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

import { UsageTracker } from '@/components/UsageTracker';

function MainApp() {
  const { user } = useAuthStore();

  return (
    <>
      <UsageTracker />
      {user?.role === 'teacher' ? <TeacherTabs /> : <StudentTabs />}
    </>
  );
}

export default MainApp;
