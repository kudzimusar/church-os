
import { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About Us | Japan Kingdom Church',
  description: 'Our vision, mission, and statement of faith. Learn how Japan Kingdom Church started in Tokyo.',
};

export default function AboutPage() {
  return <AboutClient />;
}
