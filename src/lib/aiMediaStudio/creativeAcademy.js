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

export function normalizeAcademyModules(records = []) {
  return CREATIVE_ACADEMY_MODULES.map(module => {
    const found = records.find(record => record.slug === module.slug);
    return found || lessonZeroModuleRecord(module);
  });
}

export function evaluateRenderingReadiness(records = []) {
  const modules = normalizeAcademyModules(records);
  const missing = modules.filter(module => REQUIRED_RENDERING_MODULES.includes(module.slug) && module.status !== "certified");
  return {
    ready: missing.length === 0,
    message: missing.length === 0 ? "Certified knowledge available." : "KNOWLEDGE NOT INSTALLED",
    missing,
    required: REQUIRED_RENDERING_MODULES
  };
}