import { useEffect } from "react";
import { getRecruitmentVariant, trackRecruitmentFunnelStage, trackRecruitmentSectionViewed } from "@/lib/recruitmentOptimization";

export default function RecruitmentMeasurement() {
  useEffect(() => {
    trackRecruitmentFunnelStage("landing");
    ["hero_message", "primary_cta", "trust_card_density", "product_preview_visibility", "faq_placement"].forEach(getRecruitmentVariant);

    const seen = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const key = entry.target.getAttribute("data-recruitment-section");
        if (entry.isIntersecting && key && !seen.has(key)) {
          seen.add(key);
          trackRecruitmentSectionViewed(key, { visible_ratio: Number(entry.intersectionRatio.toFixed(2)) });
        }
      });
    }, { threshold: 0.45 });

    document.querySelectorAll("[data-recruitment-section]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return null;
}