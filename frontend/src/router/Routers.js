import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ThankYou from "../pages/ThankYou";
import Home from "./../pages/Home";
import Login from "./../pages/Login";
import Register from "./../pages/Register";
import SearchResultList from "./../pages/SearchResultList";
import TourDetails from "./../pages/TourDetails";
import Tours from "./../pages/Tours";
import About from "../pages/About";
import UserDashboard from "../pages/UserDashboard";
import AdminPortal from "../pages/AdminPortal";
import PolicyContentPage from "../pages/PolicyContentPage";

const Routers = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/tours" element={<Tours />} />
      <Route path="/tours/:id" element={<TourDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/users" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/admin" element={<AdminPortal />} />
      <Route
        path="/terms-and-conditions"
        element={<PolicyContentPage policyKey="terms" />}
      />
      <Route
        path="/privacy-policy"
        element={<PolicyContentPage policyKey="privacy" />}
      />
      <Route
        path="/cancellation-refund-policy"
        element={<PolicyContentPage policyKey="cancellation" />}
      />
      <Route path="/thank-you" element={<ThankYou />} />
      <Route path="/tours/search" element={<SearchResultList />} />
    </Routes>
  );
};

export default Routers;
