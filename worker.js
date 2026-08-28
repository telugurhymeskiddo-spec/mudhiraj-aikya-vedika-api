export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    // API health check
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Mudhiraj Aikya Vedika API is working!"
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    // Create user
    if (url.pathname === "/api/users" && request.method === "POST") {
      try {
        const body = await request.json();

        const id = body.id;
        const name = body.name;
        const district = body.district;
        const constituency = body.constituency;
        const photo_url = body.photo_url || "";
        const mobile = body.mobile || "";
        const created_at = body.created_at || Date.now();

        if (!id || !name || !district || !constituency) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "id, name, district and constituency are required"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        await env.MUDHIRAJ_DB.prepare(
          `INSERT INTO users
          (id, name, district, constituency, photo_url, created_at, mobile)
          VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            id,
            name,
            district,
            constituency,
            photo_url,
            created_at,
            mobile
          )
          .run();

        return new Response(
          JSON.stringify({
            success: true,
            message: "User saved successfully",
            id: id
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }

    // Get user by ID
    if (url.pathname === "/api/users" && request.method === "GET") {
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "id is required"
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }

      try {
        const user = await env.MUDHIRAJ_DB.prepare(
          `SELECT id, name, district, constituency, photo_url, created_at, mobile
           FROM users
           WHERE id = ?`
        )
          .bind(id)
          .first();

        return new Response(
          JSON.stringify({
            success: true,
            user: user || null
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Not Found"
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
};
