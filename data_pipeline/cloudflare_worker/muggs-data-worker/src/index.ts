export interface Env {
  SUBMISSIONS: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { SUBMISSIONS } = env;
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // POST /save — Save a submission
    if (request.method === "POST" && url.pathname === "/save") {
      try {
        const data = await request.json();
        if (!data.username || !data.activity_id) {
          return new Response(JSON.stringify({ error: "Missing username or activity_id" }), {
            status: 400,
            headers: { ...cors, "Content-Type": "application/json" },
          });
        }

        const key = `${data.username}_${data.activity_id}_${Date.now()}`;
        await SUBMISSIONS.put(key, JSON.stringify(data));

        return new Response(JSON.stringify({ status: "ok", key }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.toString() }), {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    // GET /student/<username> — Retrieve all submissions for that user
    if (request.method === "GET" && url.pathname.startsWith("/student/")) {
      const username = url.pathname.split("/").pop()!;
      const list = await SUBMISSIONS.list({ prefix: `${username}_` });
      const results: any[] = [];

      for (const k of list.keys) {
        const v = await SUBMISSIONS.get(k.name);
        if (v) results.push(JSON.parse(v));
      }

      return new Response(JSON.stringify(results), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Default 404
    return new Response("Not Found", { status: 404, headers: cors });
  },
};
