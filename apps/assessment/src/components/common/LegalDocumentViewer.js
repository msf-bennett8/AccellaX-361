// Location: /apps/assessment/src/components/common/LegalDocumentViewer.js
// Markdown viewer for rendering legal documents with proper formatting

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { COLORS } from '../../utils/constants';

const LegalDocumentViewer = React.forwardRef(({ content, onScroll }, ref) => {
  return (
    <ScrollView 
      ref={ref}
      style={styles.container}
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled={true}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <Markdown style={markdownStyles}>
        {content}
      </Markdown>
    </ScrollView>
  );
});

const markdownStyles = {
  // Body text
  body: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
  
  // Headers - Bold and larger
  heading1: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  heading2: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  heading3: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  
  // Bold text
  strong: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  
  // Lists
  bullet_list: {
    marginTop: 8,
    marginBottom: 8,
  },
  ordered_list: {
    marginTop: 8,
    marginBottom: 8,
  },
  list_item: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  bullet_list_icon: {
    color: COLORS.text,
    marginRight: 8,
  },
  ordered_list_icon: {
    color: COLORS.text,
    marginRight: 8,
  },
  
  // Paragraphs
  paragraph: {
    marginTop: 6,
    marginBottom: 6,
    color: COLORS.text,
  },
  
  // Horizontal rules (---)
  hr: {
    backgroundColor: COLORS.border,
    height: 1,
    marginVertical: 16,
  },
  
  // Links
  link: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  
  // Emphasis (italic)
  em: {
    fontStyle: 'italic',
  },
  
  // Code
  code_inline: {
    backgroundColor: COLORS.inputBackground,
    color: COLORS.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontFamily: 'monospace',
  },
  code_block: {
    backgroundColor: COLORS.inputBackground,
    color: COLORS.primary,
    padding: 12,
    borderRadius: 6,
    fontFamily: 'monospace',
    marginVertical: 8,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default React.memo(LegalDocumentViewer);