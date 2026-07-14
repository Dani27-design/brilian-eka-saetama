import { readFileSync } from "fs";
import { resolve } from "path";

describe("BulkEditDialog maintenance interval policy", () => {
  const sourceFilePath = resolve(__dirname, "BulkEditDialog.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should detect when maintenance interval is selected for bulk edit", () => {
    expect(sourceCode).toContain("isMaintenanceIntervalSelected");
    expect(sourceCode).toContain("field.key === 'maintenanceInterval'");
  });

  it("should warn that existing maintenance schedules are not automatically changed", () => {
    expect(sourceCode).toContain(
      "Jadwal maintenance existing tidak otomatis berubah dari bulk edit.",
    );
    expect(sourceCode).toContain(
      "Bulk edit ini hanya mengubah nilai interval pada data produk.",
    );
    expect(sourceCode).toContain(
      "Gunakan flow edit produk untuk preview dan reschedule maintenance.",
    );
  });

  it("should surface how many selected products are on maintenance contracts", () => {
    expect(sourceCode).toContain("maintenanceContractProductCount");
    expect(sourceCode).toContain('contractData?.contractType === "maintenance"');
    expect(sourceCode).toContain(
      "produk terpilih berada pada kontrak maintenance",
    );
  });

  it("should not block bulk update solely because maintenance interval is selected", () => {
    expect(sourceCode).toContain(
      "disabled={isProcessing || selectedFields.length === 0}",
    );
    expect(sourceCode).not.toContain(
      "disabled={isProcessing || selectedFields.length === 0 || isMaintenanceIntervalSelected}",
    );
  });
});
