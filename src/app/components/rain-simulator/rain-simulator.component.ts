import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
import { TutilsModule } from 'src/app/modules/tutils/tutils.module';
import { YawaBackendService } from 'src/app/services/dark-sky.service';

@Component({
  selector: 'rain-simulator',
  templateUrl: './rain-simulator.component.html',
})
export class RainSimulatorComponent implements OnInit {

  displayRainControls: boolean;
  @Output() onRainTypeSelected: EventEmitter<string> = new EventEmitter();
  @Input() date: Date;
  @Input() coords: string;
  @Input() UTC: number;

  constructor(
    private yawaBackendService: YawaBackendService,
    public tUtils: TutilsModule,
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
      const percentile30 = this.tUtils.getPercentile(temperatures, 0.30);
      const percentile50 = this.tUtils.getPercentile(temperatures, 0.50);

      console.log({percentile30, percentile50});
    });

    // const rainType = event.srcElement.id;
    // console.log(rainType);
    // switch(rainType){
    //   case 'noRainOption':
    //     break;
    //   case 'drizzleOption':
    //     break;
    //   case 'rainOption':
    //     break;
    //   case 'heavyRainOption':
    //     break;
    // }
  }
}
