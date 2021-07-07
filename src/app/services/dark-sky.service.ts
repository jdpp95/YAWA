import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { map } from 'rxjs/operators'
import { environment } from './../../environments/environment'
import { Observable, forkJoin } from 'rxjs';
import { Observation } from '../models/observation.model';
import { DatePipe } from '@angular/common'

@Injectable({
  providedIn: 'root'
})
export class DarkSkyService {

  proxyServer: string = "https://yawa-cors-anywhere.herokuapp.com/"
  //darkSkyUrl: string = "https://api.darksky.net/forecast/";
  darkSkyUrl: string = "http://localhost:8080"

  constructor(private http: HttpClient, private datePipe: DatePipe) { }

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

    const formattedDate = this.datePipe.transform(date, 'yyyy-MM-ddTHH:mm:ss')

    let url = `${this.darkSkyUrl}?coords=${coords}`;

    if(!now){
      url += `&time=${formattedDate}`;
    }

    return this.http.get(url).pipe(map(
      (data: any) => {
        console.log(data);
        return data
      }
    ));
  }
}
