import StoryPoster from "./StoryPoster";

const moments = [
  ["FIRST HOTEL SHOOT", "Room key"],
  ["COFFEE BEFORE FILMING", "Morning nerves"],
  ["THE MASSAGE ROOM", "Studio chapter"],
  ["FROM CUSTOMER TO CREATOR", "Crossing over"],
  ["REAL COUPLES", "Chemistry"],
];

export default function DocumentaryMosaic({ videos = [], performers = [] }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 lg:px-14">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <StoryPoster title="MY FIRST SHOOT" label="The beginning" video={videos[0]} image={performers[0]?.cover_image_url} href="/become-performer" tall />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          {moments.slice(0, 2).map(([title, label], index) => <StoryPoster key={title} title={title} label={label} video={videos[index + 1]} image={performers[index + 1]?.profile_image_url} href="/become-performer" />)}
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {moments.slice(2).map(([title, label], index) => <StoryPoster key={title} title={title} label={label} video={videos[index + 3]} image={performers[index + 3]?.cover_image_url} href={videos[index + 3]?.slug ? `/videos/${videos[index + 3].slug}` : "/become-performer"} />)}
      </div>
    </section>
  );
}