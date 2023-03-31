import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TutilsModule } from 'src/app/modules/tutils/tutils.module';
import { environment as env } from './../../../environments/environment';

@Component({
  selector: 'temp-gradient',
  templateUrl: './temp-gradient.component.html',
  styleUrls: ['./temp-gradient.component.css']
})
export class TempGradientComponent {

  @Input()
  UTC: number;

  @Input()
  coronavirus: number;

  @Input()
  elevation: number;

  hourlyData: any[];

  constructor(
    public tUtils: TutilsModule,
  ) { }

  update(hourlyData: any[]) {
    this.hourlyData = hourlyData;
    let weatherData: WeatherItem[] = [];

    if (!hourlyData) {
      return;
    }

    this.hourlyData.forEach(item => {
      let weatherItem: WeatherItem = new WeatherItem;

      // Set time
      let time = new Date(item.time * 1000);
      let localHours = (time.getUTCHours() + 24 + this.UTC) % 24;

      // Set clouds
      let clouds = item.cloudCover
      let precipIntensity = item.precipIntensity;
      if (precipIntensity && precipIntensity >= 1) {
        clouds = Math.min(2.5, 1 + precipIntensity / 4);

      }

      weatherItem.time = localHours;
      weatherItem.temperature = item.temperature - this.coronavirus - this.elevation / 180;
      weatherItem.sunAngle = item.sunAngle;
      weatherItem.clouds = clouds;

      // Restraint
      if (weatherItem.temperature > env.maxTemp) {
        weatherItem.clouds = 10;
      }

      weatherData.push(weatherItem);
    })

    this.setColors(weatherData);
  }

  setColors(weatherData: WeatherItem[]) {
    let tempGradient = document.getElementById("tempGradient");
    let style = "";
    console.log(weatherData);

    if (weatherData.length == 1) {
      style = this.tUtils.formatHSL(this.tUtils.colorT(weatherData[0]['temperature'], weatherData[0]['clouds'], 0, 10, weatherData[0]['sunAngle']));
    } else {
      style = "linear-gradient(90deg, ";

      for (let i = 0; i < 24; i++) {
        let hourlyWeather: WeatherItem = weatherData[i];

        let position = Math.round(100 * i / 24);

        if (weatherData[i]) {
          style += `${this.tUtils.formatHSL(this.tUtils.colorT(hourlyWeather.temperature, hourlyWeather.clouds, 0, 10, hourlyWeather.sunAngle))} ${position}%, `;
        }

        if (i == 23) {
          style = style.substring(0, style.length - 2) + ")";
        }
      }
    }

    tempGradient.style.background = style;
  }
}

class WeatherItem {
  time: number;
  temperature: number;
  sunAngle: number;
  clouds: number;
}