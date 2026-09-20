// Deliberately conservative worker boundary. No Base44 automation is replayed here.
// A queue consumer is enabled only after each source workflow is ported and tested.
console.log(JSON.stringify({ service: 'fleshlab-worker', status: 'idle', message: 'No production jobs are enabled before explicit migration.' }));
setInterval(() => {}, 60_000);
