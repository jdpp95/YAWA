import { Component } from '@angular/core';
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
import { Observation } from './models/observation.model';
import { forkJoin } from 'rxjs';

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
export class AppComponent {
  title = 'YAWA';

  private darkSkyKey: string;

  //Forms and fields
  coords: string;
  now: boolean;
  locationForm: FormGroup;
  bulkDataForm: FormGroup;

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
  
  observations : Observation[] = [];

  coronavirus: number;

  loading: boolean = false;
  loadingFailed: boolean = false;

  bulkLoading: boolean = false;
  bulkLoadingFailed: boolean = false;
  bulkInvalidData: boolean = false;

  displayTimeCol: boolean = false;

  locationEnabled: boolean = false;

  constructor(
    private _darkSky: DarkSkyService,
    private tUtils: TutilsModule,
    private activeRoute: ActivatedRoute,
    public datePipe: DatePipe
  ) {
    this.activeRoute.queryParams.subscribe(
      response => {
        
        this.darkSkyKey = response["darkSkyKey"];
        //console.log("darkSkyKey: " + this.darkSkyKey)
        if (!this.darkSkyKey) {
          this.darkSkyKey = JSON.parse(localStorage.getItem("darkSkyKey"));
        } else {
          localStorage.setItem("darkSkyKey", JSON.stringify(this.darkSkyKey))
        }

        this.coronavirus = 1.1397 * Math.pow(response["coronavirus"], 0.3544)

        if (!this.coronavirus) {
          this.coronavirus = 0;
        }
      }
    )
    this.now = true;

    this.locationForm = new FormGroup({
      'coords': new FormControl('', [
        Validators.required
      ]),

      'now': new FormControl(true, []),

      'myDatepicker': new FormControl(moment()),

      'hour': new FormControl('0', []),

      'minute': new FormControl('0', []),

      'UTC': new FormControl('-5', [])
    });

    this.bulkDataForm = new FormGroup({
      'initDate': new FormControl(moment()),
  
      'initHour': new FormControl('0', []),

      'finalDate': new FormControl(moment()),
  
      'finalHour': new FormControl('0', []),   
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

    //console.log("Date1: " + this.date + ", " + this.date.getTime()/1000);

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
        //console.log(`Visibility: ${this.visibility} km`);

        let bcInfo = this.tUtils.breathCondensation(this.temperature, this.humidity);
        let maxH = bcInfo[0];
        this.breathCondensation = maxH > 1 ? bcInfo[1] : 0;

        let color1 = this.tUtils.formatHSL(this.tUtils.colorT(this.temperature, this.humidity, 10));
        let color2 = this.tUtils.formatHSL(this.tUtils.colorT(this.apparentT, this.humidity, this.visibility));

        //console.log("Color2: " + color2);

        let gradient = "linear-gradient(" + color1 + ", " + color2 + ")";

        document.body.style.backgroundImage = gradient;

        //console.log(gradient);

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

  onDisplayTimeColClicked(){
    this.displayTimeCol = !this.displayTimeCol;
  }

  onSubmitBulkData(){
    let listOfTimestamps = [];
    const HOUR = 60 * 60;
    const DAY = HOUR * 24;

    this.bulkInvalidData = false;

    //Get data from bulk data form
    let initDate = (new Date(this.bulkDataForm.value.initDate)).getTime()/1000;
    let finalDate = (new Date(this.bulkDataForm.value.finalDate)).getTime()/1000;
    let initHour = parseInt(this.bulkDataForm.value.initHour);
    let finalHour = parseInt(this.bulkDataForm.value.finalHour);

    //Get data from main form
    this.coords = this.locationForm.value.coords;
    this.UTC = parseInt(this.locationForm.value.UTC);

    let initTime = initDate + (initHour - this.UTC) * HOUR;
    let finalTime = finalDate + (finalHour - this.UTC) * HOUR;
    let time = initTime;

    let dayStart = time - (time + this.UTC * HOUR) % DAY;
    let dayEnd = dayStart + DAY;
    
    this.observations = []

    listOfTimestamps.push(time);
    while(!(finalTime >= dayStart && finalTime < dayEnd))
    {
      dayStart += DAY;
      time += DAY;
      dayEnd += DAY;
      listOfTimestamps.push(time);
      if(listOfTimestamps.length > 4)
      {
        this.bulkInvalidData = true;
        return;
      }
    }

    let listOfResults = this._darkSky.getWeatherInBulk(this.coords, listOfTimestamps, this.darkSkyKey)

    forkJoin(listOfResults).subscribe(
      results => {
        this.bulkLoadingFailed = false;

        for (let dailyResult of results) {
          for (let jsonObservation of dailyResult.hourly.data)
          {
            let observation = new Observation();
            observation.timestamp = jsonObservation.time;
            observation.time = new Date((jsonObservation.time + HOUR * this.UTC) * 1000);
            observation.temperature = jsonObservation.temperature + Math.random() - 0.5;

            if(jsonObservation.time >= initTime && jsonObservation.time <= finalTime)
            {
              this.observations.push(observation);
            }
          }
        }

        /*
        for(let observation of this.observations)
        {
          let date = new Date((observation.timestamp + HOUR * this.UTC) * 1000);
          let formattedDate = this.datePipe.transform(date, 'dd/MMM HH:mm', 'GMT');
          console.log(observation.timestamp, formattedDate, observation.temperature);
        }*/
        
      },

      error => {
        this.bulkLoadingFailed = true;
      }
    );
  }

  range(start: number, end: number) {
    let arr = [];
    for (let i = start; i < end; i++) {
      arr.push(i);
    }
    return arr;
  }
}
