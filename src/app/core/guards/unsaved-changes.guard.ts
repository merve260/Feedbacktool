import { Injectable, inject } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog.component';

// Schnittstelle für Komponenten, die eigene Deaktivierungslogik haben
export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({ providedIn: 'root' })
export class UnsavedChangesGuard implements CanDeactivate<CanComponentDeactivate> {
  private dialog = inject(MatDialog);

  // Wird aufgerufen, bevor eine Route verlassen wird
  canDeactivate(component: CanComponentDeactivate): Observable<boolean> | Promise<boolean> | boolean {
    // Wenn die Komponente eine eigene canDeactivate-Methode hat, diese aufrufen
    const result = component.canDeactivate ? component.canDeactivate() : true;

    // Wenn ein synchrones false zurückkommt → Dialog anzeigen
    if (result === false) {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        disableClose: true,
        width: '500px',
        height: '110px',
        data: {
          message: 'Es gibt ungespeicherte Änderungen. Wirklich verlassen?',
          confirmText: 'Verlassen',
          cancelText: 'Abbrechen'
        }
      });

      // Gibt ein Observable zurück, das true oder false liefert
      return ref.afterClosed();
    }

    // Wenn kein Problem besteht → Navigation erlauben
    return result;
  }
}
