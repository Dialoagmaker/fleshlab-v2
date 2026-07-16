import StoryPoster from "./StoryPoster";

const stories = [
  ["HE CAME FOR THE MONEY", "First payout"],
  ["FIRST NIGHT", "No experience"],
  ["THE HOTEL ROOM", "Door closed"],
  ["AFTER THE SHOOT", "What happened next"],
  ["THE SECRET", "Hidden desire"],
  ["HE STAYED FOR THE FANS", "Amateur wins"],
];

export default function CreatorStories({ videos = [], performers = [] }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28 lg:px-14">
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">Real amateurs</p>
      <h2 className="mb-12 max-w-5xl text-6xl font-black uppercase leading-[0.82] tracking-[-0.08em] text-white md:text-8xl">Real men.<br />Real lust.</h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {stories.map(([title, label], index) => {
          const performer = performers[index % Math.max(performers.length, 1)];
          return <StoryPoster key={title} title={title} label={label} video={videos[index + 3]} image={performer?.cover_image_url || performer?.profile_image_url} href="/become-performer" />;
        })}
      </div>
    </section>
  );
}