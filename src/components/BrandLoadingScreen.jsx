import BrandLogo from "@/components/BrandLogo";

export default function BrandLoadingScreen({ visible }) {
  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] transition-opacity duration-700 ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!visible}>
      <BrandLogo className="h-[92px] w-[360px] max-w-[78vw]" />
    </div>
  );
}