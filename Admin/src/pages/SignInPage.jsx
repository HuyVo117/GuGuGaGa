import { useState } from "react";
import { useSignIn } from "../hooks/useSignIn";

export default function SignInPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const signInMutation = useSignIn();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await signInMutation.mutateAsync({ email, password });
      window.location.reload();
    } catch {
      setError("Dang nhap that bai");
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <h2 className="login-title">GuGuGaGa Admin</h2>
        <p className="login-subtitle">Dang nhap de quan tri san pham, don hang va van hanh giao nhan.</p>
        <form onSubmit={handleSubmit}>
          <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
          />
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Dang nhap
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </div>
    </div>
  );
}
