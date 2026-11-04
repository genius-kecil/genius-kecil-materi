
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Endpoint download
    if (url.pathname === "/download") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", { status: 405 });
      }

      const id = url.searchParams.get("id");
      const type = url.searchParams.get("type") || "file";

      // Validasi ID Google Drive
      if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        return new Response("ID file tidak valid", { status: 400 });
      }

      let source;

      if (type === "doc") {
        source = `https://docs.google.com/document/d/${id}/export?format=pdf`;
      } else if (type === "slides") {
        source = `https://docs.google.com/presentation/d/${id}/export/pdf`;
      } else if (type === "sheet") {
        source = `https://docs.google.com/spreadsheets/d/${id}/export?format=pdf`;
      } else {
        source = `https://drive.google.com/uc?export=download&id=${id}`;
      }

      try {
        const upstream = await fetch(source, {
          method: request.method,
          redirect: "follow"
        });

        if (!upstream.ok) {
          return new Response("File tidak dapat diunduh dari Google Drive", {
            status: upstream.status
          });
        }

        const contentType =
          upstream.headers.get("Content-Type") || "application/octet-stream";

        // Tolak halaman HTML, misalnya halaman login atau konfirmasi Drive.
        if (contentType.includes("text/html")) {
          return new Response(
            "Google Drive tidak memberikan file secara langsung. Periksa izin akses file.",
            { status: 502 }
          );
        }

        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set(
          "Content-Disposition",
          `attachment; filename="materi-genius-kecil"`
        );
        headers.set("Cache-Control", "private, max-age=0");
        headers.set("X-Content-Type-Options", "nosniff");

        return new Response(
          request.method === "HEAD" ? null : upstream.body,
          { status: 200, headers }
        );
      } catch (error) {
        return new Response("Gagal mengambil file dari Google Drive", {
          status: 502
        });
      }
    }

    // Selain download, teruskan ke aset website.
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Asset binding ASSETS belum tersedia", {
      status: 500
    });
  }
};
