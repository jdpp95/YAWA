import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment as env } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MapboxService {

  backendURL: string = env.backendUrl;
  mapboxPath: string = env.mapboxPath;

  constructor(private http: HttpClient) {
  }

  getCoordsFromName(searchTerm: string){
    const url = `${this.backendURL}${this.mapboxPath}?q=${searchTerm}`;

    return this.http.get(url).pipe(
      map(places => {
        const place = places[0];
        return `${place.lat}, ${place.lng}`
      })
    );
  }
}
