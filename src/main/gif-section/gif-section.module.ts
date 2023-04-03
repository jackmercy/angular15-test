import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from './base/base.component';
import { TrendingComponent } from './trending/trending.component';
import { SearchResultComponent } from './search-result/search-result.component';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    BaseComponent,
    TrendingComponent,
    SearchResultComponent
  ]
})
export class GifSectionModule { }
