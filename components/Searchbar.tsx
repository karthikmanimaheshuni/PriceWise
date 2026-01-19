"use client";

import { scrapeAndStoreProduct } from "@/lib/actions";
import { FormEvent, useState } from "react";
import { normalizeUrl } from "@/lib/utils/normalizeUrl";

const isValidAmazonLink = (url: string): boolean => {
  try {
    const { hostname, pathname } = new URL(url);
    return hostname.includes("amazon.") && pathname.includes("/dp/");
  } catch {
    return false;
  }
};

const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedUrl = normalizeUrl(searchPrompt.trim());

    if (!isValidAmazonLink(normalizedUrl)) {
      setError("Please enter a valid Amazon product URL");
      return;
    }

    try {
      setIsLoading(true);
      await scrapeAndStoreProduct(normalizedUrl);
    } catch (err) {
      setError("Failed to scrape product. Try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="flex flex-wrap gap-4 mt-12" onSubmit={handleSubmit}>
      <input
        type="text"
        value={searchPrompt}
        onChange={(e) => setSearchPrompt(e.target.value)}
        placeholder="Enter Amazon product link"
        className="searchbar-input"
      />

      <button
        type="submit"
        className="searchbar-btn"
        disabled={isLoading || searchPrompt === ""}
      >
        {isLoading ? "Searching..." : "Search"}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
};

export default Searchbar;
