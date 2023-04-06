import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { GifItem } from 'src/core/model/gif.model';
import { GiphyParams } from 'src/core/model/giphy';
import { ApiKeyService } from 'src/core/services/api-key.service';

export interface GiphyPagination {
  total_count: number;
  count?: number;
  offset: number;
}

export interface GiphyMeta {
  status: number;
  msg: string;
  response_id: string;
}
export interface GiphyQueryResponse {
  data: GifItem[];
  pagination: GiphyPagination;
  meta: GiphyMeta
}

@Injectable({
  providedIn: 'root'
})
export class GifService {
  private readonly localFavoriteKey = 'local_favorite_gifs' as const;
  private readonly http = inject(HttpClient);
  private readonly apiKeyService = inject(ApiKeyService);
  private _favoriteGifs: GifItem[] = this.localStorageFavoriteGifs;

  private get localStorageFavoriteGifs(): GifItem[] {
    return JSON.parse(localStorage.getItem(this.localFavoriteKey) || '[]');
  }

  public get favoriteGifs(): GifItem[] {
    return this.localStorageFavoriteGifs;
  }

  public getTrendingGifs(params: Partial<GiphyParams>): Observable<GiphyQueryResponse> {
    return this.http.get<GiphyQueryResponse>(this.apiKeyService.getTrendingApi(params));
  }

  public searchGifs(params: Partial<GiphyParams>): Observable<GiphyQueryResponse> {
    return this.http.get<GiphyQueryResponse>(this.apiKeyService.getSearchApi(params));
  }

  public addFavoriteGif(item: GifItem): void {
    const index = this._favoriteGifs.findIndex(gif => gif.id === item.id);
    if (index === -1) {
      this._favoriteGifs.push(item);
      localStorage.setItem(this.localFavoriteKey, JSON.stringify(this._favoriteGifs));
    }
  }

  public removeFavoriteGif(item: GifItem): void {
    const index = this._favoriteGifs.findIndex(gif => gif.id === item.id);
    if (index !== -1) {
      this._favoriteGifs.splice(index, 1);
    }
  }

  public isFavoriteGif(item: GifItem): boolean {
    return this._favoriteGifs.some(gif => gif.id === item.id);
  }
}