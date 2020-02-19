import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DarkSkyService } from 'src/app/services/dark-sky.service'
import { TutilsModule } from './modules/tutils/tutils.module'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'YAWA';
  coords: string;
  now: boolean;
  locationForm: FormGroup;
  
  temperature: number;
  humidity: number;
  cloudiness: number;
  conditions: string;
  
  constructor(
    private _darkSky: DarkSkyService, 
    private tUtils: TutilsModule
  ){
    this.locationForm = new FormGroup({
      'coords' : new FormControl('4.6116, -74.2069', [
        Validators.required
      ]),
      
      'now' : new FormControl(true, [])
    });
  }
  
  update(){
    //console.log(this.locationForm.value)
    this.coords = this.locationForm.value.coords
    this.now = this.locationForm.value.now;
    this.getWeather();
  }
  
  getWeather(){
    this._darkSky.getWeather(this.coords, this.now).subscribe(
      response => {
        this.temperature = this.tUtils.FtoC(response.currently.temperature);
        this.humidity = response.currently.humidity;
        this.cloudiness = response.currently.cloudCover;
        this.conditions = response.currently.summary;
        
        let tColorHSL = this.tUtils.formatHSL(this.tUtils.colorT(this.temperature, this.humidity, undefined));
        document.body.style.backgroundColor = tColorHSL;
      }
    );
  }
}
