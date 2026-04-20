import Link from "next/link";
import { ShouksMark } from "@/components/brand/Logo";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-soft">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-line">
        <div className="max-w-[1280px] mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5 font-semibold text-[15px]">
            <ShouksMark size={22} />
            <span>Shouks</span>
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
