import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class DarkSkyService {
  
  proxyServer: string = "https://cors-anywhere.herokuapp.com/"
  darkSkyUrl: string = "https://api.darksky.net/forecast/{api_key}/";
  //darkSkyUrl: string = "https://google.com/";

  constructor(private http: HttpClient) {}
  
  getForecast(coords: string){
    const headers = new HttpHeaders({
      'Access-Control-Allow-Origin': 'localhost'
    });
    
    let url = this.proxyServer + this.darkSkyUrl + coords;
    
    return this.http.get(url/*, {headers}*/).pipe(map(
      (data: any) => {
        console.log(data);
        return data 
      }
    ));
  }
}
