"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UtensilsCrossed } from "lucide-react";
import { api } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import { DiningSelector } from "@/components/DiningSelector";
import { ProductCard } from "@/components/ProductCard";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { useSelection } from "@/context/SelectionContext";
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/admin");
}
// export default function MenuPage() {

//   const { selection } = useSelection();
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [activeCategory, setActiveCategory] = useState<string | "all">("all");
//   const [search, setSearch] = useState("");

//   useEffect(() => {
//     (async () => {
//       setLoading(true);
//       try {
//         const [cats, prods] = await Promise.all([
//           api.get<Category[]>("/category/all"),
//           api.get<Product[]>("/product"),
//         ]);
//         setCategories(Array.isArray(cats) ? cats : []);
//         setProducts(Array.isArray(prods) ? prods : []);
//       } catch {
//         setCategories([]);
//         setProducts([]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const filtered = useMemo(() => {
//     return products.filter((p) => {
//       const matchesCategory = activeCategory === "all" || p.category_id === activeCategory;
//       const matchesSearch = p.title.toLowerCase().includes(search.trim().toLowerCase());
//       return matchesCategory && matchesSearch;
//     });
//   }, [products, activeCategory, search]);

//   // "Barchasi" tanlanganda taomlar kategoriya bo'yicha alohida bo'limlarda
//   // ko'rsatiladi — aks holda taom, ichimlik, salat bir-biriga aralashib,
//   // odamlar chalkashib qolishi mumkin.
//   const groupedByCategory = useMemo(() => {
//     if (activeCategory !== "all") return null;
//     return categories
//       .map((c) => ({ category: c, items: filtered.filter((p) => p.category_id === c._id) }))
//       .filter((g) => g.items.length > 0);
//   }, [activeCategory, categories, filtered]);

//   return (
//     <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
//       <DiningSelector />

//       {selection && (
//         <>
//           <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//             <h1 className="font-display text-2xl font-semibold text-dark">Menyu</h1>
//             <div className="flex items-center gap-2 rounded-full border border-dark/15 bg-white px-3 py-2 sm:w-72">
//               <Search className="h-4 w-4 shrink-0 text-dark/40" aria-hidden="true" />
//               <input
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Taom qidirish..."
//                 className="w-full bg-transparent text-sm text-dark outline-none"
//               />
//             </div>
//           </div>

//           <div className="mb-6 flex flex-wrap gap-2">
//             <button
//               onClick={() => setActiveCategory("all")}
//               className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
//                 activeCategory === "all"
//                   ? "border-teal bg-teal text-white"
//                   : "border-dark/15 text-dark hover:border-teal"
//               }`}
//             >
//               Barchasi
//             </button>
//             {categories.map((c) => (
//               <button
//                 key={c._id}
//                 onClick={() => setActiveCategory(c._id)}
//                 className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
//                   activeCategory === c._id
//                     ? "border-teal bg-teal text-white"
//                     : "border-dark/15 text-dark hover:border-teal"
//                 }`}
//               >
//                 {c.name}
//               </button>
//             ))}
//           </div>

//           {loading ? (
//             <Spinner label="Taomlar yuklanmoqda..." />
//           ) : filtered.length === 0 ? (
//             <EmptyState
//               icon={UtensilsCrossed}
//               title="Hech narsa topilmadi"
//               description="Boshqa kategoriya yoki qidiruv so'zini sinab ko'ring."
//             />
//           ) : groupedByCategory ? (
//             <div className="flex flex-col gap-8">
//               {groupedByCategory.map((g) => (
//                 <div key={g.category._id}>
//                   <h2 className="mb-3 font-display text-lg font-semibold text-dark">{g.category.name}</h2>
//                   <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
//                     {g.items.map((p) => (
//                       <ProductCard key={p._id} product={p} />
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
//               {filtered.map((p) => (
//                 <ProductCard key={p._id} product={p} />
//               ))}
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }
