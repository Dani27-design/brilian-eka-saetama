import { firestore } from "@/db/firebase/firebaseConfig";
import { writeBatch, doc, getDoc } from "firebase/firestore";

export interface BatchCreateData {
  language: string;
  collection: string;
  data: Record<string, any>;
}

/**
 * Creates or updates multiple documents in a Firestore collection using batch writes
 *
 * @param params - Object containing language, collection name, and data object
 * @returns - Object with success status and message or error
 */
export const batchCreateData = async ({
  language,
  collection,
  data,
}: BatchCreateData) => {
  try {
    // Validate inputs
    if (!language || !collection || !data || typeof data !== "object") {
      throw new Error("Missing or invalid required fields");
    }

    // Create a batch
    const batch = writeBatch(firestore);

    // Process each document in the data object
    for (const [documentId, value] of Object.entries(data)) {
      // Get the document reference
      const docRef = doc(firestore, collection, documentId);

      // Check if document already exists to merge language data
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // If document exists, update just the language field
        const existingData = docSnap.data();
        batch.update(docRef, {
          [language]: value,
        });
      } else {
        // If document doesn't exist, create it with the language field
        batch.set(docRef, {
          [language]: value,
        });
      }
    }

    // Commit the batch
    await batch.commit();

    return {
      success: true,
      message: `${
        Object.keys(data).length
      } documents created/updated successfully in ${collection} collection for ${language} language`,
    };
  } catch (error: any) {
    console.error("Error in batchCreateData:", error);
    return {
      success: false,
      error: error.message || "Failed to create data",
    };
  }
};
