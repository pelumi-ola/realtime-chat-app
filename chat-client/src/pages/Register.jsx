import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errMsg } from "../lib/api.js";
import AuthShell from "../components/AuthShell.jsx";
import { Button, ErrorText, Field } from "../components/ui.jsx";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", userName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      setError(errMsg(err));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes under a minute."
      footer={<>Already registered? <Link to="/login" className="font-semibold text-lagoon">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" required maxLength={50} value={form.firstName} onChange={set("firstName")} />
          <Field label="Last name" required maxLength={50} value={form.lastName} onChange={set("lastName")} />
        </div>
        <Field label="Username" required minLength={3} maxLength={30} value={form.userName} onChange={set("userName")} />
        <Field label="Email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
        <Field label="Password" type="password" required minLength={6} autoComplete="new-password"
          value={form.password} onChange={set("password")} />
        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>
    </AuthShell>
  );
}
