# Maintenance Interval Rescheduling Plan

## Status Dokumen

Status: planning teknis.

Scope: website admin dashboard, khususnya fitur produk, kontrak, maintenance, dan inspeksi.

Tujuan dokumen ini adalah menjadi blueprint implementasi yang aman. Dokumen ini tidak boleh dibaca sebagai izin untuk menghapus atau membangun ulang semua maintenance existing tanpa preview dan validasi.

## Ringkasan Masalah

Admin dapat mengubah `maintenanceInterval` pada produk, tetapi maintenance yang sudah tergenerate tidak ikut berubah. Akibatnya jadwal maintenance tetap memakai interval lama meskipun data produk sudah berubah.

Ada masalah tambahan: jika ada dokumen maintenance yang kehilangan `product` reference atau reference product-nya tidak valid, beberapa bagian website dapat gagal membaca data karena loader mengakses `maintenance.product.id` secara langsung.

Masalah yang harus diselesaikan:

1. Perubahan interval produk harus bisa memperbarui jadwal maintenance future.
2. Maintenance yang sudah menjadi history atau memiliki inspection tidak boleh rusak.
3. Tidak boleh ada overlap maintenance untuk kombinasi `contract + product` yang sama.
4. Admin perlu akses repair terbatas jika `product` reference pada maintenance hilang/rusak.
5. Data korup tidak boleh membuat halaman maintenance/list/calendar crash.

## File dan Behavior Saat Ini

### Produk

File terkait:

- `types/product.ts`
- `app/(admin)/admin/products/create/page.tsx`
- `app/(admin)/admin/products/edit/[id]/page.tsx`
- `app/(admin)/admin/products/import/page.tsx`
- `components/Admin/Products/BulkEditDialog.tsx`
- `utils/bulkOperations.ts`
- `utils/bulkEditUtils.ts`
- `utils/productValidator.ts`

Behavior saat ini:

- `maintenanceInterval` disimpan pada dokumen `products`.
- Create produk menyimpan `maintenanceInterval` sebagai number.
- Edit produk hanya menjalankan `updateDoc(products/{id})`.
- Bulk edit hanya menjalankan batch update produk.
- Tidak ada hook yang mencari maintenance existing setelah interval produk berubah.
- Tidak ada preview dampak perubahan interval.

Konsekuensi:

- Produk dapat menyatakan interval baru, tetapi jadwal maintenance lama tetap ada.
- Bulk edit interval berpotensi membuat banyak produk tidak sinkron dengan maintenance existing.

### Kontrak

File terkait:

- `types/contracts.ts`
- `app/(admin)/admin/contracts/create/page.tsx`
- `app/(admin)/admin/contracts/edit/[id]/page.tsx`
- `app/(admin)/admin/contracts/page.tsx`
- `components/Admin/Products/BulkAddToContractDialog.tsx`

Behavior saat ini:

- Contract bertipe `maintenance` dapat men-generate maintenance otomatis.
- Contract menyimpan `products[]` dan `productDetails[]`.
- Produk menyimpan balik reference `contract`.
- Delete contract menghapus semua maintenance terkait dan melepas `product.contract`.

Konsekuensi:

- Contract adalah batas utama untuk schedule maintenance.
- Repair product reference harus mempertimbangkan produk yang terdaftar di `contract.products`, bukan memilih produk global tanpa batas.

### Maintenance Generator

File terkait:

- `utils/maintenanceScheduler.ts`
- `utils/contractMaintenanceGenerator.ts`
- `utils/smartMaintenanceRegeneration.ts`

Behavior saat ini:

- `calculateMaintenanceSchedules(startDate, endDate, interval)` membuat periode berurutan.
- `generateMaintenancesForContract` membuat maintenance awal untuk contract maintenance.
- `generateMaintenancesForNewProducts` membuat maintenance saat produk baru ditambahkan ke contract.
- `regenerateMaintenancesForExtendedContract` hanya menambahkan uncovered period saat contract diperpanjang.
- Tidak ada fungsi untuk reschedule saat `product.maintenanceInterval` berubah.

Konsekuensi:

- Kita harus menambahkan rescheduler baru, bukan memaksa fungsi extend contract untuk menangani kasus interval berubah.

### Maintenance Admin

File terkait:

- `types/maintenances.ts`
- `docs/specs/maintenances.md`
- `app/(admin)/admin/maintenances/page.tsx`
- `app/(admin)/admin/maintenances/create/page.tsx`
- `app/(admin)/admin/maintenances/edit/[id]/page.tsx`
- `app/(admin)/admin/maintenances/calendar/page.tsx`
- `utils/maintenanceDataLoader.ts`
- `utils/maintenanceFilters.ts`
- `utils/maintenanceQuery.ts`

Behavior saat ini:

- Manual create maintenance sudah melakukan overlap check, tetapi check saat ini berbasis contract period dan perlu dipertegas menjadi `contract + product`.
- Edit maintenance menjaga `contract` dan `product` sebagai read-only.
- `maintenanceDataLoader` mengakses `m.contract.id` dan `m.product.id` tanpa guard.
- Calendar memakai loader yang sama, sehingga data reference rusak dapat memengaruhi calendar.

Konsekuensi:

- Loader harus diperkeras sebelum rescheduler diterapkan.
- Repair UI harus hanya aktif saat reference rusak, bukan membuat product bebas diedit.

### Inspeksi dan Certificate

File terkait:

- `app/(admin)/admin/inspections/page.tsx`
- `app/(admin)/admin/inspections/edit/[id]/page.tsx`
- `components/Admin/Inspections/InspectionPageContent.tsx`
- `components/Admin/Inspections/InspectionsTable.tsx`
- `app/(site)/product/[productId]/certificates/PublicCertificatesClient.tsx`
- `app/api/product/[productId]/certificates/route.ts`
- `app/api/product/[productId]/certificates/[maintenanceId]/download/route.ts`
- `utils/pdfCertificate.ts`

Behavior saat ini:

- Inspection disimpan nested di maintenance.
- Certificate dan public certificate mengambil data dari maintenance approved.
- Maintenance dengan inspection adalah data operasional dan audit.

Konsekuensi:

- Reschedule tidak boleh menghapus atau mengubah maintenance yang sudah punya `inspection`.
- Repair product reference pada maintenance yang sudah punya inspection hanya boleh untuk kasus reference kosong/rusak, bukan mengganti product valid menjadi product lain.

## Istilah

`Preserved maintenance`

Maintenance yang harus dipertahankan dan tidak boleh disentuh oleh reschedule. Contoh: sudah punya inspection, status berjalan, approved, rejected, atau overlap-protected history.

`Replaceable maintenance`

Maintenance yang aman untuk dihapus dan diganti karena belum punya inspection, status masih `pending` atau `scheduled`, dan berada di window reschedule.

`Invalid reference`

Maintenance yang kehilangan `contract`, kehilangan `product`, atau reference-nya mengarah ke dokumen yang sudah tidak ada.

`Anchor maintenance`

Maintenance existing yang menjadi titik mulai perhitungan ulang setelah interval berubah.

`Effective date`

Tanggal perubahan mulai diterapkan secara logis. Untuk implementasi awal, effective date tidak berdiri sendiri sebagai tanggal bebas, tetapi diturunkan dari anchor maintenance.

`Generation batch`

Satu operasi reschedule yang memiliki `generationBatchId` agar maintenance baru bisa dilacak.

## Keputusan Bisnis Yang Sudah Ditetapkan

Keputusan ini berasal dari diskusi saat planning:

1. Jika `product` reference tidak ada atau tidak valid pada maintenance, admin boleh diberi akses repair.
2. Akses repair product reference hanya untuk data rusak, bukan edit bebas.
3. Tidak boleh ada maintenance dengan `contract` dan `product` yang sama pada rentang tanggal yang overlap.
4. Jika ada maintenance `scheduled` dengan engineer tetapi belum punya inspection, maintenance tersebut boleh diganti oleh reschedule.
5. Jika interval dipendekkan agar maintenance segera dilakukan, sistem tidak membuat maintenance immediate tambahan. Sistem harus menyesuaikan periode existing/future berdasarkan interval baru.
6. Admin tidak wajib mengisi alasan perubahan interval untuk audit.
7. Mobile app cukup membaca maintenance existing. Tidak perlu sinyal khusus bahwa jadwal lama diganti.
8. Bulk edit interval tidak otomatis reschedule pada fase awal.

## Data Invariant

Invariant berikut harus dijaga oleh create, edit, repair, dan reschedule.

### Maintenance reference invariant

Setiap maintenance valid harus memiliki:

- `contract` sebagai `DocumentReference`.
- `product` sebagai `DocumentReference`.
- `productType` yang sesuai dengan product saat maintenance dibuat atau diperbaiki.
- `startDate` dan `endDate`.
- `status` valid sesuai `MaintenanceStatus`.

Jika invariant ini tidak terpenuhi, row harus tetap bisa ditampilkan sebagai invalid/repairable, tetapi tidak boleh membuat halaman crash.

### Contract-product invariant

Untuk maintenance valid:

- `maintenance.contract` harus menunjuk contract yang ada.
- `maintenance.product` harus menunjuk product yang ada.
- Product tersebut sebaiknya ada di `contract.products`.
- Jika product punya field `contract`, nilainya harus sama dengan `maintenance.contract`, kecuali data lama sedang dalam mode repair.

### Overlap invariant

Untuk kombinasi `contract + product` yang sama:

```text
[maintenanceA.startDate, maintenanceA.endDate]
```

tidak boleh overlap dengan:

```text
[maintenanceB.startDate, maintenanceB.endDate]
```

Rumus overlap:

```ts
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && aEnd >= bStart;
}
```

Invariant ini wajib dicek pada:

- create manual maintenance.
- repair missing product reference.
- apply interval reschedule.
- add product to maintenance contract jika generator membuat maintenance baru.
- extend contract maintenance jika generator menambah uncovered period.

### Inspection preservation invariant

Maintenance dengan `inspection` tidak boleh dihapus atau diubah periodenya oleh reschedule interval.

Status yang tidak boleh disentuh oleh reschedule:

- `in_progress`
- `waiting_approval`
- `approved`
- `rejected`

Status yang boleh diganti jika belum punya inspection:

- `pending`
- `scheduled`

## Target Behavior

### Saat admin mengubah interval di edit produk

Input:

- product existing.
- old interval.
- new interval.
- contract reference dari product.
- maintenance existing untuk `contract + product`.

Behavior:

1. Jika interval tidak berubah, simpan produk seperti biasa.
2. Jika interval berubah tetapi product tidak punya contract, simpan produk dan tidak jalankan reschedule.
3. Jika interval berubah tetapi contract bukan tipe `maintenance`, simpan produk dan tidak jalankan reschedule.
4. Jika interval berubah dan product berada pada contract maintenance, tampilkan preview reschedule.
5. Admin dapat memilih:
   - batal.
   - simpan produk saja tanpa reschedule.
   - simpan produk dan apply reschedule.

Default pilihan yang direkomendasikan: tampilkan preview dan biarkan admin memilih. Jangan auto-apply tanpa konfirmasi.

### Saat admin mengubah interval di bulk edit

Fase awal:

1. Bulk edit tetap boleh mengubah `maintenanceInterval`.
2. Sistem tampilkan warning bahwa jadwal maintenance existing tidak otomatis berubah dari bulk edit.
3. Tidak ada reschedule otomatis.

Alasan:

- Bulk reschedule punya risiko tinggi karena banyak product/contract/write.
- Butuh preview agregat per product sebelum aman.

### Saat admin repair product reference kosong/rusak

Behavior:

1. Product field read-only jika reference masih valid.
2. Product field menjadi repairable jika:
   - `product` kosong.
   - `product` reference ada tetapi document target tidak ditemukan.
3. Pilihan product dibatasi ke `contract.products`.
4. Jika contract kosong/rusak, repair product diblok.
5. Sebelum menyimpan, sistem cek overlap untuk `contract + selectedProduct`.
6. Jika overlap ditemukan, tampilkan maintenance konflik dan blok save.
7. Jika lolos, update:
   - `product`
   - `productType`
   - `updatedAt`
   - `updatedBy`
   - metadata repair

## Detail Algoritma Reschedule Interval

### Input

```ts
type BuildIntervalReschedulePlanInput = {
  productId: string;
  oldInterval: number;
  newInterval: number;
  changedAt: Date;
  mode: "future_only";
};
```

Untuk fase pertama, hanya `future_only` yang diimplementasikan.

### Validasi awal

Rescheduler harus berhenti tanpa write jika:

1. `newInterval` bukan number valid.
2. `newInterval <= 0`.
3. Product tidak ditemukan.
4. Product tidak punya `contract`.
5. Contract tidak ditemukan.
6. Contract bukan `maintenance`.
7. Contract tidak punya `endDate`.
8. Tidak ada maintenance existing untuk `contract + product`.
9. Ada invalid reference yang membuat rencana tidak deterministic.

Catatan: jika tidak ada maintenance existing, sistem boleh memberi rekomendasi "generate from contract period", tetapi implementasi awal tidak perlu auto-generate dari edit produk.

### Query maintenance existing

Query utama:

```ts
query(
  collection(firestore, "maintenances"),
  where("contract", "==", contractRef),
  where("product", "==", productRef)
)
```

Setelah query:

- convert `startDate` dan `endDate` ke `Date`.
- sort ascending by `startDate`.
- validasi setiap row punya date valid.
- klasifikasikan row.

### Klasifikasi maintenance

Preserved jika:

- punya `inspection`.
- status `in_progress`.
- status `waiting_approval`.
- status `approved`.
- status `rejected`.
- `endDate` lebih kecil dari anchor start dan sudah menjadi history.
- reference/date tidak valid.

Replaceable jika:

- status `pending` atau `scheduled`.
- tidak punya `inspection`.
- punya `startDate` dan `endDate` valid.
- masuk window dari anchor maintenance sampai contract end.

Blocked jika:

- seharusnya masuk window reschedule, tetapi tidak boleh disentuh karena status/inspection.
- date invalid.
- reference invalid.
- overlap dengan preserved maintenance.

### Menentukan anchor maintenance

Anchor tidak boleh sekadar `today`. Berdasarkan keputusan planning, anchor harus diambil dari maintenance existing yang paling dekat dengan hari perubahan interval.

Definisi `changedAt`: waktu admin menyimpan perubahan interval.

Urutan pemilihan anchor:

1. Jika ada replaceable maintenance yang mencakup `changedAt`, gunakan maintenance itu.
2. Jika tidak ada, gunakan replaceable maintenance dengan `startDate` paling dekat setelah `changedAt`.
3. Jika tidak ada future replaceable maintenance, tidak ada reschedule yang bisa diterapkan. Sistem hanya simpan interval produk dan tampilkan informasi bahwa tidak ada jadwal future yang aman diganti.

Anchor start:

```text
anchorStartDate = anchorMaintenance.startDate
```

Jadwal baru dihitung dari `anchorStartDate` sampai `contract.endDate` memakai `newInterval`.

Konsekuensi:

- Jika interval dipendekkan, maintenance yang sedang pending/scheduled bisa otomatis menjadi lebih pendek.
- Jika interval dipanjangkan, beberapa maintenance future bisa hilang karena periode baru lebih panjang.
- Sistem tidak membuat maintenance immediate tambahan di luar hasil schedule.

### Menghasilkan jadwal baru

Gunakan `calculateMaintenanceSchedules(anchorStartDate, contractEndDate, newInterval)`.

Lalu filter jadwal baru:

1. Jadwal yang overlap dengan preserved maintenance harus masuk conflict.
2. Jadwal yang berada sebelum anchor tidak dibuat.
3. Jadwal yang valid menjadi `newSchedules`.

Default fase pertama:

- Jika ada conflict overlap dengan preserved maintenance, jangan apply sama sekali.
- Tampilkan conflict pada preview.

### Preview plan

Preview harus menjawab pertanyaan admin sebelum write:

- Produk apa yang berubah.
- Contract apa yang terdampak.
- Interval lama dan interval baru.
- Anchor maintenance mana yang dipakai.
- Berapa maintenance existing.
- Berapa maintenance dipertahankan.
- Berapa maintenance akan dihapus/diganti.
- Berapa maintenance baru dibuat.
- Apakah ada conflict overlap.
- Apakah ada blocked maintenance.
- Apakah ada scheduled maintenance dengan engineer yang akan diganti.

Struktur data:

```ts
type ReschedulePlan = {
  productId: string;
  productNumber: string;
  productName: string;
  contractId: string;
  contractNumber: string;
  oldInterval: number;
  newInterval: number;
  changedAt: Date;
  anchorMaintenanceId: string | null;
  anchorStartDate: Date | null;
  contractEndDate: Date;
  mode: "future_only";
  canApply: boolean;
  applyBlockedReason?: string;
  existingMaintenances: RescheduleMaintenanceSnapshot[];
  preservedMaintenances: RescheduleMaintenanceSnapshot[];
  replaceableMaintenances: RescheduleMaintenanceSnapshot[];
  blockedMaintenances: Array<{
    maintenance: RescheduleMaintenanceSnapshot;
    reason: string;
  }>;
  conflicts: Array<{
    type: "overlap";
    newSchedule: RescheduleSchedulePreview;
    existingMaintenance: RescheduleMaintenanceSnapshot;
    message: string;
  }>;
  newSchedules: RescheduleSchedulePreview[];
  writeSummary: {
    deleteCount: number;
    createCount: number;
    updateProduct: boolean;
    estimatedWrites: number;
  };
};
```

Snapshot:

```ts
type RescheduleMaintenanceSnapshot = {
  id: string;
  startDate: Date;
  endDate: Date;
  status: MaintenanceStatus;
  hasInspection: boolean;
  engineerIds: string[];
};
```

Schedule preview:

```ts
type RescheduleSchedulePreview = {
  startDate: Date;
  endDate: Date;
  sequenceNumber: number;
};
```

### Apply plan

`applyIntervalReschedulePlan` harus melakukan revalidation sebelum write.

Langkah apply:

1. Re-fetch product.
2. Re-fetch contract.
3. Re-fetch maintenance existing untuk `contract + product`.
4. Rebuild plan dengan input yang sama.
5. Bandingkan plan baru dengan plan yang disetujui admin:
   - `replaceableMaintenanceIds` sama.
   - `newSchedules` sama.
   - tidak ada conflict baru.
6. Jika berbeda, batalkan dan minta admin refresh preview.
7. Jika valid, buat `generationBatchId`.
8. Gunakan `writeBatch`.
9. Update product interval jika belum tersimpan.
10. Delete replaceable maintenance.
11. Create maintenance baru.
12. Commit batch.

Write order dalam batch tidak menjamin urutan visual, tetapi atomic dalam satu commit. Jika total write melebihi 500, pecah batch. Untuk fase awal, jika estimated writes > 450, tampilkan warning dan blok apply sampai flow batch besar dibuat.

### Maintenance baru hasil reschedule

Field inti:

```ts
{
  contract: contractRef,
  product: productRef,
  productType: productData.productType,
  engineer: null,
  status: "pending",
  startDate: Timestamp.fromDate(schedule.startDate),
  endDate: Timestamp.fromDate(schedule.endDate),
  inspection: null,
  createdAt: serverTimestamp(),
  createdBy: userRef
}
```

Metadata tambahan:

```ts
{
  generationReason: "interval_change",
  generationBatchId,
  sourceProductInterval: newInterval,
  previousProductInterval: oldInterval,
  rescheduledFromProductId: productId,
  rescheduledAt: serverTimestamp(),
  rescheduledBy: userRef
}
```

Catatan engineer:

- Maintenance baru default `engineer: null` dan `status: "pending"`.
- Jika replaceable maintenance lama punya engineer, preview harus memberi tahu bahwa assignment engineer akan hilang.
- Fase awal tidak otomatis carry-over engineer karena perubahan periode bisa mengubah workload.

## Detail Repair Product Reference

### Kapan repair UI muncul

Pada `app/(admin)/admin/maintenances/edit/[id]/page.tsx`, tampilkan repair UI jika:

1. `data.product` kosong.
2. `data.product` ada tetapi `getDoc(data.product)` tidak exists.

Jika `data.product` valid:

- tampilkan product seperti sekarang.
- tetap read-only.

### Data yang perlu dibaca

1. Maintenance by id.
2. Contract dari `maintenance.contract`.
3. Product refs dari `contract.products`.
4. Product docs untuk opsi dropdown.
5. Maintenance lain untuk contract yang sama, untuk validasi overlap setelah product dipilih.

### Dropdown product repair

Opsi dropdown:

- Hanya produk di `contract.products`.
- Tampilkan `productNumber - name - productType`.
- Jika tidak ada produk di contract, tampilkan error.

Jangan tampilkan semua produk global.

### Validasi sebelum repair save

Input:

- `maintenanceId`.
- `contractRef`.
- `selectedProductRef`.
- `maintenance.startDate`.
- `maintenance.endDate`.

Validasi:

1. Contract valid.
2. Selected product valid.
3. Selected product ada di `contract.products`.
4. Maintenance punya start/end date valid.
5. Tidak ada maintenance lain dengan contract dan selected product yang overlap.
6. Jika maintenance punya inspection, productType selected product harus kompatibel dengan checklist existing. Fase awal: jika punya inspection dan productType berbeda, blok repair.

Query overlap:

```ts
query(
  collection(firestore, "maintenances"),
  where("contract", "==", contractRef),
  where("product", "==", selectedProductRef)
)
```

Client-side filter:

- exclude current maintenance id.
- convert start/end date.
- check `rangesOverlap`.

Jika conflict:

```text
Produk ini sudah memiliki maintenance pada contract yang sama di periode {startDate} - {endDate}.
```

### Write repair

Update minimal:

```ts
{
  product: selectedProductRef,
  productType: selectedProduct.productType,
  updatedAt: serverTimestamp(),
  updatedBy: userRef,
  repairReason: "missing_product_reference",
  repairedAt: serverTimestamp(),
  repairedBy: userRef,
  previousProductReferenceState: "missing" | "not_found"
}
```

Jika project ingin audit lebih rapi, gunakan nested object:

```ts
repairMeta: {
  reason: "missing_product_reference",
  previousProductReferenceState: "missing" | "not_found",
  repairedAt: serverTimestamp(),
  repairedBy: userRef
}
```

Rekomendasi: gunakan `repairMeta` agar field top-level tidak makin tersebar.

## Hardening Loader Maintenance

File utama:

- `utils/maintenanceDataLoader.ts`

Masalah saat ini:

- `maintenances.map(m => m.contract.id)` akan gagal jika `contract` kosong.
- `maintenances.map(m => m.product.id)` akan gagal jika `product` kosong.
- Transform row juga memakai `maintenance.product.id`.

Behavior baru:

1. Extract contract ids hanya dari reference valid.
2. Extract product ids hanya dari reference valid.
3. Untuk row invalid, tetap return row.
4. Tambahkan flags:

```ts
referenceStatus: {
  contract: "valid" | "missing" | "not_found";
  product: "valid" | "missing" | "not_found";
}
isRepairable: boolean;
repairReasons: string[];
```

Display fallback:

- missing contract: `contractNumber = "-"`
- missing product: `productNumber = "-"`
- missing product: `productName = "Produk tidak valid"`
- missing productType: gunakan `maintenance.productType || "APAR"` hanya untuk mencegah crash, tetapi row harus diberi flag invalid.

Halaman yang terdampak:

- maintenance list.
- maintenance calendar.
- inspection list yang membaca maintenance.
- export jika memakai row maintenance.

## Manual Create Maintenance Overlap Rule

File:

- `app/(admin)/admin/maintenances/create/page.tsx`

Behavior yang dibutuhkan:

1. Saat admin memilih contract dan products, sistem harus cek overlap per product, bukan hanya contract.
2. Untuk setiap selected product:
   - query maintenance by `contract`.
   - filter product yang sama.
   - cek overlap date.
3. Jika salah satu product conflict, blok submit dan tampilkan daftar product conflict.

Pesan yang disarankan:

```text
Maintenance untuk produk {productNumber} pada kontrak ini sudah ada di periode {startDate} - {endDate}.
```

## UI Preview Reschedule

Preview modal harus ringkas tetapi informatif.

Konten wajib:

- Product: number, name, type.
- Contract: number, name.
- Interval lama -> interval baru.
- Anchor period yang dipakai.
- Jumlah maintenance yang dipertahankan.
- Jumlah maintenance yang akan diganti.
- Jumlah maintenance baru.
- Warning jika assignment engineer akan hilang.
- Conflict list jika ada overlap.

Tombol:

- `Batal`
- `Simpan Produk Saja`
- `Simpan dan Reschedule`

Jika `canApply === false`:

- disable `Simpan dan Reschedule`.
- tampilkan reason.

## Data Consistency dan Concurrency

Karena flow berjalan di client dengan Firebase Web SDK:

1. Preview bisa stale jika ada admin lain mengubah maintenance sebelum apply.
2. Apply harus rebuild dan revalidate plan.
3. Jika hasil revalidation berbeda, apply harus batal.
4. Jangan mengandalkan state preview lama sebagai sumber kebenaran.

Risiko tersisa:

- Firestore rules saat ini masih terlalu longgar di project. Long-term, invariant overlap dan schema harus dipindahkan juga ke server-side enforcement atau Cloud Function jika memungkinkan.

## Rencana Implementasi Per Fase

### Phase 1: Safety dan observability — DONE

Tujuan: data rusak tidak menjatuhkan UI.

Perubahan:

1. Harden `utils/maintenanceDataLoader.ts`.
2. Tambahkan reference flags pada row.
3. Tambahkan visual indicator invalid reference di maintenance list.
4. Tambahkan test untuk missing contract/product.

Tidak dilakukan di phase ini:

- reschedule interval.
- delete maintenance.
- repair otomatis.

### Phase 2: Overlap validator — DONE

Tujuan: satu sumber fungsi validasi overlap.

Tambahkan util:

```text
utils/maintenanceOverlapValidator.ts
```

Fungsi:

```ts
rangesOverlap(aStart, aEnd, bStart, bEnd)
findOverlappingMaintenances(input)
assertNoMaintenanceOverlap(input)
```

Pakai di:

- create manual maintenance.
- repair product reference.
- rescheduler apply.

### Phase 3: Repair product reference — DONE

Tujuan: admin bisa memperbaiki maintenance yang kehilangan product ref.

Perubahan:

1. Update maintenance edit page.
2. Load product options dari `contract.products`.
3. Validate overlap sebelum save.
4. Write `repairMeta`.
5. Tambahkan tests.

### Phase 4: Reschedule planning engine — DONE

Tujuan: bisa membuat preview tanpa write.

Tambahkan util:

```text
utils/maintenanceIntervalRescheduler.ts
```

Implement:

- `buildIntervalReschedulePlan`.
- anchor selection.
- classification preserved/replaceable/blocked.
- conflict overlap detection.
- write summary.

### Phase 5: Reschedule apply engine — DONE

Tujuan: apply plan secara aman.

Implement:

- `applyIntervalReschedulePlan`.
- revalidation.
- batch delete/create.
- metadata generation.
- write count guard.

### Phase 6: Integrasi edit produk — DONE

Tujuan: admin bisa reschedule setelah interval berubah.

Perubahan:

1. Simpan original product snapshot saat fetch.
2. Deteksi interval berubah.
3. Build preview.
4. Tampilkan modal.
5. Apply sesuai pilihan admin.

### Phase 7: Bulk edit policy — DONE

Tujuan: mencegah silent data mismatch.

Perubahan awal:

- Jika bulk edit berisi `maintenanceInterval`, tampilkan warning.
- Jangan auto-reschedule.

Future:

- Bulk preview per product.
- Apply batch per product dengan progress.

## Test Plan

### Unit tests

Tambahkan test untuk:

1. `rangesOverlap`:
   - overlap penuh.
   - overlap sebagian.
   - boundary same day overlap.
   - non-overlap.
2. `calculateMaintenanceSchedules` tetap menghasilkan period sesuai interval baru.
3. `buildIntervalReschedulePlan` memilih anchor yang mencakup `changedAt`.
4. `buildIntervalReschedulePlan` memilih future pending/scheduled terdekat jika tidak ada current anchor.
5. `buildIntervalReschedulePlan` mempertahankan maintenance approved.
6. `buildIntervalReschedulePlan` mempertahankan maintenance dengan inspection.
7. `buildIntervalReschedulePlan` menandai conflict jika new schedule overlap preserved maintenance.
8. `applyIntervalReschedulePlan` batal jika revalidation berubah.
9. `applyIntervalReschedulePlan` delete replaceable dan create new maintenance dengan metadata.
10. `maintenanceDataLoader` tidak throw saat product missing.
11. Repair missing product reference menolak selected product yang menyebabkan overlap.

### Integration-ish tests

Tambahkan test untuk:

1. Edit product interval 30 -> 14 menampilkan preview.
2. Edit product interval 30 -> 60 menampilkan preview.
3. Produk tanpa contract tidak memanggil rescheduler.
4. Contract bukan maintenance tidak memanggil rescheduler.
5. Scheduled maintenance dengan engineer masuk replaceable dan warning assignment hilang muncul.
6. Maintenance dengan inspection tidak masuk replaceable.
7. Repair product ref hanya muncul jika product missing/not found.
8. Manual create maintenance menolak overlap untuk contract + product yang sama.
9. Bulk edit interval menampilkan warning dan tidak reschedule.

### Regression tests

Pastikan behavior lama tetap jalan:

1. Create contract maintenance tetap generate maintenance awal.
2. Add product to maintenance contract tetap generate schedule product baru.
3. Extend contract tetap generate uncovered period.
4. Delete contract tetap menghapus maintenance terkait dan melepas product.contract.
5. Public certificate untuk approved inspection tetap bisa dibuka.

## Acceptance Criteria

### Safety

- Halaman maintenance tidak crash jika ada maintenance tanpa product.
- Halaman calendar tidak crash jika ada maintenance tanpa product.
- Maintenance dengan inspection tidak pernah dihapus oleh interval reschedule.
- Maintenance approved tidak pernah dihapus oleh interval reschedule.
- Apply reschedule batal jika ada overlap conflict.

### Reschedule

- Admin melihat preview sebelum schedule berubah.
- Interval lama dan baru terlihat jelas.
- Anchor maintenance terlihat jelas.
- Sistem mengganti hanya future pending/scheduled maintenance dari anchor.
- Tidak ada maintenance immediate tambahan di luar jadwal hasil interval baru.
- Assignment engineer yang hilang disebutkan di preview.

### Repair

- Product repair hanya tersedia untuk missing/not found product reference.
- Dropdown product repair hanya berisi product dari contract.
- Repair diblok jika menyebabkan overlap.
- Repair menyimpan audit metadata.

### Bulk edit

- Bulk edit interval tidak diam-diam menjalankan reschedule.
- Admin mendapat warning bahwa schedule existing perlu ditangani dari flow khusus.

## Hal Yang Tidak Boleh Dilakukan

1. Jangan delete semua maintenance product ketika interval berubah.
2. Jangan regenerate approved/rejected/waiting approval/in progress maintenance.
3. Jangan ubah nested `inspection` saat reschedule.
4. Jangan memperbaiki missing product reference dengan tebakan.
5. Jangan menjalankan full rebuild tanpa preview dan validasi bahwa semua maintenance aman.
6. Jangan memasukkan reschedule otomatis ke bulk edit tanpa preview.
7. Jangan memilih product repair dari semua produk global.
8. Jangan allow overlap untuk `contract + product` yang sama.
9. Jangan apply plan jika preview sudah stale.

## Open Questions Tersisa

Masih perlu diputuskan sebelum implementasi besar:

1. Jika replaceable maintenance lama punya engineer, apakah engineer harus bisa dipindahkan manual dari preview?
2. Jika write count lebih dari 450, apakah kita blok dulu atau implement batch multi-commit sejak awal?
3. Apakah `repairMeta` perlu dibuat nested pada semua repair data lain juga agar konsisten?
4. Apakah perlu halaman audit khusus untuk daftar maintenance invalid, atau cukup indicator di list dan edit page?

## Rekomendasi Keputusan Awal

Untuk implementasi pertama:

1. Kerjakan Phase 1 sampai Phase 3 dulu sebelum reschedule.
2. Gunakan mode reschedule `future_only`.
3. Anchor memakai maintenance replaceable yang mencakup `changedAt`, lalu future replaceable terdekat jika tidak ada.
4. Maintenance `pending` dan `scheduled` tanpa inspection boleh diganti.
5. Maintenance baru hasil reschedule selalu kembali ke `pending` tanpa engineer.
6. Bulk edit interval hanya memberi warning.
7. Overlap conflict selalu memblok apply.

Urutan ini menurunkan risiko karena memperbaiki fondasi data dan validasi sebelum fitur reschedule mulai menghapus/membuat dokumen maintenance.
