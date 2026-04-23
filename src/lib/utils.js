import { formatDistanceToNow, format } from 'date-fns';

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function timeAgo(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date, fmt = 'MMM d, yyyy') {
  if (!date) return '';
  return format(new Date(date), fmt);
}

export function truncate(str, len = 100) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function formatCount(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function generateId() {
  return crypto.randomUUID();
}
