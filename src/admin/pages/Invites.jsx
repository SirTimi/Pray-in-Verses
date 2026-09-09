import React from "react";
import { api } from "../api";
import RequireAuth from "../RequireAuth";

export default function Invites() {
  const [email, setEmail] =
    React.useState("");

  const [role, setRole] =
    React.useState("EDITOR");

  const [rows, setRows] =
    React.useState([]);

  const [sending, setSending] =
    React.useState(false);

  async function load() {
    const res =
      await api.listInvites();

    setRows(
      res?.data || [],
    );
  }

  React.useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();

    if (!email.trim()) {
      return;
    }

    try {
      setSending(true);

      await api.createInvite(
        email.trim(),
        role,
      );

      setEmail("");
      setRole("EDITOR");

      await load();
    } finally {
      setSending(false);
    }
  }

  return (
    <RequireAuth
      roles={["SUPER_ADMIN"]}
    >
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">
          Invites
        </h1>

        <form
          onSubmit={create}
          className="flex gap-2"
        >
          <input
            type="email"
            className="border rounded-md px-3 py-2"
            placeholder="email@example.com"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value,
              )
            }
            required
          />

          <select
            className="border rounded-md px-3 py-2"
            value={role}
            onChange={(e) =>
              setRole(
                e.target.value,
              )
            }
          >
            <option value="EDITOR">
              EDITOR
            </option>

            <option value="MODERATOR">
              MODERATOR
            </option>

            <option value="SUPER_ADMIN">
              SUPER_ADMIN
            </option>
          </select>

          <button
            type="submit"
            disabled={sending}
            className="px-3 py-2 rounded-md bg-gray-900 text-white disabled:opacity-50"
          >
            {sending
              ? "Sending..."
              : "Send"}
          </button>
        </form>

        <div className="space-y-2">
          {rows.map(
            (invite) => {
              const expired =
                !invite.acceptedAt &&
                new Date(
                  invite.expiresAt,
                ) < new Date();

              let status =
                "PENDING";

              if (
                invite.acceptedAt
              ) {
                status =
                  "ACCEPTED";
              } else if (
                expired
              ) {
                status =
                  "EXPIRED";
              }

              return (
                <div
                  key={invite.id}
                  className="border rounded-md p-3 bg-white"
                >
                  <div className="font-semibold">
                    {invite.email}
                    {" • "}
                    {invite.role}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    Expires:{" "}
                    {new Date(
                      invite.expiresAt,
                    ).toLocaleString()}
                    {" • "}
                    {status}
                  </div>
                </div>
              );
            },
          )}

          {rows.length ===
            0 && (
            <div className="text-sm text-gray-500">
              No invitations yet.
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}