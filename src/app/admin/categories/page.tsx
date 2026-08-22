"use client";

import { Tag } from "lucide-react";
import { SimpleListCrud } from "@/components/admin/SimpleListCrud";

export default function AdminCategoriesPage() {
  return (
    <SimpleListCrud
      title="Kategoriyalar"
      icon={Tag}
      fieldKey="name"
      fieldLabel="Kategoriya nomi"
      placeholder="Masalan: Milliy taomlar"
      listPath="/category/all"
      createPath="/category/create"
      updatePath={(id) => `/category/update/${id}`}
      deletePath={(id) => `/category/delete/${id}`}
    />
  );
}
