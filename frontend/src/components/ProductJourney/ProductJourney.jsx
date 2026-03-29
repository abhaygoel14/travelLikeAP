import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import "./ProductJourney.css";
import tourImg01 from "../../assets/images/tour-img01.jpg";
import tourImg02 from "../../assets/images/tour-img02.jpg";
import tourImg03 from "../../assets/images/tour-img03.jpg";
import tourImg04 from "../../assets/images/tour-img04.jpg";
import tourImg05 from "../../assets/images/tour-img05.jpg";
import tourImg06 from "../../assets/images/tour-img06.jpg";
import tourImg07 from "../../assets/images/tour-img07.jpg";
const journey = [
  {
    img: tourImg01,
    title: "Discover",
    text: "Lorem ipsum dolor sit amet.",
    top: "92%",
    left: "50%",
  },
  {
    img: tourImg02,
    title: "Explore",
    text: "Lorem ipsum dolor sit amet.",
    top: "78%",
    left: "28%",
  },
  {
    img: tourImg03,
    title: "Adventure",
    text: "Lorem ipsum dolor sit amet.",
    top: "66%",
    left: "70%",
  },
  {
    img: tourImg04,
    title: "Journey",
    text: "Lorem ipsum dolor sit amet.",
    top: "60%",
    left: "35%",
  },
  {
    img: tourImg05,
    title: "Community",
    text: "Lorem ipsum dolor sit amet.",
    top: "42%",
    left: "68%",
  },
  {
    img: tourImg06,
    title: "Growth",
    text: "Lorem ipsum dolor sit amet.",
    top: "28%",
    left: "40%",
  },
  {
    img: tourImg07,
    title: "Future",
    text: "Lorem ipsum dolor sit amet.",
    top: "16%",
    left: "60%",
  },
];

export default function ProductJourney() {
  const containerRef = useRef(null);
  const nodeRefs = useRef([]);
  const pathRef = useRef(null);
  const [svgSize, setSvgSize] = useState({ width: 900, height: 1000 });
  const [pathD, setPathD] = useState("");
  const [pathLength, setPathLength] = useState(0);

  // measure container and node positions
  useEffect(() => {
    const compute = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      setSvgSize({ width, height });

      const points = journey
        .map((_, i) => {
          const node = nodeRefs.current[i];
          if (!node) return null;
          const r = node.getBoundingClientRect();
          return {
            x: r.left - rect.left + r.width / 2,
            y: r.top - rect.top + r.height / 2,
          };
        })
        .filter(Boolean);

      if (points.length > 0) {
        // build path from top to bottom: sort points by y
        const sorted = points.slice().sort((a, b) => a.y - b.y);

        // convert Catmull-Rom spline through points to cubic Bezier path
        const cr2bezier = (pts) => {
          if (pts.length < 2) return "";
          const p = pts;
          let d = `M ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)}`;
          for (let i = 0; i < p.length - 1; i++) {
            const p0 = i === 0 ? p[0] : p[i - 1];
            const p1 = p[i];
            const p2 = p[i + 1];
            const p3 = i + 2 < p.length ? p[i + 2] : p[p.length - 1];

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
          }
          return d;
        };

        const d = cr2bezier(sorted);
        setPathD(d);
      }
    };

    // compute after a tick to ensure DOM nodes are rendered
    setTimeout(compute, 50);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // measure path length after pathD is set
  useEffect(() => {
    if (!pathD) return;
    // wait for svg to render path
    requestAnimationFrame(() => {
      try {
        const p = pathRef.current;
        if (p) {
          const len = p.getTotalLength();
          setPathLength(len);
        }
      } catch (e) {
        // ignore
      }
    });
  }, [pathD, svgSize]);

  return (
    <section className="w-full h-full py-32 flex justify-center bg-gray-50 mt-20">
      {/* Main container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[900px] h-[1000px]"
      >
        {/* Nodes first (DOM order) */}
        {journey.map((item, i) => (
          <div
            key={i}
            ref={(el) => (nodeRefs.current[i] = el)}
            style={{
              position: "absolute",
              top: item.top,
              left: item.left,
              transform: "translate(-50%, -50%)",
            }}
            className="flex flex-col items-center text-center z-20"
          >
            <div className="pj-node">
              <motion.img
                src={item.img}
                alt={item.title}
                className="pj-node-img w-16 h-16 md:w-24 md:h-24 object-cover"
                whileHover={{ scale: 1.08 }}
              />
            </div>
            <div className="mt-2 max-w-[160px]">
              <h4 className="font-semibold text-sm">{item.title}</h4>
              <p className="text-gray-500 text-xs">{item.text}</p>
            </div>
          </div>
        ))}

        {/* SVG path drawn after nodes; placed underneath visually */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
          preserveAspectRatio="none"
        >
          {pathD && (
            <motion.path
              ref={pathRef}
              d={pathD}
              stroke="var(--primary-color)"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLength || "0"}
              strokeDashoffset={pathLength || 0}
              initial={{ strokeDashoffset: pathLength || 0 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          )}
        </svg>
      </div>
    </section>
  );
}
