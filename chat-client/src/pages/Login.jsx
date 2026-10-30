import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errMsg } from "../lib/api.js";
import AuthShell from "../components/AuthShell.jsx";
import { Button, ErrorText, Field } from "../components/ui.jsx";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(errMsg(err));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up your conversations."
      footer={<>New here? <Link to="/register" className="font-semibold text-lagoon">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorText>{error}</ErrorText>
        <Field label="Email" type="email" required autoComplete="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field label="Password" type="password" required autoComplete="current-password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      </form>
    </AuthShell>
  );
}
