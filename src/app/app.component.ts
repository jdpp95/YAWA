import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

//Services
import { DarkSkyService } from 'src/app/services/dark-sky.service';

//Internal modules
import { TutilsModule } from './modules/tutils/tutils.module';

//Angular material
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

//Moment.js
import * as _moment from 'moment';

//Pipes
import { DatePipe } from '@angular/common';

const moment = _moment;

// See the Moment.js docs for the meaning of these formats:
// https://momentjs.com/docs/#/displaying/format/
export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'LL',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  }
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: {useUtc: true}}
  ]
})

export class AppComponent implements OnInit {
  title = 'YAWA';

  darkSkyKey: string;

  //Forms and fields
  coords: string;
  now: boolean;
  locationForm: FormGroup;

  date: Date;
  UTC: number;

  temperature: number;
  humidity: number;
  dewPoint: number;
  apparentT: number;
  visibility: number;

  cloudiness: number;
  conditions: string;
  windSpeed: number;
  breathCondensation: number;

  coronavirus: number;

  locationEnabled: boolean = false;

  //UI metadata
  loading: boolean = false;
  loadingFailed: boolean = false;

  constructor(
    private _darkSky: DarkSkyService,
    private activeRoute: ActivatedRoute,
    public tUtils: TutilsModule,
    public datePipe: DatePipe
  ) {
  }

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe(
      response => {
        
        this.darkSkyKey = response["darkSkyKey"];
        //console.log("darkSkyKey: " + this.darkSkyKey)
        if (!this.darkSkyKey) {
          this.darkSkyKey = JSON.parse(localStorage.getItem("darkSkyKey"));
        } else {
          localStorage.setItem("darkSkyKey", JSON.stringify(this.darkSkyKey))
        }

        this.coronavirus = 10*(Math.log10(response["coronavirus"]) - 1.7);

        if (!this.coronavirus) {
          this.coronavirus = 0;
        }
      }
    )
    this.now = true;
    this.UTC = -5;

    this.locationForm = new FormGroup({
      'coords': new FormControl('', [
        Validators.required
      ]),

      'now': new FormControl(true, []),

      'myDatepicker': new FormControl(moment()),

      'hour': new FormControl('0', []),

      'minute': new FormControl('0', []),

      'UTC': new FormControl(this.UTC, [])
    });
  }

  update() {
    const MINUTES = 60;
    const HOUR = MINUTES * 60;
    const DAY = HOUR * 24;
    let hours = this.locationForm.value.hour;
    let minutes = this.locationForm.value.minute;
    this.UTC = parseInt(this.locationForm.value.UTC);

    this.date = new Date(this.locationForm.value.myDatepicker);

    this.date.setTime(this.date.getTime() - this.UTC * HOUR * 1000 + hours * HOUR * 1000 + minutes * MINUTES * 1000);
    
    //this.date.setHours(hours, minutes, 0);
    console.log("Date3: " + this.date + ", " + this.date.getTime()/1000);
    this.loading = true;

    let coordsControl = this.locationForm.controls['coords'];

    if(this.locationEnabled) {
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            let lat = position.coords.latitude.toFixed(4);
            let long = position.coords.longitude.toFixed(4);

            let coords = lat + ", " + long;
            coordsControl.setValue(coords);
            this.coords = coords;

            this.getWeather();
          }
        )
      } else {
        console.error("Location not available!");
        this.locationEnabled = false;
      }
    } else {
      this.coords = this.locationForm.value.coords;
      this.getWeather();
    }
  }

  getWeather() {
    this._darkSky.getWeather(this.coords, this.now, this.date, this.darkSkyKey).subscribe(
      response => {
        this.temperature = response.currently.temperature - this.coronavirus;
        if (!this.now) {
          this.temperature += Math.random() - 0.5;
        }
        this.humidity = response.currently.humidity;
        this.dewPoint = response.currently.dewPoint - this.coronavirus;
        this.apparentT = response.currently.apparentTemperature - this.coronavirus;

        this.cloudiness = response.currently.cloudCover;
        this.conditions = response.currently.summary;
        this.windSpeed = response.currently.windSpeed;
        this.visibility = response.currently.visibility;

        let bcInfo = this.tUtils.breathCondensation(this.temperature, this.humidity);
        let maxH = bcInfo[0];
        this.breathCondensation = maxH > 1 ? bcInfo[1] : 0;

        let color1 = this.tUtils.formatHSL(this.tUtils.colorT(this.temperature, this.humidity, 10));
        let color2 = this.tUtils.formatHSL(this.tUtils.colorT(this.apparentT, this.humidity, this.visibility));

        let gradient = "linear-gradient(" + color1 + ", " + color2 + ")";

        document.body.style.backgroundImage = gradient;
        this.loading = false;
        this.loadingFailed = false;
      },
      error => {
        this.loading = false;
        this.loadingFailed = true;
      }
    );
  }

  onNowClicked() {
    this.now = !this.locationForm.value.now;
  }

  onLocationClicked() {
    this.locationEnabled = !this.locationEnabled;
    let coordsControl = this.locationForm.controls['coords'];
    
    if(this.locationEnabled) {
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            let lat = position.coords.latitude.toFixed(4);
            let long = position.coords.longitude.toFixed(4);

            let coords = lat + ", " + long;
            //this.locationForm.patchValue({coords: coords});
            coordsControl.setValue(coords);
            this.coords = coords;
            //coordsControl.disable();

            this.locationEnabled = true;
          }
        )
      } else {
        console.error("Location not available!");
        this.locationEnabled = false;
      }
    }
  }

  onCoordinatesChange(value: string){
    this.coords = value;
  }

  onUTCChange(value: string){
    this.UTC = parseInt(value);
  }

  onDateChange(value: string){
    let localDate = new Date(value);
    
    localDate.setUTCHours(0);
    this.date = localDate;
    console.log(this.date);
  }
}
