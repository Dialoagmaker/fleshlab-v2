import { createCampaignBible, validateCampaignBible } from "@/lib/heroPhotography/campaignBible";

export function createCampaignDesignDirection(args) {
  return createCampaignBible(args);
}

export function validateCampaignDirection(direction = {}) {
  return validateCampaignBible(direction);
}