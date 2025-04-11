"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axiosInstance"; // Import the configured axios instance
import { isAxiosError } from "axios"; // Import isAxiosError directly from the axios library
import { useSession } from "next-auth/react"; // <--- FIX: Separated this import
import { toast } from "react-hot-toast";
import { Loader2, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button"; // Corrected to named import
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea component exists

// Types
interface RatingUser {
  id: string;
  name: string | null;
  image: string | null;
}
interface RatingData {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  userId: string;
  user: RatingUser;
}
interface RatingsApiResponse {
  data: RatingData[];
  meta: {
    totalCount: number;
    currentPage: number;
    totalPages: number;
    perPage: number;
  };
}
interface RatingFormProps {
  designId: string;
  onRatingSubmitted: () => void; // Callback to refetch ratings
  hasUserRated: boolean;
}
interface RatingsSectionProps {
  designId: string;
}

// --- RatingForm Component ---
const RatingForm: React.FC<RatingFormProps> = ({
  designId,
  onRatingSubmitted,
  hasUserRated,
}) => {
  const { data: session, status } = useSession(); // Now this should work
  const [score, setScore] = useState<number>(0);
  const [hoverScore, setHoverScore] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    if (!session?.accessToken) {
      toast.error("You must be logged in to submit a rating.");
      return;
    }

    setIsSubmitting(true);
    const submitToastId = toast.loading("Submitting your rating...");

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/designs/${designId}/ratings`;
      await axiosInstance.post(
        // Use axiosInstance
        apiUrl,
        { score, comment },
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      toast.success("Rating submitted successfully!");
      setScore(0); // Reset form
      setComment("");
      onRatingSubmitted(); // Trigger refetch in parent
    } catch (error: unknown) {
      console.error("Failed to submit rating:", error);
      let errorMessage = "Failed to submit rating."; // Default message
      let isConflictError = false;

      if (isAxiosError(error)) {
        // Check if it's an Axios error first
        errorMessage =
          error.response?.data?.message || error.message || errorMessage;
        if (error.response?.status === 409) {
          isConflictError = true;
        }
      } else if (error instanceof Error) {
        // Check if it's a generic Error
        errorMessage = error.message;
      }

      // Handle specific 409 Conflict error separately
      if (isConflictError) {
        toast.error("You have already rated this design.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      toast.dismiss(submitToastId);
      setIsSubmitting(false);
    }
  };

  if (status === "loading") return null; // Don't show form while auth is loading
  if (status === "unauthenticated") {
    return (
      <p className="text-sm text-center text-gray-500 dark:text-gray-400">
        Please log in to leave a rating.
      </p>
    );
  }
  if (hasUserRated) {
    return (
      <p className="text-sm text-center text-green-600 dark:text-green-400">
        You have already rated this design. Thank you!
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 p-4 border rounded-lg dark:border-zinc-700"
    >
      <h4 className="font-medium text-lg">Leave a Rating</h4>
      {/* Star Rating Input */}
      <div className="flex items-center space-x-1">
        <span className="text-sm mr-2">Your Rating:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              (hoverScore || score) >= star
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
            onMouseEnter={() => setHoverScore(star)}
            onMouseLeave={() => setHoverScore(0)}
            onClick={() => setScore(star)}
          />
        ))}
        {score > 0 && (
          <span className="text-sm ml-2">
            ({score} star{score > 1 ? "s" : ""})
          </span>
        )}
      </div>
      {/* Comment Input */}
      <div>
        <label htmlFor="rating-comment" className="sr-only">
          Comment (Optional)
        </label>
        <Textarea
          id="rating-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment (optional)..."
          disabled={isSubmitting}
          className="w-full text-sm bg-zinc-800 border-zinc-700 text-white focus:ring-purple-500 placeholder:text-zinc-500"
        />
      </div>
      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting || score === 0}>
        {isSubmitting ? "Submitting..." : "Submit Rating"}
      </Button>
    </form>
  );
};

// --- RatingsSection Component ---
const RatingsSection: React.FC<RatingsSectionProps> = ({ designId }) => {
  const { data: session } = useSession(); // Now this should also work
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [hasUserRated, setHasUserRated] = useState(false); // Track if current user has rated

  const fetchRatings = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/designs/${designId}/ratings?page=${page}&limit=5`; // Fetch 5 per page
        const response = await axiosInstance.get<RatingsApiResponse>(apiUrl); // Use axiosInstance
        setRatings(response.data.data);
        setPagination({
          page: response.data.meta.currentPage,
          totalPages: response.data.meta.totalPages,
        });

        // Check if the current logged-in user is among the raters
        if (session?.user?.id) {
          const userRating = response.data.data.find(
            (rating) => rating.userId === session.user.id
          );
          setHasUserRated(!!userRating);
        } else {
          setHasUserRated(false);
        }
      } catch (err) {
        console.error("Failed to fetch ratings:", err);
        setError("Could not load ratings.");
        // Don't toast error here, maybe just show message in UI
      } finally {
        setIsLoading(false);
      }
    },
    [designId, session?.user?.id] // Add session dependency
  );

  useEffect(() => {
    fetchRatings(1); // Fetch first page on mount
  }, [fetchRatings]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchRatings(newPage);
    }
  };

  return (
    <div>
      {/* Rating Submission Form */}
      <RatingForm
        designId={designId}
        onRatingSubmitted={() => fetchRatings(1)} // Refetch first page after submission
        hasUserRated={hasUserRated}
      />

      {/* Display Ratings List */}
      <div className="mt-8 space-y-6">
        {isLoading && (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
          </div>
        )}
        {error && (
          <p className="text-center text-red-500 dark:text-red-400">{error}</p>
        )}

        {!isLoading && !error && ratings.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No ratings yet. Be the first!
          </p>
        )}

        {!isLoading &&
          !error &&
          ratings.length > 0 &&
          ratings.map((rating) => (
            <div
              key={rating.id}
              className="flex gap-4 border-b pb-6 dark:border-zinc-700 last:border-b-0"
            >
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={rating.user.image ?? undefined} />
                <AvatarFallback>
                  {rating.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {rating.user.name ?? "Anonymous"}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center my-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= rating.score
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                {rating.comment && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {rating.comment}
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Pagination Controls */}
      {!isLoading && !error && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center space-x-2">
          <Button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            // variant="outline" size="sm" // Removed unsupported props if necessary
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            // variant="outline" size="sm" // Removed unsupported props if necessary
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default RatingsSection;
