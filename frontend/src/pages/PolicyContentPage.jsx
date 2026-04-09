import React, { useEffect, useState } from "react";
import { Alert, Col, Container, Row, Spinner } from "reactstrap";
import CommonSection from "../shared/CommonSection";
import Newsletter from "../shared/Newsletter";
import {
  fetchPolicyContent,
  normalizePolicyContent,
} from "../utils/policyContent";
import "../styles/policy-page.css";

export default function PolicyContentPage({ policyKey = "terms" }) {
  const [policy, setPolicy] = useState(() => normalizePolicyContent(policyKey));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPolicy = async () => {
      try {
        setLoading(true);
        setError("");
        const nextPolicy = await fetchPolicyContent(policyKey);

        if (active) {
          setPolicy(nextPolicy);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError?.message || "Unable to load this policy page right now.",
          );
          setPolicy(normalizePolicyContent(policyKey));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPolicy();

    return () => {
      active = false;
    };
  }, [policyKey]);

  return (
    <>
      <CommonSection title={policy.title} />
      <section className="policy-page-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg="10">
              {error ? <Alert color="warning">{error}</Alert> : null}
              <div className="policy-page-card">
                {loading ? (
                  <div className="policy-page-loading">
                    <Spinner size="sm" /> Loading content...
                  </div>
                ) : (
                  <div
                    className="policy-page-content"
                    dangerouslySetInnerHTML={{ __html: policy.html }}
                  />
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      <Newsletter />
    </>
  );
}
