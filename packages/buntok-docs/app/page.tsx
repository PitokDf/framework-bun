import { Header } from "@/components/landing/header";
import { HomeSection } from "@/components/landing/home-section";

export default function Home() {
  return (
    <div>
      <Header />
      <div className="mx-auto max-w-6xl">
        <HomeSection />
      </div>
    </div>
  );
}
