import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-muted/10 py-12">
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="mb-8">
          <Card className="border-0 bg-background/95 shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl">Zane Tutors Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                At Zane Tutors, we respect your privacy and are committed to protecting your personal data.
                This Privacy Policy explains what information we collect, why we collect it, and how we use it.
              </p>
              <p>
                If you are a tutor, learner, or partner using our platform, this policy applies to all services
                accessed through the Tutor Portal, the Zane Learning Hub, and our related web applications.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="space-y-4">
              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">1. What We Collect</h2>
                <p className="text-muted-foreground">
                  We collect the minimum data needed to operate your account, support onboarding, verify your identity,
                  and deliver tutoring services. This includes your name, email address, phone number, teaching profile,
                  document uploads (ID, certificates, verification documents), and account preferences.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">2. Why We Use Your Information</h2>
                <p className="text-muted-foreground">
                  Your information helps us verify your tutor profile, manage your onboarding journey, process payments,
                  and match you with the right students or cohort opportunities.
                  It also allows us to maintain secure access and improve your experience on the portal.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">3. How We Store Data</h2>
                <p className="text-muted-foreground">
                  We use secure servers and encrypted channels to protect the data you provide. Document uploads are stored
                  as privacy-protected attachments and are only used for verification, compliance, and tutoring eligibility.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">4. Sharing and Third Parties</h2>
                <p className="text-muted-foreground">
                  We never sell your personal information. We may share limited data with payment processors, verification
                  partners, or service providers when required to deliver tutoring services and manage payouts.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">5. Your Rights</h2>
                <p className="text-muted-foreground">
                  You can access, update, or request deletion of your personal data at any time through the portal.
                  For specific requests, contact our support team and we will respond within the timeframe required by law.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-semibold">6. Contact</h2>
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy, please contact us through the support channels available
                  in your Tutor Portal or at support@zanetutors.com.ng.
                </p>
              </section>
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground">
            <p>
              Return to the <Link className="text-primary underline" to="/login">Login / Register</Link> page, or read our{' '}
              <Link className="text-primary underline" to="/terms">Terms of Use</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
