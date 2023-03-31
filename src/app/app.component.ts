import { Component, OnInit, ViewChild } from '@angular/core';
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
import { TempGradientComponent } from './components/temp-gradient/temp-gradient.component';

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
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } }
  ]
})

export class AppComponent implements OnInit {
  title = 'YAWA';

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
  minDP: number;
  sunAngle: number;
  actualElevation: number;

  //Computed data
  snowProbability: number;
  breathCondensation: number;
  averageTemperature: number = 0;

  coronavirus: number;
  fakeElevation: number;

  //UI metadata
  loading: boolean = false;
  loadingFailed: boolean = false;
  editHumidity: boolean = false;
  locationEnabled: boolean = false;
  displayMinMax: boolean = false;
  displayAverageTemp: boolean = false;

  //Children components
  @ViewChild(TempGradientComponent)
  gradientComponent: TempGradientComponent;

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

        let population: number = response["pop"];
        if (!population) {
          population = 51226221; //Colombia population in 16/03/2021
        }

        let vaccinated = response["vaccinated"];
        if (!vaccinated) vaccinated = 0;
        let vacPercentage = vaccinated / population;

        this.coronavirus = 10 * (Math.log10(response["coronavirus"]) - (Math.log10(population) - 6));
        this.coronavirus *= (1 - vacPercentage);

        if (!this.coronavirus || this.coronavirus < 0) {
          this.coronavirus = 0;
        }

        this.fakeElevation = response["elevation"];

        if (!this.fakeElevation || this.fakeElevation === 0) {
          this.fakeElevation = 0;
        }

      }
    )
    this.now = true;
    this.UTC = -5;

    const initDate = moment().utc();
    initDate.startOf('day');
    this.onDateChange(initDate.format())

    this.locationForm = new FormGroup({
      'coords': new FormControl('', [
        Validators.required
      ]),

      'now': new FormControl(true, []),

      'myDatepicker': new FormControl(initDate),

      'hour': new FormControl('0', []),

      'minute': new FormControl('0', []),

      'UTC': new FormControl(this.UTC, [])
    });
  }

  syncDateWithUTC() {
    //Read and set time data
    const MINUTES = 60;
    const HOUR = MINUTES * 60;

    let hours = this.locationForm.value.hour;
    let minutes = this.locationForm.value.minute;
    this.UTC = parseInt(this.locationForm.value.UTC);

    this.date = new Date(this.locationForm.value.myDatepicker);
    this.date.setTime(this.date.getTime() - this.UTC * HOUR * 1000 + hours * HOUR * 1000 + minutes * MINUTES * 1000);
  }

  update() {
    //Read and set time data
    this.syncDateWithUTC();

    this.loading = true;

    let coordsControl = this.locationForm.controls['coords'];

    if (this.locationEnabled) {
      if (navigator.geolocation) {
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

      if (useMapbox) {
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
    this._darkSky.getWeather(this.coords, this.now, this.date, this.UTC.toString()).subscribe(
      response => {
        this.temperature = response.currently.temperature - this.coronavirus - this.fakeElevation / 180;
        if (!this.now) {
          this.temperature += Math.random() - 0.5;
        }
        this.min = response.daily.data[0].temperatureMin - this.coronavirus - this.fakeElevation / 180;
        this.max = response.daily.data[0].temperatureMax - this.coronavirus - this.fakeElevation / 180;

        if (response.hourly?.data) {
          response.hourly.data.forEach(weatherItem => {
            this.averageTemperature += weatherItem.temperature;
          });

          this.averageTemperature /= response.hourly.data.length;

          this.averageTemperature - this.coronavirus - this.fakeElevation / 180;
        }

        this.humidity = response.currently.humidity;
        this.editHumidity = false;
        //this.editDewPoint = false;

        this.dewPoint = response.currently.dewPoint - this.coronavirus - this.fakeElevation / 180;
        let dewPoints = response.hourly?.data.map(hour => hour.dewPoint);

        if (dewPoints) {
          this.minDP = Math.min(...dewPoints) - this.coronavirus - this.fakeElevation / 180;
        }

        this.snowProbability = this.tUtils.snowProbability(this.temperature, this.humidity);

        this.cloudiness = response.currently.cloudCover;
        this.conditions = response.currently.summary;
        this.windSpeed = response.currently.windSpeed;
        this.visibility = response.currently.visibility;
        this.rainIntensity = response.currently.precipIntensity;

        this.sunAngle = response.sunAngle;

        this.breathCondensation = this.tUtils.breathCondensation(this.temperature, this.humidity);

        this.actualElevation = response.elevation;

        if (this.coronavirus > 0 || this.fakeElevation > 0) {
          this.computeApparentTemperature();
        } else {
          this.apparentT = response.currently.apparentTemperature - this.coronavirus - this.fakeElevation / 180;
        }

        this.displayRainData(response.daily.data[0]);

        this.gradientComponent.update(response?.hourly?.data);
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
    let color1 = this.tUtils.formatHSL(this.tUtils.colorT(this.temperature, this.cloudiness, 0, 10, this.sunAngle));
    let color2 = this.tUtils.formatHSL(this.tUtils.colorT(this.apparentT, this.cloudiness, this.rainIntensity, this.visibility, this.sunAngle));

    let gradient = "linear-gradient(" + color1 + ", " + color2 + ")";

    document.body.style.backgroundImage = gradient;
  }

  onNowClicked() {
    this.now = !this.locationForm.value.now;
  }

  onLocationClicked() {
    this.locationEnabled = !this.locationEnabled;
    let coordsControl = this.locationForm.controls['coords'];

    if (this.locationEnabled) {
      if (navigator.geolocation) {
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

  onCoordinatesChange(value: string) {
    this.coords = value;
  }

  onUTCChange(value: string) {
    this.UTC = parseInt(value);
  }

  onDateChange(value: string) {
    let localDate = new Date(value);

    localDate.setUTCHours(0);
    this.date = localDate;
    console.log(this.date);
  }

  changeHumidity() {
    this.editHumidity = true;
  }

  changeDewPoint() {
    this.dewPoint = this.minDP;
    this.humidity = this.tUtils.humidityFromDewP(this.dewPoint, this.temperature);
    this.onHumidityChanged(false);
    this.editHumidity = false;
  }

  computeApparentTemperature() {
    if (this.temperature > 15) {
      this.apparentT = this.tUtils.heatIndex(this.temperature, this.humidity);
    } else {
      this.apparentT = this.tUtils.windChill(this.temperature, this.windSpeed);
    }
  }

  onHumidityChanged(changeDewPoint: boolean, humidity?: string) {
    if (humidity) {
      this.humidity = parseInt(humidity) / 100.0;
    }

    if (changeDewPoint) {
      this.dewPoint = this.tUtils.dewPoint(this.temperature, this.humidity);
    }

    this.breathCondensation = this.tUtils.breathCondensation(this.temperature, this.humidity);
    this.computeApparentTemperature();
    this.snowProbability = this.tUtils.snowProbability(this.temperature, this.humidity);
    this.updateBackgroundColor();
  }

  onTemperatureChanged() {
    this.computeApparentTemperature();
    this.updateBackgroundColor();
  }

  displayMinMaxClicked() {
    this.displayMinMax = !this.displayMinMax;
  }

  displayAverageTempClicked() {
    this.displayAverageTemp = !this.displayAverageTemp;
  }

  onAdjustTemperatureClicked() {
    this.changeDewPoint();

    if (this.humidity < 0.9) {
      const MAX_HUMIDITY = 0.9;

      const rDiff = Math.max(MAX_HUMIDITY - this.humidity, 0);
      const hDiff = rDiff / Math.max(this.rainIntensity, 1);
      this.humidity = MAX_HUMIDITY - hDiff;
    }

    if (this.humidity < 0.7) {
      this.rainIntensity -= (0.7 - this.humidity);
    }

    this.temperature = this.tUtils.temperatureFromDewP(this.dewPoint, this.humidity);
    this.onHumidityChanged(false);
    this.onTemperatureChanged();
  }

  displayRainData(dailyData) {
    const maxPrecipitation = parseFloat(dailyData.precipIntensityMax).toFixed(1);
    const maxPrecipTime = moment.unix(dailyData.precipIntensityMaxTime).format("YYYY-MM-DD HH:mm")

    console.log(`Max precip intensity: ${maxPrecipitation}`);
    console.log(`Max precip time: ${maxPrecipTime}`);
  }
}
