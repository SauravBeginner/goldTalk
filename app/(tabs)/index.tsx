import { deities } from '@/data/deities';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  
  const opacity = useSharedValue(0.5);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
    
    scale.value = withRepeat(
      withTiming(1.05, { duration: 3000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }]
    };
  });

  const navigateToChat = (deity : any) => {
    console.warn('Navigating to record for deity:', deity); // Add this line
    router.push({
      // pathname: '/chat',
      pathname: '/(routes)/record',
      params: {
        deityName: deity.name,
        deityTitle: deity.title,
        deityOrigin: deity.origin,
      },
    });
  };

  const greetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <LinearGradient
      colors={['#0f0f1f', '#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{greetingTime()}</Text>
        <Text style={styles.userName}>{ 'Spiritual Seeker'}</Text>
        <Text style={styles.subheading}>Begin your divine conversation</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Deities</Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredContainer}
          >
            {deities.filter(d => d.featured).map((deity) => (
              <TouchableOpacity
                key={deity.id}
                style={[styles.featuredItem, { width: screenWidth * 0.75 }]}
                onPress={() => navigateToChat(deity)}
              >
                <ImageBackground
                  source={{ uri: deity.imageUrl }}
                  style={styles.deityImage}
                  imageStyle={styles.deityImageStyle}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                  >
                    <Animated.View style={[styles.glowEffect, animatedStyle]} />
                    <Text style={styles.deityName}>{deity.name}</Text>
                    <Text style={styles.deityOrigin}>{deity.origin}</Text>
                  </LinearGradient>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>All Deities</Text>
          
          <View style={styles.categories}>
            {deities.map((deity) => (
              <TouchableOpacity
                key={deity.id}
                style={styles.categoryItem}
                onPress={() => navigateToChat(deity)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: deity.color }]}>
                  <Text style={styles.categoryEmoji}>{deity.emoji}</Text>
                </View>
                <Text style={styles.categoryName}>{deity.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#e0e0e0',
  },
  userName: {
    fontFamily: 'Playfair-Bold',
    fontSize: 28,
    color: '#ffffff',
    marginTop: 4,
  },
  subheading: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#a9a9a9',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  featuredSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Playfair-Bold',
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 16,
  },
  featuredContainer: {
    paddingRight: 20,
  },
  featuredItem: {
    marginRight: 16,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  deityImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  deityImageStyle: {
    borderRadius: 16,
  },
  gradient: {
    padding: 16,
    height: '100%',
    justifyContent: 'flex-end',
  },
  glowEffect: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(138, 79, 255, 0.3)',
    bottom: 40,
    right: 10,
    zIndex: -1,
  },
  deityName: {
    fontFamily: 'Playfair-Bold',
    fontSize: 22,
    color: '#ffffff',
  },
  deityOrigin: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 4,
  },
  categoriesSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
});