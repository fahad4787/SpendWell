import React, { useState } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import AppButton from "../ui/AppButton";

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
    <InputGroup>
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
      />
      <AppButton
        tone="ghost"
        size="icon"
        onClick={() => setShowPassword((v) => !v)}
        className="password-toggle"
        type="button"
        disabled={disabled}
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-pressed={showPassword}
      >
        {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
      </AppButton>
    </InputGroup>
  );
};

export default PasswordField;
