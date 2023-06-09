import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IfModule } from '@rx-angular/template/if';
import { InfiniteListComponent } from 'src/shared/components/infinite-list/infinite-list.component';
import { GifService, GiphyPagination } from '../gif.service';
import { BehaviorSubject, Observable, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { GifItem } from 'src/core/model/gif.model';
import { GiphyParams } from 'src/core/model/giphy';
import { isEmpty } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-search-result',
  templateUrl: './search-result.component.html',
  styleUrls: ['./search-result.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    InfiniteListComponent,
    IfModule
  ],
  providers: [GifService]
})
export class SearchResultComponent implements OnInit {
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly gifService = inject(GifService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);

  private searchGifs = new BehaviorSubject<GifItem[]>([]);
  public searchGifs$: Observable<GifItem[]> = this.searchGifs.asObservable();

  public params = new BehaviorSubject<Pick<GiphyParams, 'limit' | 'offset' | 'rating' | 'lang'>>({
    limit: 30,
    rating: 'g',
    offset: 0,
    lang: 'en'
  });

  public searchTerm = new BehaviorSubject<string>('');  

  public pagination: GiphyPagination = {
    total_count: 0,
    count: 0,
    offset: 0
  };

  private unSubscribe = new Subject<void>();

  public loading = false;

  ngOnInit(): void {
    // Create a subscription to the params for load more gif
    // .pipe(takeUntil(this.unSubscribe))
    this.params.asObservable().pipe(
      takeUntil(this.unSubscribe)
    ).subscribe((params) => {
      this.pagination.offset += params.limit;
      this.loading = true;
      if (!isEmpty(this.searchTerm.value)) {
        this.gifService.searchGifs({
          ...params,
          q: this.searchTerm.value
        }).subscribe({
          next: (res) => {
            this.searchGifs.next([...this.searchGifs.value, ...res.data]);
            this.pagination = res.pagination;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.loading = false;
            this.toastr.error('Something went wrong. Try again later!', 'Error');
            this.cdr.markForCheck();
          }
        });
      }
    });

    // Create a subscription to the search term for search gif
    this.searchTerm.asObservable().pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.unSubscribe),
    ).subscribe((term) => {
      this.pagination.offset = 0;
      this.loading = true;
      this.gifService.searchGifs({
        ...this.params.value,
        q: term,
        offset: 0
      }).pipe(takeUntil(this.unSubscribe)).subscribe({
        next: (res) => {
          this.searchGifs.next([...res.data]);
          this.pagination = res.pagination;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error('Something went wrong. Try again later!', 'Error');
          this.cdr.markForCheck();
        }
      });
    });

    this.activeRoute.queryParams.subscribe(params => {
      const term: string = params?.['q'] || '';
      if (term === '') {
        return;
      }
      if (term.toLowerCase() === 'trending') {
        this.router.navigate(['/']);
      }
      params?.['q'] !== '' ? this.searchTerm.next(params?.['q']) : null;
    });
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  onLoadMoreData() {
    this.loading = true;
    if (this.searchGifs.value.length < this.pagination.total_count) {
      this.params.next({
        ...this.params.value,
        offset: this.params.value.offset + this.params.value.limit
      });
    }
    this.cdr.markForCheck();
  }
}
