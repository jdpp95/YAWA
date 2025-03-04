import { Injectable } from '@angular/core';
import { WeatherItem } from '../models/weatherItem.model';
import { UtilsService } from './tutils.service';
import * as _moment from 'moment';

const moment = _moment;

export enum ElevationUnit {
  METERS = 'm',
  FEET = 'ft'
}

export type Elevation = {
  value: number;
  unit: ElevationUnit;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherDataService {
  computeTemperatureData(weatherData: WeatherItem, response: any, nowIsChecked: boolean, fakeElevation: Elevation): void {
    weatherData.temperature = this.computeTempFromFakeElevation(weatherData, response.currently.temperature, fakeElevation);
    if (!nowIsChecked) {
      weatherData.temperature += Math.random() - 0.5;
    }
    weatherData.min = this.computeTempFromFakeElevation(weatherData, response.daily.data[0].temperatureMin, fakeElevation);
    weatherData.max = this.computeTempFromFakeElevation(weatherData, response.daily.data[0].temperatureMax, fakeElevation);
  }

  computeAverageTemperature(weatherData: WeatherItem, response: any, date: Date, fakeElevation: Elevation): number {
    let averageTemperature = 0;
    if (response.hourly?.data) {
      let todayWeather = [];

      response.hourly.data.forEach((weatherItem) => {
        let weatherItemDate = new Date(weatherItem.time * 1000);
        let weatherItemDayOfMonth = weatherItemDate.getDate();

        if (weatherItemDayOfMonth === date.getDate()) {
          todayWeather.push(weatherItem);
        }
      });

      if (todayWeather.length > 0) {
        averageTemperature = 0;
        weatherData.min = Infinity;
        weatherData.max = -Infinity;
      }
      todayWeather.forEach(weatherItem => {
        averageTemperature += weatherItem.temperature;
        weatherData.min = weatherItem.temperature < weatherData.min ? weatherItem.temperature : weatherData.min;
        weatherData.max = weatherItem.temperature > weatherData.max ? weatherItem.temperature : weatherData.max;
      });
      weatherData.min = this.computeTempFromFakeElevation(weatherData, weatherData.min, fakeElevation);
      weatherData.max = this.computeTempFromFakeElevation(weatherData, weatherData.max, fakeElevation);

      averageTemperature /= todayWeather.length;
      averageTemperature = this.computeTempFromFakeElevation(weatherData, averageTemperature, fakeElevation);
    }
    return averageTemperature;
  }

  assignWeatherData(weatherData: WeatherItem, response: any, fakeElevation: Elevation): void {
    weatherData.humidity = response.currently.humidity;
    weatherData.dewPoint = this.computeTempFromFakeElevation(weatherData, response.currently.dewPoint, fakeElevation);
    weatherData.cloudiness = response.currently.cloudCover;
    weatherData.conditions = response.currently.summary;
    weatherData.windSpeed = response.currently.windSpeed;
    weatherData.visibility = response.currently.visibility;
    weatherData.rainIntensity = response.currently.precipIntensity;
    weatherData.sunAngle = response.sunAngle;
  }

  updateApparentTemperature(weatherData: WeatherItem): void {
    if (weatherData.temperature > 15) {
      weatherData.apparentT = UtilsService.heatIndex(weatherData.temperature, weatherData.humidity);
    } else {
      weatherData.apparentT = UtilsService.windChill(weatherData.temperature, weatherData.windSpeed);
    }
  }

  computeTempFromFakeElevation(weatherData: WeatherItem, temperature: number, fakeElevation: Elevation): number {
    const FT_TO_M = 0.3048;

    if (fakeElevation.unit === ElevationUnit.FEET) {
      const meters = fakeElevation.value * FT_TO_M;
      const ratio = meters / 2550;

      // This function's only responsibility is to compute the temperature. Assignation to component.fakeElevation should be done outside.
      const fakeElevationInMeters = (ratio - 1) * weatherData.actualElevation;
      return temperature - fakeElevationInMeters / 180;
    } else if (fakeElevation.unit === ElevationUnit.METERS) {
      return temperature - fakeElevation.value / 180;
    }

  }

  applyRain(weatherData: WeatherItem, rainTemperature: number, rainIntensity: number, fakeElevation: Elevation): void {
    const newTemperature = this.computeTempFromFakeElevation(weatherData, rainTemperature, fakeElevation);
    const newHumidity = UtilsService.humidityFromDewP(weatherData.dewPoint, newTemperature);

    weatherData.temperature = newTemperature;
    weatherData.humidity = newHumidity;
    weatherData.cloudiness = rainIntensity > 0 ? 1 : weatherData.cloudiness;
    weatherData.rainIntensity = rainIntensity;
    this.updateApparentTemperature(weatherData);
  }

  copyPrompt(weatherData: WeatherItem, date: Date): void {
    let text = "";
    text += `Time of day: ${moment(date).format('HH:mm')}`;
    text += `\nTemperature: ${weatherData.temperature.toFixed(0)} °C`;
    text += `\nCloud cover: ${(weatherData.cloudiness * 100).toFixed(0)}%`;
    text += `\nRelative Humidity: ${(weatherData.humidity * 100).toFixed(0)}%`;
    text += `\nWind speed: ${weatherData.windSpeed.toFixed(0)} km/h`;
    text += `\nActivity: `;

    navigator.clipboard.writeText(text);
  }
}
