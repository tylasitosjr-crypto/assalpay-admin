/** @param {unknown} approvalStatus */
export function approvalStatusLabel(approvalStatus) {
  const n = Number(approvalStatus);
  if (n === 1) return "Approved";
  if (n === 2) return "Rejected";
  return "Pending";
}

/** @param {unknown} approvalStatus */
export function getApprovalDropdownOptions(approvalStatus) {
  const cur = Number(approvalStatus);
  if (Number.isNaN(cur)) {
    return [
      { value: 0, label: "Pending" },
      { value: 1, label: "Approved" },
      { value: 2, label: "Rejected" },
    ];
  }
  if (cur === 0) {
    return [
      { value: 0, label: "Pending" },
      { value: 1, label: "Approved" },
      { value: 2, label: "Rejected" },
    ];
  }
  if (cur === 1) {
    return [
      { value: 1, label: "Approved" },
      { value: 2, label: "Rejected" },
    ];
  }
  if (cur === 2) {
    return [
      { value: 2, label: "Rejected" },
      { value: 1, label: "Approved" },
    ];
  }
  return [
    { value: 0, label: "Pending" },
    { value: 1, label: "Approved" },
    { value: 2, label: "Rejected" },
  ];
}

// /** @param {unknown} from @param {unknown} to */
// export function isApprovalTransitionAllowed(from, to) {
//   const f = Number(from);
//   const t = Number(to);
//   if (Number.isNaN(f) || Number.isNaN(t)) return false;
//   if (f === t) return true;
//   if (f === 0) return t === 1 || t === 2;
//   if (f === 1) return t === 2;
//   if (f === 2) return t === 1;
//   return false;
// }

/** @param {unknown} from @param {unknown} to */
export function isApprovalTransitionAllowed(from, to) {
  const f = Number(from);
  const t = Number(to);
  if (Number.isNaN(f) || Number.isNaN(t)) return false;

  // REMOVED: if (f === t) return true;
  // An item should not be allowed to transition to its current status.

  // When status is 0 (Pending), it can be Approved (1) or Rejected (2)
  if (f === 0) return t === 1 || t === 2;

  // When status is 1 (Approved), it is finalized. No further transitions allowed.
  if (f === 1) return false;

  // When status is 2 (Rejected), it can only be Approved (1)
  if (f === 2) return t === 1;

  return false;
}
