import axios from "axios";
import * as cheerio from "cheerio";
import { extractCurrency, extractDescription } from "../utils";

const AMAZON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  "Accept-Language": "en-IN,en;q=0.9",
};

function extractPriceSafe($: cheerio.CheerioAPI): number | null {
  const selectors = [
    ".a-price .a-offscreen",                 // ✅ MOST RELIABLE
    "#price_inside_buybox",
    "#priceblock_dealprice",
    "#priceblock_ourprice",
    "#priceblock_saleprice",
    ".reinventPricePriceToPayMargin span",
    ".a-button-selected .a-price .a-offscreen",
    "[data-a-color='price'] .a-offscreen",
  ];

  for (const selector of selectors) {
    const el = $(selector).first();
    if (!el || !el.text()) continue;

    const raw = el.text().trim();
    const cleaned = raw.replace(/[₹,]/g, "").replace(/[^\d.]/g, "");
    const price = parseFloat(cleaned);

    if (!isNaN(price) && price > 0) {
      return price;
    }
  }

  return null;
}

function extractImagesSafe($: cheerio.CheerioAPI): string[] {
  try {
    const data =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image");

    if (!data) return [];

    return Object.keys(JSON.parse(data));
  } catch {
    return [];
  }
}

export async function scrapeAmazonProduct(url: string) {
  if (!url) return null;

  const username = process.env.BRIGHT_DATA_USERNAME!;
  const password = process.env.BRIGHT_DATA_PASSWORD!;
  const session_id = Math.floor(Math.random() * 1_000_000);

  const proxyConfig = {
    proxy: {
      host: "brd.superproxy.io",
      port: 33335,
      auth: {
        username: `${username}-session-${session_id}`,
        password,
      },
    },
    headers: AMAZON_HEADERS,
    timeout: 25_000,
  };

  try {
    const response = await axios.get(url, proxyConfig);
    const $ = cheerio.load(response.data);

    // ❌ CAPTCHA / BLOCK detection
    if (
      $("title").text().toLowerCase().includes("robot") ||
      $("#captchacharacters").length > 0
    ) {
      throw new Error("Amazon CAPTCHA triggered");
    }

    const title = $("#productTitle").text().trim();
    const currentPrice = extractPriceSafe($);
    const originalPrice =
      extractPriceSafe($) || currentPrice;

    const currency = extractCurrency($(".a-price-symbol"));
    const description = extractDescription($);
    const images = extractImagesSafe($);

    if (!title || !currentPrice) {
      console.warn("⚠ Partial scrape:", { title, currentPrice, url });
    }

    return {
      url,
      title,
      currency: currency || "₹",
      image: images[0] || "",
      currentPrice,
      originalPrice,
      discountRate: null,
      category: null,
      reviewsCount: null,
      stars: null,
      description,
      priceHistory: [],
      isOutOfStock: currentPrice === null,
      lowestPrice: currentPrice,
      highestPrice: currentPrice,
      averagePrice: currentPrice,
    };
  } catch (error: any) {
    console.error("❌ Scrape failed:", error.message);
    return null; // ❗ NEVER throw → prevents 500s
  }
}
