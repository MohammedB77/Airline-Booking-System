// استيراد Component لإنشاء مكون Angular
import { Component } from '@angular/core';

// استيراد أدوات إنشاء النموذج والتحقق من البيانات
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// استيراد أداة التنقل بين الصفحات
import { RouterLink } from '@angular/router';


// تعريف إعدادات مكون التسجيل
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})

// إنشاء كلاس صفحة التسجيل
export class Register {

  // التحكم في إظهار وإخفاء كلمة المرور
  showPassword = false;

  // التحكم في إظهار وإخفاء تأكيد كلمة المرور
  showConfirmPassword = false;

  // متغير يمثل نموذج التسجيل
  registerForm: FormGroup;


  // إنشاء النموذج باستخدام FormBuilder
  constructor(private fb: FormBuilder) {

    // إنشاء نموذج التسجيل وتحديد الحقول المطلوبة
    this.registerForm = this.fb.group({

      // اسم المستخدم مطلوب
      username: ['', Validators.required],

      // البريد الإلكتروني مطلوب ويجب أن يكون بصيغة صحيحة
      email: ['', [Validators.required, Validators.email]],

      // كلمة المرور مطلوبة ولا تقل عن 8 أحرف
      password: ['', [Validators.required, Validators.minLength(8)]],

      // تأكيد كلمة المرور مطلوب
      confirmPassword: ['', Validators.required]

    });

  }


  // التحقق من تطابق كلمة المرور مع تأكيدها
  get passwordsMatch(): boolean {

    return this.registerForm.get('password')?.value ===
           this.registerForm.get('confirmPassword')?.value;

  }


  // إظهار وإخفاء كلمة المرور
  togglePassword() {

    this.showPassword = !this.showPassword;

  }


  // إظهار وإخفاء تأكيد كلمة المرور
  toggleConfirmPassword() {

    this.showConfirmPassword = !this.showConfirmPassword;

  }


  // تنفيذ عملية إنشاء الحساب
  onSubmit() {

    // التحقق من صحة جميع الحقول
    if (this.registerForm.invalid || !this.passwordsMatch) {

      // إظهار أخطاء التحقق لجميع الحقول
      this.registerForm.markAllAsTouched();

      return;

    }

    // استخراج بيانات التسجيل
    const registerData = this.registerForm.value;

    // عرض البيانات مؤقتاً في Console
    // لاحقاً سنرسلها إلى ASP.NET Core Web API
    console.log(registerData);

  }

}