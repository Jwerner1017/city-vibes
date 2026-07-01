import React from "react";
import { useNavigate } from "react-router-dom";
import BecomeSponsorModal from "@/components/BecomeSponsorModal";

export default function BecomeASponsor() {
  const navigate = useNavigate();
  return <BecomeSponsorModal onClose={() => navigate("/")} />;
}