'use client';

import HeroSection from '@/components/public/HeroSection';
import MissionStrip from '@/components/public/MissionStrip';
import SermonSection from '@/components/public/SermonSection';
import NewHereSection from '@/components/public/NewHereSection';
import ServiceSchedule from '@/components/public/ServiceSchedule';
import DirectionsSection from '@/components/public/DirectionsSection';
import ConnectSection from '@/components/public/ConnectSection';

export default function WelcomePage() {
  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <MissionStrip />
      <SermonSection />
      <NewHereSection />
      <ServiceSchedule />
      <DirectionsSection />
      <ConnectSection />
    </div>
  );
}
