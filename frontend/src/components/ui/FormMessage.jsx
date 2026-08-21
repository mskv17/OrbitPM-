import React from "react";

export const FormMessage = ({ message, text, type = "info", children }) => {
  const content = typeof message === "object" ? message?.text : message || text || children;
  const messageType = typeof message === "object" ? message?.type || type : type;

  if (!content) return null;

  return (
    <p className={`form-message ${messageType || "info"}`} role="alert">
      {content}
    </p>
  );
};

export default FormMessage;
