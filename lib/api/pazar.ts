export async function setPazarActive(
  id: string,
  is_active: boolean
) {
  const res = await fetch(`/api/pazar/${id}/manage`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_active }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "İşlem başarısız");
  }

  return data as {
    ok: true;
    is_active: boolean;
  };
}