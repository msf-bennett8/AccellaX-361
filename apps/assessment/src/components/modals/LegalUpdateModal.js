// Location: /apps/assessment/src/components/modals/LegalUpdateModal.js
// Global modal for legal document updates - blocks all interaction

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import ReadOnlyTermsModal from './ReadOnlyTermsModal';
import ReadOnlyPrivacyModal from './ReadOnlyPrivacyModal';

const LegalUpdateModal = ({ visible, onAccept }) => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleViewTerms = () => {
    setShowTerms(true);
  };

  const handleViewPrivacy = () => {
    setShowPrivacy(true);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => {}} // Prevent dismissal
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="document-text" size={64} color={COLORS.primary} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Terms & Policies Updated</Text>

            {/* Message */}
            <Text style={styles.message}>
              We've updated our Terms of Service and Privacy Policy. Please review and accept them to continue using the app.
            </Text>

            {/* Document Links */}
            <View style={styles.linksContainer}>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleViewTerms}
                activeOpacity={0.7}
              >
                <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                <Text style={styles.linkText}>View Terms of Service</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleViewPrivacy}
                activeOpacity={0.7}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
                <Text style={styles.linkText}>View Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Accept Button */}
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>I Accept</Text>
            </TouchableOpacity>

            {/* Footer Note */}
            <Text style={styles.footerNote}>
              By continuing, you agree to our updated terms and policies
            </Text>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <ReadOnlyTermsModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
      />

      {/* Privacy Modal */}
      <ReadOnlyPrivacyModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  linksContainer: {
    width: '100%',
    marginBottom: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 12,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  footerNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LegalUpdateModal;
