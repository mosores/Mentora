export type Locale = "en" | "es";

type Copy = {
  nav: {
    product: string;
    study: string;
    admin: string;
    start: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    body: string;
    primary: string;
    secondary: string;
  };
  pillars: string[];
  dashboard: {
    hello: string;
    headline: string;
    create: string;
    upload: string;
    continue: string;
    progress: string;
    next: string;
  };
  onboarding: {
    title: string;
    note: string;
    summary: string;
  };
  tutor: {
    title: string;
    placeholder: string;
    response: string;
    actions: string[];
  };
  admin: {
    title: string;
    body: string;
  };
};

export const copy: Record<Locale, Copy> = {
  en: {
    nav: {
      product: "Product",
      study: "Study app",
      admin: "Admin",
      start: "Start free"
    },
    hero: {
      eyebrow: "Built for university life in Peru and Latin America",
      title: "Mentora",
      subtitle: "Learn your way.",
      body: "Upload class material and get a personal AI tutor that explains, summarizes, quizzes, and helps you prepare for exams in the way you learn best.",
      primary: "Start studying",
      secondary: "For institutions"
    },
    pillars: ["Private study spaces", "Source-based answers", "Bilingual learning", "Cost-controlled AI"],
    dashboard: {
      hello: "Good afternoon, Valeria",
      headline: "Your study week is already taking shape.",
      create: "New study space",
      upload: "Upload material",
      continue: "Continue studying",
      progress: "Progress snapshot",
      next: "Suggested next actions"
    },
    onboarding: {
      title: "Help us adapt your study experience",
      note: "This is not a test or diagnosis. Mentora only uses practical preferences to shape explanations.",
      summary: "We will start with short explanations, step-by-step examples, and practice questions. You can change this anytime."
    },
    tutor: {
      title: "AI Tutor",
      placeholder: "Ask about your uploaded material...",
      response: "Here is a source-grounded explanation in a clearer sequence. First, identify the concept, then connect it to your lecture example, and finally practice with one short question.",
      actions: ["Simpler", "Example", "Quiz me", "Flashcards", "Summary", "Study plan"]
    },
    admin: {
      title: "Institution-ready controls",
      body: "Provider permissions, usage limits, audit logs, and tenant policies are designed into the foundation."
    }
  },
  es: {
    nav: {
      product: "Producto",
      study: "App de estudio",
      admin: "Admin",
      start: "Empezar gratis"
    },
    hero: {
      eyebrow: "Creado para la vida universitaria en Peru y Latinoamerica",
      title: "Mentora",
      subtitle: "Aprende a tu manera.",
      body: "Sube tus materiales de clase y recibe una tutora IA personal que explica, resume, pregunta y te ayuda a prepararte para examenes segun tu forma de estudiar.",
      primary: "Empezar a estudiar",
      secondary: "Para instituciones"
    },
    pillars: ["Espacios privados", "Respuestas con fuentes", "Aprendizaje bilingue", "IA con control de costos"],
    dashboard: {
      hello: "Buenas tardes, Valeria",
      headline: "Tu semana de estudio ya esta tomando forma.",
      create: "Nuevo espacio",
      upload: "Subir material",
      continue: "Continuar estudiando",
      progress: "Resumen de progreso",
      next: "Siguientes acciones"
    },
    onboarding: {
      title: "Ayudanos a adaptar tu experiencia de estudio",
      note: "No es un test ni diagnostico. Mentora solo usa preferencias practicas para ajustar las explicaciones.",
      summary: "Empezaremos con explicaciones breves, ejemplos paso a paso y preguntas de practica. Puedes cambiarlo cuando quieras."
    },
    tutor: {
      title: "Tutora IA",
      placeholder: "Pregunta sobre tus materiales subidos...",
      response: "Aqui tienes una explicacion basada en fuentes y ordenada con mas claridad. Primero identifica el concepto, luego conectalo con el ejemplo de clase y finalmente practica con una pregunta breve.",
      actions: ["Mas simple", "Ejemplo", "Preguntame", "Tarjetas", "Resumen", "Plan"]
    },
    admin: {
      title: "Controles listos para instituciones",
      body: "Permisos de proveedores, limites de uso, auditoria y politicas por tenant estan considerados desde la base."
    }
  }
};
