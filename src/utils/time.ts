const MILLISECONDS_PER_MINUTE = 60 * 1000;
const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * 60;
const MILLISECONDS_PER_DAY = MILLISECONDS_PER_HOUR * 24;

export function formatDuration(milliseconds: bigint): string {
  const totalMilliseconds = Number(milliseconds);
  const days = Math.floor(totalMilliseconds / MILLISECONDS_PER_DAY);
  const hours = Math.floor((totalMilliseconds % MILLISECONDS_PER_DAY) / MILLISECONDS_PER_HOUR);
  const minutes = Math.floor((totalMilliseconds % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE);
  
  const parts: string[] = [];
  
  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  }
  
  if (hours > 0 || days > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  
  parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  
  return parts.join(', ');
} 