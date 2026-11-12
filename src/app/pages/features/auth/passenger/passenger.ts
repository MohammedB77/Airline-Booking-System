
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './passenger.html',
})
export class PassengerComponent {

  passenger: PassengerForm = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'YEM',
    passportNumber: '',
    phoneNumber: ''
  };

  // منع اختيار تاريخ في المستقبل
  maxDate: string = new Date().toISOString().split('T')[0];

  // حالة إرسال النموذج
  submitted = false;

  // رسالة التحقق
  formMessage = '';

  onSubmit(form: NgForm): void {
    this.submitted = true;
    this.formMessage = '';

    if (form.invalid) {
      form.control.markAllAsTouched();
      this.formMessage = 'يرجى التأكد من إدخال جميع البيانات المطلوبة بشكل صحيح.';
      return;
    }

    // الواجهة جاهزة، وسيتم ربط عملية الحفظ بالـ API لاحقاً.
    this.formMessage = 'تم التحقق من البيانات بنجاح. الواجهة جاهزة لربط خدمة الحفظ.';
  }

  resetForm(form: NgForm): void {
    form.resetForm({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      nationality: 'YEM',
      passportNumber: '',
      phoneNumber: ''
    });

    this.passenger = {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      nationality: 'YEM',
      passportNumber: '',
      phoneNumber: ''
    };

    this.submitted = false;
    this.formMessage = '';
  }
}
