import { useLiveClassStore } from '@/store/liveClassStore';
import { useLiveClassChatStore } from '@/store/liveClassChatStore';
import { useAuthStore } from '@/store/authStore';
import { getJitsiMeetUrl } from '@/constants/JitsiConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions
} from 'react-native';
import {
  ActivityIndicator,
  Text,
} from 'react-native-paper';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

export default function LiveClassRoomScreen({ route, navigation }: any) {
  // Handle both Expo Router and React Navigation params
  const routerParams = useLocalSearchParams<{ classId: string }>();
  // Prioritize route.params (React Navigation) then routerParams (Expo Router)
  const classId = route?.params?.classId || routerParams?.classId;

  const { user } = useAuthStore();
  const { currentLiveClass, startLiveClass, endLiveClass } = useLiveClassStore();
  const { messages, fetchChatMessages, sendChatMessage } = useLiveClassChatStore();

  const [isLoading, setIsLoading] = useState(true);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const chatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!classId) {
      Alert.alert('Error', 'Class ID is missing');
      if (navigation) navigation.goBack();
      return;
    }
    initClass();
  }, [classId]);

  const initClass = async () => {
    try {
      setIsLoading(true);
      const result = await startLiveClass(classId!);
      const url = result.meetingUrl || getJitsiMeetUrl(result.channelName || result.roomId || `class_${classId}`);
      setMeetingUrl(url);
      await fetchChatMessages(classId!);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start live class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndClass = useCallback(() => {
    Alert.alert('End Broadcast', 'Are you sure you want to end this live class?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Class',
        style: 'destructive',
        onPress: async () => {
          try {
            await endLiveClass(classId!);
            if (navigation) navigation.goBack();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to end class');
          }
        },
      },
    ]);
  }, [classId, navigation]);

  const handleSendChat = async () => {
    if (!chatMessage.trim() || !user) return;
    try {
      await sendChatMessage(classId!, String(user.id), user.name, chatMessage.trim());
      setChatMessage('');
      setTimeout(() => {
        chatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch {
      // Handled in store
    }
  };

  const toggleControls = () => {
    setControlsVisible(!controlsVisible);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Initializing Studio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Jitsi WebView (Background) */}
      <View style={styles.videoContainer}>
        {meetingUrl ? (
          <WebView
            source={{ uri: meetingUrl }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          />
        ) : (
          <View style={styles.noVideo}>
            <MaterialCommunityIcons name="video-off-outline" size={48} color="#475569" />
            <Text style={{ color: '#94a3b8', marginTop: 12 }}>Connecting to Stream...</Text>
          </View>
        )}
      </View>

      {/* Floating Header */}
      {controlsVisible && (
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.9)', 'rgba(15, 23, 42, 0.0)']}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation ? navigation.goBack() : null}
              style={styles.iconButtonBlur}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          <Text style={styles.className} numberOfLines={1}>
            {currentLiveClass?.title || 'Live Class Room'}
          </Text>
        </LinearGradient>
      )}

      {/* Controls Overlay */}
      {controlsVisible && (
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.controlButton, showChat && styles.controlButtonActive]}
            onPress={() => setShowChat(!showChat)}
          >
            <MaterialCommunityIcons name="chat-processing-outline" size={24} color="#fff" />
            <Text style={styles.controlLabel}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.endButton]}
            onPress={handleEndClass}
          >
            <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleControls}
          >
            <MaterialCommunityIcons name="overscan" size={24} color="#fff" />
            <Text style={styles.controlLabel}>Hide</Text>
          </TouchableOpacity>
        </View>
      )}

      {!controlsVisible && (
        <TouchableOpacity style={styles.showControlsBtn} onPress={toggleControls}>
          <MaterialCommunityIcons name="dots-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Chat Panel Overlay */}
      {showChat && (
        <KeyboardAvoidingView
          style={styles.chatOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.chatContainer}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Live Chat</Text>
              <TouchableOpacity onPress={() => setShowChat(false)}>
                <MaterialCommunityIcons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={chatListRef}
              data={messages}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
              renderItem={({ item }) => {
                const isMe = String(item.senderId) === String(user?.id);
                return (
                  <View style={[
                    styles.chatBubble,
                    item.isSystemMessage ? styles.systemBubble : (isMe ? styles.myBubble : styles.theirBubble),
                  ]}>
                    {!item.isSystemMessage && !isMe && (
                      <Text style={styles.senderName}>{item.senderName}</Text>
                    )}
                    <Text style={[
                      styles.chatText,
                      item.isSystemMessage && styles.systemText,
                      isMe && styles.myChatText
                    ]}>
                      {item.message}
                    </Text>
                  </View>
                );
              }}
            />

            <View style={styles.inputArea}>
              <TextInput
                style={styles.inputField}
                placeholder="Say something..."
                placeholderTextColor="#94a3b8"
                value={chatMessage}
                onChangeText={setChatMessage}
                onSubmitEditing={handleSendChat}
              />
              <TouchableOpacity onPress={handleSendChat} style={styles.sendButton}>
                <MaterialCommunityIcons name="send" size={20} color="#4338ca" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#e2e8f0', marginTop: 16, fontSize: 16, fontWeight: '500' },

  videoContainer: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  noVideo: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },

  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  className: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  liveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },

  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    zIndex: 10,
  },
  controlButton: {
    alignItems: 'center',
    gap: 4,
  },
  controlButtonActive: {
    opacity: 1,
  },
  endButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 6,
    shadowColor: '#ef4444',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  showControlsBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },

  chatOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    zIndex: 20,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  chatTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  myBubble: {
    backgroundColor: '#4338ca',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: '#334155',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  senderName: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  chatText: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
  },
  myChatText: {
    color: '#fff',
  },
  systemText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#cbd5e1',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    gap: 10,
  },
  inputField: {
    flex: 1,
    height: 44,
    backgroundColor: '#1e293b',
    borderRadius: 22,
    paddingHorizontal: 16,
    color: '#fff',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
