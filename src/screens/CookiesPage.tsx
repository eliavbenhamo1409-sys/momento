import { Link } from 'react-router'
import PageTransition from '../components/shared/PageTransition'

export default function CookiesPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-surface" dir="rtl">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface/80 border-b border-outline-variant/20">
          <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="font-heebo font-bold text-xl text-on-surface">Momento</Link>
            <Link to="/" className="text-sm text-primary hover:underline">חזרה לדף הבית</Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="font-heebo font-bold text-4xl text-on-surface mb-2">מדיניות עוגיות</h1>
          <p className="text-on-surface-variant mb-12">עודכנה לאחרונה: מרץ 2026</p>

          <div className="prose-legal space-y-8 text-on-surface/85 leading-relaxed [&_h2]:font-heebo [&_h2]:font-bold [&_h2]:text-xl [&_h2]:text-on-surface [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:font-heebo [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:text-on-surface [&_h3]:mt-8 [&_h3]:mb-3">

            <section>
              <h2>1. מהן עוגיות?</h2>
              <p>
                עוגיות (Cookies) הן קבצי טקסט קטנים הנשמרים במכשיר שלך (מחשב, טלפון, טאבלט) בעת ביקור באתר אינטרנט.
                הן מאפשרות לאתר לזהות את המכשיר שלך ולזכור מידע אודות הביקור שלך, כגון העדפות שפה, פרטי התחברות ושימוש באתר.
              </p>
              <p>
                בנוסף לעוגיות, אנו עשויים להשתמש בטכנולוגיות מעקב דומות כגון פיקסלים (pixels), web beacons ו-Local Storage.
                כל התייחסות ל"עוגיות" במדיניות זו כוללת גם טכנולוגיות אלו.
              </p>
            </section>

            <section>
              <h2>2. כיצד אנו משתמשים בעוגיות</h2>
              <p>
                בעת השימוש באתר momentobook.com עשוי להיאסף מידע באמצעות עוגיות אודות פעילותך, כגון:
                עמודים שנצפו, זמני גלישה, נתיב השימוש באתר, העדפות עיצוב ותצוגה.
              </p>
              <p>המידע שנאסף כפוף למדיניות הפרטיות שלנו.</p>
            </section>

            <section>
              <h2>3. סוגי עוגיות בהם אנו משתמשים</h2>

              <h3>3.1 עוגיות חיוניות (Strictly Necessary)</h3>
              <p>
                הכרחיות לתפקוד הבסיסי של האתר. בלעדיהן לא ניתן לספק את השירות.
              </p>
              <ul className="list-disc pr-6 space-y-1">
                <li>ניהול התחברות והפעלת משתמש (session) — באמצעות Supabase Auth.</li>
                <li>שמירת העדפות אבטחה וזיהוי המכשיר.</li>
                <li>הגנה מפני התקפות CSRF ושימוש לרעה.</li>
              </ul>
              <p className="text-sm text-on-surface-variant">עוגיות אלו אינן דורשות הסכמה ואינן ניתנות לביטול.</p>

              <h3>3.2 עוגיות פונקציונליות (Functional)</h3>
              <p>
                משפרות את חוויית השימוש שלך באתר על ידי שמירת העדפות:
              </p>
              <ul className="list-disc pr-6 space-y-1">
                <li>שפה וכיוון (RTL).</li>
                <li>מצב תצוגה (כגון תצוגת עריכה מועדפת).</li>
                <li>מידע שהוזן בטפסים שטרם נשלחו.</li>
              </ul>

              <h3>3.3 עוגיות ניתוח ביצועים (Analytics)</h3>
              <p>
                מסייעות לנו להבין כיצד משתמשים באתר, אילו עמודים נצפים ואילו תכונות נמצאות בשימוש רב.
                מידע זה עוזר לנו לשפר את השירות.
              </p>
              <ul className="list-disc pr-6 space-y-1">
                <li>Vercel Analytics — ניתוח ביצועי אתר ודפוסי שימוש.</li>
              </ul>
              <p className="text-sm text-on-surface-variant">
                המידע שנאסף הוא מצרפי ואנונימי ואינו מזהה אותך אישית.
              </p>

              <h3>3.4 עוגיות שיווקיות (Marketing)</h3>
              <p>
                כרגע איננו משתמשים בעוגיות שיווקיות או פרסומיות.
                ככל שנשנה זאת בעתיד, מדיניות זו תעודכן בהתאם ותתבקש/י לתת הסכמה נפרדת.
              </p>
            </section>

            <section>
              <h2>4. עוגיות צד שלישי</h2>
              <p>השירות משתמש בשירותי צד שלישי אשר עשויים להציב עוגיות משלהם:</p>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm border border-outline-variant/30 rounded-lg overflow-hidden">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="py-3 px-4 text-right font-semibold border-b border-outline-variant/30">ספק</th>
                      <th className="py-3 px-4 text-right font-semibold border-b border-outline-variant/30">מטרה</th>
                      <th className="py-3 px-4 text-right font-semibold border-b border-outline-variant/30">סוג</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-outline-variant/20">
                      <td className="py-3 px-4">Supabase</td>
                      <td className="py-3 px-4">אימות משתמש, ניהול session</td>
                      <td className="py-3 px-4">חיוני</td>
                    </tr>
                    <tr className="border-b border-outline-variant/20">
                      <td className="py-3 px-4">Google (OAuth)</td>
                      <td className="py-3 px-4">התחברות באמצעות חשבון Google</td>
                      <td className="py-3 px-4">חיוני</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Vercel</td>
                      <td className="py-3 px-4">אירוח האתר וניתוח ביצועים</td>
                      <td className="py-3 px-4">חיוני + ניתוח</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-4">
                לכל ספק מדיניות פרטיות ועוגיות משלו. מומלץ לעיין בהן:
              </p>
              <ul className="list-disc pr-6 space-y-1">
                <li><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">מדיניות הפרטיות של Supabase</a></li>
                <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">מדיניות הפרטיות של Google</a></li>
                <li><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">מדיניות הפרטיות של Vercel</a></li>
              </ul>
            </section>

            <section>
              <h2>5. Local Storage ו-Session Storage</h2>
              <p>
                בנוסף לעוגיות, השירות משתמש ב-Local Storage וב-Session Storage של הדפדפן לצורך:
              </p>
              <ul className="list-disc pr-6 space-y-1">
                <li>שמירת טוקן אימות (authentication token) לצורך שמירת התחברות.</li>
                <li>שמירת מצב העורך ועבודה נוכחית לצורך שחזור במקרה של סגירה בלתי צפויה.</li>
                <li>שמירת העדפות תצוגה.</li>
              </ul>
              <p>
                ניתן למחוק נתונים אלו דרך הגדרות הדפדפן (כלי פיתוח → Application → Storage).
              </p>
            </section>

            <section>
              <h2>6. כיצד לשלוט בעוגיות</h2>
              <p>
                רוב הדפדפנים מאפשרים לשלוט בעוגיות דרך אזור ההגדרות/העדפות:
              </p>
              <ul className="list-disc pr-6 space-y-2">
                <li><strong>הצגה ומחיקה:</strong> ניתן לצפות בעוגיות שנשמרו ולמחוק אותן ידנית.</li>
                <li><strong>חסימה:</strong> ניתן לחסום עוגיות מסוגים מסוימים או מאתרים מסוימים.</li>
                <li><strong>מצב פרטי:</strong> גלישה במצב אנונימי/פרטי מונעת שמירת עוגיות לאחר סגירת הדפדפן.</li>
              </ul>
              <p>
                <strong>שימו לב:</strong> חסימת עוגיות חיוניות עלולה לפגוע בתפקוד האתר — לדוגמה, לא תוכל/י
                להישאר מחובר/ת לחשבונך.
              </p>

              <h3>קישורים להגדרות עוגיות בדפדפנים נפוצים:</h3>
              <ul className="list-disc pr-6 space-y-1">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/he/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/he-il/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
                <li><a href="https://support.microsoft.com/he-il/microsoft-edge/microsoft-edge-%D7%A2%D7%95%D7%92%D7%99%D7%95%D7%AA" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
              </ul>
            </section>

            <section>
              <h2>7. שינויים במדיניות</h2>
              <p>
                אנו עשויים לעדכן מדיניות עוגיות זו מעת לעת, בין היתר בשל שינויים טכנולוגיים או רגולטוריים.
                שינויים מהותיים יפורסמו באתר. מומלץ לבחון מדיניות זו מעת לעת.
              </p>
            </section>

            <section>
              <h2>8. יצירת קשר</h2>
              <p>
                לשאלות בנוגע לשימוש בעוגיות או למדיניות זו, ניתן לפנות אלינו:<br />
                דוא"ל: <strong>privacy@momentobook.com</strong><br />
                אתר: <strong>momentobook.com</strong>
              </p>
            </section>

          </div>
        </main>

        <footer className="border-t border-outline-variant/20 py-8 text-center text-sm text-on-surface-variant">
          <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-6">
            <Link to="/privacy" className="hover:text-primary transition-colors">מדיניות פרטיות</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">תקנון ותנאי שימוש</Link>
            <Link to="/" className="hover:text-primary transition-colors">חזרה לדף הבית</Link>
          </div>
          <p className="mt-4">&copy; {new Date().getFullYear()} Momento. כל הזכויות שמורות.</p>
        </footer>
      </div>
    </PageTransition>
  )
}
