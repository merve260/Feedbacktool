import { Injectable, inject } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog.component';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({ providedIn: 'root' })
export class UnsavedChangesGuard implements CanDeactivate<CanComponentDeactivate> {
  private dialog = inject(MatDialog);

  canDeactivate(component: CanComponentDeactivate): Observable<boolean> | Promise<boolean> | boolean {
    // Eğer component "dirty" ise → kendi metodunu sor
    const result = component.canDeactivate ? component.canDeactivate() : true;

    // Eğer boolean dönerse ve false ise → bizim dialog açalım
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

      return ref.afterClosed(); // Observable<boolean>
    }

    return result;
  }
}
