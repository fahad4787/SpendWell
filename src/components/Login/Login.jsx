import React, { useState } from "react";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { Form, Alert, Spinner, Modal } from "react-bootstrap";
import AuthLayout from "../../Layout/AuthLayout";
import AuthCard from "../Auth/AuthCard";
import PasswordField from "../Auth/PasswordField";
import AppButton from "../ui/AppButton";

const Login = ({ onLogin, lockedMessage }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");

  const getAuthErrorMessage = (err) => {
    const code = err?.code || "";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
      return "Invalid email or password.";
    }
    if (code === "auth/invalid-email") return "Please enter a valid email address.";
    if (code === "auth/operation-not-allowed") {
      return "Email/password sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method.";
    }
    if (code === "auth/too-many-requests") return "Too many attempts. Please try again later.";
    return err?.message || "Unable to sign in. Please try again.";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onLogin();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordClick = () => {
    setShowResetModal(true);
    setResetEmail(email);
    setResetSuccess("");
    setResetError("");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetError("");
    setResetSuccess("");
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSuccess("Password reset email sent. Check your inbox.");
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseResetModal = () => {
    setShowResetModal(false);
    setResetEmail("");
    setResetSuccess("");
    setResetError("");
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to manage expenses, cash, and monthly summaries."
        showLogo
      >
        {lockedMessage ? (
          <Alert variant="warning" className="py-2 px-3 small" role="alert" aria-live="polite">
            {lockedMessage}
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="danger" className="py-2 px-3 small" role="alert" aria-live="polite">
            {error}
          </Alert>
        ) : null}
        <Form onSubmit={handleLogin}>
          <Form.Group className="form-group" controlId="login-email">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="you@company.com…"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              spellCheck={false}
            />
          </Form.Group>

          <Form.Group className="form-group" controlId="login-password">
            <Form.Label>Password</Form.Label>
            <PasswordField
              id="login-password"
              name="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
          </Form.Group>

          <AppButton tone="primary" type="submit" disabled={loading} block className="mt-2">
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </AppButton>

          <div className="auth-panel__footer">
            <button
              type="button"
              className="auth-panel__link"
              onClick={handleResetPasswordClick}
            >
              Forgot your password?
            </button>
          </div>
        </Form>
      </AuthCard>

      <Modal show={showResetModal} onHide={handleCloseResetModal} centered className="app-modal auth-reset-modal">
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {resetSuccess ? (
            <Alert variant="success" className="mb-0" role="status" aria-live="polite">
              {resetSuccess}
            </Alert>
          ) : (
            <Form id="reset-password-form" onSubmit={handleResetPassword}>
              {resetError ? (
                <Alert variant="danger" role="alert" aria-live="polite">
                  {resetError}
                </Alert>
              ) : null}
              <Form.Group className="mb-3" controlId="reset-email">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="you@company.com…"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoComplete="email"
                  spellCheck={false}
                />
              </Form.Group>
              <p className="app-modal__hint">We&apos;ll send you a link to reset your password.</p>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          {resetSuccess ? (
            <AppButton tone="primary" size="sm" onClick={handleCloseResetModal}>
              Close
            </AppButton>
          ) : (
            <>
              <AppButton tone="secondary" size="sm" onClick={handleCloseResetModal} disabled={resetLoading}>
                Cancel
              </AppButton>
              <AppButton tone="primary" size="sm" type="submit" form="reset-password-form" disabled={resetLoading}>
                {resetLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </AppButton>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </AuthLayout>
  );
};

export default Login;
