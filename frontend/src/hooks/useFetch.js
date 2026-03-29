import { useState, useEffect } from "react";

const useFetch = (url) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const res = await fetch(url);

        if (!res.ok) {
          const text = await res.text().catch(() => null);
          const msg =
            text ||
            res.statusText ||
            `Request failed with status ${res.status}`;
          console.error("useFetch non-ok response:", res.status, msg);
          setError(msg);
          setLoading(false);
          return;
        }

        // try parse JSON but handle non-JSON gracefully
        const contentType = res.headers.get("content-type") || "";
        let result;
        if (contentType.includes("application/json")) {
          result = await res.json();
          setData(result.data);
        } else {
          const text = await res.text().catch(() => null);
          console.error("useFetch expected JSON but got:", text);
          setError("Unexpected non-JSON response from server");
        }
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return {
    data,
    error,
    loading,
  };
};

export default useFetch;
