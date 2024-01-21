import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

//Services
import { YawaBackendService } from 'src/app/services/dark-sky.service';

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
import { WeatherItem } from './models/weatherItem.model';

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
  nowIsChecked: boolean;
  locationForm: FormGroup;

  date: Date;
  UTC: number;

  //Data from API
  weatherData: WeatherItem = new WeatherItem();

  //Computed data
  snowProbability: number;
  breathCondensation: number;
  averageTemperature: number = 0;

  fakeElevation: number;
  fakeElevationFt: number;

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
    private _yawaBackendService: YawaBackendService,
    private _mapbox: MapboxService,
    private activeRoute: ActivatedRoute,
    public tUtils: TutilsModule,
    public datePipe: DatePipe,
    public percentPipe: PercentPipe
  ) {
  }

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe(
      response => {
        this.fakeElevation = response["elevation"] || 0;
        this.fakeElevationFt = response["ft"];
      }
    )
    this.nowIsChecked = true;
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

    if (this.nowIsChecked) {
      this.date = new Date();
    }
  }

  getWeather() {
    this._yawaBackendService.getWeather(this.coords, this.nowIsChecked, this.date, this.UTC.toString()).subscribe(
      response => {
        this.weatherData.actualElevation = response.elevation;

        this.weatherData.temperature = this.computeTemperature(response.currently.temperature);
        if (!this.nowIsChecked) {
          this.weatherData.temperature += Math.random() - 0.5;
        }
        this.weatherData.min = this.computeTemperature(response.daily.data[0].temperatureMin);
        this.weatherData.max = this.computeTemperature(response.daily.data[0].temperatureMax);

        if (response.hourly?.data) {

          let todayWeather = [];

          response.hourly.data.forEach((weatherItem) => {
            let weatherItemDate = new Date(weatherItem.time * 1000);
            let weatherItemDayOfMonth = weatherItemDate.getDate();

            if (weatherItemDayOfMonth === this.date.getDate()) {
              todayWeather.push(weatherItem);
            }
          });

          if (todayWeather.length > 0) {
            this.averageTemperature = 0;
            this.weatherData.min = Infinity;
            this.weatherData.max = -Infinity;
          }
          todayWeather.forEach(weatherItem => {
            this.averageTemperature += weatherItem.temperature;
            this.weatherData.min = weatherItem.temperature < this.weatherData.min ? weatherItem.temperature : this.weatherData.min;
            this.weatherData.max = weatherItem.temperature > this.weatherData.max ? weatherItem.temperature : this.weatherData.max;
          });
          this.weatherData.min = this.computeTemperature(this.weatherData.min);
          this.weatherData.max = this.computeTemperature(this.weatherData.max);

          this.averageTemperature /= todayWeather.length;

          this.averageTemperature = this.computeTemperature(this.averageTemperature);
        }

        this.weatherData.humidity = response.currently.humidity;
        this.editHumidity = false;
        //this.editDewPoint = false;

        this.weatherData.dewPoint = this.computeTemperature(response.currently.dewPoint);

        this.snowProbability = this.tUtils.snowProbability(this.weatherData.temperature, this.weatherData.humidity);

        this.weatherData.cloudiness = response.currently.cloudCover;
        this.weatherData.conditions = response.currently.summary;
        this.weatherData.windSpeed = response.currently.windSpeed;
        this.weatherData.visibility = response.currently.visibility;
        this.weatherData.rainIntensity = response.currently.precipIntensity;

        this.weatherData.sunAngle = response.sunAngle;

        this.breathCondensation = this.tUtils.breathCondensation(this.weatherData.temperature, this.weatherData.humidity);

        this.computeApparentTemperature();

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
    let color1 = this.tUtils.formatHSL(this.tUtils.colorT(this.weatherData.temperature, this.weatherData.cloudiness, 0, 10, this.weatherData.sunAngle));
    let color2 = this.tUtils.formatHSL(this.tUtils.colorT(this.weatherData.apparentT, this.weatherData.cloudiness, this.weatherData.rainIntensity, this.weatherData.visibility, this.weatherData.sunAngle));

    let gradient = "linear-gradient(" + color1 + ", " + color2 + ")";

    document.body.style.backgroundImage = gradient;
  }

  onNowClicked() {
    this.nowIsChecked = !this.locationForm.value.now;
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

  computeApparentTemperature() {
    if (this.weatherData.temperature > 15) {
      this.weatherData.apparentT = this.tUtils.heatIndex(this.weatherData.temperature, this.weatherData.humidity);
    } else {
      this.weatherData.apparentT = this.tUtils.windChill(this.weatherData.temperature, this.weatherData.windSpeed);
    }
  }

  onHumidityChanged(changeDewPoint: boolean, humidity?: string) {
    console.log({ changeDewPoint, humidity })
    if (humidity) {
      this.weatherData.humidity = parseInt(humidity) / 100.0;
    }

    if (changeDewPoint) {
      this.weatherData.dewPoint = this.tUtils.dewPoint(this.weatherData.temperature, this.weatherData.humidity);
    }

    this.breathCondensation = this.tUtils.breathCondensation(this.weatherData.temperature, this.weatherData.humidity);
    this.computeApparentTemperature();
    this.snowProbability = this.tUtils.snowProbability(this.weatherData.temperature, this.weatherData.humidity);
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

  displayRainData(dailyData) {
    const maxPrecipitation = parseFloat(dailyData.precipIntensityMax).toFixed(1);
    const maxPrecipTime = moment.unix(dailyData.precipIntensityMaxTime).format("YYYY-MM-DD HH:mm")
  }

  copyPromptClicked() {
    let text = "";
    // text += "\nDate: ";
    text += `Time of day: ${moment(this.date).format('HH:mm')}`;
    text += `\nTemperature: ${this.weatherData.temperature.toFixed(0)} °C`;
    text += `\nCloud cover: ${(this.weatherData.cloudiness * 100).toFixed(0)}%`;
    text += `\nRelative Humidity: ${(this.weatherData.humidity * 100).toFixed(0)}%`;
    text += `\nWind speed: ${this.weatherData.windSpeed.toFixed(0)} km/h`;
    text += `\nActivity: `;

    navigator.clipboard.writeText(text);
  }

  computeTemperature(temperature: number) {
    const FT_TO_M = 0.3048;

    if (this.fakeElevationFt) {
      let meters = this.fakeElevationFt * FT_TO_M;
      let ratio = meters / 2550;

      this.fakeElevation = (ratio - 1) * this.weatherData.actualElevation;
    }

    return temperature - this.fakeElevation / 180;
  }

  applyRain({ rainTemperature, rainIntensity }) {

    const newHumidity = this.tUtils.humidityFromDewP(this.weatherData.dewPoint, rainTemperature);

    this.weatherData = {
      ...this.weatherData,
      temperature: this.computeTemperature(rainTemperature),
      humidity: newHumidity,
      cloudiness: rainIntensity > 0 ? 1 : this.weatherData.cloudiness,
      rainIntensity,
    }
    this.computeApparentTemperature();

    this.updateBackgroundColor();
  }
}
