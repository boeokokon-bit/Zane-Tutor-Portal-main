import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-muted/10 py-12">
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="mb-8">
          <Card className="border-0 bg-background/95 shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl">Zane Tutors Terms of Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Welcome to Zane Tutors. These Terms of Use explain the rules that govern your access to the Tutor Portal
                and the services we provide as part of the Zane Learning Hub.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="space-y-4">
              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By creating an account and using the Zane Tutor Portal, you agree to comply with these terms and all
                  applicable policies. If you do not agree, please do not use the platform.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">2. Account Responsibility</h2>
                <p className="text-muted-foreground">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activity
                  that occurs under your account. Keep your password secure and notify us immediately if you suspect
                  unauthorized access.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">3. Tutor Conduct</h2>
                <p className="text-muted-foreground">
                  Tutors must deliver professional, respectful teaching services, provide accurate profile information, and
                  meet the quality expectations of Zane and our learners. Any behavior that violates our policies may result
                  in account review or suspension.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">4. Earnings and Payments</h2>
                <p className="text-muted-foreground">
                  Zane collects payments on behalf of tutors for verified sessions, monthly packages, and cohort enrollments.
                  Your payouts will be processed according to the platform schedule once sessions are confirmed and logged.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">5. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content, branding, and software on the Zane platform are owned or licensed by Zane Tutors.
                  You may not reproduce, distribute, or use our intellectual property without permission.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">6. Updates to Terms</h2>
                <p className="text-muted-foreground">
                  We may update these terms from time to time. We will notify you of material changes through the portal or
                  via email. Continued use of the service after updates constitutes acceptance of the revised terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">7. Contact and Support</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms of Use or to report issues, contact support@zanetutors.com.ng or use the
                  support channels inside your Tutor Portal.
                </p>
              </section>
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground">
            <p>
              Return to the <Link className="text-primary underline" to="/login">Login / Register</Link> page, or read our{' '}
              <Link className="text-primary underline" to="/privacy">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
