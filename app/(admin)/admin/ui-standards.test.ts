import { readFileSync } from "fs";
import { resolve } from "path";

const ADMIN_DIR = resolve(__dirname);

function readPage(page: string): string {
  return readFileSync(resolve(ADMIN_DIR, page, "page.tsx"), "utf-8");
}

describe("STD-001: Page wrapper styling (light mode only)", () => {
  // Note: UI-112 removed all dark: classes from admin pages (stakeholder approved).
  // dark-mode-cleanup.test.ts comprehensively verifies no dark: classes exist.
  // This test verifies the light-mode wrapper styling remains consistent.
  const pages = ["users", "contracts", "maintenances", "inspections"];

  for (const page of pages) {
    it(`${page}/page.tsx should have bg-white in page wrapper`, () => {
      const source = readPage(page);
      // Find the first return ( and the opening div
      const returnMatch = source.match(/return\s*\(\s*\n\s*<div className="([^"]+)"/);
      expect(returnMatch).not.toBeNull();
      if (returnMatch) {
        expect(returnMatch[1]).toContain("bg-white");
      }
    });

    it(`${page}/page.tsx should have border-stroke in page wrapper`, () => {
      const source = readPage(page);
      const returnMatch = source.match(/return\s*\(\s*\n\s*<div className="([^"]+)"/);
      expect(returnMatch).not.toBeNull();
      if (returnMatch) {
        expect(returnMatch[1]).toContain("border-stroke");
      }
    });
  }

  it("inspections/page.tsx should NOT use container mx-auto pattern", () => {
    const source = readPage("inspections");
    const returnMatch = source.match(/return\s*\(\s*\n\s*<div className="([^"]+)"/);
    expect(returnMatch).not.toBeNull();
    if (returnMatch) {
      expect(returnMatch[1]).not.toContain("container mx-auto");
    }
  });

  it("inspections/page.tsx should use shadow-default pattern", () => {
    const source = readPage("inspections");
    const returnMatch = source.match(/return\s*\(\s*\n\s*<div className="([^"]+)"/);
    expect(returnMatch).not.toBeNull();
    if (returnMatch) {
      expect(returnMatch[1]).toContain("shadow-default");
    }
  });
});

describe("STD-002: Page header standardization", () => {
  const pages = ["users", "products", "customers", "contracts", "maintenances", "inspections", "blogs"];

  for (const page of pages) {
    describe(`${page} page header`, () => {
      it("should have responsive title (text-xl sm:text-2xl)", () => {
        const source = readPage(page);
        expect(source).toContain("text-xl");
        expect(source).toContain("sm:text-2xl");
      });

      it("should use font-semibold (not font-bold)", () => {
        const source = readPage(page);
        // Find the page title - first h1 or h2 after return
        const titleMatch = source.match(/<h[12]\s+className="([^"]+)"/);
        if (titleMatch) {
          expect(titleMatch[1]).toContain("font-semibold");
          expect(titleMatch[1]).not.toContain("font-bold");
        }
      });

      it("should have description with responsive text (text-xs sm:text-sm)", () => {
        const source = readPage(page);
        expect(source).toMatch(/text-xs text-gray-500.*sm:text-sm/);
      });

      it("should have gap-4 in header wrapper", () => {
        const source = readPage(page);
        // Find the first flex div after return
        const headerMatch = source.match(/mb-6 flex flex-col[^"]*gap-4/);
        expect(headerMatch).not.toBeNull();
      });
    });
  }
});

describe("STD-003: Primary action button standardization", () => {
  const pagesWithAddButton = ["users", "contracts", "blogs"];

  for (const page of pagesWithAddButton) {
    describe(`${page} page Add button`, () => {
      it("should use gap-2 for icon spacing (not mr-2 on icon)", () => {
        const source = readPage(page);
        // The primary button should have gap-2 (before or after bg-primary in same className)
        expect(source).toMatch(/gap-2[^"]*bg-primary|bg-primary[^"]*gap-2/);
      });

      it("should use py-2.5 padding", () => {
        const source = readPage(page);
        expect(source).toMatch(/bg-primary[^"]*py-2\.5/);
      });

      it("should use hover:bg-primary/90 (not hover:bg-opacity-90)", () => {
        const source = readPage(page);
        expect(source).toMatch(/bg-primary[^"]*hover:bg-primary\/90/);
      });

      it("should NOT use mt-4 sm:mt-0 pattern", () => {
        const source = readPage(page);
        // Old pattern had mt-4...sm:mt-0 which is replaced by wrapper gap-4
        expect(source).not.toMatch(/bg-primary[^"]*mt-4/);
      });
    });
  }
});

describe("STD-004: Error message standardization", () => {
  const simpleErrorPages = ["users", "contracts", "maintenances", "inspections", "blogs"];

  for (const page of simpleErrorPages) {
    it(`${page}/page.tsx error should use rounded-lg border border-red-200 bg-red-50`, () => {
      const source = readPage(page);
      const errorMatch = source.match(/error &&[\s\S]*?<div className="([^"]+)"/);
      if (errorMatch) {
        expect(errorMatch[1]).toContain("rounded-lg");
        expect(errorMatch[1]).toContain("border-red-200");
        expect(errorMatch[1]).toContain("bg-red-50");
      }
    });
  }

  const successPages = ["users", "blogs"];
  for (const page of successPages) {
    it(`${page}/page.tsx success should use rounded-lg border border-green-200 bg-green-50`, () => {
      const source = readPage(page);
      const successMatch = source.match(/success.*&&[\s\S]*?<div className="([^"]+)"/i);
      if (successMatch) {
        expect(successMatch[1]).toContain("rounded-lg");
        expect(successMatch[1]).toContain("border-green-200");
        expect(successMatch[1]).toContain("bg-green-50");
      }
    });
  }
});

function readComponent(path: string): string {
  return readFileSync(resolve(ADMIN_DIR, "../../../components/Admin", path), "utf-8");
}

describe("STD-005: Table header background standardization", () => {
  const tableFiles = [
    { name: "users", reader: () => readPage("users") },
    { name: "contracts", reader: () => readPage("contracts") },
    { name: "maintenances", reader: () => readPage("maintenances") },
    { name: "blogs", reader: () => readPage("blogs") },
    { name: "InspectionsTable", reader: () => readComponent("Inspections/InspectionsTable.tsx") },
  ];

  for (const { name, reader } of tableFiles) {
    it(`${name} table header should use bg-gray-50 not bg-gray-100`, () => {
      const source = reader();
      const headerMatch = source.match(/<tr className="([^"]*tracking-wide[^"]*)"/);
      if (headerMatch) {
        expect(headerMatch[1]).toContain("bg-gray-50");
        expect(headerMatch[1]).not.toContain("bg-gray-100");
      }
    });

    it(`${name} table header should use text-gray-700 not text-black`, () => {
      const source = reader();
      const headerMatch = source.match(/<tr className="([^"]*tracking-wide[^"]*)"/);
      if (headerMatch) {
        expect(headerMatch[1]).toContain("text-gray-700");
        expect(headerMatch[1]).not.toContain("text-black");
      }
    });

    it(`${name} table header should have border-stroke`, () => {
      const source = reader();
      const headerMatch = source.match(/<tr className="([^"]*tracking-wide[^"]*)"/);
      if (headerMatch) {
        expect(headerMatch[1]).toContain("border-stroke");
      }
    });
  }
});

describe("STD-006: Table cell padding standardization", () => {
  const cramped = [
    { name: "contracts", reader: () => readPage("contracts") },
    { name: "maintenances", reader: () => readPage("maintenances") },
    { name: "InspectionsTable", reader: () => readComponent("Inspections/InspectionsTable.tsx") },
  ];

  for (const { name, reader } of cramped) {
    it(`${name} should NOT have px-2 py-3 on table cells`, () => {
      const source = reader();
      expect(source).not.toContain("px-2 py-3");
    });

    it(`${name} should use px-4 py-3 on table cells`, () => {
      const source = reader();
      expect(source).toContain("px-4 py-3");
    });
  }
});

describe("UI-007: Table row hover standardization", () => {
  const noHoverPages = [
    { name: "users", reader: () => readPage("users") },
    { name: "contracts", reader: () => readPage("contracts") },
    { name: "InspectionsTable", reader: () => readComponent("Inspections/InspectionsTable.tsx") },
    { name: "blogs", reader: () => readPage("blogs") },
  ];

  for (const { name, reader } of noHoverPages) {
    it(`${name} table body rows should have hover:bg-gray-50`, () => {
      const source = reader();
      // Find tbody row <tr with className containing text-sm
      const rowMatch = source.match(/<tr[\s\S]*?className="([^"]*text-sm[^"]*)"/);
      if (rowMatch) {
        expect(rowMatch[1]).toContain("hover:bg-gray-50");
      }
    });
  }
});

describe("UI-009: Filter input styling standardization", () => {
  const inlineFilterPages = ["users", "contracts", "inspections", "blogs"];

  for (const page of inlineFilterPages) {
    it(`${page} filter inputs should use border-stroke (not border-gray-300)`, () => {
      const source = readPage(page);
      // Check filter area inputs don't use border-gray-300
      expect(source).not.toMatch(/border border-gray-300.*focus:border/);
    });

    it(`${page} filter inputs should use rounded-lg (not rounded-md)`, () => {
      const source = readPage(page);
      // Should not have rounded-md on filter inputs
      expect(source).not.toMatch(/rounded-md.*border.*focus:border/);
    });

    it(`${page} filter inputs should use focus:border-primary (not focus:border-blue-500)`, () => {
      const source = readPage(page);
      expect(source).not.toContain("focus:border-blue-500");
    });

    it(`${page} filter labels should use text-xs (not text-sm)`, () => {
      const source = readPage(page);
      // All filter labels should be text-xs not text-sm
      expect(source).not.toMatch(/block text-sm font-medium text-gray-700/);
    });
  }
});

describe("UI-012: Edit row action button standardization", () => {
  const editButtonPages = ["contracts", "blogs"];

  for (const page of editButtonPages) {
    it(`${page} Edit button should use bg-primary (not bg-blue-200)`, () => {
      const source = readPage(page);
      expect(source).not.toMatch(/bg-blue-200.*hover:bg-yellow-200/);
    });

    it(`${page} Edit button should use bg-primary text-white`, () => {
      const source = readPage(page);
      expect(source).toMatch(/bg-primary.*text-white.*hover:bg-primary/);
    });
  }

  it("maintenances Edit should be a styled button (not plain text link)", () => {
    const source = readPage("maintenances");
    // Should not have bare text-blue-600 link for Edit
    expect(source).not.toMatch(/className="text-blue-600 hover:text-blue-800 text-xs"/);
  });
});

describe("UI-014: Loading state standardization", () => {
  const loadingPages = [
    { name: "users", reader: () => readPage("users") },
    { name: "contracts", reader: () => readPage("contracts") },
    { name: "maintenances", reader: () => readPage("maintenances") },
    { name: "InspectionsTable", reader: () => readComponent("Inspections/InspectionsTable.tsx") },
    { name: "blogs", reader: () => readPage("blogs") },
  ];

  for (const { name, reader } of loadingPages) {
    it(`${name} loading state should have spinner (animate-spin)`, () => {
      const source = reader();
      // Find the loading ternary block
      const loadingMatch = source.match(/loading \? \([\s\S]*?animate-spin/);
      const isLoadingMatch = source.match(/isLoading \? \([\s\S]*?animate-spin/);
      expect(loadingMatch || isLoadingMatch).not.toBeNull();
    });

    it(`${name} loading state should use py-12 (not py-8)`, () => {
      const source = reader();
      // The loading block should not use py-8 text-center as the only element
      expect(source).not.toMatch(/loading \? \(\s*\n\s*<div className="py-8 text-center">/);
      expect(source).not.toMatch(/isLoading \? \(\s*\n\s*<div className="py-8 text-center">/);
    });
  }
});

describe("UI-015: Empty state standardization", () => {
  const emptyPages = [
    { name: "users", reader: () => readPage("users") },
    { name: "contracts", reader: () => readPage("contracts") },
    { name: "maintenances", reader: () => readPage("maintenances") },
    { name: "InspectionsTable", reader: () => readComponent("Inspections/InspectionsTable.tsx") },
    { name: "blogs", reader: () => readPage("blogs") },
  ];

  for (const { name, reader } of emptyPages) {
    it(`${name} empty state should use py-12 (not py-8)`, () => {
      const source = reader();
      // Empty state should not use py-8 text-center as a simple div
      // Look for the pattern after length === 0 check
      const emptyMatch = source.match(/length === 0 \? \(\s*\n\s*<div className="([^"]+)"/);
      if (emptyMatch) {
        expect(emptyMatch[1]).toContain("py-12");
        expect(emptyMatch[1]).not.toContain("py-8");
      }
    });

    it(`${name} empty state should have an SVG icon`, () => {
      const source = reader();
      // After length === 0, there should be an SVG icon
      const emptyBlock = source.match(/length === 0 \? \([\s\S]*?\) : \(/);
      if (emptyBlock) {
        expect(emptyBlock[0]).toContain("<svg");
      }
    });
  }
});

describe("UI-101: Table tbody row dividers", () => {
  const missingDividers = [
    { name: "contracts", reader: () => readPage("contracts") },
    { name: "maintenances", reader: () => readPage("maintenances") },
    { name: "InspectionsTable", reader: () => readComponent("Inspections/InspectionsTable.tsx") },
  ];

  for (const { name, reader } of missingDividers) {
    it(`${name} tbody should have divide-y divide-stroke`, () => {
      const source = reader();
      expect(source).toMatch(/<tbody className="divide-y divide-stroke/);
    });
  }
});

describe("UI-102: Action buttons horizontal layout", () => {
  // UI-102 original intent: action buttons must be horizontal (not vertical)
  // UI-115 supersedes the specific pattern: flex items-center gap-2 is now the standard
  // This test suite ensures horizontal layout is maintained (no flex-col)

  // Reference pages that have the correct pattern
  const referencePages = ["users", "blogs"];

  // Target page that needs to match the reference pattern
  const targetPages = ["contracts"];

  // All pages that must have horizontal action buttons
  const allActionButtonPages = [...referencePages, ...targetPages];

  // Helper to find the action button container className in the last td before </tr>
  // This is the Actions column which contains Edit/Delete buttons
  function findActionContainerClass(source: string): string | null {
    // Find the pattern: <td className="px-4 py-3"> followed by <div className="...">
    // where the div contains action buttons (Edit button as Link or button)
    // The action td is typically the last td in a row, containing flex container with buttons
    const matches = source.match(/<td className="px-4 py-3">\s*<div className="([^"]+)">\s*(?:<Link|<button)/gs);
    if (matches && matches.length > 0) {
      // Get the last match (action column is typically last)
      const lastMatch = matches[matches.length - 1];
      const classMatch = lastMatch.match(/<div className="([^"]+)"/);
      return classMatch ? classMatch[1] : null;
    }
    return null;
  }

  for (const page of allActionButtonPages) {
    describe(`${page} page action buttons`, () => {
      it("should use flex items-center gap-2 for action button container (UI-115 standard)", () => {
        const source = readPage(page);
        // UI-115 standard: flex items-center gap-2
        expect(source).toContain('className="flex items-center gap-2"');
      });

      it("should NOT use flex-col class in action button container (must be horizontal)", () => {
        const source = readPage(page);
        const actionClass = findActionContainerClass(source);
        expect(actionClass).not.toBeNull();
        if (actionClass) {
          expect(actionClass).not.toContain("flex-col");
        }
      });

      it("should NOT use flex-wrap class in action button container", () => {
        const source = readPage(page);
        const actionClass = findActionContainerClass(source);
        expect(actionClass).not.toBeNull();
        if (actionClass) {
          expect(actionClass).not.toContain("flex-wrap");
        }
      });

      it("should NOT use p-auto class in action button container", () => {
        const source = readPage(page);
        const actionClass = findActionContainerClass(source);
        expect(actionClass).not.toBeNull();
        if (actionClass) {
          expect(actionClass).not.toContain("p-auto");
        }
      });
    });
  }

  // Cross-consistency test: contracts must match users and blogs pattern
  it("contracts action button container should match users page pattern", () => {
    const contractsSource = readPage("contracts");
    const usersSource = readPage("users");

    const contractsClass = findActionContainerClass(contractsSource);
    const usersClass = findActionContainerClass(usersSource);

    expect(contractsClass).not.toBeNull();
    expect(usersClass).not.toBeNull();

    if (contractsClass && usersClass) {
      expect(contractsClass).toBe(usersClass);
    }
  });

  it("contracts action button container should match blogs page pattern", () => {
    const contractsSource = readPage("contracts");
    const blogsSource = readPage("blogs");

    const contractsClass = findActionContainerClass(contractsSource);
    const blogsClass = findActionContainerClass(blogsSource);

    expect(contractsClass).not.toBeNull();
    expect(blogsClass).not.toBeNull();

    if (contractsClass && blogsClass) {
      expect(contractsClass).toBe(blogsClass);
    }
  });
});
