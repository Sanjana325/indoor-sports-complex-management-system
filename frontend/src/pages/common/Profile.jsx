import { useMemo } from "react";

export default function Profile() {
  const user = useMemo(() => {
    const userId = localStorage.getItem("userId") || "";
    const firstName = localStorage.getItem("firstName") || "";
    const lastName = localStorage.getItem("lastName") || "";
    const email = localStorage.getItem("email") || "";
    const phone = localStorage.getItem("phone") || "";
    const role = localStorage.getItem("role") || "";

    const specialization = localStorage.getItem("specialization") || "";
    const qualifications = localStorage.getItem("qualifications") || "";

    return { userId, firstName, lastName, email, phone, role, specialization, qualifications };
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>My Profile</h2>

      <div style={{ maxWidth: 520 }}>
        <div style={{ marginBottom: 10 }}>
          <strong>Name:</strong> {`${user.firstName} ${user.lastName}`.trim() || "-"}
        </div>

        <div style={{ marginBottom: 10 }}>
          <strong>Email:</strong> {user.email || "-"}
        </div>

        <div style={{ marginBottom: 10 }}>
          <strong>Phone:</strong> {user.phone || "-"}
        </div>

        <div style={{ marginBottom: 10 }}>
          <strong>Role:</strong> {user.role || "-"}
        </div>

        {user.role === "COACH" ? (
          <>
            <div style={{ marginBottom: 10 }}>
              <strong>Specialization:</strong> {user.specialization || "-"}
            </div>

            <div style={{ marginBottom: 10 }}>
              <strong>Qualifications:</strong> {user.qualifications || "-"}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
