import { formatDistanceToNow as formatDistance } from 'date-fns';

export const formatDistanceToNow = (date: string) => {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};
