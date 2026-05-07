"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Step = "credential" | "otp";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("credential");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [userId, setUserId] = useState<number>(0);
  const [otp, setOtp] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [showDevCreds, setShowDevCreds] = useState(false);

  async function loadCaptcha() {
    const res = await fetch("/api/auth/captcha");
    const data = await res.json();
    setCaptchaId(data.id);
    setCaptchaImage(data.image);
    setCaptchaAnswer("");
  }

  useEffect(() => {
    loadCaptcha();
  }, []);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  async function handleCredentialSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, captchaId, captchaAnswer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        await loadCaptcha();
        return;
      }
      setUserId(data.userId);
      setStep("otp");
      setOtpCountdown(60);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "OTP salah atau kadaluarsa");
        return;
      }
      const role: string = data.role;
      if (role === "superadmin") router.push("/dashboard/superadmin");
      else if (role === "manager_hrd") router.push("/dashboard/manager");
      else router.push("/dashboard/admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f5f7",
        px: 2,
        py: 6,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: "18px",
          border: "1px solid #e0e0e0",
          boxShadow: "none",
          bgcolor: "#fff",
        }}
        elevation={0}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo + branding */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Image src="/images/logo.png" alt="JMC" width={36} height={36} style={{ borderRadius: 8 }} />
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6e6e73", lineHeight: 1.2 }}>
                JMC Indonesia
              </Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.011em", lineHeight: 1.2 }}>
                HRD System
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6e6e73", mb: 0.75 }}>
            {step === "credential" ? "Login" : "Verifikasi"}
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: "#1d1d1f", mb: 0.5, lineHeight: 1.2 }}>
            {step === "credential" ? "Selamat datang." : "Cek email Anda."}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#6e6e73", mb: 3, letterSpacing: "-0.007em" }}>
            {step === "credential"
              ? "Masuk ke sistem HRD JMC Indonesia."
              : "Kode OTP 6 digit telah dikirim ke email Anda."}
          </Typography>

          {step === "credential" && (
            <Box sx={{ mb: 2 }}>
              <Button
                size="small"
                variant="text"
                onClick={() => setShowDevCreds((v) => !v)}
                sx={{ fontSize: 11, color: "#6e6e73", textTransform: "none", px: 1 }}
              >
                {showDevCreds ? "Sembunyikan dev credentials" : "Lihat dev credentials"}
              </Button>
              {showDevCreds && (
                <Alert severity="info" sx={{ mt: 1, borderRadius: 2 }} icon={false}>
                  {[
                    { role: "Superadmin", username: "superadmin", password: "Admin#123" },
                    { role: "Manager HRD", username: "managerhrd", password: "Pegawai#123" },
                    { role: "Admin HRD", username: "adminhrd", password: "Pegawai#123" },
                  ].map(({ role, username: u, password: p }) => (
                    <Box key={u} sx={{ display: "flex", gap: 1, mb: 0.25, alignItems: "baseline" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 82 }}>
                        {role}:
                      </Typography>
                      <Typography variant="caption">
                        <strong>{u}</strong> / <strong>{p}</strong>
                      </Typography>
                    </Box>
                  ))}
                </Alert>
              )}
            </Box>
          )}

          {step === "otp" && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }} icon={false}>
              <Typography variant="caption" display="block">
                Cek OTP di{" "}
                <strong>MailHog</strong>:{" "}
                <a href="http://localhost:8025" target="_blank" rel="noreferrer">localhost:8025</a>
              </Typography>
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {step === "credential" && (
            <Box component="form" onSubmit={handleCredentialSubmit}>
              <TextField
                label="Username / Email / No. HP"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ mb: 2 }}
                autoComplete="username"
                autoFocus
                required
              />
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
                autoComplete="current-password"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  {captchaImage && (
                    <Box
                      component="img"
                      src={captchaImage}
                      alt="captcha"
                      sx={{
                        height: 60,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        flex: 1,
                      }}
                    />
                  )}
                  <IconButton onClick={loadCaptcha} size="small" aria-label="refresh captcha">
                    <RefreshIcon />
                  </IconButton>
                </Box>
                <TextField
                  label="Ketik kode di atas"
                  fullWidth
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                  inputProps={{ maxLength: 6 }}
                  required
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ borderRadius: 2, py: 1.5 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Lanjutkan"}
              </Button>
            </Box>
          )}

          {step === "otp" && (
            <Box component="form" onSubmit={handleOtpSubmit}>
              <TextField
                label="Kode OTP (6 digit)"
                fullWidth
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                sx={{ mb: 1 }}
                inputProps={{ inputMode: "numeric", maxLength: 6 }}
                autoFocus
                required
              />
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {otpCountdown > 0
                    ? `OTP berlaku selama ${otpCountdown} detik`
                    : "OTP sudah kadaluarsa."}
                </Typography>
                {otpCountdown === 0 && (
                  <Button
                    size="small"
                    variant="text"
                    disabled={loading}
                    onClick={async () => {
                      setError("");
                      setLoading(true);
                      try {
                        const res = await fetch("/api/auth/otp/resend", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error ?? "Gagal kirim ulang");
                        setOtpCountdown(60);
                        setOtp("");
                      } catch (e: unknown) {
                        setError(e instanceof Error ? e.message : "Terjadi kesalahan");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Kirim Ulang OTP
                  </Button>
                )}
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography variant="caption">Ingat saya selama 30 hari</Typography>}
                sx={{ mb: 1 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || otpCountdown === 0}
                sx={{ borderRadius: 2, py: 1.5, mb: 1.5 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Verifikasi"}
              </Button>
              <Button
                variant="text"
                fullWidth
                onClick={() => {
                  setStep("credential");
                  setOtp("");
                  setError("");
                  loadCaptcha();
                }}
              >
                Kembali
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
