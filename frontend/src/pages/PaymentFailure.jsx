import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function PayuFailure() {
  const location = useLocation();
  const [redirectUrl, setRedirectUrl] = useState("/thank-you/failure");

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const txnid = params.get("txnid");

      const destination = txnid
        ? `/thank-you/failure?txnid=${encodeURIComponent(txnid)}`
        : `/thank-you/failure`;

      setRedirectUrl(destination);

      // redirect after short delay
      const timer = setTimeout(() => {
        window.location.replace(destination);
      }, 500);

      return () => clearTimeout(timer);
    } catch (error) {
      console.warn("Redirect failed:", error);
    }
  }, [location.search]);

  return (
    <div style={styles.body}>
      <div style={styles.page}>
        <h1 style={styles.heading}>Payment failed</h1>

        <p>
          We are redirecting you to the application. If this does not happen
          automatically, use the link below.
        </p>

        <p style={styles.notice}>If the redirect fails, click below:</p>

        <p>
          <a href={redirectUrl} style={styles.link}>
            {redirectUrl}
          </a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  body: {
    fontFamily: "Arial, sans-serif",
    background: "#fff5f5",
    color: "#621b1b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    margin: 0,
  },
  page: {
    textAlign: "center",
    maxWidth: "520px",
    padding: "24px",
    background: "#ffffff",
    border: "1px solid #f1c0c0",
    borderRadius: "16px",
    boxShadow: "0 20px 40px rgba(98, 27, 27, 0.08)",
  },
  heading: {
    marginBottom: "12px",
    color: "#b91c1c",
  },
  notice: {
    marginTop: "16px",
    fontSize: "0.95rem",
    color: "#7f1d1d",
  },
  link: {
    color: "#b91c1c",
    textDecoration: "none",
    fontWeight: 600,
  },
};
