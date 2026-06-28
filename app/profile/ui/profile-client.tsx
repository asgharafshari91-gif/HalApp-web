"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";
import PremiumSelect from "@/components/ui/PremiumSelect";
import BlockButton from "@/components/BlockButton";

type AccountType = "individual" | "corporate";
type UserRole = "buyer" | "seller" | "both";
type KycStatus = "none" | "pending" | "approved" | "rejected" | "verified";

type LocationsIL = {
  il: string;
  ilceler: { ilce: string; mahalleler: string[] }[];
};

type ProfileRow = {
  id: string;

  full_name: string | null;
  company_name: string | null;

  account_type: AccountType | null;
  user_role: UserRole | null;

  city: string | null;
  district: string | null;
  neighborhood: string | null;
  address_line: string | null;

  phone: string | null;
  email: string | null;

  tax_office: string | null;
  tax_number: string | null;

  avatar_url: string | null;

  kvkk_accepted: boolean | null;
  kvkk_accepted_at: string | null;

  kyc_status: KycStatus | null;
  kyc_submitted_at: string | null;
  kyc_approved_at: string | null;
  kyc_rejected_at: string | null;
  kyc_last_updated: string | null;
  kyc_note: string | null;

  verified: boolean | null;

  kyc_id_front_url: string | null;
  kyc_id_back_url: string | null;
  kyc_selfie_url: string | null;

  id_card_front_url: string | null;
  id_card_back_url: string | null;
  selfie_url: string | null;

  profile_locked: boolean | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function bust(url: string) {
  if (!url) return "";
  const hasQ = url.includes("?");
  return `${url}${hasQ ? "&" : "?"}t=${Date.now()}`;
}

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "HA";
}

function safeName(p: ProfileRow | null) {
  const c = (p?.company_name ?? "").trim();
  const f = (p?.full_name ?? "").trim();
  return c || f || "HalApp Kullanıcısı";
}

function Badge({
  children,
  variant = "emerald",
}: {
  children: React.ReactNode;
  variant?: "emerald" | "amber" | "sky" | "rose";
}) {
  const cls =
    variant === "amber"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
      : variant === "sky"
      ? "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200"
      : variant === "rose"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200"
      : "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold",
        cls
      )}
    >
      {children}
    </span>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
        {label}
      </div>
      <div className="mt-2">{children}</div>
      {hint ? (
        <div className="mt-2 text-[11px] text-black/50 dark:text-white/50">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      type={type}
      className={clsx(
        "w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-extrabold text-black/80 outline-none",
        "focus:ring-2 focus:ring-emerald-500/40",
        "dark:border-white/10 dark:bg-black/30 dark:text-white/85",
        disabled && "cursor-not-allowed opacity-60"
      )}
    />
  );
}

function normStr(x: any) {
  return String(x ?? "").trim().replace(/\s+/g, " ");
}

function normKeyTR(x: any) {
  return normStr(x).toLocaleUpperCase("tr-TR");
}

function normalizeLocationsAny(raw: any): LocationsIL[] {
  if (!raw) return [];

  const unwrap =
    raw?.iller ??
    raw?.cities ??
    raw?.data ??
    raw?.locations ??
    raw?.Turkey ??
    raw?.turkey ??
    raw;

  if (
    Array.isArray(unwrap) &&
    unwrap.length &&
    unwrap[0]?.il &&
    Array.isArray(unwrap[0]?.ilceler)
  ) {
    return unwrap.map((c: any) => ({
      il: normStr(c.il),
      ilceler: (c.ilceler ?? []).map((d: any) => ({
        ilce: normStr(d.ilce),
        mahalleler: Array.isArray(d.mahalleler)
          ? d.mahalleler.map(normStr)
          : [],
      })),
    }));
  }

  if (Array.isArray(unwrap)) {
    const out: LocationsIL[] = [];

    for (const c of unwrap) {
      const il = normStr(c.il ?? c.city ?? c.name);
      if (!il) continue;

      const districts = c.ilceler ?? c.districts ?? c.counties ?? c.towns ?? [];

      const ilceler = Array.isArray(districts)
        ? districts
            .map((d: any) => {
              const ilce = normStr(d.ilce ?? d.district ?? d.name);
              const mahalleler =
                d.mahalleler ??
                d.neighborhoods ??
                d.quarters ??
                d.list ??
                d.items ??
                [];

              return {
                ilce,
                mahalleler: Array.isArray(mahalleler)
                  ? mahalleler.map(normStr)
                  : [],
              };
            })
            .filter((x: any) => x.ilce)
        : [];

      out.push({ il, ilceler });
    }

    if (out.length) return out;
  }

  if (unwrap && typeof unwrap === "object" && !Array.isArray(unwrap)) {
    const out: LocationsIL[] = [];

    for (const cityKey of Object.keys(unwrap)) {
      const il = normStr(cityKey);
      const v = unwrap[cityKey];

      if (Array.isArray(v)) {
        out.push({
          il,
          ilceler: v
            .map((d: any) => ({ ilce: normStr(d), mahalleler: [] }))
            .filter((x) => x.ilce),
        });
        continue;
      }

      if (v && typeof v === "object") {
        const ilceler = Object.keys(v)
          .map((distKey) => {
            const ilce = normStr(distKey);
            const n = v[distKey];

            if (Array.isArray(n)) {
              return { ilce, mahalleler: n.map(normStr) };
            }

            if (n && typeof n === "object") {
              const arr = n.mahalleler ?? n.neighborhoods ?? n.list ?? n.items ?? [];
              return {
                ilce,
                mahalleler: Array.isArray(arr) ? arr.map(normStr) : [],
              };
            }

            return { ilce, mahalleler: [] };
          })
          .filter((x) => x.ilce);

        out.push({ il, ilceler });
      }
    }

    if (out.length) return out;
  }

  return [];
}

function ext(f: File) {
  return (f.name.split(".").pop() || "jpg").toLowerCase();
}

async function uploadToKyc(bucketPath: string, file: File) {
  const { error } = await supabase.storage.from("kyc").upload(bucketPath, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
  });

  if (error) throw error;

  const { data } = supabase.storage.from("kyc").getPublicUrl(bucketPath);
  return data.publicUrl;
}

export default function ProfileClient() {
  const router = useRouter();
  const { toast } = useToast();

  const profileUserId =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("u") || "").trim() || null
      : null;

  const avatarInput = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [myId, setMyId] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [locs, setLocs] = useState<LocationsIL[]>([]);
  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [userRole, setUserRole] = useState<UserRole>("buyer");

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [addressLine, setAddressLine] = useState("");

  const [taxOffice, setTaxOffice] = useState("");
  const [taxNumber, setTaxNumber] = useState("");

  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  const [kycUploading, setKycUploading] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);

  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const [tradeReg, setTradeReg] = useState<File | null>(null);
  const [taxPlate, setTaxPlate] = useState<File | null>(null);
  const [activityCert, setActivityCert] = useState<File | null>(null);
  const [signatureCirc, setSignatureCirc] = useState<File | null>(null);

  const displayName = useMemo(() => safeName(profile), [profile]);

  const isMyProfile = useMemo(() => {
    if (!myId) return !profileUserId;
    if (!profileUserId) return true;
    return myId === profileUserId;
  }, [myId, profileUserId]);

  const locked = Boolean(profile?.profile_locked);
  const inputsDisabled = !isMyProfile || (locked && !editMode);

  const kycStatus = (profile?.kyc_status ?? "none") as KycStatus;

  const kycLocked =
    !isMyProfile ||
    kycStatus === "pending" ||
    kycStatus === "approved" ||
    kycStatus === "verified" ||
    profile?.verified === true;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!moreOpen) return;
      const el = moreRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setMoreOpen(false);
      }
    }

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [moreOpen]);

  const cityOptions = useMemo(() => {
    const arr = locs.map((x) => normStr(x.il)).filter(Boolean);
    const uniq = Array.from(new Set(arr));
    uniq.sort((a, b) => a.localeCompare(b, "tr"));
    return uniq;
  }, [locs]);

  const districtOptions = useMemo(() => {
    const il = locs.find((x) => normKeyTR(x.il) === normKeyTR(city));
    const arr = (il?.ilceler ?? []).map((d) => normStr(d.ilce)).filter(Boolean);
    const uniq = Array.from(new Set(arr));
    uniq.sort((a, b) => a.localeCompare(b, "tr"));
    return uniq;
  }, [locs, city]);

  const neighborhoodOptions = useMemo(() => {
    const il = locs.find((x) => normKeyTR(x.il) === normKeyTR(city));
    const ilce = (il?.ilceler ?? []).find(
      (d) => normKeyTR(d.ilce) === normKeyTR(district)
    );
    const arr = (ilce?.mahalleler ?? []).map(normStr).filter(Boolean);
    const uniq = Array.from(new Set(arr));
    uniq.sort((a, b) => a.localeCompare(b, "tr"));
    return uniq;
  }, [locs, city, district]);

  const useManualLocation = !locLoading && (locs?.length ?? 0) === 0;

  function hydrate(p: ProfileRow) {
    setAccountType((p.account_type ?? "individual") as AccountType);
    setUserRole((p.user_role ?? "buyer") as UserRole);

    setFullName(p.full_name ?? "");
    setCompanyName(p.company_name ?? "");

    setPhone(p.phone ?? "");
    setEmail(p.email ?? "");

    setCity(p.city ?? "");
    setDistrict(p.district ?? "");
    setNeighborhood(p.neighborhood ?? "");
    setAddressLine(p.address_line ?? "");

    setTaxOffice(p.tax_office ?? "");
    setTaxNumber(p.tax_number ?? "");

    setKvkkAccepted(Boolean(p.kvkk_accepted));
  }

  async function loadLocations() {
    setLocLoading(true);
    setLocError(null);

    try {
      const r = await fetch("/locations.json", { cache: "no-store" });

      if (!r.ok) {
        throw new Error(`/locations.json okunamadı (HTTP ${r.status}). public klasöründe mi?`);
      }

      const raw = await r.json();
      const normalized = normalizeLocationsAny(raw);

      setLocs(normalized);

      if (!normalized.length) {
        setLocError("locations.json okundu ama format tanınmadı veya içerik boş.");
      }
    } catch (e: any) {
      setLocs([]);
      setLocError(e?.message ?? "locations.json okunamadı.");
    } finally {
      setLocLoading(false);
    }
  }

  async function ensureProfile(targetId: string, canCreate: boolean) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetId)
      .maybeSingle();

    if (error) throw error;

    if (!data && canCreate) {
      const { error: ie } = await supabase.from("profiles").insert({
        id: targetId,
        account_type: "individual",
        user_role: "buyer",
        kyc_status: "none",
        kvkk_accepted: false,
        profile_locked: false,
        verified: false,
      });

      if (ie) throw ie;

      const { data: p2, error: e2 } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();

      if (e2) throw e2;

      return (p2 as ProfileRow) ?? null;
    }

    return (data as ProfileRow) ?? null;
  }

  async function loadAll() {
    setLoading(true);

    try {
      await loadLocations();

      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;

      setMyId(uid);

      if (!uid && !profileUserId) {
        router.replace(`/auth?next=${encodeURIComponent("/profile")}`);
        return;
      }

      const targetId = profileUserId || uid;
      if (!targetId) return;

      const canCreate = Boolean(uid && targetId === uid);
      const p = await ensureProfile(targetId, canCreate);

      if (!p) {
        toast({
          variant: "warning",
          title: "Bulunamadı",
          message: "Bu kullanıcı profili bulunamadı.",
        });
        router.push("/");
        return;
      }

      setProfile(p);
      hydrate(p);
      setEditMode(false);
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Profil yüklenemedi",
        message: e?.message ?? "Hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId]);

  useEffect(() => {
    const targetId = profileUserId || myId;
    if (!targetId) return;

    const ch = supabase
      .channel(`profile-live-${targetId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${targetId}`,
        },
        async () => {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", targetId)
              .maybeSingle();

            if (error) return;

            const p = (data as ProfileRow) ?? null;
            setProfile(p);
            if (p) hydrate(p);
          } catch {
            // no-op
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId, myId]);

  useEffect(() => {
    if (useManualLocation) return;

    if (!city) {
      setDistrict("");
      setNeighborhood("");
      return;
    }

    if (
      district &&
      !districtOptions.some((x) => normKeyTR(x) === normKeyTR(district))
    ) {
      setDistrict("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, locs]);

  useEffect(() => {
    if (useManualLocation) return;

    if (!district) {
      setNeighborhood("");
      return;
    }

    if (
      neighborhood &&
      !neighborhoodOptions.some((x) => normKeyTR(x) === normKeyTR(neighborhood))
    ) {
      setNeighborhood("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [district, locs]);

  async function pickAvatar(file: File) {
    if (!isMyProfile) return;

    try {
      setAvatarUploading(true);

      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;

      if (!uid) return;

      const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${uid}/avatar_${Date.now()}.${extension}`;

      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: file.type || "image/jpeg",
      });

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", uid);

      if (dbErr) throw dbErr;

      toast({
        variant: "success",
        title: "Güncellendi",
        message: "Profil fotoğrafın yenilendi.",
      });

      await loadAll();
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Avatar yüklenemedi",
        message: e?.message ?? "Hata oluştu.",
      });
    } finally {
      setAvatarUploading(false);
    }
  }

  function validateProfile() {
    if (!isMyProfile) return false;

    if (!kvkkAccepted) {
      toast({
        variant: "warning",
        title: "KVKK gerekli",
        message: "Devam için KVKK metnini kabul et.",
      });
      return false;
    }

    if (accountType === "individual" && !fullName.trim()) {
      toast({
        variant: "warning",
        title: "Ad Soyad gerekli",
        message: "Bireysel hesapta ad soyad zorunlu.",
      });
      return false;
    }

    if (accountType === "corporate") {
      if (!companyName.trim()) {
        toast({
          variant: "warning",
          title: "Şirket adı gerekli",
          message: "Kurumsal hesapta şirket adı zorunlu.",
        });
        return false;
      }

      if (!taxOffice.trim() || !taxNumber.trim()) {
        toast({
          variant: "warning",
          title: "Vergi bilgileri",
          message: "Vergi dairesi ve vergi no zorunlu.",
        });
        return false;
      }
    }

    if (!city.trim() || !district.trim() || !neighborhood.trim()) {
      toast({
        variant: "warning",
        title: "Adres eksik",
        message: "İl/İlçe/Mahalle zorunlu.",
      });
      return false;
    }

    if (!addressLine.trim()) {
      toast({
        variant: "warning",
        title: "Açık adres gerekli",
        message: "Detaylı adres zorunlu.",
      });
      return false;
    }

    return true;
}
  async function saveAndLock() {
    if (!isMyProfile) return;

    try {
      if (!validateProfile()) return;

      setSaving(true);

      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;

      if (!uid) return;

      const payload: any = {
        account_type: accountType,
        user_role: userRole,

        full_name: accountType === "individual" ? fullName.trim() : null,
        company_name: accountType === "corporate" ? companyName.trim() : null,

        phone: phone.trim() || null,
        email: email.trim() || null,

        city: city.trim(),
        district: district.trim(),
        neighborhood: neighborhood.trim(),
        address_line: addressLine.trim(),

        tax_office: accountType === "corporate" ? taxOffice.trim() : null,
        tax_number: accountType === "corporate" ? taxNumber.trim() : null,

        kvkk_accepted: kvkkAccepted,
        kvkk_accepted_at: kvkkAccepted ? new Date().toISOString() : null,

        profile_locked: true,
      };

      const { error } = await supabase.from("profiles").update(payload).eq("id", uid);
      if (error) throw error;

      toast({
        variant: "success",
        title: "Kaydedildi",
        message: "Profil kaydedildi ve kilitlendi.",
      });

      await loadAll();
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Kaydedilemedi",
        message: e?.message ?? "Hata oluştu.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function startEdit() {
    if (!isMyProfile) return;
    setEditMode(true);
    toast({
      variant: "info",
      title: "Düzenleme açık",
      message: "Alanları güncelleyebilirsin.",
    });
  }

  async function cancelEdit() {
    if (profile) hydrate(profile);
    setEditMode(false);
    toast({
      variant: "info",
      title: "İptal",
      message: "Değişiklikler geri alındı.",
    });
  }

  function validateKycBeforeSubmit() {
    if (!isMyProfile) return false;

    if (kycLocked) {
      toast({
        variant: "info",
        title: "Kilitli",
        message: "KYC incelemede/onaylı. Tekrar yüklenemez.",
      });
      return false;
    }

    if (!idFront || !idBack || !selfie) {
      toast({
        variant: "warning",
        title: "Eksik belge",
        message: "Kimlik ön/arka + selfie zorunlu.",
      });
      return false;
    }

    if (accountType === "corporate") {
      if (!tradeReg || !taxPlate || !activityCert || !signatureCirc) {
        toast({
          variant: "warning",
          title: "Kurumsal belgeler eksik",
          message:
            "Ticaret sicil, vergi levhası, faaliyet belgesi, imza sirküleri zorunlu.",
        });
        return false;
      }
    }

    return true;
  }

  async function submitKycOnce() {
    if (!isMyProfile) return;

    try {
      if (!validateKycBeforeSubmit()) return;

      setKycSubmitting(true);
      setKycUploading(true);

      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;

      if (!uid) {
        toast({
          variant: "error",
          title: "Oturum yok",
          message: "Lütfen tekrar giriş yap.",
        });
        return;
      }

      const now = new Date().toISOString();
      const ts = Date.now();
      const prefix = `${uid}/${ts}`;

      const idFrontUrl = await uploadToKyc(
        `${prefix}_id_front.${ext(idFront!)}`,
        idFront!
      );

      const idBackUrl = await uploadToKyc(
        `${prefix}_id_back.${ext(idBack!)}`,
        idBack!
      );

      const selfieUrl = await uploadToKyc(
        `${prefix}_selfie.${ext(selfie!)}`,
        selfie!
      );

      let kycNote: string | null = null;

      if (accountType === "corporate") {
        const tradeRegUrl = await uploadToKyc(
          `${prefix}_trade_registry.${ext(tradeReg!)}`,
          tradeReg!
        );

        const taxPlateUrl = await uploadToKyc(
          `${prefix}_tax_plate.${ext(taxPlate!)}`,
          taxPlate!
        );

        const activityCertUrl = await uploadToKyc(
          `${prefix}_activity_cert.${ext(activityCert!)}`,
          activityCert!
        );

        const signatureCircUrl = await uploadToKyc(
          `${prefix}_signature_circ.${ext(signatureCirc!)}`,
          signatureCirc!
        );

        kycNote = [
          `Kurumsal KYC belgeleri yüklendi.`,
          `Ticaret sicil: ${tradeRegUrl}`,
          `Vergi levhası: ${taxPlateUrl}`,
          `Faaliyet belgesi: ${activityCertUrl}`,
          `İmza sirküleri: ${signatureCircUrl}`,
        ].join("\n");
      }

      const payload: any = {
        kyc_status: "pending",
        kyc_submitted_at: now,
        kyc_last_updated: now,
        kyc_approved_at: null,
        kyc_rejected_at: null,

        verified: false,

        kyc_id_front_url: idFrontUrl,
        kyc_id_back_url: idBackUrl,
        kyc_selfie_url: selfieUrl,

        id_card_front_url: idFrontUrl,
        id_card_back_url: idBackUrl,
        selfie_url: selfieUrl,
      };

      if (kycNote) {
        payload.kyc_note = kycNote;
      }

      if (accountType === "corporate") {
        payload.registration_type = "corporate";
        payload.company_name = companyName.trim() || null;
        payload.tax_office = taxOffice.trim() || null;
        payload.tax_number = taxNumber.trim() || null;
        payload.activity_certificate_no = activityCert?.name ?? null;
      }

      const { error } = await supabase.from("profiles").update(payload).eq("id", uid);

      if (error) throw error;

      toast({
        variant: "success",
        title: "KYC Gönderildi",
        message: "Belgeler incelemeye alındı.",
      });

      setIdFront(null);
      setIdBack(null);
      setSelfie(null);
      setTradeReg(null);
      setTaxPlate(null);
      setActivityCert(null);
      setSignatureCirc(null);

      await loadAll();
    } catch (e: any) {
      toast({
        variant: "error",
        title: "KYC gönderilemedi",
        message: e?.message ?? "Hata oluştu.",
      });
    } finally {
      setKycUploading(false);
      setKycSubmitting(false);
    }
  }

  async function restartKycIfRejected() {
    if (!isMyProfile) return;

    try {
      if (kycStatus !== "rejected") return;

      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;

      if (!uid) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          kyc_status: "none",
          kyc_submitted_at: null,
          kyc_rejected_at: null,
          kyc_last_updated: new Date().toISOString(),
          kyc_note: null,
          verified: false,
        })
        .eq("id", uid);

      if (error) throw error;

      toast({
        variant: "info",
        title: "Tekrar açıldı",
        message: "Belgeleri yeniden yükleyebilirsin.",
      });

      await loadAll();
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Açılamadı",
        message: e?.message ?? "Hata oluştu.",
      });
    }
  }

  if (loading || !profile) {
    return (
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.55)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => (isMyProfile ? avatarInput.current?.click() : null)}
              disabled={avatarUploading || !isMyProfile}
              className={clsx(
                "h-16 w-16 overflow-hidden rounded-3xl bg-black/5 ring-1 ring-black/10 dark:bg-white/5 dark:ring-white/10",
                isMyProfile ? "transition hover:opacity-95" : "cursor-default",
                (avatarUploading || !isMyProfile) && "cursor-not-allowed opacity-60"
              )}
              title={isMyProfile ? "Profil fotoğrafını değiştir" : "Profil fotoğrafı"}
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bust(profile.avatar_url)}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-black text-black/70 dark:text-white/75">
                  {initials(displayName)}
                </div>
              )}
            </button>

            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.currentTarget.value = "";
                if (f) pickAvatar(f);
              }}
            />

            <div className="min-w-0">
              <div className="text-xl font-black tracking-tight">{displayName}</div>
              <div className="mt-1 text-sm text-black/60 dark:text-white/60">
                {profile.phone || profile.email || "—"}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="sky">
                  Hesap: {accountType === "corporate" ? "Kurumsal" : "Bireysel"}
                </Badge>

                <Badge variant="sky">
                  Rol:{" "}
                  {userRole === "both"
                    ? "Alıcı + Satıcı"
                    : userRole === "seller"
                    ? "Satıcı"
                    : "Alıcı"}
                </Badge>

                <Badge
                  variant={
                    kycStatus === "approved" || profile.verified
                      ? "emerald"
                      : kycStatus === "rejected"
                      ? "rose"
                      : "sky"
                  }
                >
                  KYC: {profile.verified ? "approved" : kycStatus}
                </Badge>

                {locked ? <Badge variant="sky">Kilitli</Badge> : <Badge variant="sky">Açık</Badge>}
                {editMode ? <Badge variant="amber">Düzenleme</Badge> : null}
                {!isMyProfile ? <Badge variant="sky">Görüntüleme</Badge> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isMyProfile && (profileUserId || profile.id) ? (
              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen((s) => !s)}
                  className="rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-sm font-extrabold transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  aria-label="Daha fazla"
                  title="Daha fazla"
                >
                  <span className="text-lg leading-none">⋮</span>
                </button>

                {moreOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-3xl border border-black/10 bg-white/95 shadow-[0_18px_70px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-zinc-950/95">
                    <div className="p-2">
                      <div className="px-1 py-1">
                        <BlockButton targetUserId={profile.id} />
                      </div>

                      <div className="my-2 h-px bg-black/10 dark:bg-white/10" />

                      <button
                        onClick={() => {
                          setMoreOpen(false);
                          router.push(`/settings/report?user=${encodeURIComponent(profile.id)}`);
                        }}
                        className="w-full rounded-2xl px-3 py-2 text-left text-sm font-extrabold text-black/80 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/5"
                      >
                        Sorun Bildir
                        <div className="text-xs font-semibold text-black/50 dark:text-white/50">
                          Şikayet / spam / uygunsuz içerik
                        </div>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {isMyProfile ? (
              !editMode ? (
                <button
                  onClick={startEdit}
                  className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  Profili Düzenle
                </button>
              ) : (
                <>
                  <button
                    onClick={cancelEdit}
                    className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-sm font-extrabold text-black/70 transition hover:bg-white dark:border-white/10 dark:bg-black/30 dark:text-white/75 dark:hover:bg-black/20"
                  >
                    İptal
                  </button>

                  <button
                    onClick={saveAndLock}
                    disabled={saving}
                    className={clsx(
                      "rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black transition hover:bg-emerald-400",
                      saving && "cursor-not-allowed opacity-60"
                    )}
                  >
                    {saving ? "Kaydediliyor…" : "Kaydet & Kilitle"}
                  </button>
                </>
              )
            ) : (
              <button
                onClick={() => router.back()}
                className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                Geri
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">Hesap Tipi</div>
        <div className="mt-1 text-sm text-black/60 dark:text-white/60">
          Satıcı/Alıcı ve Bireysel/Kurumsal seçimi, ilan ve güven seviyeni etkiler.
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Hesap tipi">
            <PremiumSelect
              value={accountType}
              onChange={(v) => setAccountType(v as AccountType)}
              disabled={inputsDisabled}
            >
              <option value="individual">Bireysel</option>
              <option value="corporate">Kurumsal</option>
            </PremiumSelect>
          </Field>

          <Field label="Rol">
            <PremiumSelect
              value={userRole}
              onChange={(v) => setUserRole(v as UserRole)}
              disabled={inputsDisabled}
            >
              <option value="buyer">Alıcı</option>
              <option value="seller">Satıcı</option>
              <option value="both">Alıcı + Satıcı</option>
            </PremiumSelect>
          </Field>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">Kimlik & İletişim</div>
        <div className="mt-1 text-sm text-black/60 dark:text-white/60">
          Profilin güveni için temel bilgiler.
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Ad Soyad" hint="Bireysel hesaplarda zorunlu.">
            <Input
              value={fullName}
              onChange={setFullName}
              placeholder="Ad Soyad"
              disabled={inputsDisabled || accountType !== "individual"}
            />
          </Field>

          <Field label="Şirket Ünvanı" hint="Kurumsal hesaplarda zorunlu.">
            <Input
              value={companyName}
              onChange={setCompanyName}
              placeholder="Örn: HalApp Gıda Pazarlama A.Ş."
              disabled={inputsDisabled || accountType !== "corporate"}
            />
          </Field>

          <Field label="Telefon">
            <Input value={phone} onChange={setPhone} placeholder="05xx..." disabled={inputsDisabled} />
          </Field>

          <Field label="E-posta">
            <Input
              value={email}
              onChange={setEmail}
              placeholder="mail@..."
              disabled={inputsDisabled}
              type="email"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">Adres</div>
        <div className="mt-1 text-sm text-black/60 dark:text-white/60">
          İl/İlçe/Mahalle Seçin <b>/</b> Açık adres zorunlu.
        </div>

        {locError ? (
          <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-black/70 dark:text-white/70">
            <b>Konum listesi yüklenemedi:</b> {locError}
            <div className="mt-1 text-xs opacity-80">
              Dosya yolu: <b>public/locations.json</b> olmalı.
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {!useManualLocation ? (
            <>
              <Field label="İl">
                <PremiumSelect value={city} onChange={setCity} disabled={inputsDisabled || locLoading}>
                  <option value="">{locLoading ? "Yükleniyor…" : "Seçiniz"}</option>
                  {cityOptions.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </PremiumSelect>
              </Field>

              <Field label="İlçe">
                <PremiumSelect
                  value={district}
                  onChange={setDistrict}
                  disabled={inputsDisabled || !city || locLoading}
                >
                  <option value="">{!city ? "Önce il seç" : "Seçiniz"}</option>
                  {districtOptions.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </PremiumSelect>
              </Field>

              <Field label="Mahalle / Semt">
                <PremiumSelect
                  value={neighborhood}
                  onChange={setNeighborhood}
                  disabled={inputsDisabled || !district || locLoading}
                >
                  <option value="">{!district ? "Önce ilçe seç" : "Seçiniz"}</option>
                  {neighborhoodOptions.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </PremiumSelect>
              </Field>
            </>
          ) : (
            <>
              <Field label="İl">
                <Input value={city} onChange={setCity} placeholder="Örn: Antalya" disabled={inputsDisabled} />
              </Field>

              <Field label="İlçe">
                <Input
                  value={district}
                  onChange={setDistrict}
                  placeholder="Örn: Muratpaşa"
                  disabled={inputsDisabled}
                />
              </Field>

              <Field label="Mahalle / Semt">
                <Input
                  value={neighborhood}
                  onChange={setNeighborhood}
                  placeholder="Örn: Lara"
                  disabled={inputsDisabled}
                />
              </Field>
            </>
          )}

          <div className="sm:col-span-2">
            <Field label="Açık adres" hint="Sokak, no, kat, daire vb. zorunlu.">
              <textarea
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                disabled={inputsDisabled}
                placeholder="Örn: ... sokak no: ... kat: ... daire: ..."
                className={clsx(
                  "min-h-[110px] w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-extrabold text-black/80 outline-none",
                  "focus:ring-2 focus:ring-emerald-500/40",
                  "dark:border-white/10 dark:bg-black/30 dark:text-white/85",
                  inputsDisabled && "cursor-not-allowed opacity-60"
                )}
              />
            </Field>
          </div>
        </div>
      </div>

      {accountType === "corporate" ? (
        <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-lg font-black">Kurumsal Bilgiler</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Kurumsal hesap için vergi bilgileri zorunlu.
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Vergi Dairesi">
              <Input
                value={taxOffice}
                onChange={setTaxOffice}
                placeholder="Örn: Kepez VD"
                disabled={inputsDisabled}
              />
            </Field>

            <Field label="Vergi No">
              <Input
                value={taxNumber}
                onChange={setTaxNumber}
                placeholder="1234567890"
                disabled={inputsDisabled}
              />
            </Field>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-black/70 dark:text-white/70">
            Kurumsal KYC’de ayrıca <b>Ticaret Sicil</b>, <b>Vergi Levhası</b>,{" "}
            <b>Faaliyet Belgesi</b>, <b>İmza Sirküleri</b> zorunludur.
          </div>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">KVKK Aydınlatma Metni</div>

        <div className="mt-2 text-sm leading-6 text-black/65 dark:text-white/65">
          HalApp; platform güvenliği, ilan yayınlama, kullanıcı doğrulama, mesajlaşma ve destek
          süreçleri için kimlik/iletişim ve adres verilerini işler.
        </div>

        <label className={clsx("mt-4 flex items-start gap-3", inputsDisabled && "opacity-60")}>
          <input
            type="checkbox"
            checked={kvkkAccepted}
            onChange={(e) => setKvkkAccepted(e.target.checked)}
            disabled={inputsDisabled}
            className="mt-1 h-4 w-4"
          />

          <span className="text-sm font-extrabold text-black/75 dark:text-white/75">
            KVKK metnini okudum ve kabul ediyorum. (Zorunlu)
          </span>
        </label>
      </div>

      {isMyProfile ? (
        <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-lg font-black">KYC (Kimlik Doğrulama)</div>
              <div className="mt-1 text-sm text-black/60 dark:text-white/60">
                {profile.verified || kycStatus === "approved"
                  ? "KYC onaylandı. Belgeler kilitli."
                  : kycStatus === "pending"
                  ? "Belgeler inceleme aşamasında. Tekrar yükleyemezsin."
                  : kycStatus === "rejected"
                  ? "KYC reddedildi. Tekrar başlatabilirsin."
                  : "Yeni kullanıcı isen belgeleri yükleyip gönderebilirsin."}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={
                  profile.verified || kycStatus === "approved"
                    ? "emerald"
                    : kycStatus === "rejected"
                    ? "rose"
                    : "sky"
                }
              >
                Durum: {profile.verified ? "approved" : kycStatus}
              </Badge>

              {kycStatus === "rejected" ? (
                <button
                  onClick={restartKycIfRejected}
                  className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  Tekrar Başlat
                </button>
              ) : null}
            </div>
          </div>

          <div className={clsx("mt-4 grid gap-3 sm:grid-cols-3", kycLocked && "opacity-60")}>
            <Field label="Kimlik Ön">
              <input
                type="file"
                accept="image/*,application/pdf"
                disabled={kycLocked}
                onChange={(e) => setIdFront(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
              />
              {idFront ? <div className="mt-2 text-xs font-bold">{idFront.name}</div> : null}
            </Field>

            <Field label="Kimlik Arka">
              <input
                type="file"
                accept="image/*,application/pdf"
                disabled={kycLocked}
                onChange={(e) => setIdBack(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
              />
              {idBack ? <div className="mt-2 text-xs font-bold">{idBack.name}</div> : null}
            </Field>

            <Field label="Selfie">
              <input
                type="file"
                accept="image/*,application/pdf"
                disabled={kycLocked}
                onChange={(e) => setSelfie(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
              />
              {selfie ? <div className="mt-2 text-xs font-bold">{selfie.name}</div> : null}
            </Field>
          </div>

          {accountType === "corporate" ? (
            <div className={clsx("mt-3 grid gap-3 sm:grid-cols-2", kycLocked && "opacity-60")}>
              <Field label="Ticaret Sicil">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={kycLocked}
                  onChange={(e) => setTradeReg(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
                {tradeReg ? <div className="mt-2 text-xs font-bold">{tradeReg.name}</div> : null}
              </Field>

              <Field label="Vergi Levhası">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={kycLocked}
                  onChange={(e) => setTaxPlate(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
                {taxPlate ? <div className="mt-2 text-xs font-bold">{taxPlate.name}</div> : null}
              </Field>

              <Field label="Faaliyet Belgesi">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={kycLocked}
                  onChange={(e) => setActivityCert(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
                {activityCert ? <div className="mt-2 text-xs font-bold">{activityCert.name}</div> : null}
              </Field>

              <Field label="İmza Sirküleri">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={kycLocked}
                  onChange={(e) => setSignatureCirc(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
                {signatureCirc ? <div className="mt-2 text-xs font-bold">{signatureCirc.name}</div> : null}
              </Field>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={kycLocked || kycSubmitting || kycUploading}
              onClick={submitKycOnce}
              className={clsx(
                "rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black transition hover:bg-emerald-400",
                (kycLocked || kycSubmitting || kycUploading) && "cursor-not-allowed opacity-60"
              )}
            >
              {kycLocked
                ? "KYC Kilitli"
                : kycSubmitting || kycUploading
                ? "Gönderiliyor…"
                : "KYC Belgelerini Gönder"}
            </button>

            {kycStatus === "pending" ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-semibold text-black/70 dark:text-white/70">
                İnceleme aşamasında. Sonuçlanınca durum otomatik güncellenecek.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {isMyProfile ? (
        editMode ? (
          <button
            onClick={saveAndLock}
            disabled={saving}
            className={clsx(
              "w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black transition hover:bg-emerald-400",
              saving && "cursor-not-allowed opacity-60"
            )}
          >
            {saving ? "Kaydediliyor…" : "Kaydet & Kilitle"}
          </button>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-semibold text-black/65 dark:border-white/10 dark:bg-white/5 dark:text-white/65">
            Profil kilitli. Güncellemek için <b>“Profili Düzenle”</b> butonuna bas.
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-semibold text-black/65 dark:border-white/10 dark:bg-white/5 dark:text-white/65">
          Bu sayfa görüntüleme modunda. Düzenleme ve KYC yalnızca kendi profilinde yapılır.
        </div>
      )}
    </div>
  );
}