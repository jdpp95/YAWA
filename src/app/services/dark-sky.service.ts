import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { map } from 'rxjs/operators'
import { Observable } from 'rxjs';
import { DatePipe } from '@angular/common'
import { environment as env } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DarkSkyService {

  backendURL: string = env.backendUrl;
  darkSkyPath: string = env.darkSkyPath;

  constructor(private http: HttpClient, private datePipe: DatePipe) { }

  //Calls the API multiple times and returns a list of observables, one per call.
  getWeatherInBulk(coords: string, listOfTimestamps: number[]) {

    let listOfResults: Observable<any>[] = []

    for (let timestamp of listOfTimestamps) {
      timestamp = Math.floor(timestamp);
      let url = `${this.backendURL}${this.darkSkyPath}?coords=${coords}&timestamp=${timestamp}`;

      let result = this.http.get(url);
      listOfResults.push(result);
    }

    return listOfResults;
  }

  getWeather(coords: string, now: boolean, date: Date, utc: string) {

    const formattedDate = this.datePipe.transform(date, `yyyy-MM-ddTHH:mm:ssZZZZZ`, utc)

    let url = `${this.backendURL}${this.darkSkyPath}?coords=${coords}`;

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
