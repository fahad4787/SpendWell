import React, { useState } from "react";
import { Form } from "react-bootstrap";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PasswordField = ({
  value,
  onChange,
  placeholder = "Password",
  required = true,
  disabled = false,
  autoComplete = "current-password",
  id = "password",
  name = "password",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="password-field">
      <Form.Control
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className="password-field__input"
      />
      <button
        type="button"
        className="password-field__toggle"
        onClick={() => setShowPassword((v) => !v)}
        disabled={disabled}
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-pressed={showPassword}
        tabIndex={-1}
      >
        {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
      </button>
    </div>
  );
};

export default PasswordField;
