import LoginForm from "@/components/auth/LoginForm";
import "@/styles/editor.css";
import { RiGridLine } from "@remixicon/react";

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <RiGridLine size={24} />
          </div>
          <h1>Sign in to Baseline</h1>
          <p>Save your grids, build a library, and download in bulk.</p>
        </div>
        <LoginForm />
        <div className="login-footer">
          <a href="/editor">Continue without signing in</a>
        </div>
      </div>
    </div>
  );
}
