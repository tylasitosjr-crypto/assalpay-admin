import { useCallback, useEffect, useRef, useState } from "react";

/**
 * @typedef {{ id: number, label: string }} Option
 * @param {{
 *   value: Option | null,
 *   onChange: (v: Option | null) => void,
 *   loadOptions?: (q: string) => Promise<Option[]>,
 *   loadOptionsPage?: (q: string, page: number) => Promise<{ options: Option[], hasMore: boolean }>,
 *   placeholder?: string,
 *   disabled?: boolean,
 *   title?: string,
 * }} props
 */
export default function SearchableAsyncSelect({
  value,
  onChange,
  loadOptions,
  loadOptionsPage = null,
  placeholder = "Search…",
  disabled,
  title,
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [options, setOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  const paged = typeof loadOptionsPage === "function";

  const runSearch = useCallback(
    async (term, nextPage = 1, append = false) => {
      if (paged) {
        if (append) setLoadingMore(true);
        else setLoading(true);
        try {
          const { options: opts, hasMore: more } = await loadOptionsPage(term, nextPage);
          const list = Array.isArray(opts) ? opts : [];
          setOptions((prev) => {
            if (!append) return list;
            const seen = new Set(prev.map((o) => o.id));
            const merged = [...prev];
            for (const o of list) {
              if (!seen.has(o.id)) {
                seen.add(o.id);
                merged.push(o);
              }
            }
            return merged;
          });
          setHasMore(!!more);
          setPage(nextPage);
        } catch {
          if (!append) setOptions([]);
          setHasMore(false);
        } finally {
          setLoading(false);
          setLoadingMore(false);
        }
        return;
      }
      setLoading(true);
      try {
        const opts = loadOptions ? await loadOptions(term) : [];
        setOptions(Array.isArray(opts) ? opts : []);
        setHasMore(false);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [loadOptions, loadOptionsPage, paged],
  );

  useEffect(() => {
    if (!open) return undefined;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      runSearch(q, 1, false);
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [q, open, runSearch]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const display =
    value?.label?.trim?.() ? value.label : value?.id != null ? `#${value.id}` : "";

  const loadMore = () => {
    if (!paged || !hasMore || loading || loadingMore) return;
    runSearch(q, page + 1, true);
  };

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", width: "100%" }}
      title={title}
    >
      <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
        <input
          className="input"
          style={{ flex: 1 }}
          disabled={disabled}
          placeholder={placeholder}
          value={open ? q : display}
          title={title}
          onChange={(e) => {
            setQ(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQ(display || "");
          }}
        />
        {value?.id != null && (
          <button
            type="button"
            className="btn"
            title="Clear selection"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setQ("");
              setOpen(false);
            }}
          >
            Clear
          </button>
        )}
      </div>
      {open && !disabled ? (
        <ul
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            zIndex: 40,
            maxHeight: 220,
            overflowY: "auto",
            margin: "4px 0 0",
            padding: "4px 0",
            listStyle: "none",
            background: "var(--card-bg, #fff)",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 6,
            boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          }}
        >
          {loading && !loadingMore ? (
            <li className="muted" style={{ padding: "8px 12px" }}>
              Loading…
            </li>
          ) : options.length === 0 ? (
            <li className="muted" style={{ padding: "8px 12px" }}>
              No matches
            </li>
          ) : (
            <>
              {options.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      borderRadius: 0,
                      fontWeight: 400,
                    }}
                    title={`Select ${o.label}`}
                    onClick={() => {
                      onChange(o);
                      setOpen(false);
                      setQ("");
                    }}
                  >
                    {o.label}
                  </button>
                </li>
              ))}
              {paged && hasMore ? (
                <li style={{ padding: "4px 8px" }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ width: "100%" }}
                    disabled={loadingMore}
                    title="Load the next page of search results"
                    onClick={(e) => {
                      e.preventDefault();
                      loadMore();
                    }}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                </li>
              ) : null}
            </>
          )}
        </ul>
      ) : null}
    </div>
  );
}
