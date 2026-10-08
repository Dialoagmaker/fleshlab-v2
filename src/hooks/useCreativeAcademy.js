import { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CREATIVE_ACADEMY_MODULES, evaluateRenderingReadiness, lessonZeroModuleRecord, normalizeAcademyModules } from "@/lib/aiMediaStudio/creativeAcademy";

export function useCreativeAcademy() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await base44.entities.CreativeAcademyModule.list("slug", 200);
      setRecords(next || []);
    } catch (err) {
      setError(err.message || "Creative Academy could not load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const installLessonZeroPlaceholders = useCallback(async () => {
    setInstalling(true);
    setError("");
    try {
      const existing = await base44.entities.CreativeAcademyModule.list("slug", 200);
      const existingSlugs = new Set((existing || []).map(item => item.slug));
      const missing = CREATIVE_ACADEMY_MODULES.filter(module => !existingSlugs.has(module.slug)).map(lessonZeroModuleRecord);
      if (missing.length) await base44.entities.CreativeAcademyModule.bulkCreate(missing);
      await load();
    } catch (err) {
      setError(err.message || "Lesson Zero placeholders could not be installed.");
    } finally {
      setInstalling(false);
    }
  }, [load]);

  const modules = useMemo(() => normalizeAcademyModules(records), [records]);
  const renderingGate = useMemo(() => evaluateRenderingReadiness(records), [records]);

  return { modules, records, loading, installing, error, renderingGate, reload: load, installLessonZeroPlaceholders };
}