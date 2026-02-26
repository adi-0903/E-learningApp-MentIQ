import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, StyleSheet, ScrollView, TouchableOpacity, Alert,
    Image, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
    StatusBar, TextInput as RNTextInput
  useWindowDimensions,
} from 'react-native';
import { Text, TextInput, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, AppShadows } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { aiApi } from '@/services/ai.service';
import FlashcardDeck from '@/components/ai/FlashcardDeck';
import Markdown from 'react-native-markdown-display';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@/services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Animated, {
    FadeInUp,
    FadeInDown,
    FadeIn,
    SlideInDown,
    Layout,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

type TabType = 'chat' | 'flashcards' | 'planner';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    image?: string;
}

export default function AICenterScreen() {
  const { width } = useWindowDimensions();
    const [activeTab, setActiveTab] = useState<TabType>('chat');
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [image, setImage] = useState<any>(null);

    // Flashcards state
    const [flashcardTopic, setFlashcardTopic] = useState('');
    const [flashcards, setFlashcards] = useState([]);

    // Planner state
    const [examDate, setExamDate] = useState<Date | null>(null);
    const [planSubject, setPlanSubject] = useState('');
    const [studyPlan, setStudyPlan] = useState('');
    const [syllabusImage, setSyllabusImage] = useState<any>(null);
    const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(true);

    const scrollRef = useRef<ScrollView>(null);

    // Fetch enrolled courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/v1/students/courses/');
                setEnrolledCourses(res.data?.results || res.data || []);
            } catch (_e) { /* silent */ }
        };
        fetchCourses();
    }, []);

    // Animations
    const pulseValue = useSharedValue(1);
    const tabTranslateX = useSharedValue(0);
    const containerWidth = width - 40;
    const tabWidth = (containerWidth - 8) / 3;

    useEffect(() => {
        pulseValue.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 2000 }),
                withTiming(1, { duration: 2000 })
            ),
            -1,
            true
        );
    }, []);

    useEffect(() => {
        const index = activeTab === 'chat' ? 0 : activeTab === 'flashcards' ? 1 : 2;
        tabTranslateX.value = withSpring(index * tabWidth, { damping: 18, stiffness: 120 });
    }, [activeTab]);

    const animatedTabStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: tabTranslateX.value }],
    }));

    const animatedPulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }],
        opacity: 0.6 + (pulseValue.value - 1) * 4
    }));

    const triggerHaptic = (style: any = Haptics.ImpactFeedbackStyle.Light) => {
        if (Platform.OS === 'web') return;

        if (Object.values(Haptics.NotificationFeedbackType).includes(style)) {
            Haptics.notificationAsync(style);
        } else {
            Haptics.impactAsync(style);
        }
    };

    const pickImage = async () => {
        triggerHaptic();
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const handleAskGlobal = async () => {
        if (!query && !image) return;

        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        const userMsg: Message = {
            id: Date.now().toString(),
            text: query,
            isUser: true,
            timestamp: new Date(),
            image: image?.uri
        };

        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        const capturedImage = image;
        setImage(null);
        setIsLoading(true);

        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const res = await aiApi.askGlobal(userMsg.text, capturedImage);
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: res.data.answer,
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        } catch (_error) {
            Alert.alert("Quantum Glitch", "QBit is having trouble accessing the neural network.");
        } finally {
            setIsLoading(false);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const handleGenerateFlashcards = async () => {
        if (!flashcardTopic) return;
        setIsLoading(true);
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const res = await aiApi.generateFlashcards(flashcardTopic);
            setFlashcards(res.data);
            triggerHaptic(Haptics.NotificationFeedbackType.Success);
        } catch (_error) {
            Alert.alert("Error", "Neural Deck construction failed.");
        } finally {
            setIsLoading(false);
        }
    }

    const pickSyllabus = async () => {
        Alert.alert(
            'Upload Syllabus',
            'Choose a file type',
            [
                {
                    text: 'Image (Photo)',
                    onPress: async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: false,
                            quality: 0.8,
                        });
                        if (!result.canceled) {
                            setSyllabusImage({ ...result.assets[0], type: 'image' });
                        }
                    }
                },
                {
                    text: 'PDF Document',
                    onPress: async () => {
                        const result = await DocumentPicker.getDocumentAsync({
                            type: 'application/pdf',
                            copyToCacheDirectory: true,
                        });
                        if (!result.canceled) {
                            setSyllabusImage({ ...result.assets[0], type: 'pdf' });
                        }
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
        triggerHaptic();
    };

    const handleGeneratePlanner = async () => {
        if (!examDate && !planSubject && !selectedCourse) {
            Alert.alert('Missing Info', 'Please select an exam date and enter a subject or choose a course.');
            return;
        }
        setIsLoading(true);
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const dateStr = examDate ? `${examDate.getFullYear()}-${String(examDate.getMonth() + 1).padStart(2, '0')}-${String(examDate.getDate()).padStart(2, '0')}` : 'Not specified';
            const subject = planSubject || selectedCourse || 'General';
            const res = await aiApi.generateStudyPlan(dateStr, 2, subject);
            setStudyPlan(res.data.plan);
            triggerHaptic(Haptics.NotificationFeedbackType.Success);
        } catch (_error) {
            Alert.alert('Error', 'Trajectory calculation failed.');
        } finally {
            setIsLoading(false);
        }
    };

    // Calendar helpers
    const calendarDays = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    }, [calendarMonth]);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const isSelectedDay = (day: number) => {
        if (!examDate) return false;
        return examDate.getDate() === day && examDate.getMonth() === calendarMonth.getMonth() && examDate.getFullYear() === calendarMonth.getFullYear();
    };

    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === calendarMonth.getMonth() && today.getFullYear() === calendarMonth.getFullYear();
    };

    const selectDay = (day: number) => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        setExamDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
        setShowCalendar(false); // auto-collapse after selection
    };

    const changeMonth = (delta: number) => {
        triggerHaptic();
        const newMonth = new Date(calendarMonth);
        newMonth.setMonth(newMonth.getMonth() + delta);
        setCalendarMonth(newMonth);
    };

    const downloadPlanAsPdf = async () => {
        if (!studyPlan) return;
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        try {
            // Extract meta info from markdown
            const daysLeftMatch = studyPlan.match(/\*\*Days Left:\*\* (\d+)/);
            const dailyHoursMatch = studyPlan.match(/\*\*Daily Hours:\*\* (\d+)h/);
            const daysLeftValue = daysLeftMatch ? daysLeftMatch[1] : '16';
            const dailyHoursValue = dailyHoursMatch ? dailyHoursMatch[1] : '2';
            const displayDate = examDate ? examDate.toISOString().split('T')[0] : '2026-03-06';

            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');

  @page { margin: 32px 40px; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    color: #2c3e50;
    background: #fff;
    line-height: 1.6;
    font-size: 13px;
  }

  /* ── HEADER ── */
  .header {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
    padding: 28px 32px 24px;
    color: white;
    border-radius: 16px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(34,211,238,0.08);
    pointer-events: none;
  }
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    position: relative;
    z-index: 1;
  }
  .logo-area { display: flex; align-items: center; gap: 10px; }
  .logo-icon {
    width: 38px; height: 38px;
    background: #22d3ee;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 20px; color: #0f172a;
    flex-shrink: 0;
  }
  .logo-text { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: white; }
  .logo-text span { color: #22d3ee; font-weight: 400; }
  .roadmap-badge {
    background: rgba(34,211,238,0.12);
    border: 1px solid rgba(34,211,238,0.35);
    padding: 5px 14px; border-radius: 100px;
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 2px;
    color: #22d3ee;
  }
  .header-title {
    font-size: 26px; font-weight: 800;
    color: white; letter-spacing: -0.5px;
    position: relative; z-index: 1;
  }
  .header-sub {
    color: rgba(255,255,255,0.55);
    font-size: 12px; margin-top: 3px;
    position: relative; z-index: 1;
  }

  /* ── META BAR ── */
  .meta-bar {
    display: flex; gap: 20px; align-items: center;
    padding: 12px 18px; background: #f8fafc;
    border: 1px solid #e2e8f0; border-radius: 10px;
    margin-bottom: 22px; font-size: 13px;
  }
  .meta-item { display: flex; align-items: center; gap: 7px; color: #475569; }
  .meta-label { font-weight: 700; color: #0f172a; }
  .meta-pill {
    background: #0891b2; color: white;
    padding: 2px 10px; border-radius: 100px;
    font-size: 11px; font-weight: 700;
  }
  .meta-divider { width: 1px; height: 20px; background: #e2e8f0; }

  /* ── CONTENT WRAPPER ── */
  .content { padding: 0; }

  /* ── WEEK HEADERS ── */
  .week-header {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-left: 5px solid #0891b2;
    border-radius: 12px;
    padding: 14px 20px;
    margin: 24px 0 16px;
    display: flex; align-items: center; gap: 14px;
    page-break-inside: avoid;
    page-break-after: avoid;
  }
  .week-number-badge {
    background: #0891b2; color: white;
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1.5px;
    padding: 4px 12px; border-radius: 100px;
    white-space: nowrap; flex-shrink: 0;
  }
  .week-title {
    font-size: 16px; font-weight: 800; color: #0c4a6e;
    border-left: 3px solid #22d3ee; padding-left: 12px;
    flex: 1;
  }

  /* ── REVISION HEADER ── */
  .revision-header {
    background: linear-gradient(135deg, #fdf4ff, #fae8ff);
    border: 1px solid #d8b4fe;
    border-left: 5px solid #a855f7;
    border-radius: 12px;
    padding: 14px 20px; margin: 24px 0 16px;
    display: flex; align-items: center; gap: 14px;
    page-break-inside: avoid;
  }

  /* ── DAY HEADERS ── */
  .day-header {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; background: #fff7ed;
    border-left: 4px solid #f97316;
    border-radius: 0 8px 8px 0;
    margin: 18px 0 10px;
    page-break-inside: avoid;
    page-break-after: avoid;
  }
  .day-label {
    font-size: 13px; font-weight: 700; color: #c2410c;
    text-transform: uppercase; letter-spacing: 0.5px;
  }

  /* ── TABLES ── */
  table {
    width: 100%;
    border-collapse: separate; border-spacing: 0;
    margin: 8px 0 18px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    page-break-inside: avoid;
    box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  }
  thead th {
    background: #f1f5f9; color: #0f172a;
    padding: 10px 14px; text-align: left;
    font-weight: 700; font-size: 11px;
    text-transform: uppercase; letter-spacing: 1px;
    border-bottom: 2px solid #e2e8f0;
  }
  td {
    padding: 11px 14px;
    border-bottom: 1px solid #f1f5f9;
    color: #475569; vertical-align: top; font-size: 13px;
  }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #fafbfd; }
  /* First column = time */
  td:first-child {
    font-family: 'DM Mono', monospace;
    font-weight: 600; color: #0891b2;
    white-space: nowrap; width: 90px; font-size: 12px;
  }
  /* Second column = activity */
  td:nth-child(2) { font-weight: 600; color: #1e293b; width: 155px; }
  /* Break rows */
  tr.break-row td { background: #f8fafc !important; color: #94a3b8; font-style: italic; }

  /* ── WEEKLY GOAL ── */
  .weekly-goal {
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    border: 1px solid #6ee7b7;
    border-left: 4px solid #10b981;
    border-radius: 10px;
    padding: 14px 18px; margin: 20px 0;
    font-size: 13px; color: #065f46;
    page-break-inside: avoid;
  }
  .weekly-goal-label {
    font-weight: 800; color: #047857;
    text-transform: uppercase; font-size: 11px;
    letter-spacing: 1px; margin-bottom: 5px;
  }

  /* ── TIPS SECTION ── */
  .tips-section {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 10px;
    padding: 16px 18px; margin: 24px 0;
    page-break-inside: avoid;
  }
  .tips-title {
    font-weight: 800; color: #92400e; font-size: 13px;
    margin-bottom: 10px; text-transform: uppercase;
  }
  .tip-item {
    display: flex; gap: 10px; margin: 7px 0;
    color: #78350f; align-items: flex-start;
  }
  .tip-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #f59e0b; flex-shrink: 0; margin-top: 5px;
  }

  /* ── GENERAL LISTS ── */
  ul, ol { padding-left: 20px; margin: 10px 0; }
  li { margin: 6px 0; color: #475569; }

  /* ── PARAGRAPHS ── */
  p { margin: 10px 0; color: #475569; }

  /* ── HR ── */
  hr {
    border: none; height: 1px;
    background: linear-gradient(to right, #22d3ee, transparent);
    margin: 28px 0;
  }

  /* ── FOOTER ── */
  .footer {
    margin-top: 48px;
    background: #f8fafc;
    padding: 28px 32px;
    border-radius: 12px;
    text-align: center;
    border-top: 3px solid #22d3ee;
    page-break-inside: avoid;
  }
  .footer-logo { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
  .footer-logo span { color: #0891b2; }
  .footer-creds { font-size: 12px; color: #94a3b8; margin-bottom: 10px; }
  .disclaimer {
    font-size: 11px; color: #cbd5e1;
    max-width: 480px; margin: 0 auto;
    font-style: italic; line-height: 1.5;
  }

</style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div class="logo-area">
        <div class="logo-icon">M</div>
        <div class="logo-text">Ment<span>IQ</span></div>
      </div>
      <div class="roadmap-badge">Study Roadmap</div>
    </div>
    <div class="header-title">QBit AI Intelligence Report</div>
    <div class="header-sub">Strategically optimized for your academic success</div>
  </div>

  <!-- META BAR -->
  <div class="meta-bar">
    <div class="meta-item">
      <span class="meta-label">Exam:</span>
      <span>${displayDate}</span>
    </div>
    <div class="meta-divider"></div>
    <div class="meta-item">
      <span class="meta-label">Days Left:</span>
      <span class="meta-pill">${daysLeftValue}</span>
    </div>
    <div class="meta-divider"></div>
    <div class="meta-item">
      <span class="meta-label">Daily Hours:</span>
      <span class="meta-pill">${dailyHoursValue}H</span>
    </div>
  </div>

  <!-- DYNAMIC CONTENT -->
  <div class="content">
    ${markdownToHtml(studyPlan)}
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-logo">Ment<span>IQ</span> • AI Powered Learning Platform</div>
    <div class="footer-creds">Generated by QBit AI Engine &copy; ${new Date().getFullYear()} MentIQ Intelligence Systems</div>
    <div class="disclaimer">This study plan is dynamically generated based on cognitive learning patterns. Consistency is the key to mastering your subjects. Keep pushing forward!</div>
  </div>

</body>
</html>`;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Save Study Plan',
                UTI: 'com.adobe.pdf',
            });
            triggerHaptic(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('Error', 'Could not generate PDF. Please try again.');
        }
    };

    const markdownToHtml = (md: string): string => {
        const lines = md.split('\n');
        const output: string[] = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // Skip the main title and meta lines (shown in header/meta bar)
            if (/^#\s+📚/.test(line) || /^\*\*Exam:/.test(line) || /^\*\*Days Left:/.test(line) || /^\*\*Daily Hours:/.test(line)) {
                i++; continue;
            }

            // Horizontal rule
            if (/^---+$/.test(line.trim())) {
                output.push('<hr>');
                i++; continue;
            }

            // WEEK header: ## Week X: Title
            const weekMatch = line.match(/^##\s+(Week\s+\d+):\s+(.+)$/);
            if (weekMatch) {
                output.push(`<div class="week-header"><span class="week-number-badge">${weekMatch[1]}</span><div class="week-title">${weekMatch[2]}</div></div>`);
                i++; continue;
            }

            // REVISION header: ## 🔁 Revision Phase...
            if (/^##\s+🔁/.test(line)) {
                output.push(`<div class="revision-header"><span style="font-size:18px;">🔁</span><div class="week-title" style="color:#581c87;border-left-color:#a855f7;">Revision Phase — Last Few Days</div></div>`);
                i++; continue;
            }

            // Any other ## header
            const h2Match = line.match(/^##\s+(.+)$/);
            if (h2Match) {
                output.push(`<div class="week-header"><div class="week-title">${h2Match[1]}</div></div>`);
                i++; continue;
            }

            // DAY header: ### 📅 Day X — Date  (or ### Day X)
            const dayMatch = line.match(/^###\s+📅?\s*(Day\s+\d+\s*[—–-]\s*.+)$/);
            if (dayMatch) {
                output.push(`<div class="day-header"><span>📅</span><span class="day-label">${dayMatch[1].trim()}</span></div>`);
                i++; continue;
            }

            // Any other ### header
            const h3Match = line.match(/^###\s+(.+)$/);
            if (h3Match) {
                output.push(`<div class="day-header"><span class="day-label">${h3Match[1]}</span></div>`);
                i++; continue;
            }

            // # header (h1) — hide it, already in PDF header
            if (/^#\s+/.test(line)) {
                i++; continue;
            }

            // TABLE: detect pipe rows
            if (/^\|/.test(line.trim())) {
                const tableLines: string[] = [];
                while (i < lines.length && /^\|/.test(lines[i].trim())) {
                    tableLines.push(lines[i]);
                    i++;
                }
                // Filter out separator rows (|---|---|)
                const dataRows = tableLines.filter(r => !/^\|[\s\-|:]+\|$/.test(r.trim()));
                if (dataRows.length >= 2) {
                    const parseCells = (row: string) =>
                        row.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

                    const headers = parseCells(dataRows[0]);
                    let tableHtml = '<table><thead><tr>';
                    headers.forEach(h => { tableHtml += `<th>${h}</th>`; });
                    tableHtml += '</tr></thead><tbody>';

                    for (let r = 1; r < dataRows.length; r++) {
                        const cells = parseCells(dataRows[r]);
                        if (cells.length === 0) continue;
                        const isBreak = cells.some(c => /break/i.test(c));
                        tableHtml += `<tr${isBreak ? ' class="break-row"' : ''}>`;
                        cells.forEach(cell => {
                            tableHtml += `<td>${cell.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</td>`;
                        });
                        tableHtml += '</tr>';
                    }
                    tableHtml += '</tbody></table>';
                    output.push(tableHtml);
                }
                continue;
            }

            // TIPS section: **💡 Tips:** or ### Tips
            if (/(\*\*💡\s*Tips[:\*]|\*\*Tips[:\*]|###\s*💡?\s*Tips)/i.test(line)) {
                const tipLines: string[] = [];
                i++;
                while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#')) {
                    const tl = lines[i].trim();
                    if (tl.startsWith('-') || tl.startsWith('*') || /^\d+\./.test(tl)) {
                        tipLines.push(tl.replace(/^[\-\*\d\.]+\s*/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'));
                    }
                    i++;
                }
                if (tipLines.length > 0) {
                    let tipsHtml = '<div class="tips-section"><div class="tips-title">💡 Study Tips</div>';
                    tipLines.forEach(tip => {
                        tipsHtml += `<div class="tip-item"><div class="tip-dot"></div><div>${tip}</div></div>`;
                    });
                    tipsHtml += '</div>';
                    output.push(tipsHtml);
                }
                continue;
            }

            // WEEKLY GOAL: **Weekly Goal:** or **🎯 Weekly Goal:**
            if (/\*\*(🎯\s*)?Weekly Goal[:\*]/i.test(line)) {
                const goalText = line.replace(/\*\*(🎯\s*)?Weekly Goal[:\*]\**/i, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').trim();
                output.push(`<div class="weekly-goal"><div class="weekly-goal-label">🎯 Weekly Goal</div><div>${goalText}</div></div>`);
                i++; continue;
            }

            // Bullet list item
            if (/^[\-\*]\s+/.test(line)) {
                const items: string[] = [];
                while (i < lines.length && /^[\-\*]\s+/.test(lines[i])) {
                    items.push(`<li>${lines[i].replace(/^[\-\*]\s+/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`);
                    i++;
                }
                output.push(`<ul>${items.join('')}</ul>`);
                continue;
            }

            // Numbered list item
            if (/^\d+\.\s+/.test(line)) {
                const items: string[] = [];
                while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
                    items.push(`<li>${lines[i].replace(/^\d+\.\s+/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`);
                    i++;
                }
                output.push(`<ol>${items.join('')}</ol>`);
                continue;
            }

            // Empty line
            if (line.trim() === '') {
                i++; continue;
            }

            // Regular paragraph
            const para = line
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>');
            output.push(`<p>${para}</p>`);
            i++;
        }

        return output.join('\n');
    };



    const renderChatTab = () => (
        <KeyboardAvoidingView
            style={styles.tabContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView
                ref={scrollRef}
                style={styles.chatScroll}
                contentContainerStyle={{ paddingBottom: 30, paddingTop: 20 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {messages.length === 0 && !isLoading && (
                    <Animated.View entering={FadeIn.delay(300)} style={styles.heroSection}>
                        <View style={styles.heroGraphic}>
                            <Animated.View style={[styles.glowCircle, animatedPulseStyle]} />
                            <Image source={require('@/assets/images/Qbit.png')} style={styles.heroLogo} />
                        </View>
                        <Text style={styles.heroTitle}>Neural Hub</Text>
                        <Text style={styles.heroSubtitle}>I&apos;m your QBit assistant, synchronized with all your learning data. How shall we accelerate your growth today?</Text>

                        <View style={styles.chipGrid}>
                            {[
                                { label: 'Summarize Bio', icon: 'book-open-page-variant' },
                                { label: 'Math Help', icon: 'function-variant' },
                                { label: 'Study Plan', icon: 'calendar-star' },
                                { label: 'Explain Logic', icon: 'head-lightbulb-outline' }
                            ].map((item, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.suggestionChip}
                                    onPress={() => {
                                        setQuery(`Can you help me with ${item.label}?`);
                                        triggerHaptic();
                                    }}
                                >
                                    <MaterialCommunityIcons name={item.icon as any} size={14} color={Colors.light.primary} />
                                    <Text style={styles.chipLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {messages.map((msg) => (
                    <Animated.View
                        key={msg.id}
                        layout={Layout.springify()}
                        entering={msg.isUser ? FadeInDown.springify() : FadeInUp.springify()}
                        style={[styles.messageRow, msg.isUser ? styles.userRow : styles.aiRow]}
                    >
                        {!msg.isUser && (
                            <View style={styles.aiOrb}>
                                <Image source={require('@/assets/images/Qbit.png')} style={styles.orbImage} />
                            </View>
                        )}
                        <View style={[styles.bubble, msg.isUser ? styles.userBubble : styles.aiBubble]}>
                            {msg.image && (
                                <Image source={{ uri: msg.image }} style={styles.bubbleImage} />
                            )}
                            {msg.isUser ? (
                                <Text style={styles.userText}>{msg.text}</Text>
                            ) : (
                                <Markdown
                                    style={{
                                        body: { color: '#1e293b', fontSize: 16, lineHeight: 24 },
                                        heading1: { color: Colors.light.primary, fontSize: 18, fontWeight: '800', marginBottom: 8 },
                                        code_block: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
                                    }}
                                >
                                    {msg.text}
                                </Markdown>
                            )}
                        </View>
                    </Animated.View>
                ))}

                {isLoading && (
                    <Animated.View entering={FadeIn.duration(400)} style={styles.aiRow}>
                        <View style={styles.aiOrb}>
                            <ActivityIndicator size="small" color={Colors.light.primary} />
                        </View>
                        <View style={[styles.bubble, styles.aiBubble, styles.thinkingBubble]}>
                            <View style={styles.dotContainer}>
                                {[0, 1, 2].map(i => (
                                    <Animated.View key={i} style={styles.dot} />
                                ))}
                            </View>
                        </View>
                    </Animated.View>
                )}
            </ScrollView>

            <View style={styles.inputAreaWrapper}>
                {image && (
                    <View style={styles.attachmentStrip}>
                        <View style={styles.attachmentItem}>
                            <Image source={{ uri: image.uri }} style={styles.miniPreview} />
                            <TouchableOpacity onPress={() => setImage(null)} style={styles.closeAttachment}>
                                <MaterialCommunityIcons name="close" size={12} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                <Surface style={styles.inputGlass} elevation={0}>
                    <TouchableOpacity onPress={pickImage} style={styles.iconBtn}>
                        <MaterialCommunityIcons name="image-plus" size={24} color={Colors.light.primary} />
                    </TouchableOpacity>
                    <RNTextInput
                        placeholder="Interface with QBit..."
                        value={query}
                        onChangeText={setQuery}
                        style={styles.glassInput}
                        placeholderTextColor="#94a3b8"
                        selectionColor={Colors.light.primary}
                    />
                    <TouchableOpacity
                        onPress={handleAskGlobal}
                        style={[styles.actionFab, (!query && !image) && styles.fabDisabled]}
                        disabled={!query && !image || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <MaterialCommunityIcons name="arrow-up" size={24} color="white" />
                        )}
                    </TouchableOpacity>
                </Surface>
            </View>
        </KeyboardAvoidingView>
    );

    const renderFlashcards = () => (
        <ScrollView
            style={styles.tabContent}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
        >
            <Animated.View entering={FadeInUp} style={styles.quantumCard}>
                <LinearGradient
                    colors={['#4f46e5', '#3730a3', '#1e1b4b']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quantumGradient}
                >
                    <View style={styles.quantumHeader}>
                        <View style={styles.iconHalo}>
                            <MaterialCommunityIcons name="molecule" size={32} color="#818cf8" />
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={styles.quantumTitle}>Neural Recall</Text>
                            <Text style={styles.quantumSubtitle} numberOfLines={2}>Atomic Memory Synthesis</Text>
                        </View>
                    </View>

                    <View style={styles.quantumBody}>
                        <Text style={styles.quantumDesc}>Input a complex topic and QBit will fractionate it into high-impact memory fragments for rapid neural retention.</Text>

                        <View style={styles.inputWrapperModern}>
                            <MaterialCommunityIcons name="poker-chip" size={20} color="#818cf8" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Topic for synthesis..."
                                value={flashcardTopic}
                                onChangeText={setFlashcardTopic}
                                style={styles.modernGhostInput}
                                placeholderTextColor="#6366f1"
                                mode="flat"
                                underlineColor="transparent"
                                activeUnderlineColor="transparent"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.quantumActionBtn}
                            onPress={handleGenerateFlashcards}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#818cf8', '#4f46e5']}
                                style={styles.quantumActionFill}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.quantumActionText}>Initiate Synthesis</Text>
                                        <MaterialCommunityIcons name="lightning-bolt" size={18} color="white" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
                <View style={styles.quantumBorder} />
            </Animated.View>

            {flashcards.length > 0 && (
                <View style={{ marginTop: 10 }}>
                    <FlashcardDeck cards={flashcards} />
                </View>
            )}
        </ScrollView>
    );

    const renderPlanner = () => (
        <ScrollView
            style={styles.tabContent}
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
        >
            {/* SINGLE TIME WEAVER CARD — calendar + form all-in-one */}
            <Animated.View entering={FadeInUp} style={styles.quantumCard}>
                <LinearGradient
                    colors={['#0891b2', '#0e7490', '#164e63']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quantumGradient}
                >
                    <View style={styles.quantumHeader}>
                        <View style={[styles.iconHalo, { backgroundColor: 'rgba(8, 145, 178, 0.2)' }]}>
                            <MaterialCommunityIcons name="calendar-clock" size={30} color="#22d3ee" />
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={styles.quantumTitle}>Time Weaver</Text>
                            <Text style={[styles.quantumSubtitle, { color: '#22d3ee' }]} numberOfLines={2}>Study Trajectory Engine</Text>
                        </View>
                    </View>

                    <View style={styles.quantumBody}>
                        {/* EXAM DATE — tappable banner or inline calendar */}
                        <Text style={styles.planFieldLabel}>Exam Date</Text>

                        {examDate && !showCalendar ? (
                            <TouchableOpacity
                                style={styles.calSelectedBanner}
                                onPress={() => { triggerHaptic(); setShowCalendar(true); }}
                            >
                                <MaterialCommunityIcons name="calendar-check" size={18} color="#22d3ee" />
                                <Text style={styles.calSelectedText}>
                                    {examDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </Text>
                                <MaterialCommunityIcons name="pencil" size={16} color="rgba(34,211,238,0.5)" />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.calendarInline}>
                                {/* Month navigation */}
                                <View style={styles.calMonthRow}>
                                    <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calArrow}>
                                        <MaterialCommunityIcons name="chevron-left" size={28} color="#22d3ee" />
                                    </TouchableOpacity>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={styles.calMonthText}>{monthNames[calendarMonth.getMonth()]}</Text>
                                        <Text style={styles.calYearText}>{calendarMonth.getFullYear()}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calArrow}>
                                        <MaterialCommunityIcons name="chevron-right" size={28} color="#22d3ee" />
                                    </TouchableOpacity>
                                </View>

                                {/* Day headers */}
                                <View style={styles.calDayHeaderRow}>
                                    {dayHeaders.map(d => (
                                        <Text key={d} style={styles.calDayHeader}>{d}</Text>
                                    ))}
                                </View>

                                {/* Day grid */}
                                <View style={styles.calGrid}>
                                    {calendarDays.map((day, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[
                                                styles.calDayCell,
                                                day && isSelectedDay(day) && styles.calDaySelected,
                                                day && isToday(day) && !isSelectedDay(day) && styles.calDayToday,
                                            ]}
                                            onPress={() => day && selectDay(day)}
                                            disabled={!day}
                                        >
                                            {day ? (
                                                <Text style={[
                                                    styles.calDayText,
                                                    isSelectedDay(day) && styles.calDayTextSelected,
                                                    isToday(day) && !isSelectedDay(day) && styles.calDayTextToday,
                                                ]}>{day}</Text>
                                            ) : null}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Subject Input */}
                        <Text style={styles.planFieldLabel}>Subject / Topic</Text>
                        <View style={[styles.inputWrapperModern, { borderColor: 'rgba(34, 211, 238, 0.2)' }]}>
                            <MaterialCommunityIcons name="book-education" size={20} color="#22d3ee" style={styles.inputIcon} />
                            <RNTextInput
                                placeholder="e.g. Data Structures, Physics..."
                                value={planSubject}
                                onChangeText={setPlanSubject}
                                style={[styles.modernGhostInput, { color: '#22d3ee' }]}
                                placeholderTextColor="#0e7490"
                            />
                        </View>

                        {/* OR Course Picker */}
                        {enrolledCourses.length > 0 && (
                            <>
                                <Text style={styles.planFieldLabel}>Or Choose a Course</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                                    <View style={styles.courseChipRow}>
                                        {enrolledCourses.map((course: any) => (
                                            <TouchableOpacity
                                                key={course.id}
                                                style={[
                                                    styles.courseChip,
                                                    selectedCourse === course.title && styles.courseChipActive,
                                                ]}
                                                onPress={() => {
                                                    triggerHaptic();
                                                    setSelectedCourse(selectedCourse === course.title ? null : course.title);
                                                    if (selectedCourse !== course.title) setPlanSubject('');
                                                }}
                                            >
                                                <MaterialCommunityIcons
                                                    name="school"
                                                    size={14}
                                                    color={selectedCourse === course.title ? '#fff' : '#22d3ee'}
                                                />
                                                <Text style={[
                                                    styles.courseChipText,
                                                    selectedCourse === course.title && styles.courseChipTextActive,
                                                ]} numberOfLines={1}>
                                                    {course.title}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </>
                        )}

                        {/* Syllabus Upload */}
                        <Text style={styles.planFieldLabel}>Syllabus (Optional)</Text>
                        <TouchableOpacity style={styles.syllabusUploadBtn} onPress={pickSyllabus}>
                            {syllabusImage ? (
                                <View style={styles.syllabusPreviewRow}>
                                    {syllabusImage.type === 'pdf' ? (
                                        <View style={[styles.syllabusThumb, { backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' }]}>
                                            <MaterialCommunityIcons name="file-pdf-box" size={30} color="white" />
                                        </View>
                                    ) : (
                                        <Image source={{ uri: syllabusImage.uri }} style={styles.syllabusThumb} />
                                    )}
                                    <Text style={styles.syllabusFileName} numberOfLines={1}>
                                        {syllabusImage.name || 'Syllabus Attached'}
                                    </Text>
                                    <TouchableOpacity onPress={() => setSyllabusImage(null)}>
                                        <MaterialCommunityIcons name="close-circle" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.syllabusPlaceholder}>
                                    <MaterialCommunityIcons name="file-image-plus" size={24} color="#22d3ee" />
                                    <Text style={styles.syllabusPlaceholderText}>Tap to upload photo or PDF</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Generate Button */}
                        <TouchableOpacity
                            style={styles.quantumActionBtn}
                            onPress={handleGeneratePlanner}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#22d3ee', '#0891b2']}
                                style={styles.quantumActionFill}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.quantumActionText}>Calibrate Roadmap</Text>
                                        <MaterialCommunityIcons name="radar" size={18} color="white" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
                <View style={[styles.quantumBorder, { backgroundColor: '#22d3ee' }]} />
            </Animated.View>

            {studyPlan ? (
                <Animated.View entering={FadeInDown} style={styles.planViewModern}>
                    <Markdown
                        style={{
                            body: { color: '#334155', fontSize: 16, lineHeight: 24 },
                            heading1: { color: '#0891b2', fontSize: 24, fontWeight: '900', marginBottom: 16 },
                        }}
                    >
                        {studyPlan}
                    </Markdown>

                    {/* Download PDF Button */}
                    <TouchableOpacity
                        style={styles.downloadPdfBtn}
                        onPress={downloadPlanAsPdf}
                    >
                        <LinearGradient
                            colors={['#0891b2', '#0e7490']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.downloadPdfGradient}
                        >
                            <MaterialCommunityIcons name="file-download" size={20} color="#fff" />
                            <Text style={styles.downloadPdfText}>Download as PDF</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            ) : null}
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0f172a', '#1e293b']}
                style={styles.topHeader}
            >
                <View style={styles.headerRow}>
                    <View style={styles.identity}>
                        <View style={styles.logoRing}>
                            <Image source={require('@/assets/images/Qbit.png')} style={styles.headerLogo} />
                        </View>
                        <View>
                            <Text style={styles.qbitText}>QBit <Text style={styles.aiText}>AI</Text></Text>
                            <View style={styles.statusRow}>
                                <View style={styles.onlineDot} />
                                <Text style={styles.statusText}>Neural Link Active</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.settingsBtn} onPress={() => triggerHaptic()}>
                        <MaterialCommunityIcons name="lightning-bolt" size={24} color={Colors.light.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.navWrapper}>
                    <View style={styles.customTabs}>
                        <Animated.View style={[styles.tabIndicator, animatedTabStyle]} />
                        {(['chat', 'flashcards', 'planner'] as TabType[]).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={styles.tabAction}
                                onPress={() => { setActiveTab(tab); triggerHaptic(); }}
                            >
                                <MaterialCommunityIcons
                                    name={tab === 'chat' ? 'message-text' : tab === 'flashcards' ? 'layers' : 'calendar-search'}
                                    size={18}
                                    color={activeTab === tab ? '#fff' : '#94a3b8'}
                                />
                                <Text style={[styles.tabLabel, activeTab === tab && styles.activeLabel]}>
                                    {tab === 'chat' ? 'Chat' : tab === 'flashcards' ? 'Cards' : 'Plan'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </LinearGradient>

            {activeTab === 'chat' ? renderChatTab() : activeTab === 'flashcards' ? renderFlashcards() : renderPlanner()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    topHeader: {
        paddingTop: 54,
        paddingBottom: 20,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        zIndex: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    identity: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoRing: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    headerLogo: {
        width: 65,
        height: 65,
        borderRadius: 32,
    },
    qbitText: {
        fontSize: 20,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 1,
    },
    aiText: {
        color: Colors.light.primary,
        fontWeight: 'normal',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
    },
    statusText: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    settingsBtn: {
        padding: 8,
    },
    navWrapper: {
        paddingHorizontal: 20,
    },
    customTabs: {
        flexDirection: 'row',
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tabIndicator: {
        position: 'absolute',
        top: 4,
        left: 4,
        height: 38,
        width: (width - 40 - 8) / 3,
        backgroundColor: Colors.light.primary,
        borderRadius: 20,
        ...AppShadows.small,
    },
    tabAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94a3b8',
    },
    activeLabel: {
        color: 'white',
    },
    tabContent: {
        flex: 1,
    },
    chatScroll: {
        flex: 1,
        paddingHorizontal: 16,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 20,
    },
    heroGraphic: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    glowCircle: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: Colors.light.primary + '20',
        borderWidth: 1,
        borderColor: Colors.light.primary + '40',
    },
    heroLogo: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0f172a',
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginTop: 30,
    },
    suggestionChip: {
        backgroundColor: 'white',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        ...AppShadows.small,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    chipLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e293b',
    },
    messageRow: {
        flexDirection: 'row',
        marginVertical: 12,
        maxWidth: '85%',
    },
    userRow: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    aiRow: {
        alignSelf: 'flex-start',
    },
    aiOrb: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
        ...AppShadows.small,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    orbImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    bubble: {
        padding: 16,
        borderRadius: 24,
    },
    userBubble: {
        backgroundColor: Colors.light.primary,
        borderTopRightRadius: 4,
        ...AppShadows.small,
    },
    aiBubble: {
        backgroundColor: 'white',
        borderTopLeftRadius: 4,
        ...AppShadows.small,
    },
    userText: {
        color: 'white',
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '600',
    },
    bubbleImage: {
        width: 220,
        height: 160,
        borderRadius: 16,
        marginBottom: 10,
    },
    thinkingBubble: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        width: 70,
    },
    dotContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#cbd5e1',
    },
    inputAreaWrapper: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        backgroundColor: '#f1f5f9', // Matching screen background
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
    },
    attachmentStrip: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    attachmentItem: {
        position: 'relative',
    },
    miniPreview: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
    },
    closeAttachment: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ef4444',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    inputGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 28,
        padding: 4,
        ...AppShadows.medium,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 56,
    },
    glassInput: {
        flex: 1,
        backgroundColor: 'transparent',
        height: 48,
        fontSize: 16,
        paddingHorizontal: 10,
        color: '#1e293b',
    },
    iconBtn: {
        padding: 10,
    },
    actionFab: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...AppShadows.small,
    },
    fabDisabled: {
        backgroundColor: '#e2e8f0',
    },
    // NEW QUANTUM CARDS
    quantumCard: {
        borderRadius: 24,
        backgroundColor: '#1e1b4b',
        overflow: 'hidden',
        ...AppShadows.medium,
        marginBottom: 20,
        position: 'relative',
    },
    quantumGradient: {
        padding: 18,
    },
    quantumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    iconHalo: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(129, 140, 248, 0.3)',
    },
    quantumTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 0.5,
    },
    quantumSubtitle: {
        fontSize: 11,
        color: '#818cf8',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    },
    quantumBody: {
        gap: 12,
    },
    quantumDesc: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 22,
        fontWeight: '500',
    },
    inputWrapperModern: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 46,
        borderWidth: 1,
        borderColor: 'rgba(129, 140, 248, 0.1)',
    },
    inputIcon: {
        marginRight: 12,
    },
    modernGhostInput: {
        flex: 1,
        backgroundColor: 'transparent',
        fontSize: 14,
        color: '#818cf8',
        fontWeight: '600',
    },
    quantumActionBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        ...AppShadows.small,
    },
    quantumActionFill: {
        height: 46,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    quantumActionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '800',
    },
    quantumBorder: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#4f46e5',
        opacity: 0.5,
    },
    planViewModern: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 32,
        ...AppShadows.medium,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(8, 145, 178, 0.1)',
    },
    // PREMIUM CALENDAR
    calendarCard: {
        borderRadius: 28,
        overflow: 'hidden',
        marginBottom: 20,
        ...AppShadows.medium,
    },
    calendarGradient: {
        padding: 20,
    },
    calendarInline: {
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(34, 211, 238, 0.1)',
    },
    calMonthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    calArrow: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calMonthText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    calYearText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 2,
    },
    calDayHeaderRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    calDayHeader: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    calGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calDayCell: {
        width: '14.28%' as any,
        aspectRatio: 1.15,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    calDayText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
    },
    calDaySelected: {
        backgroundColor: '#0891b2',
        borderRadius: 14,
    },
    calDayTextSelected: {
        color: '#fff',
        fontWeight: '800',
    },
    calDayToday: {
        borderWidth: 1.5,
        borderColor: '#22d3ee',
        borderRadius: 14,
    },
    calDayTextToday: {
        color: '#22d3ee',
        fontWeight: '800',
    },
    calSelectedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(34, 211, 238, 0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(34, 211, 238, 0.15)',
    },
    calSelectedText: {
        color: '#22d3ee',
        fontSize: 13,
        fontWeight: '700',
    },
    // PLAN FORM FIELDS
    planFieldLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    courseChipRow: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 4,
    },
    courseChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: 'rgba(34, 211, 238, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(34, 211, 238, 0.2)',
    },
    courseChipActive: {
        backgroundColor: '#0891b2',
        borderColor: '#22d3ee',
    },
    courseChipText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#22d3ee',
        maxWidth: 120,
    },
    courseChipTextActive: {
        color: '#fff',
    },
    syllabusUploadBtn: {
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(34, 211, 238, 0.2)',
        borderStyle: 'dashed' as any,
        backgroundColor: 'rgba(0,0,0,0.15)',
        overflow: 'hidden',
    },
    syllabusPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    syllabusPlaceholderText: {
        fontSize: 13,
        color: '#0e7490',
        fontWeight: '600',
    },
    syllabusPreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
    },
    syllabusThumb: {
        width: 48,
        height: 48,
        borderRadius: 10,
    },
    syllabusFileName: {
        flex: 1,
        fontSize: 14,
        color: '#22d3ee',
        fontWeight: '600',
    },
    downloadPdfBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 20,
    },
    downloadPdfGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 48,
        borderRadius: 14,
    },
    downloadPdfText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});
