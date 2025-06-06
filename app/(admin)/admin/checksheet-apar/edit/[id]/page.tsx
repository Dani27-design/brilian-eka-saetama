import { Metadata } from "next";
import ChecksheetAparForm from "@/components/Admin/ChecksheetAparForm";
import AdminPageHeader from "@/components/Admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "Edit APAR Checksheet",
};

export default function EditChecksheetAparPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto">
      <ChecksheetAparForm id={params.id} isEditing={true} />
    </div>
  );
}
