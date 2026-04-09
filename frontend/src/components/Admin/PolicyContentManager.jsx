import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, FormGroup, Input, Label, Spinner } from "reactstrap";
import {
  fetchAllPolicyContent,
  POLICY_PAGE_CONFIG,
  savePolicyContent,
} from "../../utils/policyContent";

const FONT_OPTIONS = [
  { label: "Default", value: "inherit" },
  { label: "Poppins", value: "Poppins" },
  { label: "Roboto", value: "Roboto" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Playfair Display", value: "Playfair Display" },
];

function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const updateValue = () => {
    onChange(editorRef.current?.innerHTML || "");
  };

  const runCommand = (command, commandValue = null) => {
    focusEditor();

    if (typeof document !== "undefined") {
      document.execCommand(command, false, commandValue);
      updateValue();
    }
  };

  const handleAddLink = () => {
    const nextUrl = window.prompt("Enter the link URL");

    if (nextUrl) {
      runCommand("createLink", nextUrl);
    }
  };

  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-editor__toolbar">
        <select
          className="admin-rich-editor__font"
          defaultValue="inherit"
          onChange={(event) => runCommand("fontName", event.target.value)}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.label} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>

        <button type="button" onClick={() => runCommand("bold")}>
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => runCommand("italic")}>
          <em>I</em>
        </button>
        <button type="button" onClick={() => runCommand("underline")}>
          <u>U</u>
        </button>
        <button type="button" onClick={() => runCommand("insertUnorderedList")}>
          • List
        </button>
        <button type="button" onClick={() => runCommand("insertOrderedList")}>
          1. List
        </button>
        <button type="button" onClick={handleAddLink}>
          Link
        </button>
        <button type="button" onClick={() => runCommand("removeFormat")}>
          Clear
        </button>
      </div>

      <div
        ref={editorRef}
        className="admin-rich-editor__canvas"
        contentEditable
        suppressContentEditableWarning
        onInput={updateValue}
      />
    </div>
  );
}

export default function PolicyContentManager({ user }) {
  const [policyDrafts, setPolicyDrafts] = useState({});
  const [activePolicyKey, setActivePolicyKey] = useState(
    POLICY_PAGE_CONFIG[0].key,
  );
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let active = true;

    const loadPolicies = async () => {
      try {
        setLoading(true);
        const nextPolicies = await fetchAllPolicyContent();

        if (active) {
          setPolicyDrafts(nextPolicies);
        }
      } catch (error) {
        if (active) {
          setStatus({
            color: "danger",
            text: error?.message || "Unable to load policy pages right now.",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPolicies();

    return () => {
      active = false;
    };
  }, []);

  const activePolicy = useMemo(() => {
    return (
      policyDrafts[activePolicyKey] || {
        title:
          POLICY_PAGE_CONFIG.find((item) => item.key === activePolicyKey)
            ?.title || "Policy Page",
        html: "",
        route:
          POLICY_PAGE_CONFIG.find((item) => item.key === activePolicyKey)
            ?.route || "/",
      }
    );
  }, [activePolicyKey, policyDrafts]);

  const handleDraftChange = (field, value) => {
    setPolicyDrafts((prev) => ({
      ...prev,
      [activePolicyKey]: {
        ...prev[activePolicyKey],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSavingKey(activePolicyKey);
      const savedPolicy = await savePolicyContent(
        activePolicyKey,
        activePolicy,
        user?.uid || "admin",
      );

      setPolicyDrafts((prev) => ({
        ...prev,
        [activePolicyKey]: savedPolicy,
      }));
      setStatus({
        color: "success",
        text: `${savedPolicy.title} saved to Firebase successfully.`,
      });
    } catch (error) {
      setStatus({
        color: "danger",
        text: error?.message || "Unable to save the policy page right now.",
      });
    } finally {
      setSavingKey("");
    }
  };

  return (
    <div className="admin-panel-card">
      <div className="admin-panel-card__header">
        <div>
          <h4>Policy pages</h4>
          <p>
            Edit the public Terms, Privacy, and Refund pages with rich text and
            save them directly to Firebase.
          </p>
        </div>
      </div>

      <div className="admin-section-nav admin-section-nav--policies">
        {POLICY_PAGE_CONFIG.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`admin-section-nav__btn ${
              activePolicyKey === item.key ? "active" : ""
            }`}
            onClick={() => setActivePolicyKey(item.key)}
          >
            {item.title}
          </button>
        ))}
      </div>

      {status ? <Alert color={status.color}>{status.text}</Alert> : null}

      {loading ? (
        <div className="admin-loader">
          <Spinner size="sm" /> Loading policy editor...
        </div>
      ) : (
        <div className="admin-policy-editor">
          <div className="admin-preview-note">
            <h5>{activePolicy.title}</h5>
            <p>
              Public route: <code>{activePolicy.route}</code>
            </p>
          </div>

          <FormGroup className="mt-3">
            <Label for="policyPageTitle">Page title</Label>
            <Input
              id="policyPageTitle"
              value={activePolicy.title || ""}
              onChange={(event) =>
                handleDraftChange("title", event.target.value)
              }
            />
          </FormGroup>

          <div className="admin-policy-editor__block">
            <Label className="mb-2">Policy content</Label>
            <RichTextEditor
              value={activePolicy.html || ""}
              onChange={(nextHtml) => handleDraftChange("html", nextHtml)}
            />
          </div>

          <div className="admin-form-actions">
            <Button
              color="primary"
              type="button"
              onClick={handleSave}
              disabled={savingKey === activePolicyKey}
            >
              {savingKey === activePolicyKey ? "Saving..." : "Save policy"}
            </Button>
            <a
              className="btn btn-outline-secondary"
              href={activePolicy.route}
              target="_blank"
              rel="noreferrer"
            >
              Open page
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
