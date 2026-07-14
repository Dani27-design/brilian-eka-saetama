# Maintenance Active Period Cut Rescheduling Plan

## Status Dokumen

Status: planning teknis, belum implementasi.

Scope: website admin dashboard, khususnya edit produk, reschedule maintenance, inspection, certificate, dan data integrity untuk maintenance period.

Tujuan dokumen ini adalah merencanakan fitur lanjutan untuk kasus interval maintenance dipendekkan saat periode maintenance lama masih mencakup tanggal saat ini. Fitur ini tidak menggantikan mode reschedule existing `future_only`; fitur ini menambah kemampuan koreksi terbatas untuk satu periode aktif.

## Masalah Yang Ingin Diselesaikan

Contoh kasus:

- Produk awalnya punya `maintenanceInterval = 120`.
- Contract maintenance menghasilkan maintenance periode `April - Agustus`.
- Pada bulan Juli, admin mengubah interval menjadi `60`.
- Secara operasional, periode lama seharusnya turun menjadi kira-kira `April - Juni`, sehingga maintenance berikutnya `Juni/Juli - Agustus` bisa tersedia untuk inspeksi di bulan Juli.

Masalah pada behavior saat ini:

- `utils/maintenanceIntervalRescheduler.ts` hanya mengganti maintenance dengan status `pending` atau `scheduled` tanpa inspection.
- Maintenance dengan status `approved`, `in_progress`, `waiting_approval`, `rejected`, atau yang memiliki `inspection` dipertahankan sebagai preserved.
- Jika maintenance `April - Agustus` preserved, jadwal baru `April - Juni` / `Juni - Agustus` akan overlap dengan preserved maintenance lama dan apply diblok.

Akibatnya admin tidak punya cara aman untuk mengoreksi satu periode aktif yang terlalu panjang tanpa melanggar overlap invariant.

## Keputusan Produk Yang Sudah Dikonfirmasi

Keputusan ini menjadi dasar implementasi dan menggantikan pertanyaan terbuka awal:

1. Active period cut boleh dilakukan walaupun anchor maintenance berstatus `approved`.
2. Active period cut boleh dilakukan walaupun anchor maintenance berstatus `waiting_approval`.
3. Admin tidak perlu mengisi alasan manual; metadata otomatis sudah cukup.
4. Certificate validity tetap mengikuti behavior saat ini, yaitu `inspection.createdAt + product.maintenanceInterval`.
5. UI harus menampilkan opsi active period cut saat interval dipendekkan, bukan hanya saat normal reschedule gagal.
6. UI harus ditulis untuk admin non-IT: bahasa jelas, tidak memakai istilah teknis seperti "anchor", "preserved", "replaceable" sebagai label utama.

Implikasi keputusan:

- Fitur ini adalah tindakan koreksi data yang legitimate, bukan workaround.
- Karena approved dan waiting approval boleh dipotong, audit metadata wajib lengkap.
- Karena UI selalu tersedia saat interval dipendekkan, engine harus bisa menghasilkan dua preview berdampingan:
  - preview reschedule normal `future_only`;
  - preview koreksi satu periode aktif `cut_active_period_once`.

## Glossary Untuk UI dan Kode

Istilah teknis tetap boleh dipakai di kode, tetapi label UI harus ramah admin.

| Istilah kode | Makna teknis | Label UI yang disarankan |
| --- | --- | --- |
| `anchor` | Maintenance existing yang menjadi titik koreksi | Jadwal yang sedang berjalan |
| `active period cut` | Memotong `endDate` satu maintenance aktif | Koreksi 1 periode aktif |
| `replaceable` | Maintenance future yang akan dihapus lalu dibuat ulang | Jadwal lama yang diganti |
| `preserved` | Maintenance yang tidak disentuh | Jadwal yang dipertahankan |
| `conflict` | Jadwal baru overlap dengan jadwal yang dipertahankan | Jadwal bentrok |
| `stale plan` | Data berubah setelah preview dibuat | Preview sudah kedaluwarsa |

UI tidak boleh hanya menampilkan teks seperti `anchorMaintenanceId`, `conflict`, atau `writeSummary` tanpa penjelasan yang mudah dipahami.

## File dan Behavior Saat Ini

### Scheduler

File:

```text
utils/maintenanceScheduler.ts
```

Behavior:

- `calculateMaintenanceSchedules(startDate, endDate, interval)` menghasilkan periode inklusif.
- End date periode dihitung dengan `startDate + interval - 1 hari`.
- Periode berikutnya mulai dari `previousEndDate + 1 hari`.

Konsekuensi untuk active period cut:

- Jika anchor start `2026-04-01` dan interval baru `60`, corrected end date adalah `2026-05-30`.
- Next schedule harus mulai `2026-05-31`, bukan di tanggal yang sama dengan corrected end.
- Dokumen ini memakai aturan H+1 karena itu adalah behavior scheduler existing.

### Maintenance Data

File:

```text
types/maintenances.ts
docs/specs/maintenances.md
```

Field terkait:

- `status`
- `startDate`
- `endDate`
- `inspection`
- `engineer`
- `updatedAt`
- `updatedBy`

Status workflow:

```text
pending -> scheduled -> in_progress -> waiting_approval -> approved
                                                 -> rejected -> waiting_approval
```

Behavior penting:

- `engineer` berisi assignment engineer.
- `inspection` berisi data inspeksi yang dibuat engineer dan dapat diedit admin.
- `approved` berarti inspeksi sudah disetujui admin.

Konsekuensi:

- Mengubah `endDate` pada maintenance yang sudah memiliki inspection atau approved adalah tindakan koreksi data operasional, bukan reschedule biasa.
- Fitur harus menyimpan audit metadata yang jelas.

### Rescheduler Existing

File:

```text
utils/maintenanceIntervalRescheduler.ts
```

Behavior saat ini:

- Input mode hanya `"future_only"`.
- Replaceable hanya:
  - status `pending`
  - status `scheduled`
  - tidak punya `inspection`
- Preserved jika:
  - punya `inspection`
  - status `in_progress`
  - status `waiting_approval`
  - status `approved`
  - status `rejected`
- Apply melakukan:
  - revalidation
  - update product interval
  - delete replaceable maintenance
  - create maintenance baru
  - metadata `generationReason: "interval_change"`

Konsekuensi:

- Active period cut harus menjadi mode baru atau util baru.
- Jangan mengubah behavior `future_only` secara diam-diam.

### Edit Produk

File:

```text
app/(admin)/admin/products/edit/[id]/page.tsx
```

Behavior saat ini:

- Saat interval berubah dan product berada di contract maintenance, page membangun preview reschedule.
- Admin dapat memilih:
  - batal
  - simpan produk saja
  - simpan dan reschedule
- Apply menggunakan `applyIntervalReschedulePlan`.

Konsekuensi:

- UI preview perlu menampilkan opsi active period cut hanya jika plan normal diblok karena preserved active maintenance yang bisa dikoreksi.
- Jangan jadikan active cut sebagai default tanpa preview eksplisit.

### Inspection dan Certificate

File terkait:

```text
app/(admin)/admin/inspections/edit/[id]/page.tsx
components/Admin/Inspections/InspectionPageContent.tsx
components/Admin/Inspections/InspectionsTable.tsx
utils/pdfCertificate.ts
app/api/product/[productId]/certificates/route.ts
```

Behavior yang ditemukan:

- Inspection list membaca maintenance yang punya `inspection.createdAt`.
- Certificate hanya tersedia untuk status `approved`.
- `createCertificateData` menghitung `validUntil` dari `inspection.createdAt + product.maintenanceInterval`.
- Public certificate endpoint mengambil maintenance approved by product.

Konsekuensi:

- Jika maintenance approved dipotong endDate-nya, certificate tetap tampil karena status dan inspection tetap ada.
- Certificate validity saat ini berbasis product interval saat certificate dibuat, bukan maintenance `endDate`.
- Jika bisnis ingin certificate validity mengikuti corrected maintenance endDate, itu adalah perubahan terpisah dan tidak boleh terselip dalam active period cut.

## Keputusan Awal Yang Diusulkan

Fitur ini bernama:

```text
Active period cut
```

Definisi:

Active period cut adalah koreksi terbatas yang memotong `endDate` satu maintenance anchor yang sedang mencakup `changedAt`, ketika interval produk dipendekkan dan maintenance lama terlalu panjang untuk kondisi operasional sekarang.

Keputusan awal:

1. Hanya satu maintenance anchor yang boleh dipotong dalam satu apply.
2. Anchor harus maintenance untuk kombinasi `contract + product` yang sama.
3. Anchor harus mencakup `changedAt`:

```ts
anchor.startDate <= changedAt && anchor.endDate >= changedAt
```

4. Fitur hanya berlaku ketika `newInterval < oldInterval`.
5. Corrected end date dihitung dari anchor start:

```text
correctedAnchorEndDate = anchor.startDate + newInterval - 1 hari
```

6. `correctedAnchorEndDate` harus lebih kecil dari `anchor.endDate` lama.
7. Maintenance baru setelah anchor dimulai dari:

```text
correctedAnchorEndDate + 1 hari
```

8. Maintenance baru mengikuti `calculateMaintenanceSchedules(nextStartDate, contractEndDate, newInterval)`.
9. Maintenance future yang aman tetap boleh diganti seperti mode `future_only`.
10. Maintenance preserved lain tidak boleh diubah.
11. Jika jadwal baru overlap dengan preserved maintenance lain, apply harus diblok.

## Status Policy

### Anchor yang boleh dipotong

Untuk fase pertama, anchor boleh dipotong jika:

- status `pending`
- status `scheduled`
- status `in_progress`
- status `waiting_approval`
- status `approved`
- status `rejected`

Dengan guard tambahan:

- hanya anchor yang mencakup `changedAt`;
- hanya satu dokumen anchor;
- tidak mengubah `startDate`;
- hanya mengubah `endDate`;
- tidak menghapus `inspection`;
- tidak mengubah checklist/photos/createdBy/createdAt inspection;
- tidak mengubah status anchor;
- tidak mengubah engineer anchor.

Catatan risiko:

- Memotong `approved` atau maintenance dengan `inspection` berarti memperbaiki makna periode historis. Ini hanya boleh dilakukan jika UI menampilkan warning eksplisit dan metadata audit lengkap.

### Maintenance future yang boleh diganti

Tetap mengikuti policy existing:

- status `pending` atau `scheduled`;
- tidak punya `inspection`;
- startDate setelah corrected anchor end date;
- berada dalam window sampai contract end.

Jika future maintenance punya engineer tetapi belum inspection:

- Boleh diganti, seperti keputusan sebelumnya.
- Preview wajib menyebut assignment engineer akan hilang.

### Maintenance yang harus tetap preserved

Selain anchor yang dipotong, preserved tetap:

- punya `inspection`;
- status `in_progress`;
- status `waiting_approval`;
- status `approved`;
- status `rejected`;
- date/reference invalid;
- maintenance sebelum anchor;
- maintenance yang tidak aman diklasifikasikan.

## Data Invariant

Invariant dari plan sebelumnya tetap berlaku:

1. Tidak boleh ada overlap untuk `contract + product`.
2. Maintenance valid harus memiliki `contract`, `product`, `productType`, `startDate`, `endDate`, dan status valid.
3. Data invalid tidak boleh membuat UI crash.
4. Apply harus revalidate sebelum write.
5. Preview stale harus batal.

Invariant tambahan active period cut:

1. Hanya satu anchor maintenance yang boleh di-update endDate.
2. Anchor startDate tidak boleh berubah.
3. Anchor endDate baru tidak boleh melewati anchor startDate.
4. Anchor endDate baru harus lebih kecil dari anchor endDate lama.
5. Anchor yang dipotong harus dicatat dalam audit metadata.
6. Maintenance baru tidak boleh mulai sebelum `correctedAnchorEndDate + 1 hari`.
7. Tidak boleh ada gap/overlap antara corrected anchor dan first new schedule, kecuali contract end sudah tercapai.

## Struktur Data Baru

### Mode Baru

Tambahkan mode baru pada input rescheduler:

```ts
type IntervalRescheduleMode =
  | "future_only"
  | "cut_active_period_once";
```

Untuk backward compatibility, mode existing tetap berjalan sebagai sekarang.

Perubahan konkret di `utils/maintenanceIntervalRescheduler.ts`:

```ts
export type IntervalRescheduleMode =
  | "future_only"
  | "cut_active_period_once";

export type BuildIntervalReschedulePlanInput = {
  productId: string;
  oldInterval: number;
  newInterval: number;
  changedAt: Date;
  mode: IntervalRescheduleMode;
};
```

Field `mode` pada `ReschedulePlan` juga harus berubah dari literal `"future_only"` menjadi `IntervalRescheduleMode`.

### Preview Data Tambahan

Tambahkan field opsional ke `ReschedulePlan` atau buat plan type baru yang compatible:

```ts
type ActivePeriodCutPreview = {
  anchorMaintenanceId: string;
  anchorStatus: MaintenanceStatus;
  anchorHasInspection: boolean;
  previousStartDate: Date;
  previousEndDate: Date;
  correctedStartDate: Date;
  correctedEndDate: Date;
  nextScheduleStartDate: Date | null;
  warningLevel: "normal" | "high";
  warnings: string[];
  canCut: boolean;
  blockedReason?: string;
};
```

Tambahkan ke plan:

```ts
activePeriodCut?: ActivePeriodCutPreview;
```

Makna field:

- `anchorMaintenanceId`: id maintenance yang akan dipotong.
- `anchorStatus`: status maintenance saat preview dibuat.
- `anchorHasInspection`: `true` jika anchor punya `inspection`.
- `previousStartDate`: startDate lama anchor. Hanya untuk display dan audit.
- `previousEndDate`: endDate lama anchor. Hanya untuk display dan audit.
- `correctedStartDate`: sama dengan `previousStartDate`; disimpan agar preview eksplisit.
- `correctedEndDate`: endDate baru anchor.
- `nextScheduleStartDate`: tanggal mulai jadwal baru pertama setelah anchor dipotong. `null` jika corrected end sudah mencapai contract end.
- `warningLevel`: `high` jika anchor approved, waiting approval, rejected, in progress, atau punya inspection.
- `warnings`: daftar pesan UI.
- `canCut`: true jika secara teknis anchor bisa dipotong.
- `blockedReason`: reason jika mode active cut tidak bisa dipakai.

### Snapshot Tambahan

`RescheduleMaintenanceSnapshot` saat ini hanya menyimpan field yang dibutuhkan preview. Untuk active cut, field ini cukup, tetapi warning UI butuh status dan inspection. Field existing sudah mencakup:

```ts
{
  id;
  startDate;
  endDate;
  status;
  hasInspection;
  engineerIds;
}
```

Tidak perlu menambahkan `inspection` lengkap ke snapshot. Jangan membawa checklist/photos ke plan karena plan harus tetap ringan dan tidak boleh menjadi sumber tulis untuk inspection.

### Apply Result Tambahan

```ts
type ApplyIntervalReschedulePlanResult = {
  generationBatchId: string;
  deletedMaintenanceIds: string[];
  createdMaintenanceIds: string[];
  createdCount: number;
  updatedProductId: string;
  correctedMaintenanceId?: string;
  committedPlan: ReschedulePlan;
};
```

### Helper Baru Yang Disarankan

Tambahkan helper internal agar logic tidak tersebar:

```ts
function addDays(date: Date, days: number): Date
function isDateWithinRange(date: Date, start: Date, end: Date): boolean
function findActiveMaintenanceForCut(
  maintenances: RescheduleMaintenanceSnapshot[],
  changedAt: Date
): RescheduleMaintenanceSnapshot | null
function buildActiveCutWarnings(anchor: RescheduleMaintenanceSnapshot): string[]
function activeCutSchedulesMatch(
  approvedPlan: ReschedulePlan,
  currentPlan: ReschedulePlan
): boolean
```

Aturan helper:

- `addDays` harus clone Date, tidak mutate input.
- Semua perbandingan memakai `getTime()` untuk menghindari object identity Date.
- `findActiveMaintenanceForCut` harus memilih satu maintenance saja. Jika data corrupt menghasilkan lebih dari satu active overlap untuk `changedAt`, plan harus diblok karena invariant overlap sudah rusak.

## Audit Metadata

Saat anchor dipotong, update maintenance anchor dengan metadata:

```ts
periodCorrectionMeta: {
  reason: "interval_change_active_period_cut",
  previousStartDate: Timestamp,
  previousEndDate: Timestamp,
  correctedStartDate: Timestamp,
  correctedEndDate: Timestamp,
  previousProductInterval: number,
  newProductInterval: number,
  changedAt: Timestamp,
  correctedAt: serverTimestamp(),
  correctedBy: userRef,
  generationBatchId: string,
  generatedNextMaintenanceIds: string[]
}
```

Top-level update anchor:

```ts
{
  endDate: Timestamp.fromDate(correctedEndDate),
  updatedAt: serverTimestamp(),
  updatedBy: userRef,
  periodCorrectionMeta: { ... }
}
```

Catatan:

- Jangan menimpa `inspection`.
- Jangan menimpa `engineer`.
- Jangan menimpa `status`.
- Jangan menimpa `createdAt` / `createdBy`.

## Algoritma Build Plan

Input:

```ts
{
  productId,
  oldInterval,
  newInterval,
  changedAt,
  mode: "cut_active_period_once"
}
```

Langkah:

1. Jalankan validasi awal existing:
   - product exists;
   - product punya contract;
   - contract exists;
   - contract type `maintenance`;
   - contract endDate valid;
   - product ada di `contract.products`;
   - interval baru valid.

2. Validasi khusus:
   - `newInterval < oldInterval`;
   - `changedAt` valid.

3. Query maintenance existing:

```ts
where("contract", "==", contractRef)
where("product", "==", productRef)
```

4. Convert dan sort maintenance by `startDate`.

5. Cari anchor:

```ts
anchor = maintenance.find(m =>
  m.startDate <= changedAt &&
  m.endDate >= changedAt
)
```

6. Jika tidak ada anchor, fallback ke mode `future_only` atau tampilkan blocked reason:

```text
Tidak ada maintenance aktif yang mencakup tanggal perubahan.
```

Rekomendasi fase pertama: jangan fallback diam-diam; tampilkan blocked reason agar admin tahu mode active cut tidak relevan.

7. Hitung corrected end:

```ts
correctedEnd = addDays(anchor.startDate, newInterval - 1)
```

8. Validasi corrected end:
   - `correctedEnd < anchor.endDate`;
   - `correctedEnd >= anchor.startDate`;
   - `correctedEnd < contractEndDate` jika akan membuat schedule lanjutan.

9. Hitung next schedule start:

```ts
nextStart = addDays(correctedEnd, 1)
```

10. Generate new schedules:

```ts
calculateMaintenanceSchedules(nextStart, contractEndDate, newInterval)
```

11. Klasifikasi maintenance:
   - anchor masuk `activePeriodCut`;
   - maintenance sebelum atau sama dengan anchor selain anchor preserved;
   - future `pending/scheduled` tanpa inspection replaceable;
   - future preserved tetap preserved;
   - invalid masuk blocked.

12. Deteksi conflict:
   - new schedules tidak boleh overlap preserved maintenance selain anchor yang sudah dikoreksi;
   - new schedules tidak boleh overlap anchor corrected period.

13. Hitung write summary:

```ts
estimatedWrites =
  1 // update product
  + 1 // update anchor endDate
  + replaceableMaintenances.length
  + newSchedules.length
```

14. Jika ada conflict, blocked, atau write > 450, `canApply = false`.

### Detail Klasifikasi Untuk Mode `cut_active_period_once`

Mode active cut tidak boleh memakai `findAnchorMaintenance` existing karena helper itu hanya mencari maintenance replaceable. Buat path terpisah:

```ts
const activeMaintenances = existingMaintenances.filter((maintenance) =>
  isDateWithinRange(input.changedAt, maintenance.startDate, maintenance.endDate)
);
```

Aturan:

1. Jika `activeMaintenances.length === 0`, plan blocked:

```text
Tidak ada jadwal aktif yang mencakup tanggal perubahan interval.
```

2. Jika `activeMaintenances.length > 1`, plan blocked:

```text
Ada lebih dari satu jadwal aktif pada tanggal perubahan. Data perlu diperiksa karena jadwal produk ini overlap.
```

3. Jika tepat satu, maintenance itu menjadi `activePeriodCut`.

Klasifikasi setelah anchor ditemukan:

| Kondisi maintenance | Klasifikasi |
| --- | --- |
| `id === activeCut.anchorMaintenanceId` | anchor, update endDate saja |
| `endDate < anchor.startDate` | preserved |
| `startDate <= correctedEndDate` dan bukan anchor | blocked, karena overlap dengan corrected anchor atau data tidak deterministic |
| `startDate > correctedEndDate` dan replaceable | replaceable |
| `startDate > correctedEndDate` dan preserved | preserved |
| invalid date/reference/status | blocked |

Future replaceable harus memakai window setelah corrected anchor:

```ts
maintenance.startDate > correctedEndDate
```

Jangan masukkan anchor ke `replaceableMaintenances`, walaupun status anchor `pending` atau `scheduled`.

### Generate Jadwal Baru Setelah Cut

Setelah corrected end dihitung:

```ts
const nextStart = addDays(correctedEnd, 1);
```

Jika `nextStart > contractEndDate`, maka tidak perlu membuat jadwal baru:

```ts
newSchedules = [];
nextScheduleStartDate = null;
```

Jika `nextStart <= contractEndDate`, generate:

```ts
newSchedules = calculateMaintenanceSchedules(
  nextStart,
  contractEndDate,
  input.newInterval,
);
```

Contoh konkret:

```text
contractEndDate: 2026-08-31
anchor old:     2026-04-01 sampai 2026-08-31
newInterval:    60
corrected:      2026-04-01 sampai 2026-05-30
nextStart:      2026-05-31
new schedule 1: 2026-05-31 sampai 2026-07-29
new schedule 2: 2026-07-30 sampai 2026-08-31
```

Catatan penting:

- Jika user bisnis menyebut "April - Juni", UI boleh menampilkan bulan secara natural, tetapi tanggal sistem tetap mengikuti kalkulasi inklusif.
- Jangan membuat jadwal baru mulai pada tanggal yang sama dengan corrected end, karena itu akan overlap 1 hari.

### Conflict Detection Untuk Active Cut

Conflict dicek terhadap:

1. Corrected anchor period.
2. Semua preserved maintenance selain anchor.
3. Semua existing maintenance yang tidak masuk delete list.

Pseudocode:

```ts
for (const newSchedule of newSchedules) {
  if (rangesOverlap(newSchedule.startDate, newSchedule.endDate, correctedAnchor.startDate, correctedAnchor.endDate)) {
    conflicts.push(...);
  }

  for (const preserved of preservedMaintenances) {
    if (rangesOverlap(newSchedule.startDate, newSchedule.endDate, preserved.startDate, preserved.endDate)) {
      conflicts.push(...);
    }
  }
}
```

Jika conflict muncul, `canApply = false`.

### Apply Blocked Reason Yang Harus Spesifik

Jangan gunakan satu pesan generik untuk semua active cut failure. Minimal reason:

| Kondisi | `applyBlockedReason` |
| --- | --- |
| `newInterval >= oldInterval` | `Koreksi 1 periode hanya tersedia saat interval dipendekkan.` |
| tidak ada active anchor | `Tidak ada jadwal aktif yang mencakup tanggal perubahan interval.` |
| lebih dari satu active anchor | `Ada lebih dari satu jadwal aktif pada tanggal perubahan. Periksa overlap data maintenance terlebih dahulu.` |
| corrected end >= old end | `Periode aktif tidak perlu dipotong karena hasil interval baru tidak lebih pendek dari periode saat ini.` |
| corrected end < start | `Tanggal akhir koreksi tidak valid.` |
| invalid reference/date | `Ada maintenance existing dengan data tidak valid.` |
| conflict | `Jadwal baru bentrok dengan jadwal yang harus dipertahankan.` |
| write > 450 | `Estimasi write melebihi batas aman 450 operasi.` |

## Algoritma Apply

Apply wajib revalidate.

Langkah:

1. Terima approved plan.
2. Jika `canApply === false`, throw.
3. Rebuild plan dari Firestore dengan input sama.
4. Bandingkan:
   - productId;
   - contractId;
   - oldInterval;
   - newInterval;
   - mode;
   - anchorMaintenanceId;
   - correctedEndDate;
   - replaceableMaintenanceIds;
   - newSchedules;
   - conflicts kosong;
   - blocked kosong.

5. Jika tidak match, throw `StaleReschedulePlanError`.
6. Buat `generationBatchId`.
7. `writeBatch`:
   - update product interval;
   - update anchor `endDate` dan `periodCorrectionMeta`;
   - delete future replaceable maintenance;
   - create new maintenance docs.
8. Commit batch.

### Detail Write Order Dalam Batch

Walaupun Firestore batch atomic dan tidak menjamin urutan observasi, susun command secara konsisten:

1. `batch.update(productRef, productUpdateData + maintenanceInterval + updatedAt + updatedBy)`.
2. Pre-generate semua `maintenanceRef` baru agar id bisa dimasukkan ke `periodCorrectionMeta.generatedNextMaintenanceIds`.
3. `batch.update(anchorRef, { endDate, updatedAt, updatedBy, periodCorrectionMeta })`.
4. `batch.delete` semua future replaceable maintenance.
5. `batch.set` semua maintenance baru.

Kenapa id maintenance baru perlu dibuat sebelum update anchor:

- Audit metadata anchor harus bisa menunjukkan maintenance baru mana yang dibuat sebagai lanjutan dari koreksi ini.
- Ini membantu debug jika admin bertanya mengapa periode lama berubah.

### Field Maintenance Baru Dari Active Cut

Maintenance baru tetap sama seperti hasil reschedule interval:

```ts
{
  contract: contractRef,
  product: productRef,
  productType: currentPlan.productType,
  engineer: null,
  status: "pending",
  startDate: Timestamp.fromDate(schedule.startDate),
  endDate: Timestamp.fromDate(schedule.endDate),
  inspection: null,
  createdAt: serverTimestamp(),
  createdBy: userRef,
  generationReason: "interval_change_active_period_cut",
  generationBatchId,
  sourceProductInterval: currentPlan.newInterval,
  previousProductInterval: currentPlan.oldInterval,
  rescheduledFromProductId: currentPlan.productId,
  rescheduledAt: serverTimestamp(),
  rescheduledBy: userRef,
  activeCutFromMaintenanceId: currentPlan.activePeriodCut.anchorMaintenanceId
}
```

Gunakan `generationReason: "interval_change_active_period_cut"` agar bisa dibedakan dari `future_only` yang memakai `"interval_change"`.

### Revalidation Comparison Tambahan

`planStillMatchesApproved` harus membandingkan active cut field jika `mode === "cut_active_period_once"`:

```ts
approvedPlan.activePeriodCut?.anchorMaintenanceId === currentPlan.activePeriodCut?.anchorMaintenanceId
dateTime(approvedPlan.activePeriodCut?.previousEndDate) === dateTime(currentPlan.activePeriodCut?.previousEndDate)
dateTime(approvedPlan.activePeriodCut?.correctedEndDate) === dateTime(currentPlan.activePeriodCut?.correctedEndDate)
approvedPlan.activePeriodCut?.anchorStatus === currentPlan.activePeriodCut?.anchorStatus
approvedPlan.activePeriodCut?.anchorHasInspection === currentPlan.activePeriodCut?.anchorHasInspection
```

Jika status anchor berubah setelah preview dibuat, apply harus stale.

Alasan:

- Perubahan dari `scheduled` ke `in_progress` atau `waiting_approval` berarti user lain/mobile app mengubah workflow.
- Walaupun status itu masih technically allowed, admin harus melihat ulang warning sebelum apply.

## UI Preview

File utama:

```text
app/(admin)/admin/products/edit/[id]/page.tsx
```

Tambahkan UI hanya saat:

- interval berubah;
- contract type maintenance;
- interval dipendekkan (`newInterval < oldInterval`) untuk opsi active cut;
- active period cut plan bisa dibangun atau bisa memberi blocked reason yang informatif.

Catatan keputusan terbaru:

- Active cut tidak hanya muncul ketika `future_only` gagal.
- Jika interval dipendekkan, admin harus dapat melihat opsi "Koreksi 1 periode aktif" agar paham dampak perubahan interval pada periode berjalan.
- Jika active cut tidak bisa dipakai, UI tetap boleh menampilkan alasan singkat, tetapi tombol apply active cut disabled.

### State UI Yang Disarankan

Tambahkan state terpisah agar normal plan dan active cut plan tidak saling menimpa:

```ts
const [futureOnlyPlan, setFutureOnlyPlan] = useState<ReschedulePlan | null>(null);
const [activeCutPlan, setActiveCutPlan] = useState<ReschedulePlan | null>(null);
const [selectedRescheduleMode, setSelectedRescheduleMode] =
  useState<IntervalRescheduleMode>("future_only");
```

Jika ingin minim perubahan, `reschedulePlan` existing boleh tetap dipakai untuk selected plan, tetapi preview harus tetap menyimpan kedua plan agar admin bisa membandingkan.

Recommended flow saat submit edit produk:

1. Build `future_only` plan seperti sekarang.
2. Jika `newInterval < oldInterval`, build `cut_active_period_once` plan juga.
3. Simpan product update payload sebagai `pendingProductUpdate`.
4. Tampilkan modal preview dengan dua pilihan mode:
   - `Reschedule jadwal berikutnya`;
   - `Koreksi 1 periode aktif`.
5. Default pilihan:
   - Jika active cut plan `canApply`, default ke `Koreksi 1 periode aktif` karena ini menjawab kebutuhan interval dipendekkan saat periode aktif terlalu panjang.
   - Jika active cut tidak bisa apply, default ke `Reschedule jadwal berikutnya`.

### Copy UI Yang Disarankan

Gunakan bahasa operasional:

```text
Koreksi 1 periode aktif
```

Deskripsi:

```text
Sistem akan memperpendek satu jadwal yang sedang berjalan, lalu membuat jadwal berikutnya dari tanggal setelah periode baru selesai.
```

Untuk normal future-only:

```text
Reschedule jadwal berikutnya
```

Deskripsi:

```text
Sistem hanya mengganti jadwal yang masih aman diganti. Jadwal yang sudah memiliki inspeksi atau status final tetap dipertahankan.
```

Untuk warning high risk:

```text
Jadwal yang dipotong sudah memiliki inspeksi atau status penting. Data inspeksi, status, dan engineer tidak akan diubah. Sistem hanya mengoreksi tanggal selesai dan mencatat audit otomatis.
```

Untuk conflict:

```text
Jadwal baru bentrok dengan jadwal yang harus dipertahankan, sehingga koreksi tidak bisa diterapkan.
```

Untuk stale:

```text
Data maintenance berubah setelah preview dibuat. Buat preview ulang sebelum menyimpan.
```

Preview wajib menampilkan:

1. Produk.
2. Contract.
3. Interval lama -> interval baru.
4. Anchor maintenance id.
5. Status anchor.
6. Apakah anchor punya inspection.
7. Periode anchor sebelum koreksi.
8. Periode anchor setelah koreksi.
9. Jumlah future maintenance yang diganti.
10. Jumlah maintenance baru yang dibuat.
11. Warning jika anchor approved atau punya inspection.
12. Warning jika engineer assignment future akan hilang.
13. Conflict list.
14. Tombol:
    - batal;
    - simpan produk saja;
    - simpan dan reschedule normal jika available;
    - potong 1 periode aktif dan reschedule.

### Layout Modal Yang Disarankan

Struktur modal:

1. Ringkasan produk dan kontrak.
2. Banner interval:

```text
Interval berubah dari 120 hari ke 60 hari
```

3. Segmented control / tab sederhana:
   - `Jadwal berikutnya`;
   - `Koreksi 1 periode aktif`.

4. Panel mode terpilih:
   - Apa yang akan berubah.
   - Tanggal sebelum/sesudah.
   - Jumlah jadwal lama yang diganti.
   - Jumlah jadwal baru.
   - Warning dan blocked reason.

5. Footer actions:
   - `Batal`
   - `Simpan Produk Saja`
   - `Terapkan Pilihan Ini`

Tombol `Terapkan Pilihan Ini` harus disabled jika selected plan tidak `canApply` atau tipe produk berubah.

### Tabel Preview Tanggal

Untuk active cut, tampilkan tabel kecil:

| Item | Sebelum | Sesudah |
| --- | --- | --- |
| Jadwal aktif | 01 Apr 2026 - 31 Agu 2026 | 01 Apr 2026 - 30 Mei 2026 |
| Jadwal berikutnya | Belum tersedia / jadwal lama terlalu panjang | 31 Mei 2026 - 29 Jul 2026 |

Jika ada lebih dari satu jadwal baru, tampilkan maksimal 3 jadwal pertama lalu teks:

```text
Dan {n} jadwal berikutnya sampai akhir kontrak.
```

### Guard UI

UI harus memblok apply active cut jika:

- selected plan tidak ada;
- selected plan `canApply === false`;
- product type ikut berubah;
- sedang saving/applying;
- pending product update belum tersedia.

UI tidak boleh memblok "Simpan Produk Saja".

Rekomendasi copy warning:

```text
Tindakan ini akan mengubah end date satu maintenance existing. Inspection, status, dan engineer pada maintenance tersebut tidak diubah. Perubahan dicatat di audit metadata.
```

Jika anchor approved atau punya inspection:

```text
Maintenance ini sudah memiliki inspection atau status final. End date akan dikoreksi tanpa mengubah data inspection/certificate.
```

## Hal Yang Tidak Boleh Dilakukan

1. Jangan memotong lebih dari satu maintenance anchor dalam satu apply.
2. Jangan mengubah `startDate` anchor.
3. Jangan menghapus anchor.
4. Jangan menghapus maintenance yang punya inspection.
5. Jangan mengubah checklist/photos/status/engineer anchor.
6. Jangan membuat maintenance baru yang overlap dengan preserved maintenance.
7. Jangan apply jika preview stale.
8. Jangan menjadikan active period cut default tanpa preview eksplisit.
9. Jangan mengubah certificate validity logic dalam fase ini.
10. Jangan melakukan bulk active period cut.

## Edge Cases

### Skenario Utama 120 Hari Menjadi 60 Hari

Data:

```text
contractEndDate: 2026-08-31
oldInterval: 120
newInterval: 60
changedAt: 2026-07-14
existing maintenance:
  m-active
    startDate: 2026-04-01
    endDate: 2026-08-31
    status: approved
    inspection: exists
```

Expected active cut preview:

```text
activePeriodCut.anchorMaintenanceId = "m-active"
activePeriodCut.previousStartDate = 2026-04-01
activePeriodCut.previousEndDate = 2026-08-31
activePeriodCut.correctedStartDate = 2026-04-01
activePeriodCut.correctedEndDate = 2026-05-30
activePeriodCut.nextScheduleStartDate = 2026-05-31
activePeriodCut.warningLevel = "high"
```

Expected new schedules:

```text
1. 2026-05-31 sampai 2026-07-29
2. 2026-07-30 sampai 2026-08-31
```

Expected writes:

```text
update product maintenanceInterval to 60
update m-active.endDate to 2026-05-30
create maintenance 2026-05-31 sampai 2026-07-29
create maintenance 2026-07-30 sampai 2026-08-31
```

Not allowed:

```text
delete m-active
change m-active.status
change m-active.inspection
change m-active.engineer
create schedule starting 2026-05-30
```

### Contract end lebih dekat dari corrected end

Jika `correctedEnd > contractEndDate`, plan harus diblok karena interval baru tidak menghasilkan koreksi valid.

### Corrected end sama dengan old end

Jika `correctedEnd.getTime() === anchor.endDate.getTime()`, tidak ada yang perlu dipotong. Plan harus memberi info bahwa active cut tidak diperlukan.

### Corrected end sudah lewat jauh

Jika corrected end sudah sebelum `changedAt`, itu tetap valid untuk kasus interval dipendekkan. Tujuannya memang membuat next maintenance tersedia setelah corrected end.

### Anchor belum punya inspection tapi assigned engineer

Anchor tidak dihapus dan engineer tidak berubah. Yang berubah hanya `endDate`. UI harus menyebut bahwa assignment anchor tetap dipertahankan.

### Future scheduled punya engineer

Future scheduled replaceable boleh dihapus/diganti jika belum inspection. UI harus menyebut assignment future akan hilang.

### Preserved future overlap

Jika setelah anchor dipotong, jadwal baru overlap dengan future approved/inspection maintenance lain, apply diblok.

## Test Plan

### Unit tests

Tambahkan test di:

```text
utils/maintenanceIntervalRescheduler.test.ts
```

Kasus:

1. `cut_active_period_once` memblok jika `newInterval >= oldInterval`.
2. Memilih anchor yang mencakup `changedAt`.
3. Menghitung corrected end dengan `startDate + newInterval - 1`.
4. Menghasilkan next schedule dari `correctedEnd + 1`.
5. Hanya satu anchor masuk `activePeriodCut`.
6. Anchor approved dengan inspection boleh dibuat preview dengan high warning.
7. Anchor tidak masuk delete list.
8. Future pending/scheduled tanpa inspection masuk replaceable.
9. Future approved/inspection preserved dan conflict memblok apply jika overlap.
10. Apply update anchor endDate dan `periodCorrectionMeta`.
11. Apply tidak mengubah status/engineer/inspection anchor.
12. Revalidation stale jika corrected end berubah.
13. Revalidation stale jika replaceable ids berubah.
14. Revalidation stale jika conflict baru muncul.

### Integration-ish source tests

Tambahkan atau update test untuk:

```text
app/(admin)/admin/products/edit/[id]/page.test.tsx
```

Kasus:

1. UI punya copy warning active period cut.
2. UI menampilkan periode sebelum/sesudah koreksi.
3. UI punya action eksplisit untuk potong 1 periode aktif.
4. Product type change tetap memblok apply.
5. Stale plan error tetap ditangani tanpa redirect.

### Regression tests

Pastikan tetap hijau:

1. Mode `future_only` existing.
2. Repair missing product reference.
3. Manual create overlap validator.
4. Bulk edit interval warning.
5. Maintenance loader invalid references.

## Acceptance Criteria

1. Admin dapat melihat preview active period cut sebelum write.
2. Sistem hanya memotong satu maintenance anchor.
3. Anchor adalah maintenance yang mencakup `changedAt`.
4. End date anchor berubah sesuai interval baru.
5. Start date, status, engineer, dan inspection anchor tidak berubah.
6. Future maintenance baru dibuat mulai dari H+1 corrected end date.
7. Tidak ada overlap `contract + product`.
8. Apply batal jika plan stale.
9. Apply batal jika conflict dengan preserved maintenance lain.
10. Metadata `periodCorrectionMeta` tersimpan.
11. Certificate dan inspection existing tetap bisa dibuka.

## Keputusan Final Untuk Implementasi Pertama

1. Active period cut boleh untuk status `approved`.
2. Active period cut boleh untuk status `waiting_approval`.
3. Admin tidak perlu mengisi reason manual.
4. Audit menggunakan metadata otomatis `periodCorrectionMeta`.
5. Certificate validity tetap mengikuti behavior saat ini: `inspection.createdAt + product.maintenanceInterval`.
6. UI active cut harus muncul saat interval dipendekkan.
7. UI harus ramah untuk admin non-IT dan menjelaskan dampak dengan bahasa operasional.

## Risiko Yang Tetap Harus Dikelola

1. Approved maintenance yang dipotong dapat membuat periode certificate lama terlihat berubah di daftar maintenance, walaupun certificate validity tidak berubah.
2. Jika mobile app sedang mengubah status maintenance saat admin membuka preview, apply harus stale.
3. Jika data lama sudah overlap sebelum fitur ini dijalankan, active cut harus blocked dan tidak mencoba memperbaiki otomatis.
4. Jika admin memilih "Simpan Produk Saja", interval produk berubah tetapi jadwal existing tetap tidak berubah; ini adalah pilihan eksplisit dan tetap diperbolehkan.
5. Firestore rules masih belum menjadi enforcement utama untuk invariant overlap; validasi masih berada di client/app logic.

## Rekomendasi Implementasi Bertahap

### Phase A: Engine preview - DONE

- Tambah mode `cut_active_period_once`.
- Tambah `activePeriodCut` preview.
- Tambah unit tests build plan.
- Tidak ada write.

File utama:

```text
utils/maintenanceIntervalRescheduler.ts
utils/maintenanceIntervalRescheduler.test.ts
```

Checklist detail:

1. Ubah type `BuildIntervalReschedulePlanInput.mode`.
2. Ubah type `ReschedulePlan.mode`.
3. Tambah type `ActivePeriodCutPreview`.
4. Tambah optional field `activePeriodCut`.
5. Tambah helper `addDays`.
6. Tambah helper `isDateWithinRange`.
7. Tambah helper `findActiveMaintenanceForCut`.
8. Tambah helper `buildActiveCutWarnings`.
9. Pecah build plan menjadi path:
   - `buildFutureOnlyPlan`;
   - `buildActivePeriodCutPlan`.
10. Pastikan `future_only` snapshot output tidak berubah untuk test existing.

Kriteria selesai Phase A:

- Tidak ada `writeBatch` call baru.
- Test build plan `future_only` tetap lulus.
- Test build active cut menghasilkan preview lengkap.

### Phase B: Apply engine - DONE

- Tambah apply support untuk update anchor.
- Tambah `periodCorrectionMeta`.
- Tambah revalidation.
- Tambah unit tests apply.

File utama:

```text
utils/maintenanceIntervalRescheduler.ts
utils/maintenanceIntervalRescheduler.test.ts
```

Checklist detail:

1. Update `planStillMatchesApproved` agar mode-specific.
2. Tambah comparison untuk `activePeriodCut`.
3. Pre-generate maintenance refs sebelum anchor update.
4. Update product interval seperti behavior existing.
5. Update anchor endDate.
6. Simpan `periodCorrectionMeta`.
7. Delete future replaceable maintenance.
8. Create maintenance baru dengan `generationReason: "interval_change_active_period_cut"`.
9. Return `correctedMaintenanceId`.
10. Pastikan `future_only` apply tetap menggunakan `generationReason: "interval_change"`.

Kriteria selesai Phase B:

- Apply active cut atomic dalam satu batch.
- Anchor tidak masuk delete call.
- Anchor update tidak menyertakan field `inspection`, `engineer`, atau `status`.
- Stale plan tidak melakukan write.

### Phase C: Edit product UI - DONE

- Tampilkan preview active cut.
- Tambah tombol apply eksplisit.
- Tambah warning high-risk.
- Tambah source/integration-ish tests.

File utama:

```text
app/(admin)/admin/products/edit/[id]/page.tsx
app/(admin)/admin/products/edit/[id]/page.test.tsx
```

Checklist detail:

1. Simpan dua plan:
   - `futureOnlyPlan`;
   - `activeCutPlan`.
2. Build `activeCutPlan` hanya saat `newInterval < oldInterval`.
3. Tambah selected mode state.
4. Tampilkan mode selector di modal.
5. Tampilkan tabel sebelum/sesudah untuk active cut.
6. Tampilkan warning high risk jika anchor punya inspection atau status penting.
7. Apply selected plan memakai `applyIntervalReschedulePlan`.
8. Error stale tetap menutup modal dan meminta preview ulang.
9. Product type change tetap memblok apply.
10. "Simpan Produk Saja" tetap tersedia.

Kriteria selesai Phase C:

- Admin non-IT bisa membaca apa yang berubah tanpa memahami istilah teknis.
- Active cut muncul saat interval dipendekkan.
- Jika active cut blocked, reason terlihat dan tombol apply disabled.

### Phase D: Verification - DONE

- Jalankan targeted maintenance/rescheduler suite.
- Jalankan `git diff --check`.
- Jalankan typecheck dan catat error existing jika masih ada.

Command minimal:

```text
npx jest --runTestsByPath utils/maintenanceIntervalRescheduler.test.ts 'app/(admin)/admin/products/edit/[id]/page.test.tsx' --runInBand
```

Regression suite yang harus tetap lulus:

```text
npx jest --runTestsByPath utils/maintenanceIntervalRescheduler.test.ts utils/maintenanceOverlapValidator.test.ts 'app/(admin)/admin/maintenances/create/page.test.ts' 'app/(admin)/admin/maintenances/edit/[id]/page.test.ts' utils/maintenanceDataLoader.test.ts 'app/(admin)/admin/products/edit/[id]/page.test.tsx' components/Admin/Products/BulkEditDialog.test.tsx utils/bulkOperations.test.ts --runInBand
```

Typecheck:

```text
./node_modules/.bin/tsc --noEmit --incremental false
```

Catatan:

- Saat dokumen ini dibuat, full repository test masih memiliki failure di area UI standards/filter/analytics lama. Jangan pakai full suite sebagai satu-satunya indikator active cut sampai failure global dipilah.
