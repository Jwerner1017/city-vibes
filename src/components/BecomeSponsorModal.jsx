import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, ChevronRight, ChevronLeft, CheckCircle, Building2, Tag, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

const TIERS = [
  {
    id: "bronze",
    name: "Bronze",
    badge: "🥉",
    price: "$49/mo",
    color: "from-orange-700 to-orange-900",
    border: "border-orange-500/40",
    perks: ["Map pin listing", "Business name & address", "1 family discount offer", "Basic profile page"],
  },
  {
    id: "silver",
    name: "Silver",
    badge: "🥈",
    price: "$99/mo",
    color: "from-gray-500 to-gray-700",
    border: "border-gray-400/40",
    perks: ["Everything in Bronze", "Logo & photo display", "Featured in List View", "Monthly performance report"],
  },
  {
    id: "gold",
    name: "Gold",
    badge: "🥇",
    price: "$199/mo",
    color: "from-yellow-600 to-yellow-800",
    border: "border-yellow-400/40",
    perks: ["Everything in Silver", "Priority map placement", "Holiday campaign features", "Social media shoutout"],
  },
  {
    id: "platinum",
    name: "Platinum",
    badge: "💎",
    price: "$349/mo",
    color: "from-slate-500 to-slate-800",
    border: "border-slate-300/40",
    perks: ["Everything in Gold", "Homepage banner ads", "Dedicated event sponsorship", "Direct admin support"],
  },
];

const TERMS = `LOCAL VIBES BUSINESS SPONSOR TERMS & CONDITIONS

Last Updated: June 2026

1. ELIGIBILITY
Sponsors must be a legally registered business operating in the featured city. By submitting an application, you confirm your business is in good standing.

2. CONTENT STANDARDS
All sponsor content (logos, photos, descriptions, discounts) must be accurate, family-appropriate, and not misleading. Local Vibes reserves the right to edit or reject any content that does not meet community standards.

3. DISCOUNT AUTHENTICITY
Any discounts or promotions listed must be genuine offers available to app users. Sponsors agree to honor all published discounts for the stated duration.

4. APPROVAL PROCESS
Sponsor listings are subject to review and approval by the Local Vibes team. Approval is not guaranteed. We reserve the right to decline any application without explanation.

5. BILLING & CANCELLATION
Sponsorship is billed monthly. You may cancel at any time with 7 days' notice before the next billing cycle. No partial refunds are issued for unused days.

6. INTELLECTUAL PROPERTY
You retain ownership of your submitted content. By submitting, you grant Local Vibes a non-exclusive license to display your content within the application.

7. CONDUCT
Sponsors found to be providing false information or engaging in deceptive practices will be immediately removed without refund and may be banned from future participation.

8. CHANGES TO TERMS
Local Vibes may update these terms at any time. Continued participation after changes constitutes acceptance of the new terms.

9. CONTACT
For questions regarding sponsorship, contact: sponsors@localvibes.app`;

const STEPS = ["Tiers", "Terms", "Application", "Confirm"];

export default function BecomeSponsorModal({ onClose }) {
  const [step, setStep] = useState(0);
  const [selectedTier, setSelectedTier] = useState(null);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    website_url: "",
    address: "",
    city: "",
    state_code: "",
    business_category: "",
    business_description: "",
    proposed_discount: "",
    how_heard: "",
    agreed_to_terms: false,
  });

  const handleFormChange = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleTermsScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 40) setTermsScrolled(true);
  };

  const handleSubmit = async () => {
    if (!form.agreed_to_terms) { setError("You must agree to the terms to proceed."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await base44.entities.SponsorApplication.create({
        ...form,
        tier_interest: selectedTier,
        status: "pending",
      });
      setSubmitted(true);
    } catch (e) {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!selectedTier;
    if (step === 1) return termsScrolled;
    if (step === 2) return form.business_name && form.contact_name && form.contact_email && form.business_description;
    return true;
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center border border-white/10 shadow-2xl"
        >
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="font-heading font-black text-white text-2xl mb-2">Application Submitted!</h2>
          <p className="text-white/60 text-sm mb-6">
            We'll review your application and reach out within 2-3 business days to{" "}
            <span className="text-primary font-semibold">{form.contact_email}</span>.
          </p>
          <div className="bg-white/5 rounded-2xl p-4 mb-6 text-left">
            <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Selected Tier</p>
            <p className="text-white font-bold">
              {TIERS.find(t => t.id === selectedTier)?.badge}{" "}
              {TIERS.find(t => t.id === selectedTier)?.name} — {TIERS.find(t => t.id === selectedTier)?.price}
            </p>
          </div>
          <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90 text-white">
            Close
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-gray-900 w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden border border-white/10 shadow-2xl max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="font-heading font-black text-white text-lg">Become a Sponsor</h2>
            <p className="text-white/50 text-xs mt-0.5">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10 flex-shrink-0">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* STEP 0: TIER SELECTION */}
            {step === 0 && (
              <motion.div key="tiers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-5 space-y-3">
                <div className="text-center mb-4">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <h3 className="font-heading font-bold text-white text-lg">Choose Your Sponsor Tier</h3>
                  <p className="text-white/50 text-xs mt-1">All tiers include a family discount listing on the map</p>
                </div>
                {TIERS.map(tier => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`w-full text-left rounded-2xl border-2 transition-all p-4 ${
                      selectedTier === tier.id
                        ? `bg-gradient-to-r ${tier.color} ${tier.border} scale-[1.02] shadow-lg`
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{tier.badge}</span>
                        <span className="text-white font-heading font-bold text-lg">{tier.name}</span>
                      </div>
                      <span className="text-white font-bold text-base">{tier.price}</span>
                    </div>
                    <ul className="space-y-1">
                      {tier.perks.map((p, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-white/70 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </motion.div>
            )}

            {/* STEP 1: TERMS */}
            {step === 1 && (
              <motion.div key="terms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-5">
                <div className="text-center mb-4">
                  <Shield className="w-8 h-8 text-accent mx-auto mb-2" />
                  <h3 className="font-heading font-bold text-white text-lg">Terms & Conditions</h3>
                  <p className="text-white/50 text-xs mt-1">Please scroll through and read the full terms</p>
                </div>
                <div
                  onScroll={handleTermsScroll}
                  className="bg-white/5 rounded-2xl p-4 h-64 overflow-y-auto text-white/60 text-xs leading-relaxed whitespace-pre-line border border-white/10"
                >
                  {TERMS}
                </div>
                {!termsScrolled && (
                  <p className="text-white/40 text-xs text-center mt-2 animate-pulse">↓ Scroll to the bottom to continue</p>
                )}
                {termsScrolled && (
                  <div className="mt-4 bg-green-900/30 border border-green-500/30 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <p className="text-green-300 text-xs">You've read the terms. Click Next to proceed.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: APPLICATION FORM */}
            {step === 2 && (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-5 space-y-4">
                <div className="text-center mb-2">
                  <Building2 className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-heading font-bold text-white text-lg">Your Business Info</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Business Name *", field: "business_name", placeholder: "e.g. Family Fun Pizza" },
                    { label: "Contact Name *", field: "contact_name", placeholder: "Your full name" },
                    { label: "Contact Email *", field: "contact_email", placeholder: "you@yourbusiness.com", type: "email" },
                    { label: "Contact Phone", field: "contact_phone", placeholder: "(555) 000-0000", type: "tel" },
                    { label: "Business Website", field: "website_url", placeholder: "https://yourbusiness.com", type: "url" },
                    { label: "Street Address", field: "address", placeholder: "123 Main St" },
                  ].map(({ label, field, placeholder, type }) => (
                    <div key={field}>
                      <label className="text-white/60 text-xs font-semibold block mb-1">{label}</label>
                      <input
                        type={type || "text"}
                        value={form[field]}
                        onChange={e => handleFormChange(field, e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/60 focus:bg-white/8 transition-colors"
                      />
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/60 text-xs font-semibold block mb-1">City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={e => handleFormChange("city", e.target.value)}
                        placeholder="Louisville"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs font-semibold block mb-1">State</label>
                      <input
                        type="text"
                        value={form.state_code}
                        onChange={e => handleFormChange("state_code", e.target.value)}
                        placeholder="KY"
                        maxLength={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/60 text-xs font-semibold block mb-1">Business Category *</label>
                    <Select value={form.business_category} onValueChange={v => handleFormChange("business_category", v)}>
                      <SelectTrigger className="w-full h-auto bg-white/5 border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-1 focus:ring-primary/60">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10 text-white">
                        {["restaurant","retail","entertainment","fitness","health","education","services","other"].map(c => (
                          <SelectItem key={c} value={c} className="capitalize text-white focus:bg-white/10 focus:text-white">
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-white/60 text-xs font-semibold block mb-1">Business Description *</label>
                    <textarea
                      value={form.business_description}
                      onChange={e => handleFormChange("business_description", e.target.value)}
                      placeholder="Tell families about your business and what makes it special..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-xs font-semibold block mb-1">
                      <Tag className="w-3 h-3 inline mr-1 text-green-400" />
                      Proposed Family Discount
                    </label>
                    <input
                      type="text"
                      value={form.proposed_discount}
                      onChange={e => handleFormChange("proposed_discount", e.target.value)}
                      placeholder="e.g. 15% off for families with kids, buy 1 get 1 free kids meal"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-xs font-semibold block mb-1">How did you hear about us?</label>
                    <input
                      type="text"
                      value={form.how_heard}
                      onChange={e => handleFormChange("how_heard", e.target.value)}
                      placeholder="Social media, word of mouth, Google..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONFIRM */}
            {step === 3 && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-5 space-y-4">
                <div className="text-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h3 className="font-heading font-bold text-white text-lg">Review & Submit</h3>
                  <p className="text-white/50 text-xs mt-1">Double-check your details before submitting</p>
                </div>

                {/* Summary card */}
                <div className="bg-white/5 rounded-2xl p-4 space-y-3 border border-white/10">
                  {[
                    { label: "Business", value: form.business_name },
                    { label: "Contact", value: `${form.contact_name} — ${form.contact_email}` },
                    { label: "Location", value: [form.address, form.city, form.state_code].filter(Boolean).join(", ") },
                    { label: "Tier", value: `${TIERS.find(t => t.id === selectedTier)?.badge} ${TIERS.find(t => t.id === selectedTier)?.name} (${TIERS.find(t => t.id === selectedTier)?.price})` },
                    { label: "Discount Offer", value: form.proposed_discount || "Not specified" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-3">
                      <span className="text-white/40 text-xs w-20 flex-shrink-0 pt-0.5">{label}</span>
                      <span className="text-white text-xs font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Terms checkbox */}
                <label className="flex items-start gap-3 cursor-pointer bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-primary/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.agreed_to_terms}
                    onChange={e => handleFormChange("agreed_to_terms", e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
                  />
                  <span className="text-white/70 text-xs leading-relaxed">
                    I have read and agree to the Local Vibes{" "}
                    <span className="text-primary underline cursor-pointer" onClick={() => setStep(1)}>Sponsor Terms & Conditions</span>.
                    I confirm all provided information is accurate and that my business will honor any listed discounts.
                  </span>
                </label>

                {error && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-red-300 text-xs">{error}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-white/10 flex-shrink-0">
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="text-white/60 hover:text-white gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="bg-primary hover:bg-primary/90 text-white gap-1 disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.agreed_to_terms}
              className="bg-gradient-to-r from-primary to-accent text-white gap-1 disabled:opacity-40 min-w-[120px]"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}