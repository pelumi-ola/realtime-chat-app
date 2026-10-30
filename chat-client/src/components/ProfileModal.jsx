import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import api, { errMsg } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Avatar, Button, ErrorText, Field, Modal } from "./ui.jsx";

export default function ProfileModal({ onClose }) {
  const { user, patchUser } = useAuth();
  const fileRef = useRef();
  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    userName: user.userName || "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await api.patch("/users/profile", form);
      const body = res.data?.data ?? res.data;
      patchUser({ ...form, ...(body?.user ?? {}) });
      setNotice("Profile saved");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  // Matches multer's upload.single("avatar"); server limit is 2 MB (JPEG/PNG/WebP)
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024)
      return setError("Image must be 2 MB or smaller");
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.post("/uploads/avatar", fd);
      const body = res.data?.data ?? res.data;
      const updated = body?.user ?? body?.data?.user;
      if (!updated?.avatarUrl)
        throw new Error("Upload finished but no image URL came back");
      patchUser({ avatarUrl: updated.avatarUrl });
      setNotice("Photo updated");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Modal title="Your profile" onClose={onClose}>
      <div className="mb-5 flex items-center gap-4">
        <Avatar user={user} size={64} />
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={upload}
          />
          <Button
            variant="ghost"
            loading={uploading}
            onClick={() => fileRef.current.click()}
          >
            <Camera size={16} /> Change photo
          </Button>
          <p className="mt-1 text-xs text-slate-500">
            JPEG, PNG or WebP, up to 2 MB
          </p>
        </div>
      </div>
      <form onSubmit={save} className="space-y-4">
        <ErrorText>{error}</ErrorText>
        {notice && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First name"
            required
            maxLength={50}
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Field
            label="Last name"
            required
            maxLength={50}
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
        <Field
          label="Username"
          required
          minLength={3}
          maxLength={30}
          value={form.userName}
          onChange={(e) => setForm({ ...form, userName: e.target.value })}
        />
        <p className="text-sm text-slate-500">{user.email}</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
