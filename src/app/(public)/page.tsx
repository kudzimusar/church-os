
import { Metadata } from 'next';
import WelcomeClient from './WelcomeClient';

export const metadata: Metadata = {
  title: 'Japan Kingdom Church — Tokyo',
  description: 'Building a Strong Christian Community that Represents Christ to Japanese Society. Join us Sundays at 10:30AM in Akishima, Tokyo.',
};

export default function WelcomePage() {
  return <WelcomeClient />;
}
