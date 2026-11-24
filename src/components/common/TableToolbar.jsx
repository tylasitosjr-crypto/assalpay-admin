import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/** Toolbar: search + optional status + optional sort — all synced to URL */
export default function TableToolbar({
  showSearch=true,
  showStatus = true,
  showSort = true,
  sortOptions = [
    { value: "createdAt", label: "Newest" },
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "title", label: "Title" },
  ],
  statusAllowInactive = true,
  children,
}) {
  const [sp, setSp] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
  sp.get("search") || ""
);

  useEffect(() => {
    setSearchInput(sp.get("search") || "");
  }, [sp]);

  useEffect(() => {
  const timer = setTimeout(() => {
    const currentSearch = sp.get("search") || "";

    if (searchInput === currentSearch) return;

    const next = new URLSearchParams(sp);

    if (searchInput.trim()) {
      next.set("search", searchInput.trim());
    } else {
      next.delete("search");
    }

    next.set("page", "1");

    setSp(next, { replace: true });
  }, 400);

  return () => clearTimeout(timer);
}, [searchInput, sp, setSp]);

  const status = sp.get("status") || "";
  const sort = sp.get("sort") || "createdAt";
  const direction = sp.get("direction") || "desc";

 

  const patch = (updates) => {
    const next = new URLSearchParams(sp);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === "" || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    next.set("page", "1");
    setSp(next, { replace: true });
  };

const reset = () => {
  setSearchInput("");
  setSp(new URLSearchParams(), { replace: true });
};

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div className="rowflex" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
       {showSearch && (
        <input
  className="input"
  style={{ minWidth: 200, flex: "1 1 200px" }}
  placeholder="Search…"
  value={searchInput}
  onChange={(e) => setSearchInput(e.target.value)}
/>
       )}
        {showStatus && (
          <select
            className="input"
            style={{ width: 170 }}
            value={status}
            onChange={(e) => patch({ status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            {statusAllowInactive && (
              <option value="inactive">Inactive</option>
            )}
          </select>
        )}
        {showSort && (
          <>
            <select
              className="input"
              style={{ width: 160 }}
              value={sort}
              onChange={(e) => patch({ sort: e.target.value })}
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className="input"
              style={{ width: 120 }}
              value={direction}
              onChange={(e) => patch({ direction: e.target.value })}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </>
        )}
        {children}
        <button type="button" className="btn" onClick={reset} style={{ alignSelf: "flex-end",backgroundColor:"var(--danger)",color:"white" }}>
          Reset
        </button>
      </div>
    </div>
  );
}



// import { useEffect, useState } from "react";
// import { useSearchParams } from "react-router-dom";

// /** Toolbar: search + optional status + optional sort — all synced to URL */
// export default function TableToolbar({
//   showStatus = true,
//   showSort = true,
//   sortOptions = [
//     { value: "createdAt", label: "Newest" },
//     { value: "name", label: "Name" },
//     { value: "email", label: "Email" },
//     { value: "title", label: "Title" },
//   ],
//   statusAllowInactive = true,
//   children,
// }) {
//   const [sp, setSp] = useSearchParams();
//   const [search, setSearch] = useState(sp.get("search") || "");

//   useEffect(() => {
//     setSearch(sp.get("search") || "");
//   }, [sp]);

//   const status = sp.get("status") || "";
//   const sort = sp.get("sort") || "createdAt";
//   const direction = sp.get("direction") || "desc";

//   const applySearch = () => {
//     const next = new URLSearchParams(sp);
//     if (search.trim()) next.set("search", search.trim());
//     else next.delete("search");
//     next.set("page", "1");
//     setSp(next, { replace: true });
//   };

//   const patch = (updates) => {
//     const next = new URLSearchParams(sp);
//     Object.entries(updates).forEach(([k, v]) => {
//       if (v === "" || v == null) next.delete(k);
//       else next.set(k, String(v));
//     });
//     next.set("page", "1");
//     setSp(next, { replace: true });
//   };

//   const reset = () => {
//     setSearch("");
//     setSp(new URLSearchParams(), { replace: true });
//   };

//   return (
//     <div className="card" style={{ marginBottom: "1rem" }}>
//       <div className="rowflex" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
//         <input
//           className="input"
//           style={{ minWidth: 200, flex: "1 1 200px" }}
//           placeholder="Search…"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           onKeyDown={(e) => e.key === "Enter" && applySearch()}
//         />
//         {showStatus && (
//           <select
//             className="input"
//             style={{ width: 170 }}
//             value={status}
//             onChange={(e) => patch({ status: e.target.value })}
//           >
//             <option value="">All statuses</option>
//             <option value="active">Active</option>
//             {statusAllowInactive && (
//               <option value="inactive">Inactive</option>
//             )}
//           </select>
//         )}
//         {showSort && (
//           <>
//             <select
//               className="input"
//               style={{ width: 160 }}
//               value={sort}
//               onChange={(e) => patch({ sort: e.target.value })}
//             >
//               {sortOptions.map((o) => (
//                 <option key={o.value} value={o.value}>
//                   {o.label}
//                 </option>
//               ))}
//             </select>
//             <select
//               className="input"
//               style={{ width: 120 }}
//               value={direction}
//               onChange={(e) => patch({ direction: e.target.value })}
//             >
//               <option value="desc">Desc</option>
//               <option value="asc">Asc</option>
//             </select>
//           </>
//         )}
//         {children}
//         <button type="button" className="btn primary" onClick={applySearch}>
//           Apply
//         </button>
//         <button type="button" className="btn" onClick={reset}>
//           Reset
//         </button>
//       </div>
//     </div>
//   );
// }
