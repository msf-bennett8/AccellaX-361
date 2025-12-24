// Location: /apps/assessment/src/components/modals/LegalDocumentBottomSheet.js
// Bottom Sheet for displaying Terms of Service and Privacy Policy

import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { TERMS_OF_SERVICE } from '../../constants/TERMS_OF_SERVICE';
import { PRIVACY_POLICY } from '../../constants/PRIVACY_POLICY';
import {
  trackDocumentOpened,
  trackDocumentScrolledToBottom,
} from '../../utils/legalTracker';
import LegalDocumentViewer from '../common/LegalDocumentViewer';

const { height } = Dimensions.get('window');

const LegalDocumentBottomSheet = ({
  visible,
  onClose,
  onAcceptBoth,
  termsRead,
  privacyRead,
  setTermsRead,
  setPrivacyRead,
}) => {
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState({
    terms: termsRead,
    privacy: privacyRead,
  });
  const [hasStartedScrolling, setHasStartedScrolling] = useState({
    terms: false,
    privacy: false,
  });
  
  const scrollViewRef = useRef(null);
  const currentScrollPosition = useRef(0);

  // Track when document is opened
  React.useEffect(() => {
    if (visible && activeTab === 'terms' && !termsRead) {
      trackDocumentOpened('terms');
    }
    if (visible && activeTab === 'privacy' && !privacyRead) {
      trackDocumentOpened('privacy');
    }
  }, [visible, activeTab]);

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    const hasScrolled = contentOffset.y > 10;

    // Store current scroll position
    currentScrollPosition.current = contentOffset.y;

    // Track if user has started scrolling
    if (hasScrolled && !hasStartedScrolling[activeTab]) {
      setHasStartedScrolling((prev) => ({ ...prev, [activeTab]: true }));
    }

    // Track if user reached bottom
    if (isAtBottom && !hasScrolledToBottom[activeTab]) {
      setHasScrolledToBottom((prev) => ({ ...prev, [activeTab]: true }));
      
      // Track scroll to bottom
      if (activeTab === 'terms') {
        trackDocumentScrolledToBottom('terms');
        setTermsRead(true);
      } else {
        trackDocumentScrolledToBottom('privacy');
        setPrivacyRead(true);
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset scroll position when switching tabs
    currentScrollPosition.current = 0;
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  };

  const canAccept = hasScrolledToBottom.terms && hasScrolledToBottom.privacy;

  // Get button text based on scroll state
  const getButtonText = () => {
    if (canAccept) {
      return 'I Accept Terms and Policies';
    }
    
    const currentDocRead = hasScrolledToBottom[activeTab];
    const otherDoc = activeTab === 'terms' ? 'privacy' : 'terms';
    const otherDocRead = hasScrolledToBottom[otherDoc];
    
    if (!hasStartedScrolling[activeTab]) {
      return 'Please Read These Documents';
    }
    
    if (!currentDocRead) {
      return 'Tap to Continue';
    }
    
    if (currentDocRead && !otherDocRead) {
      return 'Read Both Documents';
    }
    
    return 'Read Both Documents';
  };

  const getButtonHint = () => {
    if (canAccept) return null;
    
    const currentDocRead = hasScrolledToBottom[activeTab];
    const otherDoc = activeTab === 'terms' ? 'Privacy Policy' : 'Terms of Service';
    const otherDocRead = hasScrolledToBottom[otherDoc === 'Privacy Policy' ? 'privacy' : 'terms'];
    
    if (!hasStartedScrolling[activeTab]) {
      return 'Start scrolling to read the document';
    }
    
    if (!currentDocRead) {
      return 'Continue scrolling to the bottom';
    }
    
    if (currentDocRead && !otherDocRead) {
      return `Please read the ${otherDoc} as well`;
    }
    
    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Dimmed background */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom Sheet */}
        <View style={styles.bottomSheet}>
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Legal Documents</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
              onPress={() => handleTabChange('terms')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'terms' && styles.activeTabText,
                ]}
              >
                Terms of Service
              </Text>
              {hasScrolledToBottom.terms && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={COLORS.success}
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
              onPress={() => handleTabChange('privacy')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'privacy' && styles.activeTabText,
                ]}
              >
                Privacy Policy
              </Text>
              {hasScrolledToBottom.privacy && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={COLORS.success}
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Document Content */}
          <View style={styles.contentWrapper}>
            <LegalDocumentViewer 
              ref={scrollViewRef}
              content={activeTab === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY}
              onScroll={handleScroll}
            />
          </View>

          {/* Footer with Accept Button */}
          <View style={styles.footer}>
            {getButtonHint() && (
              <Text style={styles.footerHint}>
                {getButtonHint()}
              </Text>
            )}
            <TouchableOpacity
              style={[
                styles.acceptButton,
                !canAccept && styles.acceptButtonDisabled,
                canAccept && styles.acceptButtonEnabled,
              ]}
              onPress={() => {
                if (canAccept) {
                  onAcceptBoth();
                } else if (hasStartedScrolling[activeTab] && !hasScrolledToBottom[activeTab]) {
                  // Scroll down by one visible screen chunk
                  if (scrollViewRef.current) {
                    const modalContentHeight = height * 0.85 - 300; // Approximate visible content area
                    const newPosition = currentScrollPosition.current + modalContentHeight;
                    scrollViewRef.current.scrollTo({ 
                      y: newPosition,
                      animated: true 
                    });
                  }
                }
              }}
              disabled={!canAccept && !hasStartedScrolling[activeTab]}
            >
              <Text style={styles.acceptButtonText}>
                {getButtonText()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  checkIcon: {
    marginLeft: 6,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#E3F2FD',
  },
  acceptButtonEnabled: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

export default LegalDocumentBottomSheet;