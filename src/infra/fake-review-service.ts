import type {
  AddReviewServiceResult,
  ListReviewsOutput,
  ReviewService,
} from '../app/review-service';
import { createReview, createReviewContent } from '../domain/review';
import type { Review, ReviewContent } from '../domain/review';

export type FakeReviewServiceOptions = {
  readonly initial?: readonly Review[];
  readonly generateId?: () => string;
  readonly now?: () => Date;
};

export class FakeReviewService implements ReviewService {
  private readonly items: Review[];
  private readonly generateId: () => string; //A function that takes no parameters and returns a string
  private readonly now: () => Date;
  private idCounter = 0;

  constructor(options: FakeReviewServiceOptions = {}) {
    this.items = (options.initial ?? []).map(copyValidReview);
    this.generateId = options.generateId ?? (() => `r_${++this.idCounter}`);
    this.now = options.now ?? (() => new Date());
  }

  async listReviews(): Promise<ListReviewsOutput> {
    return {
      reviews: this.items.map(cloneReview),
      totalCount: this.items.length,
    };
  }

  async addReview(input: ReviewContent): Promise<AddReviewServiceResult> {
    const content = createReviewContent(input);
    if (!content.success) return content;

    const id = this.nextUniqueId();
    const created = createReview({
      id,
      ...content.data,
      createdAt: this.now(),
    });

    if (!created.success) {
      throw new Error('Fake review service generated an invalid review');
    }

    const stored = cloneReview(created.data);
    this.items.unshift(stored); //adding created review to the beginning of the items array
    return { success: true, data: cloneReview(stored) };
  }

  private nextUniqueId(): string {
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const id = this.generateId();
      if (!this.items.some((review) => review.id === id)) return id;
    }

    throw new Error('Fake review service could not generate a unique ID');
  }
}

function copyValidReview(review: Review): Review {
  const result = createReview(review);
  if (!result.success) {
    throw new Error('Fake review service received invalid seed data');
  }
  return cloneReview(result.data);
}

function cloneReview(review: Review): Review {
  return { ...review, createdAt: new Date(review.createdAt.getTime()) };
}
