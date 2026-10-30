import { useState } from "react";
import api, { errMsg } from "../lib/api.js";
import { idOf } from "../lib/helpers.js";
import { Button, ErrorText, Field, Modal } from "./ui.jsx";

// Used for both creating (POST /rooms) and editing (PATCH /rooms/:id)
export default function RoomModal({ room, onClose, onSaved }) {
  const editing = !!room;
  const [form, setForm] = useState({
    groupName: room?.groupName || room?.name || "",
    description: room?.description || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (editing) await api.patch(`/room/${idOf(room)}`, form);
      else await api.post("/room", form);
      await onSaved();
      onClose();
    } catch (err) {
      setError(errMsg(err));
      setLoading(false);
    }
  };

  return (
    <Modal title={editing ? "Edit room" : "Create a room"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorText>{error}</ErrorText>
        <Field
          label="Room name"
          required
          minLength={2}
          maxLength={60}
          value={form.groupName}
          onChange={(e) => setForm({ ...form, groupName: e.target.value })}
        />
        <Field
          label="Description (optional)"
          maxLength={200}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {editing ? "Save changes" : "Create room"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
