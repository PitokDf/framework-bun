import { Header } from "@/components/layout/Header";
import { HomeSection } from "@/components/landing/home-section";

export default function Home() {
  return (
    <div>
      <Header />
      <div className="mx-auto max-w-6xl pt-14">
        <HomeSection />
      </div>
    </div>
  );
}
