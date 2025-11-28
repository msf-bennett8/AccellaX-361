// src/components/common/Toast.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';

const TOAST_TYPES = {
  success: {
    backgroundColor: '#4CAF50',
    icon: '✓',
  },
  error: {
    backgroundColor: '#F44336',
    icon: '✕',
  },
  warning: {
    backgroundColor: '#FF9800',
    icon: '⚠',
  },
  info: {
    backgroundColor: '#2196F3',
    icon: 'ℹ',
  },
};

const Toast = ({
  visible = false,
  message = '',
  type = 'info',
  duration = 3000,
  onDismiss,
  position = 'top',
  style,
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      showToast();

      // Auto dismiss after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          hideToast();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const showToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  if (!isVisible) {
    return null;
  }

  const toastConfig = TOAST_TYPES[type] || TOAST_TYPES.info;
  const positionStyle = position === 'top' ? styles.positionTop : styles.positionBottom;

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={[styles.toast, { backgroundColor: toastConfig.backgroundColor }]}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{toastConfig.icon}</Text>
        </View>
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Toast Manager for showing toasts programmatically
let toastRef = null;

export const setToastRef = (ref) => {
  toastRef = ref;
};

export const showToast = ({ message, type = 'info', duration = 3000 }) => {
  if (toastRef) {
    toastRef.show(message, type, duration);
  }
};

// Toast Container Component (use this at the root of your app)
export class ToastContainer extends React.Component {
  state = {
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  };

  componentDidMount() {
    setToastRef(this);
  }

  componentWillUnmount() {
    setToastRef(null);
  }

  show = (message, type = 'info', duration = 3000) => {
    this.setState({
      visible: true,
      message,
      type,
      duration,
    });
  };

  hide = () => {
    this.setState({ visible: false });
  };

  render() {
    return (
      <Toast
        visible={this.state.visible}
        message={this.state.message}
        type={this.state.type}
        duration={this.state.duration}
        onDismiss={this.hide}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  positionTop: {
    top: Platform.OS === 'ios' ? 50 : 20,
  },
  positionBottom: {
    bottom: Platform.OS === 'ios' ? 50 : 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default Toast;