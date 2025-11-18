//src/components/common/Card.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const Card = ({
  children,
  title,
  subtitle,
  headerRight,
  footer,
  image,
  imagePosition = 'top', // 'top', 'left', 'right', 'background'
  imageStyle,
  onPress,
  onLongPress,
  variant = 'default', // 'default', 'elevated', 'outlined', 'filled'
  padding = 16,
  margin = 0,
  backgroundColor = COLORS.white,
  borderColor = COLORS.border,
  borderRadius = 12,
  elevation = 2,
  disabled = false,
  loading = false,
  style,
  containerStyle,
  headerStyle,
  contentStyle,
  footerStyle,
  badge,
  badgeColor = COLORS.primary,
  badgePosition = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  icon,
  iconPosition = 'left', // 'left', 'right'
  iconColor = COLORS.primary,
  divider = false,
  dividerColor = COLORS.border,
  shadow = true,
  fullWidth = false,
  aspectRatio,
  overflow = 'hidden',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor,
          elevation: elevation * 1.5,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: elevation },
          shadowOpacity: 0.25,
          shadowRadius: elevation * 1.5,
          borderWidth: 0,
        };
      case 'outlined':
        return {
          backgroundColor,
          borderWidth: 1,
          borderColor,
          elevation: 0,
          shadowOpacity: 0,
        };
      case 'filled':
        return {
          backgroundColor: COLORS.background,
          elevation: 0,
          shadowOpacity: 0,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor,
          elevation: shadow ? elevation : 0,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: elevation / 2 },
          shadowOpacity: shadow ? 0.2 : 0,
          shadowRadius: shadow ? elevation : 0,
          borderWidth: 0,
        };
    }
  };

  const getBadgePositionStyles = () => {
    const offset = 8;
    switch (badgePosition) {
      case 'top-left':
        return { top: offset, left: offset };
      case 'bottom-right':
        return { bottom: offset, right: offset };
      case 'bottom-left':
        return { bottom: offset, left: offset };
      case 'top-right':
      default:
        return { top: offset, right: offset };
    }
  };

  const renderImage = () => {
    if (!image) return null;

    if (typeof image === 'string') {
      return (
        <Image
          source={{ uri: image }}
          style={[
            styles.image,
            imagePosition === 'left' && styles.imageLeft,
            imagePosition === 'right' && styles.imageRight,
            imagePosition === 'background' && styles.imageBackground,
            imageStyle,
          ]}
          resizeMode={imagePosition === 'background' ? 'cover' : 'cover'}
        />
      );
    }

    // If image is a component
    return (
      <View
        style={[
          styles.imageContainer,
          imagePosition === 'left' && styles.imageLeft,
          imagePosition === 'right' && styles.imageRight,
          imageStyle,
        ]}
      >
        {image}
      </View>
    );
  };

  const renderHeader = () => {
    if (!title && !subtitle && !headerRight && !icon) return null;

    return (
      <View style={[styles.header, headerStyle]}>
        <View style={styles.headerLeft}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            {title && (
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            )}
          </View>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
            </View>
          )}
        </View>
        {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
      </View>
    );
  };

  const renderContent = () => {
    if (!children) return null;

    return (
      <View style={[styles.content, { padding }, contentStyle]}>
        {children}
      </View>
    );
  };

  const renderFooter = () => {
    if (!footer) return null;

    return (
      <View style={[styles.footer, footerStyle]}>
        {divider && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
        {footer}
      </View>
    );
  };

  const renderBadge = () => {
    if (!badge) return null;

    return (
      <View style={[styles.badge, { backgroundColor: badgeColor }, getBadgePositionStyles()]}>
        {typeof badge === 'string' || typeof badge === 'number' ? (
          <Text style={styles.badgeText}>{badge}</Text>
        ) : (
          badge
        )}
      </View>
    );
  };

  const renderLoadingState = () => {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBar} />
        <View style={[styles.loadingBar, styles.loadingBarShort]} />
        <View style={[styles.loadingBar, styles.loadingBarMedium]} />
      </View>
    );
  };

  const cardContent = (
    <View
      style={[
        styles.card,
        getVariantStyles(),
        {
          borderRadius,
          margin,
          opacity: disabled ? 0.6 : 1,
          overflow,
        },
        fullWidth && styles.fullWidth,
        aspectRatio && { aspectRatio },
        style,
      ]}
    >
      {imagePosition === 'background' && renderImage()}
      
      <View style={[imagePosition === 'background' && styles.overlayContent]}>
        {imagePosition === 'top' && renderImage()}
        
        <View style={[styles.mainContent, imagePosition === 'left' && styles.rowContent]}>
          {imagePosition === 'left' && renderImage()}
          
          <View style={styles.textContent}>
            {renderHeader()}
            {loading ? renderLoadingState() : renderContent()}
            {renderFooter()}
          </View>
          
          {imagePosition === 'right' && renderImage()}
        </View>
      </View>

      {renderBadge()}
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={containerStyle}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{cardContent}</View>;
};

// Card Action Component
export const CardAction = ({ icon, label, onPress, color = COLORS.primary, style }) => {
  return (
    <TouchableOpacity
      style={[styles.action, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Text style={[styles.actionIcon, { color }]}>{icon}</Text>}
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// Card Actions Container
export const CardActions = ({ children, style, align = 'flex-end' }) => {
  return (
    <View style={[styles.actions, { justifyContent: align }, style]}>
      {children}
    </View>
  );
};

// Card Section Component
export const CardSection = ({ title, children, style, titleStyle }) => {
  return (
    <View style={[styles.section, style]}>
      {title && <Text style={[styles.sectionTitle, titleStyle]}>{title}</Text>}
      {children}
    </View>
  );
};

// Card Media Component
export const CardMedia = ({ source, aspectRatio = 16 / 9, style, overlay, children }) => {
  return (
    <View style={[styles.media, { aspectRatio }, style]}>
      <Image source={source} style={styles.mediaImage} resizeMode="cover" />
      {overlay && <View style={styles.mediaOverlay}>{overlay}</View>}
      {children}
    </View>
  );
};

// Card List Item Component
export const CardListItem = ({ icon, title, subtitle, rightContent, onPress, style }) => {
  return (
    <TouchableOpacity
      style={[styles.listItem, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {icon && (
        <View style={styles.listItemIcon}>
          <Text style={styles.listItemIconText}>{icon}</Text>
        </View>
      )}
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
      </View>
      {rightContent && <View style={styles.listItemRight}>{rightContent}</View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      },
    }),
  },
  fullWidth: {
    width: '100%',
  },
  mainContent: {
    flex: 1,
  },
  rowContent: {
    flexDirection: 'row',
  },
  textContent: {
    flex: 1,
  },
  overlayContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  image: {
    width: '100%',
    height: 200,
  },
  imageLeft: {
    width: 100,
    height: 100,
    marginRight: 12,
  },
  imageRight: {
    width: 100,
    height: 100,
    marginLeft: 12,
  },
  imageBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  loadingContainer: {
    padding: 16,
  },
  loadingBar: {
    height: 12,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    marginBottom: 8,
  },
  loadingBarShort: {
    width: '60%',
  },
  loadingBarMedium: {
    width: '80%',
  },
  // Card Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Card Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  // Card Media
  media: {
    position: 'relative',
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  // Card List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemIconText: {
    fontSize: 20,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listItemRight: {
    marginLeft: 12,
  },
});

export default Card;