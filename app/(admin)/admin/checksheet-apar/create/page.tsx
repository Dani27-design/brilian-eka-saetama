import { Metadata } from "next";
import ChecksheetAparForm from "@/components/Admin/ChecksheetAparForm";
import AdminPageHeader from "@/components/Admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "Create APAR Checksheet",
};

export default function CreateChecksheetAparPage() {
  return (
    <div className="container mx-auto">
      <ChecksheetAparForm isEditing={false} />
    </div>
  );
}
