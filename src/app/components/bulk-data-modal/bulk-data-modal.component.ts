import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { Observation } from 'src/app/models/observation.model';
import { UtilsService } from 'src/app/services/tutils.service';
import { YawaBackendService } from 'src/app/services/dark-sky.service';
import { Elevation, WeatherDataService } from 'src/app/services/weather-data.service';
import { WeatherItem } from 'src/app/models/weatherItem.model';

@Component({
  selector: 'app-bulk-data-modal',
  templateUrl: './bulk-data-modal.component.html',
  styleUrls: ['./bulk-data-modal.component.css'],
  standalone: false
})
export class BulkDataModalComponent implements OnChanges {

  //User choices
  displayTimeCol: boolean = false;

  //Rendering data
  invalidData: boolean = false;
  loading: boolean = false;
  loadingFailed: boolean = false;

  //Forms
  dataForm: FormGroup;

  observations: Observation[] = [];

  @Input() UTC: number;
  @Input() coords: string;
  @Input() date: Date;
  @Input() hour: string;

  @Input() elevationData: { actualElevation: number, fakeElevation: Elevation };

  constructor(
    private _yawaBackend: YawaBackendService,
    public tUtils: UtilsService,
    private weatherDataService: WeatherDataService
  ) {
    this.dataForm = new FormGroup({
      'initDate': new FormControl(moment()),

      'initHour': new FormControl('0', []),

      'finalDate': new FormControl(moment()),

      'finalHour': new FormControl(this.hour ?? '0', []),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.date) {
      this.dataForm.controls['initDate'].setValue(moment(this.date).subtract(3, 'days').utcOffset(0).startOf('day'));
      this.dataForm.controls['finalDate'].setValue(moment(this.date).utcOffset(0).startOf('day'));
    }

    if (this.hour) {
      this.dataForm.controls['finalHour'].setValue(this.hour);
    }
  }

  onDisplayTimeColClicked() {
    this.displayTimeCol = !this.displayTimeCol;
  }

  onSubmitBulkData() {
    this.loading = true;

    const HOUR = 60 * 60;
    const DAY = HOUR * 24;

    this.invalidData = false;

    //Get data from bulk data form
    let initDate = (new Date(this.dataForm.value.initDate)).getTime() / 1000;
    let finalDate = (new Date(this.dataForm.value.finalDate)).getTime() / 1000;
    let initHour = parseInt(this.dataForm.value.initHour);
    let finalHour = parseInt(this.dataForm.value.finalHour);

    //Get data from main form
    let initTime = initDate + (initHour - this.UTC) * HOUR;
    let finalTime = finalDate + (finalHour - this.UTC) * HOUR;

    this.observations = []

    if (finalTime / DAY - initTime / DAY > 4) {
      this.invalidData = true;
      return;
    }

    this._yawaBackend.getWeatherInBulk(this.coords, initTime, finalTime, this.UTC).subscribe(
      (results: any) => {
        this.loadingFailed = false;
        this.loading = false;

        for (let jsonObservation of results.hourly.data) {
          let observation = new Observation();
          observation.timestamp = jsonObservation.time;
          observation.time = new Date((jsonObservation.time + HOUR * this.UTC) * 1000);
          observation.temperature = jsonObservation.temperature + Math.random() - 0.5;
          observation.temperature = this.weatherDataService.computeTempFromFakeElevation(
            { actualElevation: this.elevationData.actualElevation } as WeatherItem,
            jsonObservation.temperature,
            this.elevationData.fakeElevation
          ) + Math.random() - 0.5;
          observation.cloudiness = jsonObservation.cloudCover;

          if (jsonObservation.time >= initTime && jsonObservation.time <= finalTime) {
            this.observations.push(observation);
          }
        }
      },
      error => {
        this.loadingFailed = true;
        this.loading = false;
      }
    );
  }
}
