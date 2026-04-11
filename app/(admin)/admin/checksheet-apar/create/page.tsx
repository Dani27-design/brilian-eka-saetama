"use client";

import ChecksheetAparForm from "@/components/Admin/ChecksheetAparForm";
import { usePageHeader } from "@/app/context/PageHeaderContext";

export default function CreateChecksheetAparPage() {
  usePageHeader("Create APAR Checksheet", "Create a new APAR inspection checksheet");

  return (
    <div className="">
      <ChecksheetAparForm isEditing={false} />
    </div>
  );
}
