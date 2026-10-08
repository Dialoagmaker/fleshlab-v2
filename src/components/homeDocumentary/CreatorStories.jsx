import StoryPoster from "./StoryPoster";

export default function CreatorStories({ videos = [], performers = [] }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28 lg:px-14">
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">Performers</p>
      <h2 className="mb-12 max-w-5xl text-4xl font-black uppercase leading-[0.88] tracking-[-0.055em] text-white md:text-6xl">Real men. Real lust.</h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {performers.slice(0, 6).map((performer, index) => (
          <StoryPoster key={performer.id || performer.slug || index} title={performer.display_name} label={performer.nationality || "FLESHLAB"} video={videos[index + 3]} image={performer?.cover_image_url || performer?.profile_image_url} href={performer.slug ? `/performers/${performer.slug}` : "/performers"} cta="VIEW PROFILE" />
        ))}
      </div>
    </section>
  );
}