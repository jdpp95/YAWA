import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { map } from 'rxjs/operators'
import { Observable } from 'rxjs';
import { DatePipe } from '@angular/common'

@Injectable({
  providedIn: 'root'
})
export class DarkSkyService {

  proxyServer: string = "https://yawa-cors-anywhere.herokuapp.com/"
  darkSkyUrl: string = "http://localhost:8080"

  constructor(private http: HttpClient, private datePipe: DatePipe) { }

  //Calls the API multiple times and returns a list of observables, one per call.
  getWeatherInBulk(coords: string, listOfTimestamps: number[]) {

    let listOfResults: Observable<any>[] = []

    for (let timestamp of listOfTimestamps) {
      timestamp = Math.floor(timestamp);
      let url = `${this.darkSkyUrl}?coords=${coords}&timestamp=${timestamp}`;

      let result = this.http.get(url);
      listOfResults.push(result);
    }

    return listOfResults;
  }

  getWeather(coords: string, now: boolean, date: Date, utc: string) {

    const formattedDate = this.datePipe.transform(date, `yyyy-MM-ddTHH:mm:ssZZZZZ`, utc)

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
