import BrandLogo from "@/components/BrandLogo";
import LanguageSwitcher from "@/components/public/LanguageSwitcher";

export default function LandingNav({ text }) {
  const hrefs = ["#who", "#journey", "#earn", "#worlds", "#trust"];
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#070706]/74 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:px-10 lg:px-14">
        <a href="/" className="flex items-center"><BrandLogo className="w-32 md:w-40" /></a>
        <nav className="hidden items-center gap-7 lg:flex">
          {text.nav.map((item, index) => <a key={item} href={hrefs[index]} className="text-[11px] font-black uppercase tracking-[0.16em] text-white/70 transition hover:text-white">{item}</a>)}
        </nav>
        <div className="flex items-center gap-3"><LanguageSwitcher /><a href="/become-performer" className="hidden rounded-full bg-[#c95b38] px-5 py-3 text-[11px] font-black uppercase tracking-wide text-white transition hover:bg-[#e0774d] sm:inline-flex">Join now</a></div>
      </div>
    </header>
  );
}