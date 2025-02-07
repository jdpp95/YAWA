import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

//Angular modules
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//Custom modules
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { CommonModule, DatePipe, PercentPipe } from '@angular/common';
import { CommaDecimalPipe } from './pipes/comma-decimal.pipe';
import { BulkDataModalComponent } from './components/bulk-data-modal/bulk-data-modal.component';
import { TempGradientComponent } from './components/temp-gradient/temp-gradient.component';
import { RainSimulatorComponent } from './components/rain-simulator/rain-simulator.component';
import { UtilsService } from './services/tutils.service';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';


@NgModule({
  declarations: [
    AppComponent,
    CommaDecimalPipe,
    BulkDataModalComponent,
    TempGradientComponent,
    RainSimulatorComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NoopAnimationsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    AppRoutingModule,
    MatFormFieldModule,
    CommonModule
  ],
  providers: [
    MatDatepickerModule,
    DatePipe,
    PercentPipe, 
    UtilsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
