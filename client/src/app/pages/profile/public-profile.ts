import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PublicProfile, User } from '../../core/models/user.model';
import { Review, ReviewType } from '../../core/models/social.model';
import { AuthService } from '../../core/services/auth.service';
import { ReviewService } from '../../core/services/review.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { ShowDatePipe, TimeAgoPipe } from '../../shared/pipes/date.pipes';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-public-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    StarRatingComponent,
    ShowDatePipe,
    TimeAgoPipe,
    InrPipe,
  ],
  templateUrl: './public-profile.html',
  styleUrl: './public-profile.css',
})
export class PublicProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly reviewsApi = inject(ReviewService);
  private readonly toast = inject(ToastService);

  readonly userId = Number(this.route.snapshot.paramMap.get('userId'));

  readonly profile = signal<PublicProfile | null>(null);
  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly submitting = signal(false);

  readonly reviewType = signal<ReviewType>('SellerReview');
  readonly rating = signal(0);
  readonly comment = signal('');

  readonly me = this.auth.user;
  readonly isSelf = computed(() => this.me()?.id === this.userId);
  readonly signedIn = this.auth.isLoggedIn;

  readonly reviewTypes: { value: ReviewType; label: string }[] = [
    { value: 'SellerReview', label: 'Seller' },
    { value: 'BuyerReview', label: 'Buyer' },
  ];

  ngOnInit(): void {
    if (!Number.isFinite(this.userId) || this.userId <= 0) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }
    this.load();
  }

  initials(user: User): string {
    return user.fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');
  }

  submitReview(): void {
    if (!this.profile() || this.submitting()) {
      return;
    }
    if (this.rating() < 1) {
      this.toast.error('Pick a star rating first.');
      return;
    }

    this.submitting.set(true);
    this.reviewsApi
      .submit({
        revieweeId: this.userId,
        type: this.reviewType(),
        rating: this.rating(),
        comment: this.comment().trim() || null,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.rating.set(0);
          this.comment.set('');
          this.toast.success('Your review is live. Thanks for keeping ThiraiHub trustworthy.');
          this.load();
        },
        error: () => this.submitting.set(false),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.notFound.set(false);

    this.auth.loadProfile(this.userId).subscribe({
      next: (response) => {
        this.profile.set(response);
        this.reviews.set(response.reviews);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }
}
