import { app } from "./_lib/app.js";

export default {
  fetch(request: Request) {
    return app.fetch(request);
  }
};
