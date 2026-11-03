import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { Form, Alert } from "react-bootstrap";
import { auth } from "../../firebase";
import { completeBootstrap } from "../../utils/bootstrap";
import AuthLayout from "../../Layout/AuthLayout";
import AuthCard from "../Auth/AuthCard";
import PasswordField from "../Auth/PasswordField";
import AppButton from "../ui/AppButton";

const Signup = ({ setupComplete, onRegistered }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (setupComplete) {
    return <Navigate to="/login" replace />;
  }

  const getErrorMessage = (err) => {
    if (err?.message === "SETUP_ALREADY_COMPLETE") {
      return "Setup is already complete. Please sign in instead.";
    }
    const code = err?.code || "";
    if (code === "auth/email-already-in-use") {
      return "This email is already registered. Try signing in.";
    }
    if (code === "auth/invalid-email") return "Please enter a valid email address.";
    if (code === "auth/weak-password") {
      return "Password should be at least 6 characters.";
    }
    if (code === "auth/operation-not-allowed") {
      return "Email/password sign-up is not enabled in Firebase Authentication.";
    }
    return err?.message || "Unable to create account. Please try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = username.trim();
    const mail = email.trim().toLowerCase();

    if (!name) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, mail, password);
      try {
        await completeBootstrap({
          uid: cred.user.uid,
          email: mail,
          username: name,
        });
      } catch (bootErr) {
        // Roll back orphan auth user if bootstrap lost the race
        try {
          await cred.user.delete();
        } catch {
          await signOut(auth);
        }
        throw bootErr;
      }
      onRegistered?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Create admin account"
        subtitle="One-time setup — register the first Spendwell admin. This page won’t be available after setup."
        showLogo
      >
        {error ? (
          <Alert variant="danger" className="py-2 px-3 small" role="alert" aria-live="polite">
            {error}
          </Alert>
        ) : null}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="form-group" controlId="signup-name">
            <Form.Label>Full name</Form.Label>
            <Form.Control
              type="text"
              name="username"
              placeholder="Your name…"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="name"
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="form-group" controlId="signup-email">
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
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="form-group" controlId="signup-password">
            <Form.Label>Password</Form.Label>
            <PasswordField
              id="signup-password"
              name="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="form-group" controlId="signup-confirm">
            <Form.Label>Confirm password</Form.Label>
            <PasswordField
              id="signup-confirm"
              name="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              disabled={loading}
            />
          </Form.Group>

          <AppButton
            tone="primary"
            type="submit"
            loading={loading}
            loadingText="Creating account…"
            block
            className="mt-2"
          >
            Create admin account
          </AppButton>
        </Form>
      </AuthCard>
    </AuthLayout>
  );
};

export default Signup;
