import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateReviewRequest, Review, ReviewListResponse } from '../models/social.model';
import { API_BASE } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);

  submit(payload: CreateReviewRequest): Observable<{ reviewId: number; review: Review }> {
    return this.http.post<{ reviewId: number; review: Review }>(`${API_BASE}/reviews`, payload);
  }

  getForUser(userId: number): Observable<ReviewListResponse> {
    return this.http.get<ReviewListResponse>(`${API_BASE}/reviews/${userId}`);
  }
}
