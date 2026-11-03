const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
});

/**
 * Format a timestamp for display.
 * Handles Firestore timestamps, Date objects, and ISO strings.
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return '';

  try {
    let date;
    if (typeof timestamp === 'object' && typeof timestamp?.toDate === 'function') {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return '';
    }

    return Number.isNaN(date.getTime()) ? 'Invalid Date' : dateFormatter.format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};
