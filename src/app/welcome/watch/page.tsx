
import { Metadata } from 'next';
import WatchClient from './WatchClient';

export const metadata: Metadata = {
  title: 'Watch | Japan Kingdom Church',
  description: 'Watch our latest sermons and testimonies from Japan Kingdom Church Tokyo.',
};

export default function WatchPage() {
  return <WatchClient />;
}
