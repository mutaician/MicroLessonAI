const required = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  openaiApiKey: () => required("OPENAI_API_KEY"),
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
  runwayImageModel: process.env.RUNWAY_IMAGE_MODEL ?? "gpt_image_2",
  runwayApiSecret: () => required("RUNWAYML_API_SECRET"),
  supabaseUrl: () => required("SUPABASE_URL"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  port: Number(process.env.PORT ?? 8787)
};
