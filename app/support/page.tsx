import SupportHero from "./SupportHero";
import AccountHealth from "./AccountHealth";
import SystemStatus from "./SystemStatus";
import VideoAcademy from "./VideoAcademy";
import FaqSection from "./FaqSection";
import SupportRequest from "./SupportRequest";

export const metadata = {
  title: "HalApp Kontrol Merkezi",
  description:
    "HalApp destek merkezi, hesap sağlığı, sistem durumu, akademi ve destek talepleri.",
};

export default function SupportPage() {
  return (
    <main className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <SupportHero />

      <div className="mt-8">
        <AccountHealth />
      </div>

      <div className="mt-8">
        <SystemStatus />
      </div>

      <div className="mt-8">
        <VideoAcademy />
      </div>

      <div className="mt-8">
        <FaqSection />
      </div>

      <div className="mt-8">
        <SupportRequest />
      </div>
    </main>
  );
}