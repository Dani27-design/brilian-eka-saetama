import { readFileSync } from "fs";
import { resolve } from "path";

const ADMIN_DIR = resolve(__dirname);
const COMPONENTS_DIR = resolve(__dirname, "../../../components/Admin");

function readPage(page: string): string {
  return readFileSync(resolve(ADMIN_DIR, page, "page.tsx"), "utf-8");
}

function readComponent(path: string): string {
  return readFileSync(resolve(COMPONENTS_DIR, path), "utf-8");
}

// Standard className patterns from spec
const EDIT_BUTTON_STANDARD =
  "inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90";

const DELETE_BUTTON_STANDARD =
  "inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50";

// Fixed widths that should NOT be present
const FORBIDDEN_FIXED_WIDTHS = ["w-14", "w-16", "w-18"];

// Wrong color schemes that should NOT be present for Edit buttons
const FORBIDDEN_EDIT_COLORS = [
  "bg-blue-50",
  "bg-blue-100",
  "text-blue-700",
  "text-blue-800",
];

// Wrong color scheme for Delete buttons (filled style instead of outline)
const FORBIDDEN_DELETE_FILLED = ["bg-red-100", "text-red-700"];

describe("UI-113: Edit Button Standardization", () => {
  describe("users/page.tsx Edit button", () => {
    it("should use <Link> element (not <button> for navigation)", () => {
      const source = readPage("users");
      // Find the Edit button that navigates to /admin/users/edit/
      // It should be <Link href=... not <button onClick={() => router.push(...)
      const editButtonMatch = source.match(
        /<Link[^>]*href=\{[^}]*\/admin\/users\/edit\/[^}]*\}/
      );
      expect(editButtonMatch).not.toBeNull();
    });

    it("should contain bg-primary in className", () => {
      const source = readPage("users");
      // The Edit button className should include bg-primary
      const editLinkMatch = source.match(
        /<Link[^>]*href=\{[^}]*\/admin\/users\/edit\/[^}]*\}[^>]*className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("bg-primary");
      }
    });

    it("should contain text-white in className", () => {
      const source = readPage("users");
      const editLinkMatch = source.match(
        /<Link[^>]*href=\{[^}]*\/admin\/users\/edit\/[^}]*\}[^>]*className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("text-white");
      }
    });

    it("should contain rounded-lg in className", () => {
      const source = readPage("users");
      const editLinkMatch = source.match(
        /<Link[^>]*href=\{[^}]*\/admin\/users\/edit\/[^}]*\}[^>]*className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("rounded-lg");
      }
    });

    it("should contain px-3 py-1.5 in className", () => {
      const source = readPage("users");
      const editLinkMatch = source.match(
        /<Link[^>]*href=\{[^}]*\/admin\/users\/edit\/[^}]*\}[^>]*className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("px-3");
        expect(editLinkMatch[1]).toContain("py-1.5");
      }
    });

    it("should NOT contain fixed widths (w-14, w-16, w-18)", () => {
      const source = readPage("users");
      // Find the Edit button area and check it doesn't have fixed widths
      const editAreaMatch = source.match(
        /router\.push\([^)]*\/admin\/users\/edit\/[^)]*\)[^}]*className="([^"]*)"/
      );
      // Also check if there's a Link pattern
      const editLinkMatch = source.match(
        /<Link[^>]*href=\{[^}]*\/admin\/users\/edit\/[^}]*\}[^>]*className="([^"]*)"/
      );
      const className = editAreaMatch?.[1] || editLinkMatch?.[1] || "";
      for (const width of FORBIDDEN_FIXED_WIDTHS) {
        expect(className).not.toContain(width);
      }
    });

    it("should NOT contain wrong color schemes (bg-blue-50, bg-blue-100)", () => {
      const source = readPage("users");
      const editAreaMatch = source.match(
        /router\.push\([^)]*\/admin\/users\/edit\/[^)]*\)[^}]*className="([^"]*)"/
      );
      const editLinkMatch = source.match(
        /<Link[^>]*href=\{[^}]*\/admin\/users\/edit\/[^}]*\}[^>]*className="([^"]*)"/
      );
      const className = editAreaMatch?.[1] || editLinkMatch?.[1] || "";
      for (const color of FORBIDDEN_EDIT_COLORS) {
        expect(className).not.toContain(color);
      }
    });
  });

  describe("products/page.tsx Edit button", () => {
    it("should use <Link> element", () => {
      const source = readPage("products");
      const editButtonMatch = source.match(
        /<Link[^>]*href=\{[^}]*\/admin\/products\/edit\/[^}]*\}/
      );
      expect(editButtonMatch).not.toBeNull();
    });

    it("should contain bg-primary in className", () => {
      const source = readPage("products");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/products\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("bg-primary");
      }
    });

    it("should contain text-white in className", () => {
      const source = readPage("products");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/products\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("text-white");
      }
    });

    it("should contain rounded-lg in className", () => {
      const source = readPage("products");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/products\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("rounded-lg");
      }
    });

    it("should contain px-3 py-1.5 in className", () => {
      const source = readPage("products");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/products\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("px-3");
        expect(editLinkMatch[1]).toContain("py-1.5");
      }
    });

    it("should NOT contain fixed widths (w-14, w-16, w-18)", () => {
      const source = readPage("products");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/products\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      const className = editLinkMatch?.[1] || "";
      for (const width of FORBIDDEN_FIXED_WIDTHS) {
        expect(className).not.toContain(width);
      }
    });

    it("should NOT contain wrong color schemes (bg-blue-50, bg-blue-100)", () => {
      const source = readPage("products");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/products\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      const className = editLinkMatch?.[1] || "";
      for (const color of FORBIDDEN_EDIT_COLORS) {
        expect(className).not.toContain(color);
      }
    });
  });

  describe("CustomerListItem.tsx Edit button", () => {
    it("should use <Link> element", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const editButtonMatch = source.match(
        /<Link[^>]*href=\{[^}]*\/admin\/customers\/edit\/[^}]*\}/
      );
      expect(editButtonMatch).not.toBeNull();
    });

    it("should contain bg-primary in className", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/customers\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("bg-primary");
      }
    });

    it("should contain text-white in className", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/customers\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("text-white");
      }
    });

    it("should contain rounded-lg in className", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/customers\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("rounded-lg");
      }
    });

    it("should contain px-3 py-1.5 in className", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/customers\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("px-3");
        expect(editLinkMatch[1]).toContain("py-1.5");
      }
    });

    it("should NOT contain fixed widths (w-14, w-16, w-18)", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/customers\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      const className = editLinkMatch?.[1] || "";
      for (const width of FORBIDDEN_FIXED_WIDTHS) {
        expect(className).not.toContain(width);
      }
    });

    it("should NOT contain wrong color schemes (bg-blue-50, bg-blue-100)", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/customers\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      const className = editLinkMatch?.[1] || "";
      for (const color of FORBIDDEN_EDIT_COLORS) {
        expect(className).not.toContain(color);
      }
    });
  });

  describe("contracts/page.tsx Edit button", () => {
    it("should use <Link> element", () => {
      const source = readPage("contracts");
      const editButtonMatch = source.match(
        /<Link[^>]*href=\{[^}]*\/admin\/contracts\/edit\/[^}]*\}/
      );
      expect(editButtonMatch).not.toBeNull();
    });

    it("should contain bg-primary in className", () => {
      const source = readPage("contracts");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/contracts\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("bg-primary");
      }
    });

    it("should contain text-white in className", () => {
      const source = readPage("contracts");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/contracts\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("text-white");
      }
    });

    it("should contain rounded-lg in className", () => {
      const source = readPage("contracts");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/contracts\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("rounded-lg");
      }
    });

    it("should contain px-3 py-1.5 in className", () => {
      const source = readPage("contracts");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/contracts\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("px-3");
        expect(editLinkMatch[1]).toContain("py-1.5");
      }
    });

    it("should NOT contain fixed widths (w-14, w-16, w-18)", () => {
      const source = readPage("contracts");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/contracts\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      const className = editLinkMatch?.[1] || "";
      for (const width of FORBIDDEN_FIXED_WIDTHS) {
        expect(className).not.toContain(width);
      }
    });

    it("should NOT contain wrong color schemes (bg-blue-50, bg-blue-100)", () => {
      const source = readPage("contracts");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/contracts\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      const className = editLinkMatch?.[1] || "";
      for (const color of FORBIDDEN_EDIT_COLORS) {
        expect(className).not.toContain(color);
      }
    });
  });

  describe("maintenances/page.tsx Edit button (includes UI-106 fix)", () => {
    it("should use <Link> element (not <a> element)", () => {
      const source = readPage("maintenances");
      // Must find <Link with href to maintenances/edit
      const editLinkMatch = source.match(
        /<Link[^>]*href=\{?[^}]*\/admin\/maintenances\/edit\/[^}]*\}?/
      );
      expect(editLinkMatch).not.toBeNull();
    });

    it("should NOT use <a> element for Edit button", () => {
      const source = readPage("maintenances");
      // Should not have <a href="...maintenances/edit..."
      const aTagMatch = source.match(
        /<a[^>]*href=\{?[^}]*\/admin\/maintenances\/edit\/[^}]*\}?/
      );
      expect(aTagMatch).toBeNull();
    });

    it("should contain bg-primary in className", () => {
      const source = readPage("maintenances");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{?[^}]*\/admin\/maintenances\/edit\/[^}]*\}?[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("bg-primary");
      }
    });

    it("should contain text-white in className", () => {
      const source = readPage("maintenances");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{?[^}]*\/admin\/maintenances\/edit\/[^}]*\}?[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("text-white");
      }
    });

    it("should contain rounded-lg in className", () => {
      const source = readPage("maintenances");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{?[^}]*\/admin\/maintenances\/edit\/[^}]*\}?[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("rounded-lg");
      }
    });

    it("should contain px-3 py-1.5 in className", () => {
      const source = readPage("maintenances");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{?[^}]*\/admin\/maintenances\/edit\/[^}]*\}?[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("px-3");
        expect(editLinkMatch[1]).toContain("py-1.5");
      }
    });

    it("should contain pencil SVG icon", () => {
      const source = readPage("maintenances");
      // Find the Edit Link and check if it has an SVG child before closing
      const editBlockMatch = source.match(
        /<Link[\s\S]*?href=\{?`[^`]*\/admin\/maintenances\/edit\/[^`]*`\}?[\s\S]*?<\/Link>/
      );
      expect(editBlockMatch).not.toBeNull();
      if (editBlockMatch) {
        expect(editBlockMatch[0]).toContain("<svg");
      }
    });

    it("should NOT contain fixed widths (w-14, w-16, w-18)", () => {
      const source = readPage("maintenances");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{?[^}]*\/admin\/maintenances\/edit\/[^}]*\}?[\s\S]*?className="([^"]*)"/
      );
      const className = editLinkMatch?.[1] || "";
      for (const width of FORBIDDEN_FIXED_WIDTHS) {
        expect(className).not.toContain(width);
      }
    });

    it("should NOT contain wrong color schemes (bg-blue-50, bg-blue-100)", () => {
      const source = readPage("maintenances");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{?[^}]*\/admin\/maintenances\/edit\/[^}]*\}?[\s\S]*?className="([^"]*)"/
      );
      const className = editLinkMatch?.[1] || "";
      for (const color of FORBIDDEN_EDIT_COLORS) {
        expect(className).not.toContain(color);
      }
    });
  });

  describe("blogs/page.tsx Edit button", () => {
    it("should use <Link> element", () => {
      const source = readPage("blogs");
      const editButtonMatch = source.match(
        /<Link[^>]*href=\{[^}]*\/admin\/blogs\/edit\/[^}]*\}/
      );
      expect(editButtonMatch).not.toBeNull();
    });

    it("should contain bg-primary in className", () => {
      const source = readPage("blogs");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/blogs\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("bg-primary");
      }
    });

    it("should contain text-white in className", () => {
      const source = readPage("blogs");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/blogs\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("text-white");
      }
    });

    it("should contain rounded-lg in className", () => {
      const source = readPage("blogs");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/blogs\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("rounded-lg");
      }
    });

    it("should contain px-3 py-1.5 in className", () => {
      const source = readPage("blogs");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/blogs\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("px-3");
        expect(editLinkMatch[1]).toContain("py-1.5");
      }
    });

    it("should NOT contain fixed widths (w-14, w-16, w-18)", () => {
      const source = readPage("blogs");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/blogs\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      const className = editLinkMatch?.[1] || "";
      for (const width of FORBIDDEN_FIXED_WIDTHS) {
        expect(className).not.toContain(width);
      }
    });

    it("should NOT contain wrong color schemes (bg-blue-50, bg-blue-100)", () => {
      const source = readPage("blogs");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/blogs\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      const className = editLinkMatch?.[1] || "";
      for (const color of FORBIDDEN_EDIT_COLORS) {
        expect(className).not.toContain(color);
      }
    });
  });

  describe("InspectionsTable.tsx Edit button", () => {
    it("should use <Link> element", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      const editButtonMatch = source.match(
        /<Link[^>]*href=\{[^}]*\/admin\/inspections\/edit\/[^}]*\}/
      );
      expect(editButtonMatch).not.toBeNull();
    });

    it("should contain bg-primary in className", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/inspections\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("bg-primary");
      }
    });

    it("should contain text-white in className", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/inspections\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("text-white");
      }
    });

    it("should contain rounded-lg in className", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/inspections\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("rounded-lg");
      }
    });

    it("should contain px-3 py-1.5 in className", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/inspections\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      expect(editLinkMatch).not.toBeNull();
      if (editLinkMatch) {
        expect(editLinkMatch[1]).toContain("px-3");
        expect(editLinkMatch[1]).toContain("py-1.5");
      }
    });

    it("should contain pencil SVG icon", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      // Find the Edit Link and check if it has an SVG child before closing
      const editBlockMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/inspections\/edit\/[^}]*\}[\s\S]*?<\/Link>/
      );
      expect(editBlockMatch).not.toBeNull();
      if (editBlockMatch) {
        expect(editBlockMatch[0]).toContain("<svg");
      }
    });

    it("should NOT contain fixed widths (w-14, w-16, w-18)", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/inspections\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      const className = editLinkMatch?.[1] || "";
      for (const width of FORBIDDEN_FIXED_WIDTHS) {
        expect(className).not.toContain(width);
      }
    });

    it("should NOT contain wrong color schemes (bg-blue-50, bg-blue-100, text-blue-800)", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      const editLinkMatch = source.match(
        /<Link[\s\S]*?href=\{[^}]*\/admin\/inspections\/edit\/[^}]*\}[\s\S]*?className="([^"]*)"/
      );
      const className = editLinkMatch?.[1] || "";
      for (const color of FORBIDDEN_EDIT_COLORS) {
        expect(className).not.toContain(color);
      }
    });
  });
});

describe("UI-117: Delete Button Standardization", () => {
  describe("users/page.tsx Delete button", () => {
    it("should contain border border-red-300 in className (outline style)", () => {
      const source = readPage("users");
      // Find delete button near deleteUser
      const deleteMatch = source.match(
        /deleteUser\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("border");
        expect(deleteMatch[1]).toContain("border-red-300");
      }
    });

    it("should contain bg-white in className (outline style)", () => {
      const source = readPage("users");
      const deleteMatch = source.match(
        /deleteUser\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("bg-white");
      }
    });

    it("should contain text-red-600 in className", () => {
      const source = readPage("users");
      const deleteMatch = source.match(
        /deleteUser\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("text-red-600");
      }
    });

    it("should contain rounded-lg in className", () => {
      const source = readPage("users");
      const deleteMatch = source.match(
        /deleteUser\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("rounded-lg");
      }
    });

    it("should contain px-3 py-1.5 in className", () => {
      const source = readPage("users");
      const deleteMatch = source.match(
        /deleteUser\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("px-3");
        expect(deleteMatch[1]).toContain("py-1.5");
      }
    });

    it("should NOT contain bg-red-100 (filled style)", () => {
      const source = readPage("users");
      const deleteMatch = source.match(
        /deleteUser\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).not.toContain("bg-red-100");
      }
    });

    it("should NOT contain fixed widths (w-18)", () => {
      const source = readPage("users");
      const deleteMatch = source.match(
        /deleteUser\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        for (const width of FORBIDDEN_FIXED_WIDTHS) {
          expect(deleteMatch[1]).not.toContain(width);
        }
      }
    });
  });

  describe("contracts/page.tsx Delete button", () => {
    it("should contain border border-red-300 in className (outline style)", () => {
      const source = readPage("contracts");
      // Find delete button near handleDelete
      const deleteMatch = source.match(
        /handleDelete\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("border");
        expect(deleteMatch[1]).toContain("border-red-300");
      }
    });

    it("should contain bg-white in className (outline style)", () => {
      const source = readPage("contracts");
      const deleteMatch = source.match(
        /handleDelete\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("bg-white");
      }
    });

    it("should contain text-red-600 in className", () => {
      const source = readPage("contracts");
      const deleteMatch = source.match(
        /handleDelete\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("text-red-600");
      }
    });

    it("should contain rounded-lg in className", () => {
      const source = readPage("contracts");
      const deleteMatch = source.match(
        /handleDelete\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("rounded-lg");
      }
    });

    it("should contain px-3 py-1.5 in className", () => {
      const source = readPage("contracts");
      const deleteMatch = source.match(
        /handleDelete\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("px-3");
        expect(deleteMatch[1]).toContain("py-1.5");
      }
    });

    it("should NOT contain bg-red-100 (filled style)", () => {
      const source = readPage("contracts");
      const deleteMatch = source.match(
        /handleDelete\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).not.toContain("bg-red-100");
      }
    });

    it("should NOT contain fixed widths (w-18)", () => {
      const source = readPage("contracts");
      const deleteMatch = source.match(
        /handleDelete\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        for (const width of FORBIDDEN_FIXED_WIDTHS) {
          expect(deleteMatch[1]).not.toContain(width);
        }
      }
    });
  });

  describe("blogs/page.tsx Delete button", () => {
    it("should contain border border-red-300 in className (outline style)", () => {
      const source = readPage("blogs");
      // Find delete button near handleDeleteBlog
      const deleteMatch = source.match(
        /handleDeleteBlog\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("border");
        expect(deleteMatch[1]).toContain("border-red-300");
      }
    });

    it("should contain bg-white in className (outline style)", () => {
      const source = readPage("blogs");
      const deleteMatch = source.match(
        /handleDeleteBlog\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("bg-white");
      }
    });

    it("should contain text-red-600 in className", () => {
      const source = readPage("blogs");
      const deleteMatch = source.match(
        /handleDeleteBlog\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("text-red-600");
      }
    });

    it("should contain rounded-lg in className", () => {
      const source = readPage("blogs");
      const deleteMatch = source.match(
        /handleDeleteBlog\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("rounded-lg");
      }
    });

    it("should contain px-3 py-1.5 in className", () => {
      const source = readPage("blogs");
      const deleteMatch = source.match(
        /handleDeleteBlog\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).toContain("px-3");
        expect(deleteMatch[1]).toContain("py-1.5");
      }
    });

    it("should NOT contain bg-red-100 (filled style)", () => {
      const source = readPage("blogs");
      const deleteMatch = source.match(
        /handleDeleteBlog\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        expect(deleteMatch[1]).not.toContain("bg-red-100");
      }
    });

    it("should NOT contain fixed widths (w-18)", () => {
      const source = readPage("blogs");
      const deleteMatch = source.match(
        /handleDeleteBlog\([\s\S]*?className="([^"]*)"/
      );
      expect(deleteMatch).not.toBeNull();
      if (deleteMatch) {
        for (const width of FORBIDDEN_FIXED_WIDTHS) {
          expect(deleteMatch[1]).not.toContain(width);
        }
      }
    });
  });

  describe("CustomerListItem.tsx Delete button", () => {
    it("should contain border border-red-300 in className (outline style)", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      // Find delete button - look for handleDelete and canDelete pattern
      const deleteMatch = source.match(
        /handleDelete[\s\S]*?canDelete[\s\S]*?className=\{?`([^`]*)"/
      );
      // Alternative: find the delete button section
      const deleteSection = source.match(
        /Delete Button[\s\S]*?<button[\s\S]*?className=\{?`([^`]*)"/
      );
      const className = deleteMatch?.[1] || deleteSection?.[1] || "";
      expect(className).toContain("border");
      expect(className).toContain("border-red-300");
    });

    it("should contain bg-white in className (outline style)", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const deleteSection = source.match(
        /Delete Button[\s\S]*?<button[\s\S]*?className=\{?`([^`]*)"/
      );
      const className = deleteSection?.[1] || "";
      expect(className).toContain("bg-white");
    });

    it("should contain text-red-600 in className", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const deleteSection = source.match(
        /Delete Button[\s\S]*?<button[\s\S]*?className=\{?`([^`]*)"/
      );
      const className = deleteSection?.[1] || "";
      expect(className).toContain("text-red-600");
    });

    it("should contain rounded-lg in className", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const deleteSection = source.match(
        /Delete Button[\s\S]*?<button[\s\S]*?className=\{?`([^`]*)"/
      );
      const className = deleteSection?.[1] || "";
      expect(className).toContain("rounded-lg");
    });

    it("should contain px-3 py-1.5 in className", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const deleteSection = source.match(
        /Delete Button[\s\S]*?<button[\s\S]*?className=\{?`([^`]*)"/
      );
      const className = deleteSection?.[1] || "";
      expect(className).toContain("px-3");
      expect(className).toContain("py-1.5");
    });

    it("should NOT contain bg-red-100 (filled style)", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const deleteSection = source.match(
        /Delete Button[\s\S]*?<button[\s\S]*?className=\{?`([^`]*)"/
      );
      const className = deleteSection?.[1] || "";
      expect(className).not.toContain("bg-red-100");
    });

    it("should NOT contain text-red-700 (wrong text color)", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const deleteSection = source.match(
        /Delete Button[\s\S]*?<button[\s\S]*?className=\{?`([^`]*)"/
      );
      const className = deleteSection?.[1] || "";
      expect(className).not.toContain("text-red-700");
    });

    it("should NOT contain fixed widths (w-14, w-16, w-18)", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      const deleteSection = source.match(
        /Delete Button[\s\S]*?<button[\s\S]*?className=\{?`([^`]*)"/
      );
      const className = deleteSection?.[1] || "";
      for (const width of FORBIDDEN_FIXED_WIDTHS) {
        expect(className).not.toContain(width);
      }
    });
  });
});

describe("Visual Consistency across Edit and Delete buttons", () => {
  it("all Edit buttons should use same padding (px-3 py-1.5)", () => {
    const usersSource = readPage("users");
    const productsSource = readPage("products");
    const contractsSource = readPage("contracts");
    const maintenancesSource = readPage("maintenances");
    const blogsSource = readPage("blogs");
    const customerSource = readComponent("Customers/CustomerListItem.tsx");
    const inspectionsSource = readComponent("Inspections/InspectionsTable.tsx");

    // All should contain px-3 py-1.5 pattern
    const sources = [
      usersSource,
      productsSource,
      contractsSource,
      maintenancesSource,
      blogsSource,
      customerSource,
      inspectionsSource,
    ];

    for (const source of sources) {
      // Each source must have an Edit area with px-3 and py-1.5
      expect(source).toMatch(/px-3.*py-1\.5|py-1\.5.*px-3/);
    }
  });

  it("all Edit buttons should use same border-radius (rounded-lg)", () => {
    const usersSource = readPage("users");
    const productsSource = readPage("products");
    const contractsSource = readPage("contracts");
    const maintenancesSource = readPage("maintenances");
    const blogsSource = readPage("blogs");
    const customerSource = readComponent("Customers/CustomerListItem.tsx");
    const inspectionsSource = readComponent("Inspections/InspectionsTable.tsx");

    const sources = [
      usersSource,
      productsSource,
      contractsSource,
      maintenancesSource,
      blogsSource,
      customerSource,
      inspectionsSource,
    ];

    for (const source of sources) {
      // Each source must have Edit area with rounded-lg
      expect(source).toContain("rounded-lg");
    }
  });

  it("all Delete buttons in scope should use outline style (bg-white border-red-300)", () => {
    const usersSource = readPage("users");
    const contractsSource = readPage("contracts");
    const blogsSource = readPage("blogs");
    const customerSource = readComponent("Customers/CustomerListItem.tsx");

    // Each delete button area should have bg-white and border-red-300
    for (const source of [
      usersSource,
      contractsSource,
      blogsSource,
      customerSource,
    ]) {
      expect(source).toContain("bg-white");
      expect(source).toContain("border-red-300");
    }
  });
});
