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
      'coords' : new FormControl('', [
        Validators.required
      ])
    });
  }
  
  update(){
    //console.log(this.locationForm.value)
    this.coords = this.locationForm.value.coords
    this.getForecast();
  }
  
  getForecast(){
    this._darkSky.getForecast(this.coords).subscribe(
      response => {
        this.temperature = this.tUtils.FtoC(response.currently.temperature);
        this.humidity = response.currently.humidity;
        this.cloudiness = response.currently.cloudCover;
        this.conditions = response.currently.summary;
        
        let tColorHSL = this.tUtils.formatHSL(this.tUtils.colorT(this.temperature, this.humidity));
        document.body.style.backgroundColor = tColorHSL;
      }
    );
  }
}
