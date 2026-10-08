export const OFFICIAL_FLESHLAB_LOGO_URL = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/1591ab54c_ChatGPTImageJul14202612_16_43AM.png";

export default function BrandLogo({ className = "", imageClassName = "" }) {
  return (
    <span className={`inline-flex items-center justify-center overflow-hidden align-middle ${className}`} aria-label="FLESHLAB">
      <img
        src={OFFICIAL_FLESHLAB_LOGO_URL}
        alt="FLESHLAB Amateur Wins"
        width="1024"
        height="683"
        decoding="async"
        draggable="false"
        className={`block h-auto w-full max-w-none shrink-0 select-none ${imageClassName}`}
      />
    </span>
  );
}