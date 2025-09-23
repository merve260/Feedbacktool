import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../../core/auth/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/dialogs/confirm-dialog.component';
import { CanComponentDeactivate } from '../../../../core/guards/unsaved-changes.guard';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, TranslateModule],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss'],
})
export class ProfileSettingsComponent implements OnInit, CanComponentDeactivate {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private auth = inject(AuthService);
  private translate = inject(TranslateService);

  user$ = this.auth.user$;
  form!: FormGroup;

  avatarPreview: string | null = null;
  avatarChanged = false;

  ngOnInit() {
    this.user$.subscribe(u => {
      if (u) {
        this.form = this.fb.group({
          displayName: [u.displayName || ''],
        });

        if (u.uid) {
          this.auth.getUserAvatar(u.uid).subscribe(photo => {
            this.avatarPreview = photo;
          });
        }
      }
    });
  }

  canDeactivate(): boolean {
    return !this.form?.dirty && !this.avatarChanged;
  }

  async saveProfile() {
    try {
      if (this.form?.dirty) {
        const { displayName } = this.form.value;
        await this.auth.updateProfile({ displayName });
        this.form.markAsPristine();
      }

      if (this.avatarChanged && this.avatarPreview) {
        await this.auth.uploadUserAvatarBase64(this.avatarPreview);
        this.avatarChanged = false;
      }

      this.snackBar.open(
        this.translate.instant('profile.saved'),
        this.translate.instant('common.close'),
        {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
    } catch (err) {
      console.error('Fehler beim Aktualisieren!', err);
      this.snackBar.open(
        this.translate.instant('errors.saveFailed'),
        this.translate.instant('common.close'),
        {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
    }
  }

  async changeAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const allowed = ['image/png', 'image/jpeg', 'image/webp'];
      const fileName = file.name.toLowerCase();
      const maxSize = 1 * 1024 * 1024; // 1 MB

      if (file.size > maxSize) {
        this.snackBar.open(
          this.translate.instant('avatar.tooLarge'),
          this.translate.instant('common.ok'),
          {
            duration: 7000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          }
        );
        return;
      }
      if (
        file.type === 'image/svg+xml' ||
        fileName.endsWith('.svg') ||
        !allowed.includes(file.type)
      ) {
        this.snackBar.open(
          this.translate.instant('avatar.invalidType'),
          this.translate.instant('common.ok'),
          {
            duration: 7000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          }
        );
        return;
      }

      this.avatarPreview = await this.toBase64(file);
      this.avatarChanged = true;
    };
  }

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  logout() {
    if (this.form?.dirty || this.avatarChanged) {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        disableClose: true,
        data: {
          message: this.translate.instant('profile.unsavedChanges'),
          confirmText: this.translate.instant('common.leave'),
          cancelText: this.translate.instant('common.cancel'),
        },
      });

      ref.afterClosed().subscribe(result => {
        if (result) {
          this.auth.logout();
        }
      });
    } else {
      this.auth.logout();
    }
  }

  async resetAvatar() {
    this.avatarPreview = null;
    this.avatarChanged = true;
    await this.auth.deleteAvatar();
  }
}
