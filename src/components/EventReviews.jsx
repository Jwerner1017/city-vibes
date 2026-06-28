import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star, ThumbsUp, MessageSquarePlus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

function StarRating({ value, onChange, size = "md" }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "lg" ? "w-8 h-8" : "w-5 h-5";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={`${sz} transition-colors ${
              n <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingSummary({ reviews }) {
  if (!reviews.length) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const counts = [5, 4, 3, 2, 1].map(n => ({
    star: n,
    count: reviews.filter(r => r.rating === n).length,
  }));
  return (
    <div className="flex gap-4 items-center p-4 bg-muted/50 rounded-xl mb-4">
      <div className="text-center">
        <p className="font-heading font-black text-4xl text-foreground">{avg.toFixed(1)}</p>
        <StarRating value={Math.round(avg)} size="sm" />
        <p className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex-1 space-y-1">
        {counts.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs w-2 text-muted-foreground">{star}</span>
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-4">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({ eventId, user, existingReview, onSubmitted }) {
  const { toast } = useToast();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [body, setBody] = useState(existingReview?.body || "");
  const [tips, setTips] = useState(existingReview?.tips || "");
  const [ageOfKids, setAgeOfKids] = useState(existingReview?.age_of_kids || "");
  const [wouldReturn, setWouldReturn] = useState(existingReview?.would_return ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { toast({ title: "Please select a star rating" }); return; }
    setSubmitting(true);
    const data = {
      event_id: eventId,
      rating,
      title,
      body,
      tips,
      age_of_kids: ageOfKids,
      would_return: wouldReturn,
      reviewer_name: user.full_name || "Parent",
    };
    if (existingReview) {
      await base44.entities.EventReview.update(existingReview.id, data);
      toast({ title: "Review updated! ✏️" });
    } else {
      await base44.entities.EventReview.create(data);
      toast({ title: "Review posted! 🎉 Thanks for helping other families." });
    }
    setSubmitting(false);
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-4 space-y-3">
      <h4 className="font-heading font-bold text-sm">{existingReview ? "Edit Your Review" : "Write a Review"}</h4>

      <div>
        <p className="text-xs text-muted-foreground mb-1">Overall rating *</p>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Review title (e.g. 'Perfect for toddlers!')"
          className="w-full text-sm border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        />
      </div>

      <div>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Share your experience..."
          rows={3}
          className="w-full text-sm border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
        />
      </div>

      <div>
        <textarea
          value={tips}
          onChange={e => setTips(e.target.value)}
          placeholder="💡 Helpful tips for other families (parking, best time, what to bring...)"
          rows={2}
          className="w-full text-sm border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
        />
      </div>

      <div className="flex gap-3">
        <input
          value={ageOfKids}
          onChange={e => setAgeOfKids(e.target.value)}
          placeholder="Kids' ages (e.g. 3 & 7)"
          className="flex-1 text-sm border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={wouldReturn}
            onChange={e => setWouldReturn(e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          Would return
        </label>
      </div>

      <Button type="submit" disabled={submitting} className="w-full rounded-full h-10 text-sm font-heading font-bold">
        {submitting ? "Posting..." : existingReview ? "Update Review" : "Post Review"}
      </Button>
    </form>
  );
}

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <p className="font-semibold text-sm">{review.reviewer_name || "Family"}</p>
          {review.age_of_kids && (
            <p className="text-xs text-muted-foreground">Kids: {review.age_of_kids}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarRating value={review.rating} />
          <p className="text-xs text-muted-foreground">{moment(review.created_date).fromNow()}</p>
        </div>
      </div>

      {review.title && <p className="font-semibold text-sm mt-1">{review.title}</p>}

      {review.body && (
        <p className={`text-sm text-muted-foreground mt-1 leading-relaxed ${!expanded && review.body.length > 120 ? "line-clamp-3" : ""}`}>
          {review.body}
        </p>
      )}

      {review.body?.length > 120 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary font-semibold mt-1 flex items-center gap-1">
          {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> More</>}
        </button>
      )}

      {review.tips && (
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-amber-700 mb-0.5">💡 Family Tip</p>
          <p className="text-xs text-amber-800">{review.tips}</p>
        </div>
      )}

      {review.would_return && (
        <div className="flex items-center gap-1 mt-2">
          <ThumbsUp className="w-3 h-3 text-primary" />
          <span className="text-xs text-primary font-semibold">Would return!</span>
        </div>
      )}
    </div>
  );
}

export default function EventReviews({ eventId, user }) {
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    const data = await base44.entities.EventReview.filter({ event_id: eventId }, "-created_date", 50);
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => { loadReviews(); }, [eventId]);

  const myReview = user ? reviews.find(r => r.created_by_id === user.id) : null;

  const handleSubmitted = () => {
    setShowForm(false);
    loadReviews();
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-bold text-base flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4 text-primary" />
          Family Reviews
          {reviews.length > 0 && <span className="text-sm font-normal text-muted-foreground">({reviews.length})</span>}
        </h3>
        {user && !myReview && !showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            size="sm"
            className="rounded-full text-xs h-8 gap-1"
          >
            <Star className="w-3 h-3" /> Rate it
          </Button>
        )}
        {user && myReview && !showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="ghost"
            size="sm"
            className="rounded-full text-xs h-8"
          >
            Edit review
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!loading && reviews.length > 0 && <RatingSummary reviews={reviews} />}

      {showForm && user && (
        <div className="mb-4">
          <ReviewForm
            eventId={eventId}
            user={user}
            existingReview={myReview}
            onSubmitted={handleSubmitted}
          />
          <button onClick={() => setShowForm(false)} className="text-xs text-muted-foreground mt-2 w-full text-center">
            Cancel
          </button>
        </div>
      )}

      {!loading && !user && !reviews.length && (
        <p className="text-sm text-muted-foreground text-center py-4">Sign in to leave the first review!</p>
      )}

      {!loading && !reviews.length && user && !showForm && (
        <div className="text-center py-6 bg-muted/30 rounded-xl">
          <p className="text-sm text-muted-foreground mb-2">No reviews yet — be the first!</p>
          <Button onClick={() => setShowForm(true)} size="sm" className="rounded-full gap-1">
            <Star className="w-3 h-3" /> Write a Review
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
      </div>
    </div>
  );
}