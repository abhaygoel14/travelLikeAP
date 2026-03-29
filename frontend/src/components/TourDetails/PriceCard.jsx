import React, { useState } from "react";
import { motion } from "framer-motion";
import InquiryModal from "./InquiryModal";

export default function PriceCard({ price = 199, discounted = 149 }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.aside
      className="td-price-card"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="price-row">
        <div>
          <div className="price-old">${price}</div>
          <div className="price-new">
            ${discounted} <span>/ person</span>
          </div>
        </div>
      </div>

      <div className="price-actions">
        <motion.button
          className="primary__btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Pay Now
        </motion.button>
        <motion.button
          className="secondary__btn"
          whileHover={{ scale: 1.02 }}
          onClick={() => setOpen(true)}
        >
          Inquire Here
        </motion.button>
      </div>

      {open && <InquiryModal onClose={() => setOpen(false)} />}
    </motion.aside>
  );
}
