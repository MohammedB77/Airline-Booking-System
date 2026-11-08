// استيراد Component لإنشاء مكون Angular
import { Component } from '@angular/core';

// استيراد أدوات إنشاء النموذج والتحقق من البيانات
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

// استيراد أداة التنقل بين الصفحات
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

// استيراد خدمة تغيير اسم تبويب المتصفح
import { Title } from '@angular/platform-browser';

import { UserService } from '../../../../core/services/user.service';

// تعريف إعدادات مكون تسجيل الدخول
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

// إنشاء كلاس صفحة تسجيل الدخول
export class Login {
  // التحكم في إظهار وإخفاء كلمة المرور
  showPassword = false;

  // التحكم في حالة إرسال النموذج
  isSubmitting = false;
  errorMessage = '';

  // متغير يمثل نموذج تسجيل الدخول
  loginForm: FormGroup;


  // إنشاء النموذج وتحديد عنوان الصفحة
  constructor(
    private fb: FormBuilder,
    private title: Title,
    private userService: UserService,
    private router: Router
  ) {

    // تغيير اسم تبويب المتصفح
    this.title.setTitle('تسجيل الدخول | مَدار');

    // إنشاء نموذج تسجيل الدخول
    this.loginForm = this.fb.group({

      // البريد الإلكتروني مطلوب ويجب أن يكون صحيحاً
      email: ['', [Validators.required, Validators.email]],

      // كلمة المرور مطلوبة
      password: ['', Validators.required]

    });

  }


  // إظهار وإخفاء كلمة المرور
  togglePassword() {
    this.showPassword = !this.showPassword;
  }


  // تنفيذ عملية تسجيل الدخول
  onSubmit(): void {

    // التحقق من صحة البيانات
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // استخراج بيانات تسجيل الدخول
    const loginData = this.loginForm.value;

    // عرض البيانات مؤقتاً
    // لاحقاً سنربطها مع ASP.NET Core Web API
    const user = {
      email: loginData.email,
      password: loginData.password
    };

    this.isSubmitting = true;
    this.errorMessage = '';
    this.userService.login(user).subscribe({
      next: (loggedInUser) => {
        this.isSubmitting = false;
        const destination = loggedInUser.role.toLowerCase() === 'passenger'
          ? '/home'
          : '/home';
        void this.router.navigateByUrl(destination);
      },
      error: (error: Error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.';
      }
    });
  }

}