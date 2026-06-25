/**
 * FleshLab Live — Centralized affiliate link config.
 * Update URLs here without touching any page files.
 */

const BASE_LIVE_URL = "https://www.fleshlab-live.com/male-cams/";

// Performer signup — update this URL once the final Chaturbate broadcaster link is confirmed
const PERFORMER_SIGNUP_URL = "https://chaturbate.com/in/?track=performer_signup_fleshlab&tour=grq&campaign=creator_recruiting";

export const LIVE_LINKS = {
  live:            `${BASE_LIVE_URL}?track=fleshlab_live`,
  liveHome:        `${BASE_LIVE_URL}?track=fleshlab_home`,
  liveHeader:      `${BASE_LIVE_URL}?track=fleshlab_header`,
  liveFooter:      `${BASE_LIVE_URL}?track=fleshlab_footer`,
  fitmaster:       `${BASE_LIVE_URL}?track=fitmaster_page`,
  fitmasterX:      `${BASE_LIVE_URL}?track=fitmaster_x`,
  fitmasterReddit: `${BASE_LIVE_URL}?track=fitmaster_reddit`,
  fitmasterSignup: `${PERFORMER_SIGNUP_URL}&track=fitmaster_signup`,
  performerSignup: PERFORMER_SIGNUP_URL,
};

/** Standard rel attribute for all outbound affiliate links */
export const AFFILIATE_REL = "noopener noreferrer sponsored nofollow";