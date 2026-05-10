import { handle } from "@hono/node-server/vercel";
import { app } from "../server/app.js";

export const config = {
  maxDuration: 300,
  api: {
    bodyParser: false
  }
};

export default handle(app);
