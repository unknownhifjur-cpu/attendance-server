import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(env.port, () =>
    console.log(`🚀 API on http://localhost:${env.port}/api`)
  );
}
main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});