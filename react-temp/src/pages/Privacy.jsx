import Footer from "../components/Footer.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import "./Privacy.css";

function Privacy() {
  const { language, isArabic } = useLanguage();

  const tr = (en, ar) =>
    language === "ar" ? ar : en;

  return (
    <main
      className="privacy-page"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <section className="privacy-hero">
        <div className="privacy-hero__inner">
          <span className="privacy-eyebrow">
            {tr(
              "PRIVACY & TRUST",
              "الخصوصية والثقة"
            )}
          </span>

          <h1>
            {tr(
              "Privacy Policy",
              "سياسة الخصوصية"
            )}
          </h1>

          <p>
            {tr(
              "This policy explains how Fixer.Co handles the information you share while using our website and services.",
              "توضح هذه السياسة كيفية تعامل Fixer.Co مع المعلومات التي تشاركها أثناء استخدام الموقع والخدمات."
            )}
          </p>

          <span className="privacy-updated">
            {tr(
              "Last updated: September 2026",
              "آخر تحديث: سبتمبر 2026"
            )}
          </span>
        </div>
      </section>

      <section className="privacy-content">
        <div className="privacy-container">
          <article className="privacy-card">
            <PolicySection
              number="01"
              title={tr(
                "Information We Collect",
                "المعلومات التي نجمعها"
              )}
            >
              <p>
                {tr(
                  "We may collect information you provide directly to Fixer.Co, such as your name, username, email address, phone number, account details, service request details, and information you submit through forms on the website.",
                  "قد نجمع المعلومات التي تقدمها مباشرة إلى Fixer.Co، مثل الاسم واسم المستخدم والبريد الإلكتروني ورقم الجوال وبيانات الحساب وتفاصيل طلبات الخدمة والمعلومات التي ترسلها عبر نماذج الموقع."
                )}
              </p>
            </PolicySection>

            <PolicySection
              number="02"
              title={tr(
                "How We Use Information",
                "كيف نستخدم المعلومات"
              )}
            >
              <p>
                {tr(
                  "We use this information to create and manage accounts, process and track service requests, connect customers with fixers, communicate with users, provide support, maintain website security, and improve the Fixer.Co experience.",
                  "نستخدم هذه المعلومات لإنشاء الحسابات وإدارتها، ومعالجة طلبات الخدمة ومتابعتها، وربط العملاء بالفنيين، والتواصل مع المستخدمين، وتقديم الدعم، والمحافظة على أمان الموقع، وتحسين تجربة Fixer.Co."
                )}
              </p>
            </PolicySection>

            <PolicySection
              number="03"
              title={tr(
                "Google Sign-In",
                "تسجيل الدخول عبر Google"
              )}
            >
              <p>
                {tr(
                  "If you choose to continue with Google, Fixer.Co may receive basic profile information provided by Google, such as your name and email address. We use this information only to sign you in, create or connect your Fixer.Co account, and provide account-related features.",
                  "إذا اخترت المتابعة باستخدام Google، فقد تستقبل Fixer.Co معلومات أساسية من ملفك في Google مثل الاسم والبريد الإلكتروني. نستخدم هذه المعلومات فقط لتسجيل دخولك وإنشاء حساب Fixer.Co أو ربطه وتقديم المزايا المرتبطة بالحساب."
                )}
              </p>
            </PolicySection>

            <PolicySection
              number="04"
              title={tr(
                "Cookies and Sessions",
                "ملفات الارتباط والجلسات"
              )}
            >
              <p>
                {tr(
                  "Fixer.Co may use session cookies or similar browser storage to keep you signed in, remember language or guest preferences, and support essential website functionality. These technologies are used for service operation rather than third-party advertising.",
                  "قد تستخدم Fixer.Co ملفات جلسة أو تخزينًا مشابهًا في المتصفح للحفاظ على تسجيل الدخول وتذكر اللغة أو وضع الضيف ودعم الوظائف الأساسية للموقع. وتُستخدم هذه التقنيات لتشغيل الخدمة وليست للإعلانات الخارجية."
                )}
              </p>
            </PolicySection>

            <PolicySection
              number="05"
              title={tr(
                "Data Sharing",
                "مشاركة البيانات"
              )}
            >
              <p>
                {tr(
                  "We do not sell your personal information. Information may be shared only when needed to provide the requested service, operate the platform, comply with legal obligations, or protect the security and rights of Fixer.Co and its users.",
                  "لا نبيع معلوماتك الشخصية. وقد تتم مشاركة المعلومات فقط عند الحاجة لتقديم الخدمة المطلوبة أو تشغيل المنصة أو الالتزام بالمتطلبات النظامية أو حماية أمان وحقوق Fixer.Co ومستخدميها."
                )}
              </p>
            </PolicySection>

            <PolicySection
              number="06"
              title={tr(
                "Data Security",
                "أمان البيانات"
              )}
            >
              <p>
                {tr(
                  "We take reasonable measures designed to protect user information and limit access to data. No online system can guarantee absolute security, so users should also protect their account credentials and devices.",
                  "نتخذ إجراءات معقولة تهدف إلى حماية معلومات المستخدمين والحد من الوصول إلى البيانات. ولا يمكن لأي نظام عبر الإنترنت ضمان الأمان الكامل، لذلك ينبغي للمستخدمين أيضًا حماية بيانات الدخول وأجهزتهم."
                )}
              </p>
            </PolicySection>

            <PolicySection
              number="07"
              title={tr(
                "Your Choices",
                "خياراتك"
              )}
            >
              <p>
                {tr(
                  "You may choose not to use Google Sign-In and use the available account options instead. You may also contact us if you have questions about the information associated with your Fixer.Co account.",
                  "يمكنك اختيار عدم استخدام تسجيل الدخول عبر Google واستخدام خيارات الحساب الأخرى المتاحة. كما يمكنك التواصل معنا إذا كانت لديك أسئلة حول المعلومات المرتبطة بحسابك في Fixer.Co."
                )}
              </p>
            </PolicySection>

            <PolicySection
              number="08"
              title={tr(
                "Contact Us",
                "تواصل معنا"
              )}
            >
              <p>
                {tr(
                  "For privacy questions or requests related to this policy, please contact Fixer.Co through the Contact Us page on our website.",
                  "للاستفسارات المتعلقة بالخصوصية أو بهذه السياسة، يرجى التواصل مع Fixer.Co من خلال صفحة تواصل معنا في الموقع."
                )}
              </p>
            </PolicySection>
          </article>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function PolicySection({
  number,
  title,
  children,
}) {
  return (
    <section className="privacy-section">
      <div className="privacy-section__number">
        {number}
      </div>

      <div className="privacy-section__content">
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default Privacy;
