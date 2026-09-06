export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // =========================
    // CORS PREFLIGHT
    // =========================
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    // =========================
    // API HEALTH CHECK
    // =========================
    if (
      url.pathname === "/" &&
      request.method === "GET"
    ) {
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

    // =========================
    // ACTIVE USER ACTIVITY
    // =========================
    if (
      url.pathname === "/api/users/activity" &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json();
        const id = body.id;

        if (!id) {
          return new Response(
            JSON.stringify({ success: false, error: "id is required" }),
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
          `CREATE TABLE IF NOT EXISTS user_activity (
             user_id TEXT PRIMARY KEY,
             last_active INTEGER NOT NULL
           )`
        ).run();

        await env.MUDHIRAJ_DB.prepare(
          `INSERT INTO user_activity (user_id, last_active)
           VALUES (?, ?)
           ON CONFLICT(user_id)
           DO UPDATE SET last_active = excluded.last_active`
        ).bind(id, Date.now()).run();

        return new Response(
          JSON.stringify({ success: true }),
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

    // =========================
    // ACTIVE USERS COUNT
    // =========================
    if (
      url.pathname === "/api/admin/active-users" &&
      request.method === "GET"
    ) {
      try {
        await env.MUDHIRAJ_DB.prepare(
          `CREATE TABLE IF NOT EXISTS user_activity (
             user_id TEXT PRIMARY KEY,
             last_active INTEGER NOT NULL
           )`
        ).run();

        const result = await env.MUDHIRAJ_DB.prepare(
          `SELECT COUNT(*) AS active_users
           FROM user_activity
           WHERE last_active >= ?`
        ).bind(Date.now() - (24 * 60 * 60 * 1000)).first();

        return new Response(
          JSON.stringify({
            success: true,
            active_users: result?.active_users || 0
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

    // =========================
    // ADMIN DASHBOARD STATS
    // =========================
    if (
      url.pathname === "/api/admin/dashboard-stats" &&
      request.method === "GET"
    ) {
      try {
        const usersResult = await env.MUDHIRAJ_DB.prepare(
          "SELECT COUNT(*) AS total_users FROM users"
        ).first();

        const templatesResult = await env.MUDHIRAJ_DB.prepare(
          'SELECT COUNT(*) AS total_templates FROM templates WHERE status = "published"'
        ).first();

        return new Response(
          JSON.stringify({
            success: true,
            total_users: usersResult?.total_users || 0,
            total_templates: templatesResult?.total_templates || 0
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

    // =========================
    
// TOTAL DOWNLOADS
if (
  url.pathname === "/api/templates/download" &&
  request.method === "POST"
) {
  try {
    const body = await request.json();
    const id = body.id;
    const user_id = body.user_id || "";

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "id is required" }),
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
      `CREATE TABLE IF NOT EXISTS template_downloads (
         id TEXT PRIMARY KEY,
         template_id TEXT NOT NULL,
         user_id TEXT,
         district TEXT,
         downloaded_at INTEGER NOT NULL
       )`
    ).run();

    let district = "";

    if (user_id) {
      const user = await env.MUDHIRAJ_DB.prepare(
        "SELECT district FROM users WHERE id = ?"
      ).bind(user_id).first();

      district = user?.district || "";
    }

    await env.MUDHIRAJ_DB.prepare(
      `INSERT INTO template_downloads
       (id, template_id, user_id, district, downloaded_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      id,
      user_id,
      district,
      Date.now()
    ).run();

    return new Response(
      JSON.stringify({ success: true }),
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

// DASHBOARD DOWNLOAD COUNT
if (
  url.pathname === "/api/admin/downloads" &&
  request.method === "GET"
) {
  try {
    await env.MUDHIRAJ_DB.prepare(
      `CREATE TABLE IF NOT EXISTS template_downloads (
         id TEXT PRIMARY KEY,
         template_id TEXT NOT NULL,
         downloaded_at INTEGER NOT NULL
       )`
    ).run();

    const result = await env.MUDHIRAJ_DB.prepare(
      "SELECT COUNT(*) AS downloads FROM template_downloads"
    ).first();

    return new Response(
      JSON.stringify({
        success: true,
        downloads: result?.downloads || 0
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

// CREATE USER
    // =========================
    if (
      url.pathname === "/api/users" &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json();

        const id = body.id;
        const name = body.name;
        const district = body.district;
        const constituency = body.constituency;
        const photo_url = body.photo_url || "";
        const mobile = body.mobile || "";
        const created_at =
          body.created_at || Date.now();

        if (
          !id ||
          !name ||
          !district ||
          !constituency
        ) {
          return new Response(
            JSON.stringify({
              success: false,
              error:
                "id, name, district and constituency are required"
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
          (
            id,
            name,
            district,
            constituency,
            photo_url,
            created_at,
            mobile
          )
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

    // =========================
    // GET USER BY ID
    // =========================
    if (
      url.pathname === "/api/users" &&
      request.method === "GET"
    ) {
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
        const user =
          await env.MUDHIRAJ_DB.prepare(
            `SELECT
              id,
              name,
              district,
              constituency,
              photo_url,
              created_at,
              mobile
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

    // =========================
    // UPLOAD PROFILE PHOTO
    // =========================
    if (
      url.pathname === "/api/users/photo" &&
      request.method === "POST"
    ) {
      try {
        const id =
          url.searchParams.get("id");

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

        const contentType =
          request.headers.get("Content-Type") ||
          "image/jpeg";

        const photoData =
          await request.arrayBuffer();

        if (!photoData.byteLength) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "photo data is empty"
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

        const key =
          "profile/" + id;

        await env.MUDHIRAJ_PHOTOS.put(
          key,
          photoData,
          {
            httpMetadata: {
              contentType: contentType
            }
          }
        );

        const photoUrl =
          url.origin +
          "/api/users/photo?id=" +
          encodeURIComponent(id);

        await env.MUDHIRAJ_DB.prepare(
          "UPDATE users SET photo_url = ? WHERE id = ?"
        )
          .bind(photoUrl, id)
          .run();

        return new Response(
          JSON.stringify({
            success: true,
            message:
              "Photo uploaded successfully",
            photo_url: photoUrl
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

    // =========================
    // GET PROFILE PHOTO
    // =========================
    if (
      url.pathname === "/api/users/photo" &&
      request.method === "GET"
    ) {
      try {
        const id =
          url.searchParams.get("id");

        if (!id) {
          return new Response(
            "id is required",
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        const key =
          "profile/" + id;

        const photo =
          await env.MUDHIRAJ_PHOTOS.get(
            key,
            "arrayBuffer"
          );

        if (!photo) {
          return new Response(
            "Photo not found",
            {
              status: 404,
              headers: corsHeaders
            }
          );
        }

        const metadata =
          await env.MUDHIRAJ_PHOTOS.getWithMetadata(
            key,
            "arrayBuffer"
          );

        return new Response(
          photo,
          {
            headers: {
              "Content-Type":
                (
                  metadata.metadata &&
                  metadata.metadata.contentType
                ) ||
                "image/jpeg",

              "Cache-Control":
                "public, max-age=86400",

              ...corsHeaders
            }
          }
        );
      } catch (error) {
        return new Response(
          "Photo error",
          {
            status: 500,
            headers: corsHeaders
          }
        );
      }
    }

    // =========================
    // ADMIN: GET ALL USERS
    // =========================
    if (
      url.pathname === "/api/admin/users" &&
      request.method === "GET"
    ) {
      try {
        const result =
          await env.MUDHIRAJ_DB.prepare(
            `SELECT
              id,
              name,
              district,
              constituency,
              photo_url,
              created_at,
              mobile
             FROM users
             ORDER BY created_at DESC`
          ).all();

        return new Response(
          JSON.stringify({
            success: true,
            users: result.results || []
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


    // Template stats: Get stats
    if (url.pathname === "/api/templates/stats" && request.method === "GET") {
      try {
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

        const result = await env.MUDHIRAJ_DB.prepare(
          "SELECT views, shares FROM template_stats WHERE template_id = ?"
        )
          .bind(id)
          .first();

        return new Response(
          JSON.stringify({
            success: true,
            views: result ? result.views : 0,
            shares: result ? result.shares : 0
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

    // Template stats: Increment views
    if (url.pathname === "/api/templates/view" && request.method === "POST") {
      try {
        const id = url.searchParams.get("id");
        if (!id) return new Response(JSON.stringify({success:false,error:"id is required"}), {status:400,headers:{"Content-Type":"application/json",...corsHeaders}});
        await env.MUDHIRAJ_DB.prepare("INSERT INTO template_stats (template_id, views, shares) VALUES (?, 1, 0) ON CONFLICT(template_id) DO UPDATE SET views = views + 1").bind(id).run();
        const result = await env.MUDHIRAJ_DB.prepare("SELECT views, shares FROM template_stats WHERE template_id = ?").bind(id).first();
        return new Response(JSON.stringify({success:true,views:result ? result.views : 0,shares:result ? result.shares : 0}), {headers:{"Content-Type":"application/json",...corsHeaders}});
      } catch (error) {
        return new Response(JSON.stringify({success:false,error:error.message}), {status:500,headers:{"Content-Type":"application/json",...corsHeaders}});
      }
    }

    // Template stats: Increment shares
    if (url.pathname === "/api/templates/share" && request.method === "POST") {
      try {
        const id = url.searchParams.get("id");
        if (!id) return new Response(JSON.stringify({success:false,error:"id is required"}), {status:400,headers:{"Content-Type":"application/json",...corsHeaders}});
        await env.MUDHIRAJ_DB.prepare("INSERT INTO template_stats (template_id, views, shares) VALUES (?, 0, 1) ON CONFLICT(template_id) DO UPDATE SET shares = shares + 1").bind(id).run();
        const result = await env.MUDHIRAJ_DB.prepare("SELECT views, shares FROM template_stats WHERE template_id = ?").bind(id).first();
        return new Response(JSON.stringify({success:true,views:result ? result.views : 0,shares:result ? result.shares : 0}), {headers:{"Content-Type":"application/json",...corsHeaders}});
      } catch (error) {
        return new Response(JSON.stringify({success:false,error:error.message}), {status:500,headers:{"Content-Type":"application/json",...corsHeaders}});
      }
    }

    // =========================
    // =========================
    // =========================
    // ADMIN: DISTRICT DASHBOARD
    // =========================
    if (
      url.pathname === "/api/admin/district-dashboard" &&
      request.method === "GET"
    ) {
      try {
        const result = await env.MUDHIRAJ_DB.prepare(
          `SELECT
             u.district AS district,
             COUNT(DISTINCT u.id) AS members,
             COUNT(DISTINCT CASE
               WHEN ua.last_active >= ? THEN u.id
             END) AS active,
             COUNT(DISTINCT td.template_id) AS templates_used,
             COUNT(td.id) AS downloads
           FROM users u
           LEFT JOIN user_activity ua
             ON ua.user_id = u.id
           LEFT JOIN template_downloads td
             ON td.district = u.district
           GROUP BY u.district
           ORDER BY u.district`
        ).bind(Date.now() - (24 * 60 * 60 * 1000)).all();

        return new Response(
          JSON.stringify({
            success: true,
            districts: result.results || []
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

        // TEMPLATES: PUBLISH
    // =========================
    if (url.pathname === "/api/templates" && request.method === "POST") {
      try {
        const body = await request.json();

        const id = body.id;
        const category = body.category;
        const image_url = body.image_url;
        const photo_shape = body.photo_shape || "RECTANGLE";
        const photo_x = body.photo_x ?? 0.20;
        const photo_y = body.photo_y ?? 0.25;
        const photo_width = body.photo_width ?? 0.60;
        const photo_height = body.photo_height ?? 0.40;
        const name_x = body.name_x ?? 0.20;
        const name_y = body.name_y ?? 0.72;
        const name_width = body.name_width ?? 0.60;
        const name_height = body.name_height ?? 0.12;
        const status = body.status || "published";
        const created_at = body.created_at || Date.now();

        if (!id || !category || !image_url) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "id, category and image_url are required"
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
          `INSERT OR REPLACE INTO templates
           (id, category, image_url, photo_shape,
            photo_x, photo_y, photo_width, photo_height,
            name_x, name_y, name_width, name_height,
            status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            id,
            category,
            image_url,
            photo_shape,
            photo_x,
            photo_y,
            photo_width,
            photo_height,
            name_x,
            name_y,
            name_width,
            name_height,
            status,
            created_at
          )
          .run();

        return new Response(
          JSON.stringify({
            success: true,
            template_id: id,
            share_url: url.origin + "/template?id=" + encodeURIComponent(id)
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

    // =========================
    // TEMPLATES: GET PUBLISHED
    // =========================
    if (url.pathname === "/api/templates" && request.method === "GET") {
      try {
        const status = url.searchParams.get("status") || "published";

        const result = await env.MUDHIRAJ_DB.prepare(
          `SELECT id, category, image_url, photo_shape,
                  photo_x, photo_y, photo_width, photo_height,
                  name_x, name_y, name_width, name_height,
                  status, created_at
           FROM templates
           WHERE status = ?
           ORDER BY created_at DESC`
        )
          .bind(status)
          .all();

        return new Response(
          JSON.stringify({
            success: true,
            templates: result.results || []
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

    // =========================
    // PUBLIC TEMPLATE LINK
    // =========================
    if (url.pathname === "/template" && request.method === "GET") {
      try {
        const id = url.searchParams.get("id");

        if (!id) {
          return new Response("Template id is required", {
            status: 400,
            headers: corsHeaders
          });
        }

        const template = await env.MUDHIRAJ_DB.prepare(
          `SELECT id, category, image_url
           FROM templates
           WHERE id = ? AND status = "published"`
        )
          .bind(id)
          .first();

        if (!template) {
          return new Response("Template not found", {
            status: 404,
            headers: corsHeaders
          });
        }

        const imageUrl = template.image_url;

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ముదిరాజ్ ఐక్య వేదిక - ${template.category}</title>
<meta property="og:title" content="ముదిరాజ్ ఐక్య వేదిక Template">
<meta property="og:image" content="${imageUrl}">
<meta property="og:type" content="website">
</head>
<body style="margin:0;background:#f5f5f5;text-align:center;font-family:Arial,sans-serif">
<h2>ముదిరాజ్ ఐక్య వేదిక</h2>
<p>${template.category}</p>
<img src="${imageUrl}" style="max-width:100%;height:auto">
</body>
</html>`;

        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=UTF-8",
            ...corsHeaders
          }
        });
      } catch (error) {
        return new Response("Template error", {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Template image upload / public image API
    if (url.pathname === "/api/templates/image" && request.method === "POST") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ success: false, error: "Missing template id" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const imageData = await request.arrayBuffer();
      if (!imageData.byteLength) {
        return new Response(JSON.stringify({ success: false, error: "Empty image" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      await env.MUDHIRAJ_PHOTOS.put("templates/" + id, imageData, {
        httpMetadata: { contentType: request.headers.get("Content-Type") || "image/jpeg" }
      });

      return new Response(JSON.stringify({
        success: true,
        image_url: url.origin + "/api/templates/image?id=" + encodeURIComponent(id)
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (url.pathname === "/api/templates/image" && request.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response("Missing template id", { status: 400, headers: corsHeaders });
      }

      const object = await env.MUDHIRAJ_PHOTOS.get("templates/" + id);
      if (!object) {
        return new Response("Image not found", { status: 404, headers: corsHeaders });
      }

      const headers = new Headers(corsHeaders);
      object.writeHttpMetadata(headers);
      headers.set("Cache-Control", "public, max-age=31536000");

      return new Response(object.body, { headers });
    }

    // NOT FOUND
    // =========================
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
