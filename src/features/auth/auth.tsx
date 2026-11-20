import { createContext, useContext, useState, type ReactNode } from "react";
import { Alert, Button, Form, Input, Modal, Typography } from "antd";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { ALLOWED_DOMAINS, register, signIn, signOut, type AuthError, type User } from "./authApi";
import { useLanguage } from "../../shared/i18n/language";

export type { User };

/** Cât timp nu te loghezi, aplicația merge ca „Guest”. Mai târziu, rezervarea poate cere logare. */
const GUEST: User = { email: "guest", name: "Guest" };

type AuthApi = {
  /** Utilizatorul curent; `GUEST` dacă nu e logat nimeni. */
  user: User;
  isGuest: boolean;
  /** Pornește sesiunea după o logare sau o confirmare reușită. */
  startSession: (user: User) => void;
  logout: () => void;
};

const SESSION_KEY = "workplace-booking.session.v1";
const AuthContext = createContext<AuthApi | null>(null);

function readSession(): User | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const u = parsed as Record<string, unknown>;
      if (typeof u.email === "string" && typeof u.name === "string") return { email: u.email, name: u.name };
    }
  } catch {
    /* sesiune ilizibilă: se cere din nou logarea */
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<User | null>(readSession);

  const startSession = (next: User) => {
    setSession(next);
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      /* fără salvare: sesiunea ține doar până la reîncărcare */
    }
  };

  // Ieșirea șterge doar sesiunea. Rezervările și notificările rămân salvate pe e-mailul utilizatorului.
  const logout = () => {
    void signOut();
    setSession(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      /* nimic de făcut */
    }
  };

  const api: AuthApi = { user: session ?? GUEST, isGuest: session === null, startSession, logout };
  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthApi {
  const api = useContext(AuthContext);
  if (!api) throw new Error("useAuth must be used inside AuthProvider");
  return api;
}

type Step = "signin" | "register";

function AuthFlow({ onDone }: { onDone: () => void }) {
  const { startSession } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("signin");
  const [error, setError] = useState<AuthError | null>(null);
  const [busy, setBusy] = useState(false);

  const go = (next: Step) => {
    setError(null);
    setStep(next);
  };

  const handleSignIn = async (v: { email: string; password: string }) => {
    setBusy(true);
    const res = await signIn(v.email, v.password);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    startSession(res.user);
    onDone();
  };

  const handleRegister = async (v: { name: string; email: string; password: string }) => {
    setBusy(true);
    const res = await register(v.email, v.password, v.name);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    startSession(res.user);
    onDone();
  };

  const errorBox = error ? <Alert type="error" showIcon message={t.auth.errors[error]} style={{ marginBottom: 12 }} /> : null;

  const isRegister = step === "register";
  return (
    <>
      <Typography.Paragraph type="secondary">
        {isRegister ? t.auth.registerIntro : t.auth.signInIntro}
      </Typography.Paragraph>
      {errorBox}
      <Form key={step} layout="vertical" requiredMark={false} onFinish={isRegister ? handleRegister : handleSignIn}>
        {isRegister && (
          <Form.Item name="name" label={t.auth.fullName} rules={[{ required: true, message: t.auth.enterName }]}>
            <Input prefix={<UserOutlined />} autoComplete="name" placeholder="Ana Popescu" />
          </Form.Item>
        )}
        <Form.Item
          name="email"
          label={t.auth.email}
          rules={[
            { required: true, message: t.auth.enterEmail },
            { type: "email", message: t.auth.invalidEmail },
          ]}
        >
          <Input prefix={<MailOutlined />} autoComplete="username" placeholder="name@outlook.com" />
        </Form.Item>
        <Form.Item
          name="password"
          label={t.auth.password}
          rules={[
            { required: true, message: t.auth.enterPassword },
            ...(isRegister ? [{ min: 6, message: t.auth.minPassword }] : []),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} autoComplete={isRegister ? "new-password" : "current-password"} />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={busy}>
          {isRegister ? t.auth.register : t.auth.signIn}
        </Button>
      </Form>
      <div style={{ marginTop: 12, textAlign: "center" }}>
        {isRegister ? (
          <Button type="link" onClick={() => go("signin")}>
            {t.auth.haveAccount}
          </Button>
        ) : (
          <Button type="link" onClick={() => go("register")}>
            {t.auth.newHere}
          </Button>
        )}
      </div>
      {isRegister && ALLOWED_DOMAINS.length > 0 && (
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: 0, textAlign: "center" }}>
          {t.auth.domains(ALLOWED_DOMAINS.join(", "))}
        </Typography.Paragraph>
      )}
    </>
  );
}

/**
 * Fereastra de logare / înregistrare, deschisă din bara din stânga.
 * Logare reală (server, e-mail cu cod) se conectează în `authApi.ts`.
 */
export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <Modal open={open} onCancel={onClose} footer={null} title={t.auth.title} width={400} destroyOnHidden>
      {open && <AuthFlow onDone={onClose} />}
    </Modal>
  );
}