import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class DarkSkyService {
  
  proxyServer: string = "https://cors-anywhere.herokuapp.com/"
  darkSkyUrl: string = "https://api.darksky.net/forecast/";
  //darkSkyUrl: string = "https://google.com/";

  constructor(private http: HttpClient) {}
  
  getWeather(coords: string, now: boolean, date: Date){
    const headers = new HttpHeaders({
      'Access-Control-Allow-Origin': 'localhost'
    });
    
    //let date = new Date()
    //let timestamp = Math.round(date.getTime()/1000 - 126252000);
    let timestamp = Math.round(date.getTime()/1000);
    let url = this.proxyServer + this.darkSkyUrl + coords;
    
    if(!now)
    {
      url += "," + timestamp;
    }
    
    url += "?units=si"
    
    return this.http.get(url/*, {headers}*/).pipe(map(
      (data: any) => {
        console.log(data);
        return data 
      }
    ));
  }
}
