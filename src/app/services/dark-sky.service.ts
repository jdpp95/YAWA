import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { map } from 'rxjs/operators'
import { Observable } from 'rxjs';
import { DatePipe } from '@angular/common'
import { environment as env } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class YawaBackendService {

  backendURL: string = env.backendUrl;
  yawaBackendPath: string = env.openMeteoPath;

  constructor(private http: HttpClient, private datePipe: DatePipe) { }

  //Calls the API multiple times and returns a list of observables, one per call.
  getWeatherInBulk(coords: string, initTime: number, endTime: number, utc: number) {

    let [lat, long] = coords.split(",");
    let url = `${this.backendURL}${this.yawaBackendPath}?lat=${lat}&long=${Number(long)}&start_timestamp=${initTime}&end_timestamp=${endTime}&utc=${utc}`;

    let result = this.http.get(url);

    return result;
  }

  getWeather(coords: string, now: boolean, date: Date, utc: string) {

    let [lat, long] = coords.split(",");

    let url = `${this.backendURL}${this.yawaBackendPath}?lat=${lat}&long=${Number(long)}&utc=${utc}`;

    let unixTime = Math.floor(Number(date));

    if (!now) {
      url += `&timestamp=${unixTime / 1000}`;
    }

    return this.http.get(url).pipe(map(
      (data: any) => {
        console.log(data);
        return data
      }
    ));
  }
}
