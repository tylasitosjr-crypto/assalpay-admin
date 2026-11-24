import { useEffect, useState } from "react";
import { Link, useNavigate, useMatch, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";

export default function FaqForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !!useMatch({ path: "/faqs/new", end: true });
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (isCreate || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/admin/faqs/${id}`);
        const row = unwrap(res);
        if (!cancelled) {
          setQuestion(row.question || "");
          setAnswer(row.answer || "");
          setStatus(row.status === 1 ? "active" : "inactive");
        }
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const qErr =
    question && question.trim().length < 3 ? "Min 3 characters" : "";

  const submit = async (e) => {
    e.preventDefault();
    if (qErr || !question.trim()) {
      toast.error("Fix validation errors");
      return;
    }
    try {
      const body = {
        question: question.trim(),
        answer,
        status,
      };
      if (isCreate) {
        const res = await axiosInstance.post("/admin/faqs", body);
        const row = unwrap(res);
        toast.success("Created");
        navigate(`/faqs/${row.id}`);
      } else {
        const res = await axiosInstance.put(`/admin/faqs/${id}`, body);
        unwrap(res);
        toast.success("Saved");
        navigate(`/faqs/${id}`);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <Link className="btn" to="/faqs">
        ← FAQ list
      </Link>
      <h2 style={{ marginTop: "1rem" }}>{isCreate ? "New FAQ" : "Edit FAQ"}</h2>
      <form className="stack" style={{ gap: "1rem", marginTop: "1rem" }} onSubmit={submit}>
        <label className="field">
          <span className="field-label">Question</span>
          <textarea
            className="input"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
          {qErr && <span className="field-error">{qErr}</span>}
        </label>
        <label className="field">
          <span className="field-label">Answer</span>
          <textarea
            className="input"
            rows={8}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Status</span>
          <select
            className="input"
            style={{ maxWidth: 200 }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button type="submit" className="btn primary">
          Save
        </button>
      </form>
    </div>
  );
}
