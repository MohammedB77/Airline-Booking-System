
import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';

import {
  PassengerService,
  type PassengerCreateRequest
} from '../../../../core/services/passenger.service';

import { UserService } from '../../../../core/services/user.service';

// Passenger Form Data
interface PassengerForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  passportNumber: string;
  phoneNumber: string;
}

@Component({
  selector: 'app-passenger',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './passenger.html',
})
export class PassengerComponent {

  private readonly passengerService = inject(PassengerService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  // Passenger Form
  passenger: PassengerForm = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'YEM',
    passportNumber: '',
    phoneNumber: ''
  };

  // Prevent future dates
  maxDate: string = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  ).toISOString().split('T')[0];

  // Form Status
  submitted = false;
  isSaving = false;
  formMessage = '';
  messageType: 'success' | 'error' = 'error';

  // Get User ID
  private getUserId(): number | null {

    const state = this.location.getState();

    const navigationUserId =
      state && typeof state === 'object'
        ? (state as { userId?: unknown }).userId
        : undefined;

    const currentUserId = this.userService.currentUser()?.id;

    const rawId = navigationUserId ?? currentUserId;

    if (rawId === null || rawId === undefined || rawId === '') {
      return null;
    }

    const id = Number(rawId);

    return Number.isInteger(id) && id > 0 ? id : null;
  }

  // Save Passenger
  onSubmit(form: NgForm): void {

    if (this.isSaving) {
      return;
    }

    this.submitted = true;
    this.formMessage = '';

    // Validate Form
    if (
      form.invalid ||
      !this.passenger.dateOfBirth ||
      this.passenger.dateOfBirth > this.maxDate
    ) {
      form.control.markAllAsTouched();

      this.messageType = 'error';
      this.formMessage =
        'يرجى التأكد من إدخال جميع البيانات المطلوبة بشكل صحيح.';

      return;
    }

    // Get Registered User ID
    const userId = this.getUserId();

    if (userId === null) {
      this.messageType = 'error';
      this.formMessage =
        'لم يتم العثور على حساب المستخدم. يرجى إكمال إنشاء الحساب أولاً.';

      return;
    }

    // Prepare Passenger Data
    const passengerData: PassengerCreateRequest = {

      firstName: this.passenger.firstName.trim(),

      lastName: this.passenger.lastName.trim(),

      dateOfBirth: `${this.passenger.dateOfBirth}T00:00:00`,

      gender: this.passenger.gender,

      nationality: this.passenger.nationality,

      passportNumber: this.passenger.passportNumber.trim(),

      phoneNumber: this.passenger.phoneNumber.trim(),

      userId: userId
    };

    this.isSaving = true;

    // Send Passenger Data To API
    this.passengerService.create(passengerData).subscribe({

      next: (response) => {

        this.isSaving = false;

        this.messageType = 'success';

        this.formMessage =
          'تم حفظ بيانات المسافر بنجاح.';

        console.log('Passenger Created:', response);

        // Navigate to Home Page
        void this.router.navigateByUrl('/home');
      },

      error: (error: HttpErrorResponse) => {

        this.isSaving = false;

        this.messageType = 'error';

        if (error.status === 0) {

          this.formMessage =
            'تعذر الاتصال بالخادم. تأكد من تشغيل API.';

        } else if (error.status === 400) {

          this.formMessage =
            'تعذر حفظ البيانات. تحقق من صحة البيانات ورقم المستخدم.';

        } else {

          this.formMessage =
            'حدث خطأ أثناء حفظ بيانات المسافر. حاول مرة أخرى.';
        }

        console.error('Passenger Error:', error);
      }
    });
  }

  // Reset Passenger Form
  resetForm(form: NgForm): void {

    if (this.isSaving) {
      return;
    }

    const initialData: PassengerForm = {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      nationality: 'YEM',
      passportNumber: '',
      phoneNumber: ''
    };

    form.resetForm(initialData);

    this.passenger = { ...initialData };

    this.submitted = false;
    this.formMessage = '';
    this.messageType = 'error';
  }
}
