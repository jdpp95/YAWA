import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

//Services
import { DarkSkyService } from 'src/app/services/dark-sky.service';

//Internal modules
import { TutilsModule } from './modules/tutils/tutils.module';

//Angular material
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

//Moment.js
import * as _moment from 'moment';
//import {default as _rollupMoment} from 'moment';

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
  },
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

    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ]
})
export class AppComponent {
  title = 'YAWA';
  
  coords: string;
  now: boolean;
  locationForm: FormGroup;
  
  date: Date;
  UTC: number;
  
  temperature: number;
  humidity: number;
  dewPoint: number;
  apparentT: number;
  
  cloudiness: number;
  conditions: string;
  windSpeed: number;
  
  loading: boolean = false;
  
  constructor(
    private _darkSky: DarkSkyService, 
    private tUtils: TutilsModule
  ){
    this.now = true;
      
    this.locationForm = new FormGroup({
      'coords' : new FormControl('4.6116, -74.2069', [
        Validators.required
      ]),
      
      'now' : new FormControl(true, []),
      
      'myDatepicker' : new FormControl(moment()),
      
      'hour' : new FormControl('0', []),
      
      'minute' : new FormControl('0', []),
      
      'UTC' : new FormControl('-5', [])
    });
  }
  
  update(){
    this.coords = this.locationForm.value.coords;
    
    let hours = this.locationForm.value.hour;
    let minutes = this.locationForm.value.minute;
    this.UTC = parseInt(this.locationForm.value.UTC);
    
    this.date = new Date(this.locationForm.value.myDatepicker);
    this.date.setHours(hours, minutes, 0);
    this.date.setTime(this.date.getTime() - (5 + this.UTC)*60*60*1000);
    console.log(this.date);
    this.loading = true;
    this.getWeather();
  }
  
  getWeather(){
    this._darkSky.getWeather(this.coords, this.now, this.date).subscribe(
      response => {
        this.temperature = response.currently.temperature;
        if(!this.now){
          this.temperature += Math.random() - 0.5;
        }
        this.humidity = response.currently.humidity;
        this.dewPoint = response.currently.dewPoint;
        this.apparentT = response.currently.apparentTemperature;
        
        this.cloudiness = response.currently.cloudCover;
        this.conditions = response.currently.summary;
        this.windSpeed = response.currently.windSpeed;
        
        let color1 = this.tUtils.formatHSL(this.tUtils.colorT(this.temperature, this.humidity, undefined));
        let color2 = this.tUtils.formatHSL(this.tUtils.colorT(this.apparentT, this.humidity, undefined));
        
        //console.log("Color2: " + color2);
        
        let gradient = "linear-gradient(" + color1 + ", " + color2 + ")";
        
        document.body.style.backgroundImage = gradient;
        
        //console.log(gradient);
        
        this.loading = false;
      }
    );
  }
  
  onNowClicked(){
    this.now = !this.locationForm.value.now;
  }
  
  range(start: number, end: number){
    let arr = [];
    for(let i = start; i < end; i++)
    {
      arr.push(i);
    }
    return arr;
  }
}
