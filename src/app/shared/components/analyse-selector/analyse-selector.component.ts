import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';

declare var flatpickr: any;

@Component({
  selector: 'app-analyse-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkDrag, CdkDropList],
  templateUrl: './analyse-selector.component.html',
  styleUrl: './analyse-selector.component.scss'
})
export class AnalyseSelectorComponent implements AfterViewInit {
  @Input() title: string = "Sélecteur d'Analyse";
  @Input() showIndicators: boolean = true;
  @Input() showAxes: boolean = true;
  
  // State for the selector
  @Input() isDragDropMode: boolean = false;
  @Input() selectedPeriod: string = 'Ce mois-ci';
  
  @Input() availableIndicators: string[] = [];
  @Input() selectedIndicators: string[] = [];
  
  @Input() availableAxes: string[] = [];
  @Input() selectedAxes: string[] = [];

  @Output() modeChanged = new EventEmitter<'classic' | 'dragdrop'>();
  @Output() selectedPeriodChange = new EventEmitter<string>();
  
  @Output() selectedIndicatorsChange = new EventEmitter<string[]>();
  @Output() availableIndicatorsChange = new EventEmitter<string[]>();
  
  @Output() selectedAxesChange = new EventEmitter<string[]>();
  @Output() availableAxesChange = new EventEmitter<string[]>();

  @Output() analysisTriggered = new EventEmitter<any>();

  toggleMode(mode: 'classic' | 'dragdrop') {
    this.isDragDropMode = mode === 'dragdrop';
    this.modeChanged.emit(mode);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
    this.emitChanges();
  }

  toggleIndicator(ind: string, isSelected: boolean) {
    if (isSelected) {
      // Move from selected to available
      const index = this.selectedIndicators.indexOf(ind);
      if (index > -1) {
        this.selectedIndicators.splice(index, 1);
        this.availableIndicators.push(ind);
      }
    } else {
      // Move from available to selected
      const index = this.availableIndicators.indexOf(ind);
      if (index > -1 && this.selectedIndicators.length < 6) {
        this.availableIndicators.splice(index, 1);
        this.selectedIndicators.push(ind);
      }
    }
    this.emitChanges();
  }

  toggleAxe(axe: string, isSelected: boolean) {
    if (isSelected) {
      const index = this.selectedAxes.indexOf(axe);
      if (index > -1) {
        this.selectedAxes.splice(index, 1);
        this.availableAxes.push(axe);
      }
    } else {
      const index = this.availableAxes.indexOf(axe);
      if (index > -1 && this.selectedAxes.length < 3) {
        this.availableAxes.splice(index, 1);
        this.selectedAxes.push(axe);
      }
    }
    this.emitChanges();
  }

  private emitChanges() {
    this.selectedIndicatorsChange.emit([...this.selectedIndicators]);
    this.availableIndicatorsChange.emit([...this.availableIndicators]);
    this.selectedAxesChange.emit([...this.selectedAxes]);
    this.availableAxesChange.emit([...this.availableAxes]);
  }

  ngAfterViewInit() {
    this.initFlatpickr();
  }

  initFlatpickr() {
    setTimeout(() => {
      if (typeof flatpickr !== 'undefined') {
        flatpickr('.flatpickr-range-input', {
          mode: 'range',
          dateFormat: 'd/m/Y',
          locale: 'fr',
          allowInput: true,
          onClose: (selectedDates: any[], dateStr: string, instance: any) => {
            if (selectedDates.length === 1) {
              const singleDate = instance.formatDate(selectedDates[0], 'd/m/Y');
              this.selectedPeriod = singleDate;
              this.selectedPeriodChange.emit(singleDate);
            } else if (selectedDates.length === 2) {
              const start = instance.formatDate(selectedDates[0], 'd/m/Y');
              const end = instance.formatDate(selectedDates[1], 'd/m/Y');
              const finalVal = start === end ? start : `${start} au ${end}`;
              this.selectedPeriod = finalVal;
              this.selectedPeriodChange.emit(finalVal);
            }
          },
          onChange: (selectedDates: any[], dateStr: string, instance: any) => {
            if (selectedDates.length === 2) {
              const start = instance.formatDate(selectedDates[0], 'd/m/Y');
              const end = instance.formatDate(selectedDates[1], 'd/m/Y');
              const finalVal = start === end ? start : `${start} au ${end}`;
              this.selectedPeriod = finalVal;
              this.selectedPeriodChange.emit(finalVal);
            }
          }
        });
      }
    }, 150);
  }

  onRefresh() {
    this.analysisTriggered.emit({
      period: this.selectedPeriod,
      indicators: this.selectedIndicators,
      axes: this.selectedAxes
    });
  }
}
