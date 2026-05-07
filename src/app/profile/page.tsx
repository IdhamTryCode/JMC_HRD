"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AppShell from "@/components/AppShell";
import { D } from "@/lib/design-tokens";

type SessionInfo = { userId: number; username: string; role: string };

function passwordRules(v: string) {
  const errors: string[] = [];
  if (v.length < 8) errors.push("Minimal 8 karakter");
  if (/\s/.test(v)) errors.push("Tidak boleh ada spasi");
  if (!/[A-Z]/.test(v)) errors.push("Harus ada huruf kapital");
  if (!/[a-z]/.test(v)) errors.push("Harus ada huruf kecil");
  if (!/[^A-Za-z0-9]/.test(v)) errors.push("Harus ada karakter spesial");
  return errors;
}

const roleLabel: Record<string, string> = {
  superadmin: "Superadmin",
  manager_hrd: "Manager HRD",
  admin_hrd: "Admin HRD",
};

export default function ProfilePage() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSession);
  }, []);

  const newPwErrors = newPw ? passwordRules(newPw) : [];
  const confirmMismatch = confirmPw && confirmPw !== newPw;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (newPwErrors.length > 0 || confirmMismatch) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/users/${session.userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengubah password");
      setSuccess("Password berhasil diubah");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <Box sx={{ maxWidth: 480 }}>
        {/* User identity card */}
        {session && (
          <Card sx={{ borderRadius: "14px", border: `1px solid ${D.hairline}`, boxShadow: "none", mb: 2 }}>
            <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: D.primary, fontSize: 18, fontWeight: 600 }}>
                {session.username[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: D.ink, letterSpacing: "-0.009em" }}>
                  {session.username}
                </Typography>
                <Chip
                  label={roleLabel[session.role] ?? session.role}
                  size="small"
                  color="primary"
                  sx={{ mt: 0.5, height: 20, fontSize: 11 }}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Change password */}
        <Card sx={{ borderRadius: "14px", border: `1px solid ${D.hairline}`, boxShadow: "none" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Ganti Password
            </Typography>
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Password Saat Ini"
                type={showCurrent ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowCurrent((v) => !v)}>
                        {showCurrent ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Password Baru"
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                error={newPwErrors.length > 0}
                helperText={newPwErrors.length > 0 ? newPwErrors.join(", ") : " "}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowNew((v) => !v)}>
                        {showNew ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Konfirmasi Password Baru"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                error={!!confirmMismatch}
                helperText={confirmMismatch ? "Password tidak cocok" : " "}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading || newPwErrors.length > 0 || !!confirmMismatch}
                sx={{ alignSelf: "flex-start" }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : "Simpan Password"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AppShell>
  );
}
