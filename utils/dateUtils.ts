export const getTodayDateString = (): string => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const isSameDay = (d1: string, d2: string): boolean => {
  return d1 === d2;
};
