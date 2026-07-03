import { useMemo } from "react";
import {
  computeHealthScore, computePurchaseProbability, computeStatusBadges, computeInterestProfile,
  computeRecommendations, computeSessionAnalytics, computeHeatmap, computeAttribution,
  computeJourneyMilestones, computeInsightSummary,
} from "@/lib/customerIntelligence";
import HealthScoreCard from "./HealthScoreCard";
import StatusBadgesCard from "./StatusBadgesCard";
import InterestProfileCard from "./InterestProfileCard";
import RecommendationsCard from "./RecommendationsCard";
import SessionAnalyticsCard from "./SessionAnalyticsCard";
import ActivityHeatmap from "./ActivityHeatmap";
import MarketingAttributionCard from "./MarketingAttributionCard";
import RevenueDashboardCard from "./RevenueDashboardCard";
import FlashPaySummaryCard from "./FlashPaySummaryCard";
import JourneyMilestones from "./JourneyMilestones";
import InsightSummaryCard from "./InsightSummaryCard";
import AdminNotesCard from "./AdminNotesCard";

export default function CrmDashboard({ events, summary, user, financials, notes, onAddNote, onDeleteNote, isSavingNote }) {
  const health = useMemo(() => computeHealthScore(events, summary, financials), [events, summary, financials]);
  const probability = useMemo(() => computePurchaseProbability(events, summary, financials), [events, summary, financials]);
  const badges = useMemo(() => computeStatusBadges(events, summary, user, financials), [events, summary, user, financials]);
  const interest = useMemo(() => computeInterestProfile(events), [events]);
  const recommendations = useMemo(() => computeRecommendations(events, summary, financials, probability), [events, summary, financials, probability]);
  const session = useMemo(() => computeSessionAnalytics(events), [events]);
  const heatmap = useMemo(() => computeHeatmap(events), [events]);
  const attribution = useMemo(() => computeAttribution(events), [events]);
  const milestones = useMemo(() => computeJourneyMilestones(events, financials), [events, financials]);
  const insight = useMemo(() => computeInsightSummary(events, summary, financials, interest), [events, summary, financials, interest]);

  return (
    <div className="space-y-4">
      <HealthScoreCard health={health} probability={probability} />
      <InsightSummaryCard summary={insight} />
      <StatusBadgesCard badges={badges} />
      <InterestProfileCard interest={interest} />
      <RecommendationsCard recommendations={recommendations} />
      <JourneyMilestones milestones={milestones} />
      <SessionAnalyticsCard session={session} />
      <ActivityHeatmap heatmap={heatmap} />
      <MarketingAttributionCard attribution={attribution} />
      <RevenueDashboardCard summary={summary} financials={financials} />
      <FlashPaySummaryCard financials={financials} />
      <AdminNotesCard notes={notes} onAdd={onAddNote} onDelete={onDeleteNote} isSaving={isSavingNote} />
    </div>
  );
}