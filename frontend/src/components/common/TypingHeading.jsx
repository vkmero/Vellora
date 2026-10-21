import React from 'react';

/**
 * Static Heading component (Master Spec §8: All typing animations removed)
 * Immediately displays the complete text with zero delay and no blinking cursors.
 */
export default function TypingHeading({
  text,
  className = '',
  as: Component = 'span',
}) {
  const displayText = Array.isArray(text) ? text[0] : (text || '');

  return (
    <Component className={`inline-block font-sans ${className}`}>
      {displayText}
    </Component>
  );
}
