import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";

export default function CmsEditor() {
  const { slug } = useParams();

  const [cmsList, setCmsList] = useState([]);
  const [busy, setBusy] = useState(false);

  const subtypeLabels = {
    1: "Customer",
    2: "Vendor",
    3: "Driver",
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await axiosInstance.get(
          `/admin/cms/${slug}`,
        );

        const rows = unwrap(res);

        if (!cancelled) {
          setCmsList(rows || []);
        }
      } catch (e) {
        toast.error(e.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    }),
    [],
  );

  const updateField = (index, field, value) => {
    setCmsList((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);

    try {
      const payload = {
        cms: cmsList.map((item) => ({
          id: item.id,
          title: item.title?.trim() || "",
          description: item.description || "",
        })),
      };

      const res = await axiosInstance.put(
        `/admin/cms/${slug}`,
        payload,
      );

      const updatedRows = unwrap(res);

      setCmsList(updatedRows);

      toast.success("CMS updated successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pageTitles = {
    "about-us": "About Us",
    "privacy-policy": "Privacy Policy",
    "terms-and-conditions": "Terms & Conditions",
  };

  return (
    <div className="card">
      <Link className="btn" to="/">
        ← Dashboard
      </Link>

      <h2 style={{ marginTop: "1rem" }}>
        {pageTitles[slug] || "CMS"}
      </h2>

      <form
        onSubmit={submit}
        style={{
          marginTop: "1rem",
        }}
      >
        {cmsList.map((item, index) => (
          <div
            key={item.id}
            className="card"
            style={{
              marginBottom: "20px",
              padding: "20px",
              border: "1px solid #ddd",
            }}
          >

            <label className="field">
              <span className="field-label">Title</span>

              <input
                className="input"
                value={item.title || ""}
                onChange={(e) =>
                  updateField(
                    index,
                    "title",
                    e.target.value,
                  )
                }
              />
            </label>

            <label
              className="field"
              style={{ marginTop: "1rem" }}
            >
              <span className="field-label">
                Content
              </span>

              <ReactQuill
                theme="snow"
                value={item.description || ""}
                modules={modules}
                onChange={(value) =>
                  updateField(
                    index,
                    "description",
                    value,
                  )
                }
              />
            </label>
          </div>
        ))}

        <button
          type="submit"
          className="btn primary"
          disabled={busy}
        >
          {busy ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}

// import { useEffect, useMemo, useState } from "react";
// import { Link, useParams } from "react-router-dom";
// import ReactQuill from "react-quill";
// import "react-quill/dist/quill.snow.css";
// import { toast } from "react-toastify";
// import { axiosInstance, unwrap } from "../../api/axiosInstance.js";

// export default function CmsEditor() {
//   const { slug } = useParams();
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [busy, setBusy] = useState(false);

//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       try {
//         const res = await axiosInstance.get(`/admin/cms/${slug}`);
//         const row = unwrap(res);
//         if (!cancelled) {
//           setTitle(row.title || "");
//           setDescription(row.description || "");
//         }
//       } catch (e) {
//         toast.error(e.message);
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, [slug]);

//   const modules = useMemo(
//     () => ({
//       toolbar: [
//         [{ header: [1, 2, false] }],
//         ["bold", "italic", "underline", "strike"],
//         [{ list: "ordered" }, { list: "bullet" }],
//         ["link"],
//         ["clean"],
//       ],
//     }),
//     [],
//   );

//   const submit = async (e) => {
//     e.preventDefault();
//     setBusy(true);
//     try {
//       const res = await axiosInstance.put(`/admin/cms/${slug}`, {
//         title: title.trim(),
//         description,
//       });
//       unwrap(res);
//       toast.success("Saved");
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setBusy(false);
//     }
//   };

//   const titles = {
//     "about-us": "About us",
//     "privacy-policy": "Privacy policy",
//     "terms-and-conditions": "Terms & conditions",
//   };

//   return (
//     <div className="card">
//       <Link className="btn" to="/">
//         ← Dashboard
//       </Link>
//       <h2 style={{ marginTop: "1rem" }}>
//         {titles[slug] || "CMS"}
//       </h2>
//       <form className="stack" style={{ gap: "1rem", marginTop: "1rem" }} onSubmit={submit}>
//         <label className="field">
//           <span className="field-label">Title</span>
//           <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
//         </label>
//         <label className="field">
//           <span className="field-label">Content</span>
//           <ReactQuill theme="snow" value={description} onChange={setDescription} modules={modules} />
//         </label>
//         <button type="submit" className="btn primary" disabled={busy}>
//           Save
//         </button>
//       </form>
//     </div>
//   );
// }
