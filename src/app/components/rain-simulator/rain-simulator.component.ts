import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
import { UtilsService } from 'src/app/services/tutils.service';
import { YawaBackendService } from 'src/app/services/dark-sky.service';

@Component({
  selector: 'rain-simulator',
  templateUrl: './rain-simulator.component.html',
})
export class RainSimulatorComponent implements OnInit {

  displayRainControls: boolean;
  @Output() onRainTypeSelected: EventEmitter<any> = new EventEmitter();
  @Input() date: Date;
  @Input() coords: string;
  @Input() UTC: number;

  constructor(
    private yawaBackendService: YawaBackendService,
    public tUtils: UtilsService,
  ) { }

  ngOnInit(): void {
    this.displayRainControls = false;
  }

  toggleRainSimControls(): void {
    this.displayRainControls = !this.displayRainControls;
  }

  onOptionSelected(event): void {
    const oneDayAgo = Number(moment(this.date).subtract(1, 'days').format('X'));
    const now = Number(moment(this.date).format('X'));

    this.yawaBackendService.getWeatherInBulk(this.coords, oneDayAgo, now, this.UTC).pipe(
      map(data => data.hourly.data)
    ).subscribe((weatherItems: any[]) => {
      const temperatures = weatherItems.map(item => item.temperature);
      const currentTemperature = temperatures[temperatures.length - 1];

      const rainType = event.srcElement.id;
      let rainIntensity = 0;
      let rainTemperature;
      switch (rainType) {
        case 'noRainOption':
          rainTemperature = currentTemperature;
          break;
        case 'drizzleOption':
          rainTemperature = this.scale(temperatures, currentTemperature, 20, 65);
          rainIntensity = 1;
          break;
        case 'rainOption':
          rainTemperature = this.scale(temperatures, currentTemperature, 30, 50);
          rainIntensity = 4;
          break;
        case 'heavyRainOption':
          rainTemperature = this.scale(temperatures, currentTemperature, 30, 30);
          rainIntensity = 9;
          break;
      }
      this.onRainTypeSelected.emit({rainTemperature, rainIntensity});
    });
  }

  private scale(arr: number[], value: number, lowerQuantile: number, higherQuantile: number) {
    const lowerPercentile = UtilsService.getPercentile(arr, lowerQuantile / 100);
    const higherPercentile = UtilsService.getPercentile(arr, higherQuantile / 100);
    const currentPercentRank = UtilsService.getPercentileRank(arr, value);

    const scaledValue = UtilsService.transition(lowerPercentile, higherPercentile, 0, 1, currentPercentRank);
    return scaledValue;
  }
}
