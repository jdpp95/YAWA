import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MapboxService {

  private accessToken = ""; //Private

  constructor(private http: HttpClient) {
  }

  getCoordsFromName(searchTerm: string){
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchTerm}.json?access_token=${this.accessToken}`;

    return this.http.get(url).pipe(
      map(response => {
        const center = response['features'][0]['center'];
        return `${center[1]}, ${center[0]}`
      })
    );
  }
}
