import { useLiveClassStore } from '@/store/liveClassStore';
import { useLiveClassChatStore } from '@/store/liveClassChatStore';
import { useAuthStore } from '@/store/authStore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {
  ActivityIndicator,
  IconButton,
  Text,
} from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function StudentLiveClassRoomScreen({ route, navigation }: any) {
  const { classId, meetingUrl: initialMeetingUrl, title } = route.params || {};

  const { user } = useAuthStore();
  const { currentLiveClass, leaveLiveClass } = useLiveClassStore();
  const { messages, fetchChatMessages, sendChatMessage } = useLiveClassChatStore();

  const [isLoading, setIsLoading] = useState(true);
  const [meetingUrl] = useState<string | null>(initialMeetingUrl || null);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!classId) {
      Alert.alert('Error', 'No class ID provided');
      navigation.goBack();
      return;
    }

    // Fetch chat messages for this class
    fetchChatMessages(classId).catch(console.error);

    return () => {
      // Leave class when unmounting
      leaveLiveClass(classId).catch(() => { });
    };
  }, [classId]);

  const handleLeave = useCallback(() => {
    Alert.alert('Leave Class', 'Are you sure you want to leave this session?', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveLiveClass(classId);
          } catch {
            // Ignore errors on leave
          }
          navigation.goBack();
        },
      },
    ]);
  }, [classId]);

  const handleSendChat = async () => {
    if (!chatMessage.trim() || !user) return;
    try {
      await sendChatMessage(classId, String(user.id), user.name, chatMessage.trim());
      setChatMessage('');
      chatListRef.current?.scrollToEnd({ animated: true });
    } catch {
      // Handled in store
    }
  };

  const renderChatMessage = useCallback(({ item }: { item: any }) => (
    <View style={[
      styles.chatBubble,
      item.isSystemMessage && styles.systemBubble,
    ]}>
      {!item.isSystemMessage && (
        <Text style={styles.chatSender}>{item.senderName}</Text>
      )}
      <Text style={item.isSystemMessage ? styles.systemText : styles.chatText}>
        {item.message}
      </Text>
    </View>
  ), []);

  if (!meetingUrl) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Unable to Connect</Text>
        <Text style={styles.errorText}>Could not load the meeting room. Please try again.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Meeting Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <View style={styles.liveDot} />
          <Text style={styles.toolbarTitle} numberOfLines={1}>
            {title || currentLiveClass?.title || 'Live Class'}
          </Text>
        </View>
        <View style={styles.toolbarRight}>
          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={() => setShowChat(!showChat)}
          >
            <MaterialCommunityIcons
              name={showChat ? 'chat' : 'chat-outline'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolbarBtn, styles.leaveBtn]}
            onPress={handleLeave}
          >
            <MaterialCommunityIcons name="phone-hangup" size={20} color="#fff" />
            <Text style={styles.leaveBtnText}>Leave</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Jitsi WebView */}
      <View style={styles.videoContainer}>
        {isLoading && (
          <View style={styles.webviewLoader}>
            <ActivityIndicator size="large" color="#2dd4bf" />
            <Text style={styles.webviewLoaderText}>Connecting to classroom...</Text>
          </View>
        )}
        <WebView
          source={{ uri: meetingUrl }}
          style={[styles.webview, isLoading && { opacity: 0 }]}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            Alert.alert('Error', 'Failed to load the video room');
          }}
        />
      </View>

      {/* Chat Panel */}
      {showChat && (
        <KeyboardAvoidingView
          style={styles.chatPanel}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.chatContainer}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>Live Chat</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setShowChat(false)}
                iconColor="#94a3b8"
              />
            </View>

            <FlatList
              ref={chatListRef}
              data={messages}
              keyExtractor={(item) => String(item.id)}
              style={styles.chatList}
              contentContainerStyle={styles.chatListContent}
              renderItem={renderChatMessage}
              onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                placeholderTextColor="#94a3b8"
                value={chatMessage}
                onChangeText={setChatMessage}
                onSubmitEditing={handleSendChat}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendChat}>
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  // ─── Error State ────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // ─── Toolbar ────────────────────────────────────────────────
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 40 : 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  toolbarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveBtn: {
    backgroundColor: '#ef4444',
    width: 'auto',
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 6,
  },
  leaveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // ─── Video ──────────────────────────────────────────────────
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  webviewLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    zIndex: 10,
    gap: 16,
  },
  webviewLoaderText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },

  // ─── Chat Panel ────────────────────────────────────────────
  chatPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  chatHeaderTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 16,
    gap: 8,
  },
  chatBubble: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 10,
  },
  systemBubble: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignSelf: 'center',
  },
  chatSender: {
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 2,
    color: '#2dd4bf',
  },
  chatText: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 18,
  },
  systemText: {
    fontStyle: 'italic',
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 12,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: '#334155',
    borderRadius: 20,
    color: '#fff',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
