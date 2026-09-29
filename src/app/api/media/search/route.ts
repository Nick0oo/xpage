import { NextResponse } from "next/server";
import { pexelsRequest, pexelsMediaSchema } from "@/lib/media/pexels";

export const runtime = "nodejs";

type PexelsPhoto = { id: number; url: string; photographer: string; photographer_url: string; width: number; height: number; alt: string; src: { medium: string } };
type PexelsVideo = { id: number; url: string; user: { name: string; url: string }; width: number; height: number; duration: number; image: string; video_files: { width: number | null; quality: string; file_type: string; link: string }[] };

function pexelsPageUrl(url: string) {
  const parsed = new URL(url);
  return parsed.protocol === "https:" && parsed.hostname === "www.pexels.com";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim().slice(0, 120) ?? "";
  const type = params.get("type") === "video" ? "video" : "image";
  const page = Math.min(100, Math.max(1, Number(params.get("page") ?? 1) || 1));
  if (query.length < 2) return NextResponse.json({ error: "Escribe al menos dos caracteres para buscar.", code: "invalid_query" }, { status: 400 });
  try {
    const endpoint = new URL(type === "image" ? "https://api.pexels.com/v1/search" : "https://api.pexels.com/v1/videos/search");
    endpoint.searchParams.set("query", query);
    endpoint.searchParams.set("page", String(page));
    endpoint.searchParams.set("per_page", "12");
    endpoint.searchParams.set("orientation", "landscape");
    const result = type === "image"
      ? await pexelsRequest<{ photos?: PexelsPhoto[] }>(endpoint)
      : await pexelsRequest<{ videos?: PexelsVideo[] }>(endpoint);
    const items = type === "image"
      ? (result as { photos?: PexelsPhoto[] }).photos?.flatMap((photo) => pexelsPageUrl(photo.url) && pexelsPageUrl(photo.photographer_url) && photo.src.medium.startsWith("https://images.pexels.com/") ? [{
          id: photo.id, type, previewUrl: photo.src.medium, sourceUrl: photo.url, creditUrl: photo.photographer_url,
          author: photo.photographer, altText: photo.alt || `Foto de ${photo.photographer}`, width: photo.width, height: photo.height, durationSeconds: null,
        }] : [])
      : (result as { videos?: PexelsVideo[] }).videos?.flatMap((video) => {
          const videoFile = video.video_files.find((file) => file.file_type === "video/mp4" && file.link.startsWith("https://videos.pexels.com/"));
          if (!videoFile || !pexelsPageUrl(video.url) || !pexelsPageUrl(video.user.url) || !video.image.startsWith("https://images.pexels.com/")) return [];
          return [{
            id: video.id, type, previewUrl: video.image, sourceUrl: video.url, creditUrl: video.user.url, author: video.user.name,
            altText: `Video de ${video.user.name}`, width: videoFile.width ?? video.width, height: video.height, durationSeconds: video.duration,
          }];
        });
    const parsed = pexelsMediaSchema.array().safeParse(items ?? []);
    if (!parsed.success) throw new Error("invalid_provider_data");
    return NextResponse.json({ items: parsed.data, provider: "Pexels", page, hasMore: (items?.length ?? 0) === 12 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "search_failed";
    if (code === "missing_api_key") return NextResponse.json({ error: "Configura PEXELS_API_KEY en .env.local para buscar fotos y vídeos.", code }, { status: 503 });
    if (code === "rate_limited") return NextResponse.json({ error: "Pexels alcanzó su límite temporal. Espera antes de volver a buscar.", code }, { status: 429 });
    return NextResponse.json({ error: "Pexels no está disponible ahora. Inténtalo de nuevo en un momento.", code: "provider_unavailable" }, { status: 502 });
  }
}
