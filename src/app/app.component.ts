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
import { DatePipe, PercentPipe } from '@angular/common';
import { MapboxService } from './services/mapbox.service';

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

  //Data from API
  temperature: number;
  min: number;
  max: number;
  humidity: number;
  dewPoint: number;
  apparentT: number;
  visibility: number;
  cloudiness: number;
  conditions: string;
  windSpeed: number;
  rainIntensity: number;

  //Computed data
  snowProbability: number;
  breathCondensation: number;

  coronavirus: number;

  //UI metadata
  loading: boolean = false;
  loadingFailed: boolean = false;
  editHumidity: boolean = false;
  editDewPoint: boolean = false;
  locationEnabled: boolean = false;
  displayMinMax: boolean = false;
  //isRaining: boolean = false;

  constructor(
    private _darkSky: DarkSkyService,
    private activeRoute: ActivatedRoute,
    private _mapbox: MapboxService,
    public tUtils: TutilsModule,
    public datePipe: DatePipe,
    public percentPipe: PercentPipe
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

        let population: number = response["pop"];
        if(!population){
          population = 51226221; //Colombia population in 16/03/2021
        }

        let vaccinated = response["vaccinated"]
        if(!vaccinated) vaccinated = 0;
        let vacPercentage = vaccinated/population;
        
        this.coronavirus = 10*(Math.log10(response["coronavirus"]) - (Math.log10(population) - 6));
        this.coronavirus *= (1 - vacPercentage);

        if (!this.coronavirus || this.coronavirus < 0) {
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
    //Read and set time data
    const MINUTES = 60;
    const HOUR = MINUTES * 60;
    const DAY = HOUR * 24;
    let hours = this.locationForm.value.hour;
    let minutes = this.locationForm.value.minute;
    this.UTC = parseInt(this.locationForm.value.UTC);
    this.date = new Date(this.locationForm.value.myDatepicker);
    this.date.setTime(this.date.getTime() - this.UTC * HOUR * 1000 + hours * HOUR * 1000 + minutes * MINUTES * 1000);
    
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
      
      //TODO: Add a condition
      const pattern = new RegExp(/^(-?\d{1,2}(\.\d*)?), ?(-?\d{1,3}(\.\d*)?)$/m);
      const useMapbox = !pattern.test(this.coords);

      if(useMapbox){
        this._mapbox.getCoordsFromName(this.coords).subscribe(
          coords => {
            this.coords = coords
            console.log(this.coords)
            this.getWeather();
          }
        );
      } else {
        this.coords = this.locationForm.value.coords;
        this.getWeather();
      }
    }
  }

  getWeather() {
    this._darkSky.getWeather(this.coords, this.now, this.date, this.darkSkyKey).subscribe(
      response => {
        this.temperature = response.currently.temperature - this.coronavirus;
        if (!this.now) {
          this.temperature += Math.random() - 0.5;
        }
        this.min = response.daily.data[0].temperatureMin - this.coronavirus;
        this.max = response.daily.data[0].temperatureMax - this.coronavirus;
        this.humidity = response.currently.humidity;
        this.editHumidity = false;
        this.editDewPoint = false;

        this.dewPoint = response.currently.dewPoint - this.coronavirus;
        this.snowProbability = this.tUtils.snowProbability(this.temperature, this.humidity);

        this.cloudiness = response.currently.cloudCover;
        this.conditions = response.currently.summary;
        this.windSpeed = response.currently.windSpeed;
        this.visibility = response.currently.visibility;
        this.rainIntensity = response.currently.precipIntensity;

        this.breathCondensation = this.tUtils.breathCondensation(this.temperature, this.humidity);

        if(this.coronavirus > 0){
          this.computeApparentTemperature();
        } else {
          this.apparentT = response.currently.apparentTemperature - this.coronavirus;
        }

        this.updateBackgroundColor();
        this.loading = false;
        this.loadingFailed = false;
      },
      error => {
        this.loading = false;
        this.loadingFailed = true;
      }
    );
  }

  private updateBackgroundColor() {
    let color1 = this.tUtils.formatHSL(this.tUtils.colorT(this.temperature, this.cloudiness, this.rainIntensity*2, 10));
    let color2 = this.tUtils.formatHSL(this.tUtils.colorT(this.apparentT, this.cloudiness, 0, this.visibility));

    let gradient = "linear-gradient(" + color1 + ", " + color2 + ")";

    document.body.style.backgroundImage = gradient;
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
            coordsControl.setValue(coords);
            this.coords = coords;

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

  changeHumidity(){
    this.editHumidity = true;
  }

  changeDewPoint(){
    this.editDewPoint = true;
  }

  computeApparentTemperature(){
    if(this.temperature > 15)
    {
      this.apparentT = this.tUtils.heatIndex(this.temperature, this.humidity);
    } else {
      this.apparentT = this.tUtils.windChill(this.temperature, this.windSpeed);
    }
  }

  onHumidityChanged(humidity: string){
    this.humidity = parseInt(humidity)/100.0;
    this.dewPoint = this.tUtils.dewPoint(this.temperature, this.humidity);

    this.breathCondensation = this.tUtils.breathCondensation(this.temperature, this.humidity);
    
    this.computeApparentTemperature();

    this.snowProbability = this.tUtils.snowProbability(this.temperature, this.humidity);

    this.updateBackgroundColor();
  }

  onDewPointChanged(dewPoint: string){
    this.dewPoint = parseInt(dewPoint);
    this.humidity = this.tUtils.humidityFromDewP(this.dewPoint, this.temperature);
  }

  displayMinMaxClicked(){
    this.displayMinMax = !this.displayMinMax;
  }
}
