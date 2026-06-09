/** Returns the accessible text for a TanStack column sort state. */
export function getSortLabel(sorted: false | "asc" | "desc"): string {
  if (sorted === "asc") {
    return "Sorted ascending";
  }

  if (sorted === "desc") {
    return "Sorted descending";
  }

  return "Not sorted";
}

/** Returns the aria-sort value for a TanStack column sort state. */
export function getAriaSort(
  sorted: false | "asc" | "desc",
): "ascending" | "descending" | "none" {
  if (sorted === "asc") {
    return "ascending";
  }

  if (sorted === "desc") {
    return "descending";
  }

  return "none";
}
