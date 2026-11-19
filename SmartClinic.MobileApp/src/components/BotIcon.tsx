import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

// Same 24px Bot outline used by Lucide on the web client.
export const BotIcon = ({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" accessibilityElementsHidden importantForAccessibility="no">
    <Path d="M12 8V4H8" />
    <Rect width={16} height={12} x={4} y={8} rx={2} />
    <Path d="M2 14h2M20 14h2M9 13v2M15 13v2" />
  </Svg>
);
