const LOGO_URL = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/1591ab54c_ChatGPTImageJul14202612_16_43AM.png";

export default function BrandLogo({ className = "", imageClassName = "" }) {
  return (
    <span className={`relative inline-block overflow-hidden align-middle ${className}`} aria-label="FLESHLAB">
      <img
        src={LOGO_URL}
        alt="FLESHLAB Amateur Wins"
        className={`absolute left-1/2 top-[49%] max-w-none -translate-x-1/2 -translate-y-1/2 w-[112%] h-auto ${imageClassName}`}
      />
    </span>
  );
}