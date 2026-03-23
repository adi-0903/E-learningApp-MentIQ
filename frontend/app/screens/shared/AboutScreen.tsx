import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Image, Animated, Easing } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';
import { Colors, Spacing, AppShadows, BorderRadius, Typography } from '@/constants/theme';

interface AboutScreenProps {
  navigation: any;
}

function AboutScreen({ navigation }: AboutScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f766e', '#134e4a', '#06201f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumHeader}
      >
        <View style={styles.headerBlurOverlay}>
          <MaterialCommunityIcons name="molecule" size={400} color="rgba(255,255,255,0.03)" style={styles.bgDecoration} />
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.manifestoLabel}>The Manifesto</Text>
          <Text style={styles.headerTitle}>Bloom Identity</Text>
          <Text style={styles.headerSubtitle}>Engineering the future of mentorship</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Brand Identity Card */}
          <Card style={styles.heroCard}>
            <LinearGradient
              colors={['#ffffff', '#f0fdfa']}
              style={styles.heroGradient}
            >
              <View style={styles.brandRow}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoOuter}>
                    <Image
                      source={require('@/assets/images/Logo.png')}
                      style={styles.logoImg}
                    />
                  </View>
                </View>
                <View style={styles.brandTextBody}>
                  <Text style={styles.brandName}>EduBloom</Text>
                  <Text style={styles.brandTagline}>Intelligence & Growth</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.stableBadge}>
                      <View style={styles.dot} />
                      <Text style={styles.stableText}>v1.5.0 STABLE</Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Card>

          {/* Core Vision */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Our Visionary Pillars</Text>
            <View style={styles.headingLine} />
          </View>

          <Card style={styles.visionCard}>
            <Card.Content>
              <Text style={styles.visionBody}>
                "We believe that education shouldn't just be consumed; it should be cultivated. Bloom is an intelligent ecosystem designed to bridge the gap between human curiosity and actionable excellence."
              </Text>
              <View style={styles.impactGrid}>
                <View style={styles.impactItem}>
                  <Text style={styles.impactVal}>15K+</Text>
                  <Text style={styles.impactKey}>Active Minds</Text>
                </View>
                <View style={styles.impactItem}>
                  <Text style={styles.impactVal}>98%</Text>
                  <Text style={styles.impactKey}>Growth Rate</Text>
                </View>
                <View style={styles.impactItem}>
                  <Text style={styles.impactVal}>24/7</Text>
                  <Text style={styles.impactKey}>AI Support</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Module Ecosystem */}
          <Text style={styles.sectionHeading}>Knowledge Architecture</Text>
          <View style={styles.moduleGrid}>
            <View style={styles.moduleCard}>
              <View style={[styles.moduleIconBox, { backgroundColor: '#f0fdfa' }]}>
                <MaterialCommunityIcons name="api" size={24} color="#0f766e" />
              </View>
              <Text style={styles.moduleTitle}>Smart Sync</Text>
              <Text style={styles.moduleDesc}>Real-time cross-platform data integrity.</Text>
            </View>
            <View style={styles.moduleCard}>
              <View style={[styles.moduleIconBox, { backgroundColor: '#fff1f2' }]}>
                <MaterialCommunityIcons name="radar" size={24} color="#f43f5e" />
              </View>
              <Text style={styles.moduleTitle}>Live Pulse</Text>
              <Text style={styles.moduleDesc}>Interactive mentorship via live streams.</Text>
            </View>
            <View style={styles.moduleCard}>
              <View style={[styles.moduleIconBox, { backgroundColor: '#eff6ff' }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.moduleTitle}>Rapid Quiz</Text>
              <Text style={styles.moduleDesc}>Adaptive testing with instant reasoning.</Text>
            </View>
            <View style={styles.moduleCard}>
              <View style={[styles.moduleIconBox, { backgroundColor: '#f5f3ff' }]}>
                <MaterialCommunityIcons name="layers-triple" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.moduleTitle}>Course OS</Text>
              <Text style={styles.moduleDesc}>Structured learning paths for mastery.</Text>
            </View>
          </View>

          {/* Support Network */}
          <Text style={styles.sectionHeading}>Global Connectivity</Text>
          <Card style={styles.connectivityCard}>
            <TouchableOpacity style={styles.connectRow}>
              <View style={[styles.connectIcon, { backgroundColor: '#f8fafc' }]}>
                <MaterialCommunityIcons name="email-check" size={20} color="#64748b" />
              </View>
              <View style={styles.connectMain}>
                <Text style={styles.connectLabel}>Global Concierge</Text>
                <Text style={styles.connectValue}>support@edubloom.com</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right-circle-outline" size={22} color="#cbd5e1" />
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            <TouchableOpacity style={styles.connectRow}>
              <View style={[styles.connectIcon, { backgroundColor: '#f8fafc' }]}>
                <MaterialCommunityIcons name="web" size={20} color="#64748b" />
              </View>
              <View style={styles.connectMain}>
                <Text style={styles.connectLabel}>Digital Portal</Text>
                <Text style={styles.connectValue}>www.edubloom.com</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right-circle-outline" size={22} color="#cbd5e1" />
            </TouchableOpacity>
          </Card>

          {/* Footer Branding */}
          <View style={styles.footerBranding}>
            <View style={styles.footerLogoRow}>
              <View style={styles.miniDot} />
              <Text style={styles.footerBrandName}>EDUBLOOM LABS</Text>
              <View style={styles.miniDot} />
            </View>
            <Text style={styles.legalNotice}>© 2026 Bloom Collective. All access rights reserved.</Text>
            <View style={styles.originRow}>
              <Text style={styles.originText}>Conceptualized & Engineered in India</Text>
              <MaterialCommunityIcons name="heart" size={12} color="#ef4444" style={{ marginLeft: 6 }} />
            </View>
          </View>
        </Animated.View>
        <View style={styles.scrollSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  premiumHeader: {
    height: 165,
    paddingTop: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  bgDecoration: {
    position: 'absolute',
    right: -100,
    top: -50,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerContent: {
    marginTop: 40,
  },
  manifestoLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2dd4bf',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 44,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  heroCard: {
    borderRadius: 32,
    marginTop: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...AppShadows.medium,
  },
  heroGradient: {
    padding: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 20,
  },
  logoOuter: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...AppShadows.small,
  },
  logoImg: {
    width: 50,
    height: 40,
    resizeMode: 'contain',
  },
  brandTextBody: {
    flex: 1,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  stableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#134e4a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2dd4bf',
  },
  stableText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 40,
    marginBottom: 20,
  },
  headingLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: 40,
    marginBottom: 20,
  },
  visionCard: {
    borderRadius: 28,
    backgroundColor: '#134e4a',
    padding: 24,
    ...AppShadows.dark,
  },
  visionBody: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ccfbf1',
    lineHeight: 28,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 30,
  },
  impactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  impactItem: {
    alignItems: 'center',
    flex: 1,
  },
  impactVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  impactKey: {
    fontSize: 9,
    color: '#2dd4bf',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...AppShadows.light,
  },
  moduleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 6,
  },
  moduleDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    fontWeight: '500',
  },
  connectivityCard: {
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...AppShadows.light,
    marginBottom: 40,
  },
  connectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  connectIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  connectMain: {
    flex: 1,
  },
  connectLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  connectValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
  },
  footerBranding: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8fafc',
    marginHorizontal: -20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  miniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  footerBrandName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 2,
  },
  legalNotice: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  originText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '800',
  },
  scrollSpacing: {
    height: 40,
  },
});

export default AboutScreen;
