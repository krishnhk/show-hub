import { User } from './user.model';

export type ReviewType = 'BuyerReview' | 'SellerReview';

export interface Review {
  id: number;
  reviewerId: number;
  revieweeId: number;
  type: ReviewType;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName?: string;
}

export interface ReviewListResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  breakdown: { rating: number; count: number }[];
}

export interface CreateReviewRequest {
  revieweeId: number;
  type: ReviewType;
  rating: number;
  comment: string | null;
}

export type NotificationType = 'booking' | 'resale' | 'system';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  link: string | null;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  unreadCount: number;
}
