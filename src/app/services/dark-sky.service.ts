import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'
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
  getWeatherInBulk(coords: string, initTime: number, endTime: number, utc: number): Observable<any> {

    let [lat, long] = coords.split(",");
    let params = new HttpParams()
      .set('lat', lat)
      .set('long', String(Number(long)))
      .set('start_timestamp', String(initTime))
      .set('end_timestamp', String(endTime));

    if (!isNaN(utc)) {
      params = params.set('utc', String(utc));
    }

    return this.http.get(`${this.backendURL}${this.yawaBackendPath}`, { params });
  }

  getWeather(coords: string, now: boolean, date: Date, utc: number) {
    const [lat, long] = coords.split(",");

    let params = new HttpParams()
      .set('lat', lat)
      .set('long', String(Number(long)));

    if (!isNaN(utc)) {
      params = params.set('utc', String(utc));
    }

    if (!now) {
      const unixTime = Math.floor(Number(date)) / 1000;
      params = params.set('timestamp', String(unixTime));
    }

    return this.http.get(`${this.backendURL}${this.yawaBackendPath}`, { params })
      .pipe(map((data: any) => {
        console.log(data);
        return data;
      }));
  }
}
