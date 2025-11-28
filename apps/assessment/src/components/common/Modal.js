// src/components/common/Modal.js
import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';

const Modal = ({
  visible = false,
  onClose,
  title,
  children,
  footer,
  closeOnBackdropPress = true,
  showCloseButton = true,
  style,
  contentStyle,
}) => {
  const handleBackdropPress = () => {
    if (closeOnBackdropPress && onClose) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, style]}>
              {/* Header */}
              {(title || showCloseButton) && (
                <View style={styles.header}>
                  {title && <Text style={styles.title}>{title}</Text>}
                  {showCloseButton && (
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={onClose}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Content */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.content, contentStyle]}
                showsVerticalScrollIndicator={true}
              >
                {children}
              </ScrollView>

              {/* Footer */}
              {footer && <View style={styles.footer}>{footer}</View>}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxWidth: 500,
    width: '100%',
    maxHeight: '90%',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#757575',
    fontWeight: 'bold',
  },
  scrollView: {
    flexGrow: 0,
  },
  content: {
    padding: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});

export default Modal;