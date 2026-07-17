import { motion } from "framer-motion";
import { HeartHandshake, Smile, Users } from "lucide-react";
import MediaImage from "@/components/homeTube/MediaImage";
import AnimatedCounter from "@/components/landingV2/AnimatedCounter";

const moments = [
  {
    image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4ecf7441b_generated_image.png",
    title: "People before production",
    body: "Approachable creators, real emotion and a studio process built around comfort."
  },
  {
    image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4b2a370cb_generated_image.png",
    title: "Stories reviewed together",
    body: "Creators see the process, understand the outcome and stay part of the decision."
  },
  {
    image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/d9bb27add_generated_image.png",
    title: "Start from everyday moments",
    body: "A phone, a room and a simple first step into a premium creator platform."
  },
  {
    image: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/6418c7379_generated_image.png",
    title: "Supported by a real team",
    body: "Production can be homemade, studio-supported or both as the creator grows."
  }
];

export default function HumanMomentsSection() {
  return (
    <section className="relative overflow-hidden border-y border-white/8 bg-[#060a0d] px-5 py-16 lg:px-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(240,24,61,0.16),transparent_30%),radial-gradient(circle_at_80%_78%,rgba(255,255,255,0.07),transparent_28%)]" />
      <motion.div animate={{ y: [0, -14, 0], opacity: [0.4, 0.68, 0.4] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} className="absolute right-[12%] top-16 h-32 w-32 rounded-full bg-[#f0183d]/14 blur-3xl" />
      <div className="relative mx-auto grid max-w-[1360px] gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7 }} className="flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#f0183d]">REAL PEOPLE, REAL STORIES</p>
          <h2 className="fl-condensed mt-4 text-[62px] uppercase leading-[0.9] tracking-[-0.02em] text-white/92">THE PEOPLE BEHIND AMATEUR WINS.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/62">FLESHLAB is not built around untouchable stars. It is built around everyday creators, first uploads, honest collaboration and a premium system that helps real people grow.</p>
          <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
            <AnimatedCounter value={17} label="performers" note="Active creator profiles in the platform." className="rounded-2xl border border-white/10 bg-black/24 p-5" />
            <AnimatedCounter value={5} label="countries" note="A growing international creator network." className="rounded-2xl border border-white/10 bg-black/24 p-5" />
          </div>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2">
          {moments.map((moment, index) => (
            <motion.article key={moment.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.62, delay: index * 0.06 }} className={`group relative min-h-[285px] overflow-hidden rounded-2xl border border-white/12 bg-black ${index === 0 ? "sm:translate-y-8" : ""} ${index === 3 ? "sm:-translate-y-8" : ""}`}>
              <MediaImage src={moment.image} alt={moment.title} className="absolute inset-0 h-full w-full object-cover object-[center_38%] opacity-78 transition duration-700 group-hover:scale-105 group-hover:opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/32 to-transparent" />
              <div className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-black/30 backdrop-blur">
                {index === 0 ? <Users className="h-5 w-5 text-[#f0183d]" /> : index === 1 ? <HeartHandshake className="h-5 w-5 text-[#f0183d]" /> : <Smile className="h-5 w-5 text-[#f0183d]" />}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="text-lg font-black uppercase leading-tight">{moment.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/64">{moment.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}