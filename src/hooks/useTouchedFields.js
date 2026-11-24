import { useCallback, useState } from "react";

/**
 * Only show validation messages after the user has interacted with a field (mark on blur/change).
 */
export function useTouchedFields() {
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const mark = useCallback((key) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const markMany = useCallback((keys) => {
    setTouched((prev) => {
      let next = prev;
      let changed = false;
      for (const k of keys) {
        if (!next[k]) {
          if (!changed) {
            next = { ...prev };
            changed = true;
          }
          next[k] = true;
        }
      }
      return next;
    });
  }, []);

  const markSubmitAttempt = useCallback(() => {
    setSubmitAttempted(true);
  }, []);

  const reset = useCallback(() => {
    setTouched({});
    setSubmitAttempted(false);
  }, []);

  const show = useCallback(
    (key, error) => Boolean(error && (touched[key] || submitAttempted)),
    [touched, submitAttempted],
  );

  /** e.g. date range: show if any listed field was touched, or after a submit attempt */
  const showWhen = useCallback(
    (error, keys) =>
      Boolean(error && (keys.some((k) => touched[k]) || submitAttempted)),
    [touched, submitAttempted],
  );

  return { mark, markMany, markSubmitAttempt, reset, show, showWhen };
}
