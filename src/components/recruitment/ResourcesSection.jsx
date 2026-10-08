import InternalLinkCard from "./InternalLinkCard";

const resources = [
  {
    href: "/become-performer",
    title: "Become a Performer",
    desc: "Main application portal for all creator opportunities"
  },
  {
    href: "/gay-performer-recruitment-philippines",
    title: "Philippines Recruitment",
    desc: "Specialized program for Philippines-based creators"
  },
  {
    href: "/chaturbate-model-join-studio",
    title: "Chaturbate Model Program",
    desc: "Studio partnership for cam performers"
  },
  {
    href: "/fanclub",
    title: "Fanclub System",
    desc: "Monthly subscription fanclub platform"
  },
  {
    href: "/how-it-works",
    title: "How It Works",
    desc: "Complete guide to FLESHLAB's creator workflow"
  },
  {
    href: "/faq",
    title: "FAQ",
    desc: "Frequently asked questions about FLESHLAB"
  }
];

export default function ResourcesSection() {
  return (
    <section className="py-16 md:py-20 border-b border-white/6">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-8 text-center">
          Related Resources
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource, i) => (
            <InternalLinkCard key={i} {...resource} />
          ))}
        </div>
      </div>
    </section>
  );
}