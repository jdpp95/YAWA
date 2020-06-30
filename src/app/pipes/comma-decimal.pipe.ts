import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'commaDecimal'
})
export class CommaDecimalPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {
    return value.replace(".",",");
  }

}
