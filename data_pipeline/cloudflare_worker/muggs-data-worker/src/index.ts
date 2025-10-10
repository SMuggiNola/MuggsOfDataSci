export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ====== 1️⃣ SAVE ENDPOINT ======
    if (url.pathname.endsWith("/save") && request.method === "POST") {
      try {
        const body = await request.json();
        const { username, activity_id, draft, responses, score, timestamp } = body;

        if (!username || !activity_id)
          return new Response("Missing username or activity_id", { status: 400 });

        // Separate keys for draft vs final
        const key = draft
          ? `draft:${username}:${activity_id}`
          : `final:${username}:${activity_id}:${Date.now()}`;

        const data = {
          username,
          activity_id,
          draft: !!draft,
          timestamp: timestamp || new Date().toISOString(),
          responses: responses || {},
          score: score || null,
        };

        await env.SUBMISSIONS.put(key, JSON.stringify(data));

        return new Response(
          JSON.stringify({ success: true, key, type: draft ? "draft" : "final" }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(`Error saving: ${err.message}`, { status: 500 });
      }
    }

    // ====== 2️⃣ LOAD ENDPOINT ======
    if (url.pathname.endsWith("/load") && request.method === "GET") {
      const username = url.searchParams.get("username");
      const activity_id = url.searchParams.get("activity_id");

      if (!username || !activity_id)
        return new Response("Missing username or activity_id", { status: 400 });

      const key = `draft:${username}:${activity_id}`;
      const stored = await env.SUBMISSIONS.get(key);

      if (!stored)
        return new Response(JSON.stringify({ found: false }), {
          headers: { "Content-Type": "application/json" },
          status: 404,
        });

      const data = JSON.parse(stored);
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ====== 3️⃣ DEFAULT ROUTE ======
    return new Response("✅ Muggs Data Worker active. Use /save or /load endpoints.", {
      status: 200,
    });
  },
};
