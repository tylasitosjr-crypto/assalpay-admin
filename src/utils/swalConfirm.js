import Swal from "sweetalert2";

const base = {
  showCancelButton: true,
  cancelButtonText: "Cancel",
};

export async function confirmDelete(opts = {}) {
  const { isConfirmed } = await Swal.fire({
    ...base,
    icon: "warning",
    title: opts.title ?? "Delete this item?",
    text: opts.text,
    confirmButtonText: opts.confirmText ?? "Delete",
    confirmButtonColor: "#b91c1c",
  });
  return isConfirmed;
}

export async function confirmLogout() {
  const { isConfirmed } = await Swal.fire({
    ...base,
    icon: "question",
    title: "Log out?",
    text: "You will need to log in again to access the admin panel.",
    confirmButtonText: "Log out",
    confirmButtonColor: "#166534",
  });
  return isConfirmed;
}

export async function confirmAction(opts = {}) {
  const { isConfirmed } = await Swal.fire({
    ...base,
    icon: opts.icon ?? "question",
    title: opts.title ?? "Confirm?",
    text: opts.text,
    confirmButtonText: opts.confirmText ?? "Confirm",
    confirmButtonColor: opts.confirmColor ?? "#166534",
  });
  return isConfirmed;
}
