import StoryPoster from "./StoryPoster";

const moments = [
  ["LATE CHECK-IN", "Room key"],
  ["MIRROR SELFIE", "Before camera"],
  ["THE MASSAGE ROOM", "Door closed"],
  ["STRAIGHT?", "Hidden desire"],
  ["REAL COUPLES", "No acting"],
];

export default function DocumentaryMosaic({ videos = [], performers = [] }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 lg:px-14">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <StoryPoster title="HE NEVER PLANNED THIS" label="Ordinary guy" video={videos[0]} image={performers[0]?.cover_image_url} href={videos[0]?.slug ? `/videos/${videos[0].slug}` : "/videos"} tall />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          {moments.slice(0, 2).map(([title, label], index) => <StoryPoster key={title} title={title} label={label} video={videos[index + 1]} image={performers[index + 1]?.profile_image_url} href={videos[index + 1]?.slug ? `/videos/${videos[index + 1].slug}` : "/videos"} />)}
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {moments.slice(2).map(([title, label], index) => <StoryPoster key={title} title={title} label={label} video={videos[index + 3]} image={performers[index + 3]?.cover_image_url} href={videos[index + 3]?.slug ? `/videos/${videos[index + 3].slug}` : "/become-performer"} />)}
      </div>
    </section>
  );
}