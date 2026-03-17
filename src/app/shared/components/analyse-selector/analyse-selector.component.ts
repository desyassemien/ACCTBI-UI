import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-analyse-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkDrag, CdkDropList],
  templateUrl: './analyse-selector.component.html',
  styleUrl: './analyse-selector.component.scss'
})
export class AnalyseSelectorComponent {
  @Input() title: string = "Sélecteur d'Analyse";
  
  // State for the selector
  @Input() isDragDropMode: boolean = false;
  @Input() selectedPeriod: string = 'Ce mois-ci';
  
  @Input() availableIndicators: string[] = [];
  @Input() selectedIndicators: string[] = [];
  
  @Input() availableAxes: string[] = [];
  @Input() selectedAxes: string[] = [];

  @Output() modeChanged = new EventEmitter<'classic' | 'dragdrop'>();
  @Output() selectedPeriodChange = new EventEmitter<string>();
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
  }

  onRefresh() {
    this.analysisTriggered.emit({
      period: this.selectedPeriod,
      indicators: this.selectedIndicators,
      axes: this.selectedAxes
    });
  }
}
