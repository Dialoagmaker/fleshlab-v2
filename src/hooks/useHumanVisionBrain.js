import { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";

const MODULE = "human-vision";

export function useHumanVisionBrain() {
  const [data, setData] = useState({ categories: [], records: [], reasoning: [], attention: [], heatmap: [], reports: [], exams: [], certifications: [], versions: [], dependencies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [categories, records, reasoning, attention, heatmap, reports, exams, certifications, versions, dependencies] = await Promise.all([
        base44.entities.CreativeAcademyKnowledgeCategory.filter({ module_slug: MODULE }, "category_slug", 100),
        base44.entities.CreativeAcademyKnowledgeRecord.filter({ module_slug: MODULE }, "record_slug", 500),
        base44.entities.HumanVisionReasoningFramework.filter({ module_slug: MODULE }, "-updated_date", 10),
        base44.entities.HumanVisionAttentionFramework.filter({ module_slug: MODULE }, "-updated_date", 10),
        base44.entities.HumanVisionHeatmapFramework.filter({ module_slug: MODULE }, "-updated_date", 10),
        base44.entities.HumanVisionReportFramework.filter({ module_slug: MODULE }, "-updated_date", 10),
        base44.entities.CreativeAcademyExam.filter({ module_slug: MODULE }, "exam_slug", 50),
        base44.entities.CreativeAcademyCertification.filter({ module_slug: MODULE }, "-updated_date", 50),
        base44.entities.CreativeAcademyVersion.filter({ module_slug: MODULE }, "-updated_date", 50),
        base44.entities.CreativeAcademyDependency.filter({ dependency_module_slug: MODULE }, "module_slug", 100)
      ]);
      setData({ categories, records, reasoning, attention, heatmap, reports, exams, certifications, versions, dependencies });
    } catch (err) {
      setError(err.message || "Human Vision Brain could not load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const coverage = useMemo(() => {
    const approvedRecords = data.records.filter(record => record.approved && !record.rejected).length;
    return {
      categoryCount: data.categories.length,
      recordCount: data.records.length,
      approvedRecords,
      missingCategories: data.categories.filter(category => !category.record_count).length,
      coverageScore: data.categories.length ? Math.round((approvedRecords / data.categories.length) * 100) : 0,
      certified: data.certifications.some(item => item.status === "active")
    };
  }, [data]);

  return { ...data, coverage, loading, error, reload: load };
}