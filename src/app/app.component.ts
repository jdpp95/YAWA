import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

//Services
import { YawaBackendService } from 'src/app/services/dark-sky.service';

//Internal modules
import { UtilsService } from './services/tutils.service';

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
import { Elevation, ElevationUnit, WeatherDataService } from './services/weather-data.service';
import { MatTooltip } from '@angular/material/tooltip';

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
  ],
  standalone: false
})

export class AppComponent implements OnInit {
  @ViewChild('background') background: ElementRef;
  @ViewChild('weatherDataLeftPanel') weatherDataLeftPanel: ElementRef;
  @ViewChild('weatherDataRightPanel') weatherDataRightPanel: ElementRef;
  @ViewChild(TempGradientComponent)
  gradientComponent: TempGradientComponent;

  title = 'YAWA';

  //Forms and fields
  coords: string;
  nowIsChecked: boolean;
  locationForm: FormGroup;

  date: Date;
  UTC: number;

  //Data from API
  weatherData: WeatherItem = {} as WeatherItem;

  //Computed data
  snowProbability: number;
  breathCondensation: number;
  averageTemperature: number = 0;
  indoorTemp = { left: null, right: null };

  fakeElevation: Elevation = {
    value: 0,
    unit: ElevationUnit.METERS
  };

  //UI metadata
  loading: boolean = false;
  loadingFailed: boolean = false;
  editHumidity: boolean = false;
  locationEnabled: boolean = false;
  displayMinMax: boolean = false;
  displayAverageTemp: boolean = false;

  constructor(
    private _yawaBackendService: YawaBackendService,
    private _mapbox: MapboxService,
    private activeRoute: ActivatedRoute,
    public tUtils: UtilsService,
    public datePipe: DatePipe,
    public percentPipe: PercentPipe,
    private weatherDataService: WeatherDataService
  ) {
  }

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe(
      response => {
        if (response["elevation"]) {
          this.fakeElevation = {
            value: response["elevation"],
            unit: ElevationUnit.METERS
          }
        } else if (response["ft"]) {
          this.fakeElevation = {
            value: response["ft"],
            unit: ElevationUnit.FEET
          }
        }
      }
    )
    this.UTC = -5;

    const initDate = moment().utc();
    initDate.startOf('day');
    this.onDateChange(initDate.format())

    const savedFormData = localStorage.getItem('locationFormData');
    if (savedFormData) {
      const formData = JSON.parse(savedFormData);
      this.locationForm = new FormGroup({
        coords: new FormControl(formData.coords, [Validators.required]),
        now: new FormControl(formData.now, []),
        myDatepicker: new FormControl(formData.myDatepicker),
        hour: new FormControl(formData.hour, []),
        minute: new FormControl(formData.minute, []),
        UTC: new FormControl(formData.UTC, [])
      });
      this.nowIsChecked = this.locationForm.value.now;
    } else {
      this.locationForm = new FormGroup({
        coords: new FormControl('', [Validators.required]),
        now: new FormControl(true, []),
        myDatepicker: new FormControl(initDate),
        hour: new FormControl(0, []),
        minute: new FormControl(0, []),
        UTC: new FormControl(this.UTC, [])
      });
      this.nowIsChecked = true;
    }
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

            this.saveFormDataToLocalStorage();
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
        this.saveFormDataToLocalStorage();
        this.getWeather();
      }
    }

    if (this.nowIsChecked) {
      this.date = new Date();
    }
  }

  saveFormDataToLocalStorage() {
    const formData = {
      coords: this.locationForm.value.coords,
      now: this.locationForm.value.now,
      myDatepicker: this.locationForm.value.myDatepicker,
      hour: this.locationForm.value.hour,
      minute: this.locationForm.value.minute,
      UTC: this.locationForm.value.UTC
    };
    localStorage.setItem('locationFormData', JSON.stringify(formData));
  }

  getWeather() {
    this._yawaBackendService.getWeather(this.coords, this.nowIsChecked, this.date, this.UTC.toString()).subscribe(
      response => {
        this.updateWeatherData(response);
      },
      error => {
        this.loading = false;
        this.loadingFailed = true;
      }
    );
  }

  updateWeatherData(response) {
    this.weatherData.actualElevation = response.elevation;
    this.weatherDataService.computeTemperatureData(this.weatherData, response, this.nowIsChecked, this.fakeElevation);
    this.weatherDataService.processHourlyData(this.weatherData, response, this.date, this.fakeElevation);
    this.weatherDataService.assignWeatherData(this.weatherData, response, this.fakeElevation);
    this.updateApparentTemperature();
    this.gradientComponent.update(response?.hourly?.data);
    this.updateBackgroundColor();
    if (response.currently.indoorTemp) {
      this.indoorTemp.left = this.weatherDataService.computeTempFromFakeElevation(
        this.weatherData,
        response.currently.indoorTemp.left,
        this.fakeElevation
      );
      this.indoorTemp.right = this.weatherDataService.computeTempFromFakeElevation(
        this.weatherData,
        response.currently.indoorTemp.right,
        this.fakeElevation
      );
      this.updateWeatherPanelBackground(this.indoorTemp.left, 'left');
      this.updateWeatherPanelBackground(this.indoorTemp.right, 'right');
    }
    this.loading = false;
    this.loadingFailed = false;
  }

  private updateBackgroundColor() {
    const { temperature, cloudiness, rainIntensity, visibility, sunAngle, apparentT } = this.weatherData;
    let color1 = UtilsService.formatHSL(
      UtilsService.colorT(temperature, cloudiness, 0, 10, sunAngle)
    );
    let color2 = UtilsService.formatHSL(
      UtilsService.colorT(apparentT, cloudiness, rainIntensity, visibility, sunAngle)
    );

    const gradient = `linear-gradient(${color1}, ${color2})`;

    this.background.nativeElement.style.backgroundImage = gradient;
  }

  private updateWeatherPanelBackground(temperature: number, panel: 'left' | 'right') {
    let colorHsl = 'hsl(0, 0%, 100%)';
    if (temperature !== null) {
      colorHsl = UtilsService.formatHSL(
        UtilsService.colorT(temperature, 0.15, 0, 10, 0)
      );
    }
    const panelElement = panel === 'left' ? this.weatherDataLeftPanel : this.weatherDataRightPanel;
    const panelItems = panelElement.nativeElement.querySelectorAll('li');
    panelItems.forEach((li: HTMLElement) => {
      li.style.backgroundColor = colorHsl;
    });
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

  updateApparentTemperature() {
    if (this.weatherData.temperature > 15) {
      this.weatherData.apparentT = UtilsService.heatIndex(this.weatherData.temperature, this.weatherData.humidity);
    } else {
      this.weatherData.apparentT = UtilsService.windChill(this.weatherData.temperature, this.weatherData.windSpeed);
    }
  }

  onHumidityChanged(changeDewPoint: boolean, humidity?: string) {
    console.log({ changeDewPoint, humidity })
    if (humidity) {
      this.weatherData.humidity = parseInt(humidity) / 100.0;
    }

    if (changeDewPoint) {
      this.weatherData.dewPoint = UtilsService.dewPoint(this.weatherData.temperature, this.weatherData.humidity);
    }

    this.breathCondensation = UtilsService.breathCondensation(this.weatherData.temperature, this.weatherData.humidity);
    this.updateApparentTemperature();
    this.snowProbability = UtilsService.snowProbability(this.weatherData.temperature, this.weatherData.humidity);
    this.updateBackgroundColor();
  }

  displayMinMaxClicked() {
    this.displayMinMax = !this.displayMinMax;
  }

  displayAverageTempClicked() {
    this.displayAverageTemp = !this.displayAverageTemp;
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

  applyRain({ rainTemperature, rainIntensity }) {
    const newTemperature = this.weatherDataService.computeTempFromFakeElevation(this.weatherData, rainTemperature, this.fakeElevation);
    const newHumidity = UtilsService.humidityFromDewP(this.weatherData.dewPoint, newTemperature);

    this.weatherData = {
      ...this.weatherData,
      temperature: newTemperature,
      humidity: newHumidity,
      cloudiness: rainIntensity > 0 ? 1 : this.weatherData.cloudiness,
      rainIntensity,
    }
    this.updateApparentTemperature();
    this.updateBackgroundColor();
  }
}
