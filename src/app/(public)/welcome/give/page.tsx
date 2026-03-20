
import { Metadata } from 'next';
import GiveClient from './GiveClient';

export const metadata: Metadata = {
  title: 'Give | Japan Kingdom Church',
  description: 'Support the mission of Japan Kingdom Church Tokyo through your generosity.',
};

export default function GivePage() {
  return <GiveClient />;
}
