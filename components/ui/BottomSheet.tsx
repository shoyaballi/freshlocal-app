import React, { useCallback, useEffect } from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  ViewStyle,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors, borderRadius, spacing, shadows } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 50;

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapIndex?: number;
  style?: ViewStyle;
}

// Desktop web: centred modal overlay
function DesktopModal({ isVisible, onClose, children, style }: BottomSheetProps) {
  if (!isVisible) return null;

  return (
    <Modal transparent visible={isVisible} animationType="fade">
      <Pressable style={desktopStyles.backdrop} onPress={onClose}>
        <Pressable
          style={[desktopStyles.modal, style]}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView
            style={desktopStyles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const desktopStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'default' as any,
  },
  modal: {
    backgroundColor: colors.backgroundWhite,
    borderRadius: borderRadius['2xl'],
    maxWidth: 480,
    width: '90%',
    maxHeight: '80%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.lg,
  },
  scrollView: {
    flexGrow: 0,
  },
});

// Mobile / native: swipeable bottom sheet
function MobileBottomSheet({
  isVisible,
  onClose,
  children,
  snapPoints = [0.5],
  initialSnapIndex = 0,
  style,
}: BottomSheetProps) {
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
  const active = useSharedValue(false);

  const initialHeight = SCREEN_HEIGHT * snapPoints[initialSnapIndex];
  const HANDLE_HEIGHT = 44;

  const scrollTo = useCallback((destination: number) => {
    'worklet';
    active.value = destination !== 0;
    translateY.value = withSpring(destination, { damping: 50 });
  }, []);

  const closeSheet = useCallback(() => {
    scrollTo(0);
    runOnJS(onClose)();
  }, [onClose, scrollTo]);

  useEffect(() => {
    if (isVisible) {
      scrollTo(-initialHeight);
    } else {
      scrollTo(0);
    }
  }, [isVisible, initialHeight, scrollTo]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      translateY.value = Math.max(translateY.value, MAX_TRANSLATE_Y);
    })
    .onEnd(() => {
      if (translateY.value > -initialHeight / 2) {
        runOnJS(closeSheet)();
      } else {
        scrollTo(-initialHeight);
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const rBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(active.value ? 1 : 0),
    };
  });

  if (!isVisible) return null;

  return (
    <Modal transparent visible={isVisible} animationType="none">
      <GestureHandlerRootView style={mobileStyles.container}>
        <Animated.View style={[mobileStyles.backdrop, rBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Animated.View>
        <Animated.View style={[mobileStyles.sheet, rBottomSheetStyle, style]}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={mobileStyles.handleArea}>
              <View style={mobileStyles.handle} />
            </Animated.View>
          </GestureDetector>
          <View style={{ flex: 1, maxHeight: initialHeight - HANDLE_HEIGHT }}>
            {children}
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const mobileStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    height: SCREEN_HEIGHT,
    width: '100%',
    backgroundColor: colors.backgroundWhite,
    position: 'absolute',
    top: SCREEN_HEIGHT,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },
  handleArea: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.grey300,
    borderRadius: 2,
  },
});

// Export: picks desktop modal or mobile bottom sheet
export function BottomSheet(props: BottomSheetProps) {
  const { isDesktop } = useResponsive();
  const useDesktopModal = Platform.OS === 'web' && isDesktop;

  if (useDesktopModal) {
    return <DesktopModal {...props} />;
  }
  return <MobileBottomSheet {...props} />;
}

export default BottomSheet;
