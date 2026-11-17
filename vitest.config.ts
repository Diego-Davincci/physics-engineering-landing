/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    // Unit tests live next to the code; tests/ holds the Playwright specs.
    include: ["src/**/*.test.ts"],
  },
});
