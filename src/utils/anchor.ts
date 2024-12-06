interface Position {
  x: number;
  y: number;
}

interface CardDimensions {
  width: number;
  height: number;
}

export function calculateAnchor(
  sourcePosition: Position,
  targetPosition: Position,
  dimensions: CardDimensions = { width: 256, height: 192 }
): string {
  // Calculate center points
  const sourceCenter = {
    x: sourcePosition.x + dimensions.width / 2,
    y: sourcePosition.y + dimensions.height / 2
  };
  const targetCenter = {
    x: targetPosition.x + dimensions.width / 2,
    y: targetPosition.y + dimensions.height / 2
  };

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Calculate the absolute angle for better comparison
  const absAngle = ((angle % 360) + 360) % 360;
  
  // Define angle ranges for each side
  if (absAngle >= 315 || absAngle < 45) return 'right';
  if (absAngle >= 45 && absAngle < 135) return 'bottom';
  if (absAngle >= 135 && absAngle < 225) return 'left';
  return 'top';
}