import StoryPoster from "./StoryPoster";

const stories = [
  ["MY FIRST HOTEL SHOOT", "First step"],
  ["MY FIRST PAYOUT", "Amateur wins"],
  ["FROM CUSTOMER TO CREATOR", "Crossing over"],
  ["I ALMOST SAID NO", "Before camera"],
  ["I CAME BACK", "Second chapter"],
  ["WHY I JOINED", "Creator story"],
];

export default function CreatorStories({ videos = [], performers = [] }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28 lg:px-14">
      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">Creator stories</p>
      <h2 className="mb-12 max-w-5xl text-6xl font-black uppercase leading-[0.82] tracking-[-0.08em] text-white md:text-8xl">Real people.<br />Real results.</h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {stories.map(([title, label], index) => {
          const performer = performers[index % Math.max(performers.length, 1)];
          return <StoryPoster key={title} title={title} label={label} video={videos[index + 3]} image={performer?.cover_image_url || performer?.profile_image_url} href="/become-performer" />;
        })}
      </div>
    </section>
  );
}