import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";

export const getData = async (
  lang: string,
  collectionId: string,
  docId: string,
) => {
  try {
    const docRef = doc(firestore, collectionId, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && lang && lang !== "") {
      const data = docSnap.data();
      return data[lang];
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting hero data:", error);
    return null;
  }
};
