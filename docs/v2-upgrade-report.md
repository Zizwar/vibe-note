<div dir="rtl">

# تقرير التنفيذ: ترقية Expo 56 + إصلاحات v2 — Vibe Note

> **التاريخ:** 9 يونيو 2026 · **الفرع:** v1 · **النموذج المنفِّذ:** Claude Opus 4.8
> هذا التقرير يوثّق الجولة التنفيذية التي شملت: بناء خطة طريق v2 عملية، ترقية Expo SDK 55 → 56، إصلاح حقول الإدخال (TextInput) للعربية/RTL، وإضافة "دردشة مع الذكاء" من شاشة البرومبت.

---

## 1. ماذا أُنجِز بالتفصيل

### 1.1 خطة طريق v2 عملية (المهمة 1) ✅
- أُضيف **القسم 9 — خطة الطريق التنفيذية لـ v2** داخل `docs/v2-roadmap-report.md`، ويتضمّن:
  - **المنهجية (Method):** تزايدية محكومة بالمخاطر، شرائح رأسية، أعلام ميزات، هجرات مُرقَّمة، بوّابة جودة، والحفاظ على فلسفة "محلّي أولاً/BYOK".
  - **المتطلّبات المسبقة (Prerequisites):** الأدوات والبيئة، جدول الديون التقنية `P0-1…P0-7`، ورسم اعتماديات الميزات.
  - **سجلّ طلبيات الترقية v1 → v2 (Upgrade Backlog):** بنود مرقّمة `UP-01 … UP-22` مرتّبة في 5 موجات (A الأساس، B الإنتاجية، C الذكاء، D التعاون، E النضج)، مع الطبقات المتأثّرة ومعيار القبول لكل بند.

### 1.2 ترقية Expo SDK 55 → 56 (المهمة 2) ✅
- **`package.json`:** رفع كل التبعيات لإصدارات SDK 56 الرسمية (مأخوذة من `bundledNativeModules.json` الخاص بـ `expo@56.0.9`):
  - `expo ~56.0.9`، `react 19.2.3`، `react-native 0.85.3`، `react-native-gesture-handler ~2.31.1`، `react-native-safe-area-context ~5.7.0`، وحزم `expo-* ~56.0.x`.
  - تغيير اسم الحزمة `expo-55-starter` → `vibe-note` ورفع `version` إلى `1.0.0`.
- **معالجة 3 أعطال شخّصها `expo-doctor`:**
  1. **حقل `splash` لم يعد مقبولاً في مخطط SDK 56** → نُقل إلى إضافة `expo-splash-screen` ضمن `plugins` في `app.json`، وأُضيفت الحزمة `expo-splash-screen ~56.0.10`.
  2. **تبعية الند المفقودة `expo-font`** (يطلبها `@expo/vector-icons`، وغيابها يسبّب تعطّلاً خارج Expo Go) → أُضيفت `expo-font ~56.0.5`.
  3. **TypeScript** المتوقَّع `~6.0.3` → رُفِع من `~5.9.2`.
- **كسر API في `expo-file-system`:** الدالة `FileSystem.cacheDirectory` أُزيلت في SDK 56. حُدِّث `App.tsx` لاستخدام واجهة الكائنات الجديدة `new File(Paths.cache, 'import_temp.vibe')` — بنفس النمط المستخدم أصلاً في `src/engine/importExport.ts`.
- **النتيجة النهائية:**
  - `npx tsc --noEmit` → **نظيف (0 أخطاء).**
  - `npx expo-doctor` → **21/21 فحصاً ناجحاً، لا مشاكل.**
  - `npm install` → نجح (نُظّف `package-lock.json` وأُعيد توليده).

### 1.3 إصلاح حقول الإدخال TextInput للعربية/RTL (المهمة 3) ✅
**السبب الجذري:** الحقول كانت أحادية السطر (بلا `multiline`)، فالنص الكبير يتمدّد أفقياً ويبقى على سطر واحد بدل أن يلتفّ وينزل لأسطر جديدة.

- **`src/components/VariableFiller.tsx`:**
  - حقل قيمة المتغيّر وحقل "قيمة مخصّصة": أصبحا `multiline` + `textAlignVertical="top"`، مع `minHeight/maxHeight/lineHeight` لتمدّد عمودي محكوم (مع تمرير داخلي عند تجاوز الحد).
  - صفّ إضافة الخيار يُحاذي عناصره من الأسفل (`alignItems: 'flex-end'`) ليبقى زر "+" متّسقاً عند تمدّد الحقل.
- **`src/screens/CreatePromptScreen.tsx`:**
  - حقل **الوصف** أصبح `multiline` بنمط `descriptionInput` (تمدّد 72→160px).
  - حقل المحتوى أُضيف له سقف `maxHeight: 320`، وحقل تعديل الذكاء أصبح يدعم RTL.
- **`src/screens/AIAssistantScreen.tsx`:** حقل الدردشة وحقل الأدوات أصبحا يدعمان RTL.
- **دعم RTL موحّد:** كل أنماط `inputRTL` صارت `{ textAlign: 'right', writingDirection: 'rtl' }` لعرض عربي صحيح في الإدخال متعدّد الأسطر.

### 1.4 "دردشة مع الذكاء" من شاشة البرومبت (المهمة 4) ✅
- **`src/types/index.ts`:** أُضيف حقل `seedPrompt?: string` إلى `NavigationParams`.
- **`src/screens/AIAssistantScreen.tsx`:** يقرأ `params.seedPrompt`؛ وعند وجوده يفتح تبويب **الدردشة** ويملأ صندوق الإدخال بالبرومبت تلقائياً (المستخدم يراجع ثم يضغط إرسال — بلا إرسال مفاجئ).
- **`src/screens/PromptDetailScreen.tsx`:** زر "دردشة مع الذكاء" في شريط الإجراءات السفلي (يظهر فقط عند `isAIConfigured()`) يفتح المساعد مع محتوى البرومبت الخام.
- **`src/components/VariableFiller.tsx`:** زر دردشة في صفّ الإجراءات يبني البرومبت النهائي بقيم المتغيّرات (`buildFinalPrompt`)، يسجّل الاستخدام والسجل، يغلق النافذة، ثم يفتح المساعد بالبرومبت **المعبّأ بالقيم**.
- **`src/i18n/strings.ts`:** أُضيف المفتاح `chatWithAI` بالإنجليزية/العربية/الفرنسية.
- هذه نسخة أولى من بند `UP-14`، وأساس مبكّر لميزة `UP-13` (التشغيل داخل التطبيق).

### 1.5 تنظيف الجذر (P0-2 من خطة الطريق) ✅
حُذفت ملفات ميتة غير مرجعية (`main` هو `index.ts` → `App.tsx`): `app.js`، `app.json.new.json` (فارغ)، `package_last.json`، و`proomy-note (1).zip`. هذا أزال أيضاً أخطاء `tsc` المتبقّية التي كانت من `app.js`.

---

## 2. قائمة التغييرات (الملفات والتفاصيل)

| الملف | الحالة | التفاصيل |
|---|---|---|
| `package.json` | عُدِّل | كل تبعيات SDK 56 + `expo-font` + `expo-splash-screen` + TS 6 + الاسم/الإصدار |
| `app.json` | عُدِّل | إزالة `splash` العلوي ونقله لإضافة `expo-splash-screen` |
| `App.tsx` | عُدِّل | استبدال `FileSystem.cacheDirectory` بـ `new File(Paths.cache, …)` |
| `package-lock.json` | عُدِّل | أُعيد توليده لإصدارات SDK 56 |
| `src/components/VariableFiller.tsx` | عُدِّل | حقول multiline/RTL + زر "دردشة مع الذكاء" + handler/styles |
| `src/screens/CreatePromptScreen.tsx` | عُدِّل | وصف multiline + RTL writingDirection + سقوف ارتفاع |
| `src/screens/AIAssistantScreen.tsx` | عُدِّل | قراءة `seedPrompt` وتعبئة الدردشة + RTL للحقول |
| `src/screens/PromptDetailScreen.tsx` | عُدِّل | زر "دردشة مع الذكاء" (مشروط بـ `isAIConfigured`) |
| `src/types/index.ts` | عُدِّل | `seedPrompt?` في `NavigationParams` |
| `src/i18n/strings.ts` | عُدِّل | مفتاح `chatWithAI` (en/ar/fr) |
| `docs/v2-roadmap-report.md` | عُدِّل | القسم 9: خطة الطريق التنفيذية لـ v2 |
| `docs/v2-upgrade-report.md` | جديد | هذا التقرير |
| `app.js`, `app.json.new.json`, `package_last.json`, `proomy-note (1).zip` | حُذفت | ملفات ميتة/مكرّرة |

إجمالي: **14 ملفاً مُعدَّلاً/محذوفاً + ملفّا تقرير** (نحو 1500 إضافة / 2944 حذفاً، أغلب الحذف من إعادة توليد القفل وإزالة الـ zip).

---

## 3. تعليمات التشغيل والبناء

```bash
# 1) تثبيت التبعيات (SDK 56)
cd /root/vibe-note-v1
npm install

# 2) فحوصات الجودة
npx tsc --noEmit        # يجب أن يكون نظيفاً
npx expo-doctor         # يجب أن يمر 21/21

# 3) التشغيل أثناء التطوير (يلزم Dev Client لأن المشروع يستخدم وحدات أصلية)
npx expo start --dev-client
# أو فتح أندرويد مباشرة:
npm run android

# 4) بناء أندرويد عبر EAS (إصدار قابل للتثبيت)
npx eas-cli build -p android --profile preview      # APK داخلي للاختبار
npx eas-cli build -p android --profile production    # إصدار المتجر
```

> **ملاحظة:** المشروع يعتمد على وحدات أصلية (expo-sqlite, secure-store, sharing…)، لذا **لا يعمل في Expo Go** ويحتاج **Development Build / Dev Client** أو بناء EAS.

---

## 4. ما لم يُنجَز بعد (ضمن خطة v2 الأوسع)

هذه الجولة نفّذت الأساس (`UP-01`, جزء من `UP-14`) وتنظيف `P0-2`. البنود التالية من خطة الطريق **لم تُنفَّذ** وتبقى أعمالاً قادمة:
- `UP-03` بنية اختبارات (Jest + jest-expo) — **لا توجد اختبارات بعد**.
- `UP-04` هجرات قاعدة بيانات مُرقَّمة (`schema_version`).
- `UP-05` نقل قراءات القاعدة إلى Async + Pagination/Virtualization.
- `UP-06` توصيل البحث بـ FTS5 فعلياً + ترتيب BM25.
- `UP-07 … UP-22` (المجلّدات، سجل الإصدارات، التشغيل داخل التطبيق، الصوت، المزامنة…).
- توحيد التوثيق المتبقّي (السمات 5↔10 في README) — `P0-7`.

---

## 5. المخاطر و TODOs

1. **لم يُجرَ بناء أندرويد أصلي (native) في هذه البيئة.** تحقّقنا عبر `tsc` و`expo-doctor` فقط؛ يجب تأكيد البناء عبر `eas build -p android` على جهاز/سحابة فعلية، خصوصاً بعد قفزة RN 0.83 → 0.85 (New Architecture مُفعّلة افتراضياً في SDK 56).
2. **New Architecture (Fabric/TurboModules) افتراضية في SDK 56.** يُنصح باختبار يدوي للشاشات الحسّاسة: لوحة المفاتيح في الدردشة (`Animated` + `KeyboardAvoidingView`)، نوافذ المودال، و`expo-sqlite`.
3. **اختبار RTL/العربية على جهاز فعلي:** أُضيف `writingDirection: 'rtl'` و`multiline`؛ يُستحسن التأكد بصرياً من التفاف النص العربي الطويل وعلامات الترقيم في الحقول المعدّلة.
4. **زر الدردشة يمرّر نصاً خاماً:** يُرسَل محتوى البرومبت كما هو إلى صندوق الدردشة دون رسالة نظام موجّهة؛ لاحقاً (`UP-13`) يُفضّل إرفاق سياق/تعليمات وتشغيل مباشر داخل التطبيق وحفظ المخرجات.
5. **`react-native 0.85.3` مقابل أحدث إصدار في السجل (0.86.0):** اعتُمد الإصدار الذي يثبّته SDK 56 رسمياً (`bundledNativeModules`) لضمان التوافق، وليس الأحدث مطلقاً.
6. **لا توجد شبكة أمان اختبارات:** أي إعادة هيكلة قادمة (Async DB, FTS5) عالية الخطورة بدون `UP-03` أولاً — يُنصح بتنفيذه قبل الموجة B.

</div>
