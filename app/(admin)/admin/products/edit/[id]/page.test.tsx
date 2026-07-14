/**
 * Tests for UI-EDIT: Edit Product page visual alignment
 *
 * Validates that the edit product page uses the unified admin card styling:
 * - Outer wrapper has flex h-full flex-col
 * - Form card has rounded-lg, border-white/80, shadow-sm
 * - Submit button text is preserved
 */

import { readFileSync } from "fs";
import { resolve } from "path";

describe("Edit Product Page — Visual Alignment", () => {
  const sourceFilePath = resolve(__dirname, "page.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should render without syntax errors (file is readable)", () => {
    expect(sourceCode).toBeDefined();
    expect(sourceCode.length).toBeGreaterThan(0);
    expect(sourceCode).toContain("export default function EditProductPage");
  });

  it("should have outer wrapper with flex h-full flex-col classes", () => {
    // Find the main return statement's first div (outer wrapper)
    // Skip the loading return: if (loading) return <div...
    const mainReturnMatch = sourceCode.match(/return\s*\(\s*<div\s+className="([^"]*)"\s*>\s*\{\/\* Back button/);
    expect(mainReturnMatch).not.toBeNull();
    const outerClasses = mainReturnMatch![1];
    expect(outerClasses).toContain("flex");
    expect(outerClasses).toContain("h-full");
    expect(outerClasses).toContain("flex-col");
  });

  it("should have form card with rounded-lg, border-white/80, shadow-sm classes", () => {
    // The form container should have the unified card styling
    // Current: shadow-default rounded-sm border border-stroke
    // Expected: rounded-lg border-white/80 shadow-sm
    const formCardMatch = sourceCode.match(
      /<div\s+className="([^"]*rounded-lg[^"]*border-white\/80[^"]*bg-white[^"]*shadow-sm[^"]*p-4[^"]*)"/,
    );
    expect(formCardMatch).not.toBeNull();
    const cardLine = formCardMatch![0];
    expect(cardLine).toContain("rounded-lg");
    expect(cardLine).toContain("border-white/80");
    expect(cardLine).toContain("shadow-sm");
  });

  it("should have submit button with correct text", () => {
    // Verify the submit button text is preserved
    expect(sourceCode).toContain('Simpan Produk');
    expect(sourceCode).toContain('type="submit"');
  });

  it("should import rescheduler utilities and Modal for interval change preview", () => {
    expect(sourceCode).toContain("@/utils/maintenanceIntervalRescheduler");
    expect(sourceCode).toContain("buildIntervalReschedulePlan");
    expect(sourceCode).toContain("applyIntervalReschedulePlan");
    expect(sourceCode).toContain("StaleReschedulePlanError");
    expect(sourceCode).toContain('import Modal from "@/components/Admin/Modal"');
  });

  it("should store original product snapshot for interval comparison", () => {
    expect(sourceCode).toContain("originalProductSnapshot");
    expect(sourceCode).toContain("setOriginalProductSnapshot");
    expect(sourceCode).toContain("maintenanceInterval: initialMaintenanceInterval");
    expect(sourceCode).toContain("contractType: fetchedContractData?.contractType || null");
  });

  it("should build reschedule preview only for changed interval on maintenance contract", () => {
    expect(sourceCode).toContain("oldInterval !== newInterval");
    expect(sourceCode).toContain('originalProductSnapshot?.contractType === "maintenance"');
    expect(sourceCode).toContain("buildIntervalReschedulePlan({");
    expect(sourceCode).toContain('mode: "future_only"');
    expect(sourceCode).toContain('mode: "cut_active_period_once"');
    expect(sourceCode).toContain("newInterval < (oldInterval as number)");
    expect(sourceCode).toContain("setShowRescheduleModal(true)");
  });

  it("should provide the required preview modal actions", () => {
    expect(sourceCode).toContain('title="Preview Reschedule Maintenance"');
    expect(sourceCode).toContain("Simpan Produk Saja");
    expect(sourceCode).toContain("Terapkan Pilihan Ini");
    expect(sourceCode).toContain("Batal");
  });

  it("should apply reschedule with product update data atomically", () => {
    expect(sourceCode).toContain("handleSaveAndReschedule");
    expect(sourceCode).toContain("applyIntervalReschedulePlan({");
    expect(sourceCode).toContain("approvedPlan: selectedReschedulePlan");
    expect(sourceCode).toContain("productUpdateData: pendingProductUpdate");
  });

  it("should disable apply when the plan cannot apply or product type changed", () => {
    expect(sourceCode).toContain("productTypeChangedWithInterval");
    expect(sourceCode).toContain("!productTypeChangedWithInterval");
    expect(sourceCode).toContain("Boolean(selectedReschedulePlan?.canApply)");
    expect(sourceCode).toContain("disabled={!canApplyReschedule}");
  });

  it("should handle stale reschedule plan errors without redirecting", () => {
    expect(sourceCode).toContain("err instanceof StaleReschedulePlanError");
    expect(sourceCode).toContain("Data maintenance berubah setelah preview dibuat");
    expect(sourceCode).toContain("setFutureOnlyPlan(null)");
    expect(sourceCode).toContain("setActiveCutPlan(null)");
  });

  it("should store separate normal and active-cut plans with selected mode state", () => {
    expect(sourceCode).toContain("futureOnlyPlan");
    expect(sourceCode).toContain("activeCutPlan");
    expect(sourceCode).toContain("selectedRescheduleMode");
    expect(sourceCode).toContain('useState<IntervalRescheduleMode>("future_only")');
  });

  it("should show active period cut copy and before-after preview table", () => {
    expect(sourceCode).toContain("Koreksi 1 periode aktif");
    expect(sourceCode).toContain("Reschedule jadwal berikutnya");
    expect(sourceCode).toContain("Jadwal yang sedang berjalan");
    expect(sourceCode).toContain("Sebelum");
    expect(sourceCode).toContain("Sesudah");
    expect(sourceCode).toContain("Belum tersedia / jadwal lama terlalu panjang");
  });

  it("should show high-risk active cut warning copy", () => {
    expect(sourceCode).toContain("Jadwal yang dipotong sudah memiliki inspeksi atau status penting");
    expect(sourceCode).toContain("Data inspeksi, status, dan engineer tidak akan diubah");
    expect(sourceCode).toContain("mencatat audit otomatis");
  });

  it("should keep product-only save available when active cut is blocked", () => {
    expect(sourceCode).toContain("Koreksi 1 periode aktif belum bisa diterapkan");
    expect(sourceCode).toContain("Pilihan ini belum bisa diterapkan");
    expect(sourceCode).toContain("Simpan Produk Saja");
  });
});
