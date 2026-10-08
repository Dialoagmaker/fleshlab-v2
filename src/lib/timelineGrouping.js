export function parseMetadata(json) {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

function metaLabel(event) {
  const meta = parseMetadata(event.metadata_json);
  if (!meta) return null;
  return meta.performer_name || meta.display_name || meta.video_title || meta.title || null;
}

// Groups consecutive occurrences of the same event_name into a single summary item.
export function groupConsecutiveEvents(events) {
  const groups = [];
  let i = 0;
  while (i < events.length) {
    const current = events[i];
    let j = i + 1;
    while (j < events.length && events[j].event_name === current.event_name) j++;
    const cluster = events.slice(i, j);

    if (cluster.length === 1) {
      groups.push({ type: "single", event_name: current.event_name, event: current, time: current.created_date });
    } else {
      const counts = {};
      for (const ev of cluster) {
        const label = metaLabel(ev);
        if (label) counts[label] = (counts[label] || 0) + 1;
      }
      const breakdown = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
      const first = new Date(cluster[0].created_date).getTime();
      const last = new Date(cluster[cluster.length - 1].created_date).getTime();

      groups.push({
        type: "group",
        event_name: current.event_name,
        count: cluster.length,
        first_time: cluster[0].created_date,
        last_time: cluster[cluster.length - 1].created_date,
        rapid: last - first <= 2000,
        breakdown,
        time: cluster[cluster.length - 1].created_date,
      });
    }
    i = j;
  }
  return groups;
}