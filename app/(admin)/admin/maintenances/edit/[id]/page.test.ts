import { readFileSync } from "fs";
import { resolve } from "path";

describe("Maintenance edit product reference repair", () => {
  const sourceFilePath = resolve(__dirname, "page.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("uses the shared maintenance overlap validator", () => {
    expect(sourceCode).toContain("@/utils/maintenanceOverlapValidator");
    expect(sourceCode).toContain("assertNoMaintenanceOverlap");
    expect(sourceCode).toContain("MaintenanceOverlapError");
  });

  it("tracks invalid reference state and repair product selection", () => {
    expect(sourceCode).toContain('type ReferenceState = "valid" | "missing" | "not_found"');
    expect(sourceCode).toContain("contractReferenceState");
    expect(sourceCode).toContain("productReferenceState");
    expect(sourceCode).toContain("repairProductOptions");
    expect(sourceCode).toContain("selectedRepairProductId");
  });

  it("loads repair options only from the current contract products", () => {
    expect(sourceCode).toContain("contractDataForRepair?.products");
    expect(sourceCode).toContain("contractDataForRepair.products.map");
    expect(sourceCode).toContain("getDoc(productRef)");
    expect(sourceCode).not.toContain('collection(firestore, "products")');
    expect(sourceCode).not.toContain("collection(firestore, 'products')");
  });

  it("does not invent a product type fallback for repair options", () => {
    expect(sourceCode).toContain("isProductType(productData.productType)");
    expect(sourceCode).not.toContain('productType: productData.productType || "APAR"');
  });

  it("renders repair selection only when product reference is invalid", () => {
    expect(sourceCode).toContain('productReferenceState === "valid"');
    expect(sourceCode).toContain("Referensi produk tidak valid");
    expect(sourceCode).toContain("Pilih produk pengganti");
    expect(sourceCode).toContain('disabled={contractReferenceState !== "valid" || repairProductOptions.length === 0}');
  });

  it("blocks repair when the contract reference is invalid", () => {
    expect(sourceCode).toContain('contractReferenceState !== "valid" || !hasReferenceId(form.contract)');
    expect(sourceCode).toContain("Kontrak harus valid sebelum referensi produk dapat diperbaiki.");
  });

  it("validates overlap with the current maintenance excluded", () => {
    const overlapCallStart = sourceCode.indexOf("await assertNoMaintenanceOverlap({");
    const updateDataStart = sourceCode.indexOf("const updateData:");

    expect(overlapCallStart).toBeGreaterThan(-1);
    expect(updateDataStart).toBeGreaterThan(overlapCallStart);

    const overlapBlock = sourceCode.substring(overlapCallStart, updateDataStart);
    expect(overlapBlock).toContain("contractRef: form.contract");
    expect(overlapBlock).toContain("productRef: selectedRepairProductRef");
    expect(overlapBlock).toContain("excludeMaintenanceId: form.id");
  });

  it("blocks product type changes after inspection exists", () => {
    expect(sourceCode).toContain("form.inspection && selectedRepairProduct.productType !== form.productType");
    expect(sourceCode).toContain("Produk pengganti harus memiliki tipe yang sama");
  });

  it("writes repaired product, product type, and repair metadata", () => {
    expect(sourceCode).toContain("updateData.product = selectedRepairProductRef");
    expect(sourceCode).toContain("updateData.productType = selectedRepairProduct.productType");
    expect(sourceCode).toContain("updateData.repairMeta");
    expect(sourceCode).toContain('reason: "missing_product_reference"');
    expect(sourceCode).toContain("previousProductReferenceState: productReferenceState");
    expect(sourceCode).toContain("repairedAt: serverTimestamp()");
    expect(sourceCode).toContain("repairedBy: userRef");
  });
});
