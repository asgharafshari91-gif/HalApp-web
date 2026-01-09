export function timeAgoTR(dateISO?: string | null) {
  if (!dateISO) return "";
  const d = new Date(dateISO);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s} sn önce`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day} gün önce`;
  return d.toLocaleDateString("tr-TR");
}