import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/config";
import { allSeoLocationSlugs } from "@/lib/seo-locations";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  const now = new Date();

  const staticRoutes = [
    "",
    "/vans",
    "/van-hire",
    "/faq",
    "/contact",
    "/terms",
    "/privacy",
    "/cookies",
    "/promotions",
    "/driver-requirements",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const locationRoutes = allSeoLocationSlugs().map((slug) => ({
    url: `${base}/van-hire/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...locationRoutes];
}
