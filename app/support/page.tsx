import SupportCenterClient from "./ui/support-center-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Destek Merkezi | HalApp",
  description: "HalApp kullanıcı destek merkezi ve ticket takibi.",
};

export default function SupportPage() {
  return <SupportCenterClient />;
}