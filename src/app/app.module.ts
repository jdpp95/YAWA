import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

//Angular modules
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//Angular Material Modules
import { MatDatepickerModule, MatNativeDateModule, MatIconModule, MatFormFieldModule } from '@angular/material';

//Custom modules
import { TutilsModule } from './modules/tutils/tutils.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { DatePipe } from '@angular/common';
import { CommaDecimalPipe } from './pipes/comma-decimal.pipe';
import { BulkDataModalComponent } from './components/bulk-data-modal/bulk-data-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    CommaDecimalPipe,
    BulkDataModalComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    TutilsModule,
    NoopAnimationsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    AppRoutingModule,
    MatFormFieldModule
  ],
  providers: [MatDatepickerModule, DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
