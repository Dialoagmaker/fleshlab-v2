export const CREATIVE_ACADEMY_MODULES = [
  ["human-vision", "Human Vision"],
  ["photography", "Photography"],
  ["lighting", "Lighting"],
  ["composition", "Composition"],
  ["typography", "Typography"],
  ["color-theory", "Color Theory"],
  ["visual-storytelling", "Visual Storytelling"],
  ["advertising", "Advertising"],
  ["poster-design", "Poster Design"],
  ["entertainment-branding", "Entertainment Branding"],
  ["marketing-psychology", "Marketing Psychology"],
  ["film-language", "Film Language"],
  ["world-knowledge", "World Knowledge"],
  ["visual-culture", "Visual Culture"],
  ["brand-dna", "Brand DNA"],
  ["art-direction", "Art Direction"],
  ["graphic-design", "Graphic Design"],
  ["image-critique", "Image Critique"],
  ["creative-critique", "Creative Critique"],
  ["creative-decision-making", "Creative Decision Making"]
].map(([slug, title]) => ({ slug, title }));

export const CREATIVE_ACADEMY_SYSTEMS = [
  "Knowledge Modules",
  "Lesson Management",
  "Reference Libraries",
  "Rule Libraries",
  "Example Libraries",
  "Training Progress",
  "Examinations",
  "Certification",
  "Version History",
  "Quality Scores",
  "Knowledge Dependencies"
];

export const REQUIRED_RENDERING_MODULES = CREATIVE_ACADEMY_MODULES.map(module => module.slug);

export const CREATIVE_ACADEMY_CAPABILITY_ALIASES = {
  lighting: ["color-lighting"],
  "color-theory": ["color-lighting"],
  advertising: ["advertising-psychology"],
  "marketing-psychology": ["advertising-psychology"],
  "poster-design": ["composition", "typography", "art-direction", "visual-systems"],
  "entertainment-branding": ["visual-systems", "art-direction"],
  "film-language": ["photography", "composition", "visual-storytelling", "visual-genre"],
  "world-knowledge": ["creative-memory", "studio-operating-system", "creative-benchmark-suite"]
};

export function lessonZeroModuleRecord(module) {
  return {
    slug: module.slug,
    title: module.title,
    status: "missing",
    installed: false,
    certified: false,
    training_progress: 0,
    version: "0.0.0",
    known_scope: "No creative knowledge installed. This module is an empty training container created by Lesson Zero.",
    exposed_knowledge_json: JSON.stringify({ knows: [], claims_allowed: false }),
    missing_requirements_json: JSON.stringify({ required_lessons: [], exams: [], certification: "missing" }),
    dependency_slugs: [],
    quality_score: 0
  };
}

function isCertified(record) {
  return record?.status === "certified" && record?.installed === true && record?.certified === true;
}

function resolveCapability(module, records = []) {
  const direct = records.find(record => record.slug === module.slug);
  if (isCertified(direct)) return { ...direct, required_slug: module.slug, satisfied_by_slug: direct.slug, mapping_type: "direct" };

  const aliasSlugs = CREATIVE_ACADEMY_CAPABILITY_ALIASES[module.slug] || [];
  const certifiedAliases = aliasSlugs
    .map(slug => records.find(record => record.slug === slug))
    .filter(isCertified);

  if (certifiedAliases.length) {
    const primary = certifiedAliases[0];
    return {
      ...(direct || lessonZeroModuleRecord(module)),
      status: "certified",
      installed: true,
      certified: true,
      training_progress: 100,
      quality_score: Math.min(...certifiedAliases.map(record => Number(record.quality_score || 90))),
      version: primary.version,
      required_slug: module.slug,
      satisfied_by_slug: primary.slug,
      satisfied_by_title: primary.title,
      mapping_type: "certified_capability_alias",
      known_scope: `Satisfied by certified capability ${primary.title}: ${primary.known_scope || "certified scope available"}`,
      exposed_knowledge_json: JSON.stringify({
        required_slug: module.slug,
        satisfied_by: certifiedAliases.map(record => ({ slug: record.slug, title: record.title, version: record.version, quality_score: record.quality_score })),
        claims_allowed: true,
        mapping_type: "certified_capability_alias"
      })
    };
  }

  return direct || lessonZeroModuleRecord(module);
}

export function normalizeAcademyModules(records = []) {
  return CREATIVE_ACADEMY_MODULES.map(module => resolveCapability(module, records));
}

export function evaluateRenderingReadiness(records = []) {
  const modules = normalizeAcademyModules(records);
  const missing = modules.filter(module => REQUIRED_RENDERING_MODULES.includes(module.slug) && module.status !== "certified");
  const satisfied = modules.filter(module => REQUIRED_RENDERING_MODULES.includes(module.slug) && module.status === "certified");
  return {
    ready: missing.length === 0,
    message: missing.length === 0 ? "Certified knowledge available." : "KNOWLEDGE NOT INSTALLED",
    missing,
    satisfied,
    required: REQUIRED_RENDERING_MODULES
  };
}