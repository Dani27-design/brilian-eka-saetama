import { readFileSync } from "fs";
import { resolve } from "path";

describe("DB-003: Contract deletion uses atomic batch", () => {
  const sourceFilePath = resolve(__dirname, "page.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should import writeBatch from firebase/firestore", () => {
    expect(sourceCode).toMatch(/import\s*\{[^}]*writeBatch[^}]*\}\s*from\s*["']firebase\/firestore["']/);
  });

  it("should use writeBatch in handleDelete", () => {
    // Find handleDelete function - extract from function start to the closing };
    const handleDeleteStart = sourceCode.indexOf("handleDelete = async");
    expect(handleDeleteStart).toBeGreaterThan(-1);

    // Find the end of handleDelete by looking for the pattern "  };\n\n  return"
    // which marks the end of the function before the component return
    const handleDeleteEnd = sourceCode.indexOf("  };\n\n  return", handleDeleteStart);
    expect(handleDeleteEnd).toBeGreaterThan(handleDeleteStart);

    const handleDeleteBody = sourceCode.slice(handleDeleteStart, handleDeleteEnd + 4);
    expect(handleDeleteBody).toContain("writeBatch");
    expect(handleDeleteBody).toContain("batch.commit()");
  });

  it("should NOT use Promise.all with individual deleteDoc for maintenances", () => {
    // Old pattern: Promise.all(maintenanceDeletions) with individual deleteDoc
    const handleDeleteStart = sourceCode.indexOf("handleDelete = async");
    const handleDeleteEnd = sourceCode.indexOf("  };\n\n  return", handleDeleteStart);
    const handleDeleteBody = sourceCode.slice(handleDeleteStart, handleDeleteEnd + 4);

    // Should NOT have the old pattern of mapping deleteDoc then Promise.all
    expect(handleDeleteBody).not.toMatch(/\.map\(\s*\n?\s*\(?maintenanceDoc\)?\s*=>\s*deleteDoc/);
  });

  it("should NOT use sequential updateDoc for products", () => {
    // Old pattern: for loop with individual await updateDoc
    const handleDeleteStart = sourceCode.indexOf("handleDelete = async");
    const handleDeleteEnd = sourceCode.indexOf("  };\n\n  return", handleDeleteStart);
    const handleDeleteBody = sourceCode.slice(handleDeleteStart, handleDeleteEnd + 4);

    expect(handleDeleteBody).not.toMatch(/for\s*\([^)]*productId[^)]*\)\s*\{[\s\S]*?await\s+updateDoc/);
  });

  it("should not have debug console.log", () => {
    const lines = sourceCode.split("\n");
    const logLines = lines.filter(
      (line) =>
        line.includes("console.log(") &&
        !line.trim().startsWith("//")
    );
    expect(logLines).toEqual([]);
  });

  it("should not have raw error objects in console.error", () => {
    const lines = sourceCode.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("//")) continue;
      if (line.includes("console.error(")) {
        const badPattern = /console\.error\([^)]*,\s*(error|err)\s*\)/;
        if (badPattern.test(line)) {
          throw new Error(`Found raw error object in console.error: ${line.trim()}`);
        }
      }
    }
  });
});
