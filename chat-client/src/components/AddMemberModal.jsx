import { useState } from "react";
import api, { errMsg } from "../lib/api.js";
import { Button, ErrorText, Field, Modal } from "./ui.jsx";

export default function AddMemberModal({ roomId, onClose, onAdded }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post(`/room/${roomId}/members`, { email });
      await onAdded();
      onClose();
    } catch (err) {
      setError(errMsg(err));
      setLoading(false);
    }
  };

  return (
    <Modal title="Add a member" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorText>{error}</ErrorText>
        <Field
          label="Their email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add member
          </Button>
        </div>
      </form>
    </Modal>
  );
}
