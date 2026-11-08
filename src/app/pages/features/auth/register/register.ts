// استيراد Component لإنشاء مكون Angular
import { Component } from '@angular/core';

// استيراد أدوات إنشاء النموذج والتحقق من البيانات
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// استيراد أداة التنقل بين الصفحات
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';


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
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';


  // إنشاء النموذج باستخدام FormBuilder
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {

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
  onSubmit(): void {

    // التحقق من صحة جميع الحقول
    if (this.registerForm.invalid || !this.passwordsMatch) {

      // إظهار أخطاء التحقق لجميع الحقول
      this.registerForm.markAllAsTouched();

      return;

    }

    const registerData = this.registerForm.getRawValue();
    const userInfo = {
      username: String(registerData.username).trim(),
      email: String(registerData.email).trim(),
      password: String(registerData.password),
      role: 'Passenger' as const
    };

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.register(userInfo).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'تم إنشاء الحساب بنجاح. سيتم نقلك إلى تسجيل الدخول.';
        void this.router.navigate(['/login']);
      },
      error: (error: { error?: { message?: string }; message?: string }) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.message ||
          error.message ||
          'تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.';
      }
    });
  }

}