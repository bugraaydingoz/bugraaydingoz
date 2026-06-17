module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      settings: {
        chromeFlags: "--headless=new",
        onlyCategories: ["performance", "seo"],
      },
      staticDistDir: "./dist",
      url: ["http://localhost/"],
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 1 }],
      },
    },
    upload: {
      outputDir: "./.lighthouseci",
      target: "filesystem",
    },
  },
};
