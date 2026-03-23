import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCard } from './BadgeCard';

interface BadgeEarnedModalProps {
  visible: boolean;
  badge: any;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const BadgeEarnedModal: React.FC<BadgeEarnedModalProps> = ({ visible, badge, onClose }) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  if (!badge) return null;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modalContainer, 
            { 
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }] 
            }
          ]}
        >
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.content}
          >
            {/* Background Decorative Rays */}
            <Animated.View style={[styles.rays, { transform: [{ rotate: rotation }] }]}>
              <MaterialCommunityIcons name="brightness-7" size={300} color="rgba(217, 119, 6, 0.05)" />
            </Animated.View>

            <View style={styles.header}>
              <View style={styles.trophyIcon}>
                <MaterialCommunityIcons name="trophy-variant" size={40} color="#d97706" />
              </View>
              <Text style={styles.title}>Achievement Unlocked!</Text>
              <Text style={styles.subtitle}>You've earned a new milestone</Text>
            </View>

            <View style={styles.badgeContainer}>
              <BadgeCard 
                badge={badge} 
                isEarned={true} 
                size="large" 
                hideInfo={true}
              />
            </View>

            <View style={styles.info}>
              <Text style={styles.badgeName}>{badge.badge_name || badge.name}</Text>
              <Text style={styles.badgeDescription}>
                Congratulations! Your hard work and dedication have paid off. This badge is now displayed on your profile.
              </Text>
            </View>

            <TouchableOpacity 
              onPress={onClose}
              activeOpacity={0.8}
              style={styles.closeButton}
            >
              <LinearGradient
                colors={['#d97706', '#b45309']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Awesome!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  content: {
    padding: 30,
    alignItems: 'center',
    position: 'relative',
  },
  rays: {
    position: 'absolute',
    top: '10%',
    zIndex: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  trophyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  badgeContainer: {
    marginVertical: 20,
    zIndex: 1,
  },
  info: {
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  badgeName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#d97706',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  closeButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
