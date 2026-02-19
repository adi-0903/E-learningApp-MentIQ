import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { Colors, AppShadows, Typography, BorderRadius, Spacing } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = 400;

interface Flashcard {
    front: string;
    back: string;
}

export default function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setIsFlipped(false);
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setCurrentIndex(currentIndex - 1);
        }
    };

    if (!cards || cards.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No cards available. Generate some first!</Text>
            </View>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <View style={styles.container}>
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Card {currentIndex + 1} of {cards.length}</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${((currentIndex + 1) / cards.length) * 100}%` }]} />
                </View>
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={handleFlip}>
                <View style={[styles.card, AppShadows.medium]}>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardLabel}>{isFlipped ? "ANSWER" : "QUESTION"}</Text>
                        <Text style={styles.cardText}>
                            {isFlipped ? currentCard.back : currentCard.front}
                        </Text>
                    </View>
                    <View style={styles.flipIcon}>
                        <MaterialCommunityIcons name="rotate-3d-variant" size={24} color={Colors.light.primary} />
                        <Text style={styles.tapText}>Tap to Flip</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <View style={styles.controls}>
                <TouchableOpacity onPress={handlePrev} disabled={currentIndex === 0} style={[styles.controlBtn, currentIndex === 0 && styles.disabledBtn]}>
                    <MaterialCommunityIcons name="chevron-left" size={32} color={currentIndex === 0 ? "#ccc" : Colors.light.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNext} disabled={currentIndex === cards.length - 1} style={[styles.controlBtn, currentIndex === cards.length - 1 && styles.disabledBtn]}>
                    <MaterialCommunityIcons name="chevron-right" size={32} color={currentIndex === cards.length - 1 ? "#ccc" : Colors.light.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: Spacing.l,
    },
    emptyContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        ...Typography.body,
        color: Colors.light.textSecondary,
    },
    progressContainer: {
        width: '100%',
        marginBottom: Spacing.m,
        paddingHorizontal: Spacing.l,
    },
    progressText: {
        ...Typography.caption,
        color: Colors.light.textSecondary,
        marginBottom: 8,
        textAlign: 'center',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.light.primary,
        borderRadius: 3,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: Colors.light.white,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardLabel: {
        ...Typography.caption,
        color: Colors.light.primary,
        fontWeight: 'bold',
        marginBottom: Spacing.l,
        letterSpacing: 1.5,
    },
    cardText: {
        ...Typography.h3,
        textAlign: 'center',
        color: Colors.light.text,
    },
    flipIcon: {
        alignItems: 'center',
        opacity: 0.6,
        gap: 4,
    },
    tapText: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    controls: {
        flexDirection: 'row',
        marginTop: Spacing.l,
        gap: Spacing.xl,
    },
    controlBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.light.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...AppShadows.small,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    disabledBtn: {
        backgroundColor: '#f8fafc',
        elevation: 0,
    }
});
