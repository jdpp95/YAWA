import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { map } from 'rxjs/operators'
import { environment } from './../../environments/environment'
import { Observable, forkJoin } from 'rxjs';
import { Observation } from '../models/observation.model';

@Injectable({
  providedIn: 'root'
})
export class DarkSkyService {

  proxyServer: string = "https://yawa-cors-anywhere.herokuapp.com/"
  //proxyServer: string = "";
  darkSkyUrl: string = "https://api.darksky.net/forecast/";

  constructor(private http: HttpClient) { }

  //Calls the API multiple times and returns a list of observables, one per call.
  getWeatherInBulk(coords: string, listOfTimestamps: number[], apiKey: string) {

    let listOfResults: Observable<any>[] = []

    for (let timestamp of listOfTimestamps) {
      let url = this.proxyServer + this.darkSkyUrl + apiKey + "/"
        + coords.replace(" ", "") + "," + timestamp + "?units=si";

      let result = this.http.get(url);
      listOfResults.push(result);
    }

    return listOfResults;
  }

  getWeather(coords: string, now: boolean, date: Date, apiKey: string) {

    let timestamp = Math.round(date.getTime() / 1000);
    let url = this.proxyServer + this.darkSkyUrl + apiKey + "/" + coords;

    if (!now) {
      url += "," + timestamp;
    }

    url += "?units=si"

    return this.http.get(url).pipe(map(
      (data: any) => {
        console.log(data);
        return data
      }
    ));
  }
}
