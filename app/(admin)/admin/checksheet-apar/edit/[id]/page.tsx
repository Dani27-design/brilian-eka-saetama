"use client";

import ChecksheetAparForm from "@/components/Admin/ChecksheetAparForm";
import { usePageHeader } from "@/app/context/PageHeaderContext";

export default function EditChecksheetAparPage({
  params,
}: {
  params: { id: string };
}) {
  usePageHeader("Edit APAR Checksheet", "Edit an existing APAR inspection checksheet");

  return (
    <div className="">
      <ChecksheetAparForm id={params.id} isEditing={true} />
    </div>
  );
}
