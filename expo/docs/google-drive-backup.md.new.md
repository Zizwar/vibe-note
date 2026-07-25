<div 

# دليل ربط تطبيق Vibe Note مع Google Drive ومزامنة البيانات تلقائياً

يشرح هذا الدليل بالتفصيل الخطوات البرمجية والتهيئة اللازمة لربط تطبيق **Vibe Note** (المبني بـ React Native و Expo) بحساب Google الخاص بالمستخدم، لتمكينه من مزامنة برومبتاته ونسخه الاحتياطية تلقائياً في حسابه على **Google Drive**.

يعتمد هذا الحل على واجهة برمجة تطبيقات Google Drive (REST API v3) ومكتبات تسجيل الدخول الآمن، لحفظ النسخة الاحتياطية في مجلد خاص ومحمي بالتطبيق (`appDataFolder`) لضمان عدم وصول التطبيقات الأخرى لبيانات المستخدم.

---

## 🛠️ أولاً: تهيئة منصة مطوري جوجل (Google Cloud Console)

لكي يتمكن التطبيق من مصادقة المستخدم والاتصال بالـ Drive الخاص به، يجب إعداد مشروع في منصة Google Cloud:

### 1. إنشاء مشروع وتفعيل الـ API
1. افتح [منصة مطوري جوجل (Google Cloud Console)](https://console.cloud.google.com/).
2. أنشئ مشروعاً جديداً باسم التطبيق (مثال: `Vibe Note`).
3. اذهب إلى شريط البحث وابحث عن **Google Drive API** ثم قم بتفعيله (**Enable**).

### 2. إعداد شاشة موافقة OAuth (OAuth Consent Screen)
1. من القائمة الجانبية، اختر **APIs & Services** > **OAuth consent screen**.
2. حدد نوع المستخدم كـ **External** ثم اضغط **Create**.
3. املأ معلومات التطبيق الأساسية (الاسم، البريد الإلكتروني للدعم والاتصال).
4. في خطوة **Scopes (النطاقات)**، اضغط على **Add or Remove Scopes** وأضف النطاق التالي:
   - `https://www.googleapis.com/auth/drive.appdata` 
   - *لماذا هذا النطاق؟* هذا النطاق يمنح تطبيقك مساحة تخزين خاصة ومخفية داخل Google Drive تسمى `appDataFolder`. لا يمكن للمستخدم أو للتطبيقات الأخرى رؤية الملفات بداخلها أو تعديلها، مما يمنع الحذف غير المقصود لملف النسخة الاحتياطية.
5. في خطوة **Test Users**، قم بإضافة حسابات Gmail التي ستستخدمها لاختبار التطبيق أثناء مرحلة التطوير.

### 3. إنشاء معرفات العميل (OAuth Client IDs)
ستحتاج لإنشاء **Client ID** مخصص لكل بيئة:
1. اذهب إلى **APIs & Services** > **Credentials**.
2. اضغط على **Create Credentials** واختر **OAuth client ID**.
3. **لنظام Android**: اختر نوع التطبيق Android، أدخل اسم الحزمة (Package Name) من ملف `app.json` (مثلاً `com.zizwar.vibenote`)، وأدخل بصمة SHA-1 لشهادة التوقيع الخاصة بك.
4. **لنظام iOS**: اختر نوع التطبيق iOS، وأدخل معرف الحزمة (Bundle ID).
5. **لبيئة التطوير والويب (Expo OAuth Redirect)**: اختر نوع التطبيق **Web application**. سيعطيك هذا معرف عميل للويب (Web Client ID)، وهو ضروري جداً لتمريره لإعدادات مكتبة تسجيل الدخول.

---

## 📦 ثانياً: تثبيت المكتبات المطلوبة في تطبيق Expo

للحصول على أفضل تجربة أداء وتوافق، يوصى باستخدام مكتبة تسجيل الدخول الرسمية من جوجل (والتي تتطلب استخدام EAS Build أو Development Build):

```bash
npx expo install @react-native-google-signin/google-signin
```

لحفظ رموز الاتصال بشكل آمن داخل الجهاز، سنستخدم أيضاً مكتبة التخزين الآمن من Expo:

```bash
npx expo install expo-secure-store
```

---

## 💻 ثالثاً: التنفيذ البرمجي لعملية المزامنة

### 1. تهيئة مكتبة تسجيل الدخول وتوصيل الحساب

قم بتهيئة الخدمة باستخدام الـ Web Client ID الذي حصلت عليه من خطوة الـ Google Console:

```typescript
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';

GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/drive.appdata'], // الوصول لمجلد البيانات المخفي فقط
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // استبدله بمعرف العميل الخاص بك للويب
  offlineAccess: true, // مهم للحصول على Refresh Token للمزامنة التلقائية اللاحقة
});

export async function linkGoogleDrive(): Promise<string | null> {
  try {
    await GoogleSignin.hasPlayServices();
    
    // بدء عملية تسجيل الدخول
    const userInfo = await GoogleSignin.signIn();
    
    // الحصول على الرموز الآمنة
    const tokens = await GoogleSignin.getTokens();
    const accessToken = tokens.accessToken;
    
    // حفظ حالة تسجيل الدخول محلياً
    await SecureStore.setItemAsync('google_drive_linked', 'true');
    
    return accessToken;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('تم إلغاء عملية تسجيل الدخول من قبل المستخدم');
    } else {
      console.error('خطأ أثناء تسجيل الدخول بجوجل:', error);
    }
    return null;
  }
}
```

### 2. دالة رفع النسخة الاحتياطية تلقائياً (Upload Auto-Backup)

تستخدم هذه الدالة صيغة `multipart/related` لرفع ملف البيانات الخاص بك كصيغة JSON إلى المجلد المخفي الخاص بالتطبيق في درايف:

```typescript
export async function uploadBackupToGoogleDrive(jsonData: string, accessToken: string): Promise<string | null> {
  try {
    const filename = `vibe-note-autobackup.json`;
    
    // 1. تحديد بيانات الملف الوصفية
    const metadata = {
      name: filename,
      parents: ['appDataFolder'], // حفظ الملف في المجلد المخفي الخاص بالتطبيق
      mimeType: 'application/json',
    };

    const boundary = 'vibe_note_boundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    // 2. دمج الوصف مع محتوى النسخة الاحتياطية في هيكل واحد
    const body = 
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      jsonData +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: body,
      }
    );

    const result = await response.json();
    
    if (response.ok) {
      console.log('تم رفع النسخة الاحتياطية بنجاح. معرف الملف:', result.id);
      return result.id;
    } else {
      console.error('فشل في رفع الملف إلى Google Drive:', result);
      return null;
    }
  } catch (error) {
    console.error('خطأ غير متوقع أثناء الرفع السحابي:', error);
    return null;
  }
}
```

### 3. دالة جلب واستعادة البيانات من السحابة (Restore Backup)

لجلب ملف النسخة الاحتياطية واستعادته داخل التطبيق:

```typescript
export async function restoreBackupFromGoogleDrive(accessToken: string): Promise<string | null> {
  try {
    // 1. البحث عن الملف في مجلد التطبيق appDataFolder وترتيبه حسب الأحدث تعديلاً
    const searchUrl = 'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&orderBy=modifiedTime desc&pageSize=1';
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    
    if (data.files && data.files.length > 0) {
      const fileId = data.files[0].id;
      
      // 2. تحميل محتوى الملف (البرومبتات المخزنة كـ JSON)
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const fileResponse = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      const fileContent = await fileResponse.text();
      return fileContent;
    }
    
    console.log('لم يتم العثور على أي ملفات احتياطية في Google Drive');
    return null;
  } catch (error) {
    console.error('خطأ أثناء استعادة النسخة الاحتياطية:', error);
    return null;
  }
}
```

---

## 🔄 رابعاً: استراتيجية المزامنة والنسخ التلقائي (Silent Auto-Sync)

لجعل تجربة المستخدم سلسة ومريحة، اتبع هذه الممارسات داخل كود تطبيقك:

1. **المزامنة الصامتة عند الفتح أو التحديث:**
   - عند بدء تشغيل التطبيق، تحقق إذا كان المستخدم قد قام بربط حسابه مسبقاً (`google_drive_linked === 'true'`).
   - استدع دالة تجديد الرمز تلقائياً في الخلفية `await GoogleSignin.signInSilently()`.
   - احصل على الـ `accessToken` الجديد، ثم قم بإجراء فحص ومزامنة سريعة لبيانات التطبيق.

2. **تحديث البيانات:**
   - يمكنك تفعيل خيار "النسخ التلقائي بعد التغيير" في إعدادات التطبيق.
   - في حال تفعيله، بعد كل عملية إضافة، تعديل أو حذف لأي برومبت، انتظر مدة وجيزة (مثلاً 5 ثوانٍ باستخدام Debounce لعدم تكرار الطلبات بشكل مكثف) ثم قم برفع النسخة المحدثة إلى Google Drive في الخلفية دون تعطيل عمل المستخدم.

3. **واجهة المستخدم (UI):**
   - أضف خياراً في صفحة الإعدادات: **"النسخ الاحتياطي التلقائي (Google Drive)"**.
   - وفر زر **"ربط الحساب"** إذا لم يكن الحساب مرتبطاً، وزر **"إلغاء الربط"** لتمكين المستخدم من تسجيل الخروج وحذف الرموز المحلية.
