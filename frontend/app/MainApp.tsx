import { useAuthStore } from '@/store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '@/constants/theme';
import { TouchableOpacity, View } from 'react-native';
import StudentAIStackNavigator from './navigation/StudentAIStackNavigator';

// Screens - using absolute imports
// Student screens
import BrowseCoursesScreen from './screens/student/BrowseCoursesScreen';
import BrowseLiveClassesScreen from './screens/student/BrowseLiveClassesScreen';
import StudentHomeScreen from './screens/student/StudentHomeScreen';
import StudentProgressScreen from './screens/student/StudentProgressScreen';
import StudentVideoLecturesScreen from './screens/student/StudentVideoLecturesScreen';
import AllQuizzesScreen from './screens/student/AllQuizzesScreen';
import CourseLessonsScreen from './screens/shared/CourseLessonsScreen';

// Teacher screens
import CreateAnnouncementScreen from './screens/teacher/CreateAnnouncementScreen';
import CreateCourseScreen from './screens/teacher/CreateCourseScreen';
import CreateLessonScreen from './screens/teacher/CreateLessonScreen';
import CreateLiveClassScreen from './screens/teacher/CreateLiveClassScreen';
import CreateQuizScreen from './screens/teacher/CreateQuizScreen';
import ManageLessonsScreen from './screens/teacher/ManageLessonsScreen';
import ManageLiveClassesScreen from './screens/teacher/ManageLiveClassesScreen';
import ManageQuizzesScreen from './screens/teacher/ManageQuizzesScreen';
import ManageVideoLecturesScreen from './screens/teacher/ManageVideoLecturesScreen';
import MyCoursesScreen from './screens/teacher/MyCoursesScreen';
import TeacherHomeScreen from './screens/teacher/TeacherHomeScreen';
import TeacherProgressScreen from './screens/teacher/TeacherProgressScreen';
import StudentDetailScreen from './screens/teacher/StudentDetailScreen';

// Shared screens
import AboutScreen from './screens/shared/AboutScreen';
import AnnouncementsScreen from './screens/shared/AnnouncementsScreen';
import CourseDetailScreen from './screens/shared/CourseDetailScreen';
import LessonDetailScreen from './screens/shared/LessonDetailScreen';
import ProfileScreen from './screens/shared/ProfileScreen';
import QuizResultScreen from './screens/shared/QuizResultScreen';
import QuizScreen from './screens/shared/QuizScreen';
import NotificationSettingsScreen from './screens/shared/NotificationSettingsScreen';
import SecurityScreen from './screens/shared/SecurityScreen';
import QuizAnalysisScreen from './screens/shared/QuizAnalysisScreen';

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
      <Stack.Screen name="QuizAnalysis" component={QuizAnalysisScreen} />
      <Stack.Screen name="StudentVideoLectures" component={StudentVideoLecturesScreen} />
      <Stack.Screen name="AllQuizzes" component={AllQuizzesScreen} />
      <Stack.Screen name="CourseLessons" component={CourseLessonsScreen} />
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
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
    </Stack.Navigator>
  );
}

// Teacher Progress Stack
function TeacherProgressStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="TeacherProgressMain" component={TeacherProgressScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
    </Stack.Navigator>
  );
}

// Student Progress Stack
function StudentProgressStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="StudentProgressMain" component={StudentProgressScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="QuizResult" component={QuizResultScreen} />
      <Stack.Screen name="QuizAnalysis" component={QuizAnalysisScreen} />
      <Stack.Screen name="StudentVideoLectures" component={StudentVideoLecturesScreen} />
      <Stack.Screen name="AllQuizzes" component={AllQuizzesScreen} />
      <Stack.Screen name="CourseLessons" component={CourseLessonsScreen} />
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
        tabBarHideOnKeyboard: true,
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
        name="AI Center"
        component={StudentAIStackNavigator}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot" color={color} size={size} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...(props as any)}
              style={{
                top: -20,
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <View
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 31,
                  backgroundColor: Colors.light.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: '#fff',
                }}
              >
                <MaterialCommunityIcons name="creation" size={30} color="white" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={StudentProgressStack}
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
      <Stack.Screen name="CourseLessons" component={CourseLessonsScreen} />
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
        component={TeacherProgressStack}
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
