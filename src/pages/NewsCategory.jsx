import React from "react";
import { useParams } from "react-router-dom";
import News from "@/pages/News";

const categoryArchives = {
  "platform-updates": { value: "studioUpdates", label: "Platform Updates" },
  "studio-news": { value: "behindTheScenes", label: "Studio News" },
  "creator-announcements": { value: "creatorStories", label: "Creator Announcements" },
  "new-releases": { value: "production", label: "New Releases" },
  "community-updates": { value: "fanclub", label: "Community Updates" },
  "press-releases": { value: "pressRelease", label: "Press Releases" },
  "partnerships": { value: "partnerships", label: "Partnerships" },
  "events": { value: "events", label: "Events" },
};

export default function NewsCategory() {
  const { categorySlug } = useParams();
  const archive = categoryArchives[categorySlug] || { value: "all", label: "All Updates" };
  return <News initialCategory={archive.value} archiveLabel={archive.label} />;
}