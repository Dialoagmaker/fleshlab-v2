export default function SummerPromoBanner() {
  return (
    <section className="w-full bg-black h-[320px] md:h-[340px] lg:h-[360px] overflow-hidden">
      <img
        src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/df4dc9d91_image.png"
        alt="FLESHLAB Summer Studio Special - 50% OFF Fanclub Access"
        className="w-full h-full object-cover"
        style={{ 
          objectPosition: "50% 35%"
        }}
      />
    </section>
  );
}