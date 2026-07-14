import { loadMaintenancesWithRelatedData } from "./maintenanceDataLoader";

type MockDocData = Record<string, any>;

const mockStore: Record<string, Record<string, MockDocData>> = {
  contracts: {},
  products: {},
  users: {},
  customers: {},
};

jest.mock("@/db/firebase/firebaseConfig", () => ({
  firestore: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  DocumentReference: jest.fn(),
  DocumentSnapshot: jest.fn(),
  DocumentData: jest.fn(),
  doc: jest.fn((_firestore, collectionName: string, id: string) => ({
    collectionName,
    id,
  })),
  getDoc: jest.fn(async (ref: { collectionName: string; id: string }) => {
    const data = mockStore[ref.collectionName]?.[ref.id];
    return {
      id: ref.id,
      exists: () => Boolean(data),
      data: () => data,
    };
  }),
}));

function timestamp(date: string) {
  return {
    toDate: () => new Date(date),
  };
}

function ref(collectionName: string, id: string) {
  return { collectionName, id };
}

describe("maintenanceDataLoader safety", () => {
  beforeEach(() => {
    mockStore.contracts = {};
    mockStore.products = {};
    mockStore.users = {};
    mockStore.customers = {};
  });

  it("returns a repairable row instead of throwing when product reference is missing", async () => {
    mockStore.contracts.contractA = {
      contractNumber: "CTR-001",
      contractName: "Maintenance Contract",
    };

    const rows = await loadMaintenancesWithRelatedData([
      {
        id: "maintenanceA",
        contract: ref("contracts", "contractA"),
        product: null,
        productType: "APAR",
        engineer: null,
        status: "pending",
        startDate: timestamp("2026-07-01"),
        endDate: timestamp("2026-07-30"),
        inspection: null,
      } as any,
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].productName).toBe("Produk tidak valid");
    expect(rows[0].productNumber).toBe("-");
    expect(rows[0].referenceStatus).toEqual({
      contract: "valid",
      product: "missing",
    });
    expect(rows[0].isRepairable).toBe(true);
    expect(rows[0].repairReasons).toContain("missing_product_reference");
  });

  it("returns an invalid row instead of throwing when contract reference is missing", async () => {
    mockStore.products.productA = {
      name: "APAR 3kg",
      productNumber: 101,
      productType: "APAR",
    };

    const rows = await loadMaintenancesWithRelatedData([
      {
        id: "maintenanceA",
        contract: undefined,
        product: ref("products", "productA"),
        productType: "APAR",
        engineer: null,
        status: "pending",
        startDate: timestamp("2026-07-01"),
        endDate: timestamp("2026-07-30"),
        inspection: null,
      } as any,
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].contractName).toBe("Kontrak tidak valid");
    expect(rows[0].contractNumber).toBe("-");
    expect(rows[0].referenceStatus).toEqual({
      contract: "missing",
      product: "valid",
    });
    expect(rows[0].isRepairable).toBe(false);
    expect(rows[0].repairReasons).toContain("missing_contract_reference");
  });

  it("marks product references as not_found when the referenced product document does not exist", async () => {
    mockStore.contracts.contractA = {
      contractNumber: "CTR-001",
      contractName: "Maintenance Contract",
    };

    const rows = await loadMaintenancesWithRelatedData([
      {
        id: "maintenanceA",
        contract: ref("contracts", "contractA"),
        product: ref("products", "deletedProduct"),
        productType: "HYDRANT",
        engineer: null,
        status: "scheduled",
        startDate: timestamp("2026-07-01"),
        endDate: timestamp("2026-07-30"),
        inspection: null,
      } as any,
    ]);

    expect(rows[0].referenceStatus).toEqual({
      contract: "valid",
      product: "not_found",
    });
    expect(rows[0].isRepairable).toBe(true);
    expect(rows[0].repairReasons).toContain("product_reference_not_found");
    expect(rows[0].productType).toBe("HYDRANT");
  });

  it("preserves existing valid row behavior while adding reference metadata", async () => {
    mockStore.customers.customerA = { name: "Customer A" };
    mockStore.contracts.contractA = {
      contractNumber: "CTR-001",
      contractName: "Maintenance Contract",
      customer: ref("customers", "customerA"),
    };
    mockStore.products.productA = {
      name: "APAR 3kg",
      productNumber: 101,
      productType: "APAR",
      specs: { brand: "Brand A" },
    };
    mockStore.users.engineerA = {
      name: "Engineer A",
      role: "engineer",
    };

    const rows = await loadMaintenancesWithRelatedData([
      {
        id: "maintenanceA",
        contract: ref("contracts", "contractA"),
        product: ref("products", "productA"),
        productType: "APAR",
        engineer: [ref("users", "engineerA")],
        status: "scheduled",
        startDate: timestamp("2026-07-01"),
        endDate: timestamp("2026-07-30"),
        inspection: null,
      } as any,
    ]);

    expect(rows[0]).toMatchObject({
      id: "maintenanceA",
      contractNumber: "CTR-001",
      contractName: "Maintenance Contract",
      productNumber: 101,
      productName: "APAR 3kg",
      productType: "APAR",
      referenceStatus: {
        contract: "valid",
        product: "valid",
      },
      isRepairable: false,
      repairReasons: [],
    });
    expect(rows[0].engineers).toEqual([{ id: "engineerA", name: "Engineer A" }]);
    expect(rows[0].contractData?.customerData?.name).toBe("Customer A");
    expect(rows[0].productData?.specs).toEqual({ brand: "Brand A" });
  });
});
