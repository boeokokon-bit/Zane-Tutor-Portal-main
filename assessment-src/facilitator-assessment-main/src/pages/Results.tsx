import { useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AssessmentResult,
  SUBJECT_LABELS,
  PSYCH_CATEGORY_LABELS,
  getFullName,
  TUTOR_RATING_LABELS,
  TUTOR_RATING_DESCRIPTIONS,
  getTutorRatingEmoji,
} from '@/types/assessment';
import {
  getStatusColor,
  getStatusBgColor,
} from '@/lib/assessmentUtils';
import { saveToGoogleSheets } from '@/lib/googleSheets';
import QuestionReviewSection from '@/components/results/QuestionReviewSection';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { wpApi } from '@/lib/wordpressApi';
import { toast } from 'sonner';
import {
  ArrowRight,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Phone,
  Mail,
  Award,
  BookOpen,
  Laptop,
  Brain,
} from 'lucide-react';

const WHATSAPP_NUMBER = '2348107239402';
const CONTACT_EMAIL = 'hello@zanetutors.com.ng';

const Results = () => {
  const location = useLocation();
  const result = location.state?.result as AssessmentResult | undefined;
  const { isAuthenticated } = useAuth();
  const wpSaveAttempted = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (result && isAuthenticated && !wpSaveAttempted.current) {
      wpSaveAttempted.current = true;
      wpApi.saveAssessment(result as unknown as Record<string, unknown>)
        .then(() => toast.success('Results saved and sent for admin review!'))
        .catch(() => {});
    }
  }, [result, isAuthenticated]);

  const tutorName = result ? getFullName(result.studentInfo.firstName, result.studentInfo.lastName) : '';

  if (!result) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">📋</div>
            <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
            <p className="text-muted-foreground mb-6">Please complete the assessment first.</p>
            <Link to="/assessment">
              <Button className="gradient-primary text-primary-foreground">Start Assessment</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const compositeScore = result.compositeScore ?? result.finalReadinessScore;
  const tutorRating = result.tutorRating ?? 'developing';
  const sectionScores = result.sectionScores;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-success';
    if (score >= 70) return 'text-accent';
    if (score >= 55) return 'text-warning';
    return 'text-destructive';
  };

  const getRatingGradient = () => {
    switch (tutorRating) {
      case 'expert': return 'from-success/20 to-success/5';
      case 'proficient': return 'from-accent/20 to-accent/5';
      case 'developing': return 'from-warning/20 to-warning/5';
      case 'foundational': return 'from-destructive/20 to-destructive/5';
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'needs_work':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'urgent':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi ZaneTutors! I just completed the Tutor Proficiency Assessment and scored ${compositeScore}/100 (${TUTOR_RATING_LABELS[tutorRating]}). I'd like to discuss my results.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className={`relative py-12 md:py-16 bg-gradient-to-b ${getRatingGradient()}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-muted-foreground mb-2">Assessment Complete</p>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Hi {tutorName},</h1>
            <p className="text-lg text-muted-foreground">Here's your proficiency score:</p>
          </div>

          <Card className="max-w-md mx-auto p-8 text-center shadow-xl animate-scale-in">
            <div className={`text-7xl md:text-8xl font-bold mb-2 animate-score-reveal ${getScoreColor(compositeScore)}`}>
              {compositeScore}
              <span className="text-3xl text-muted-foreground">/100</span>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">{getTutorRatingEmoji(tutorRating)}</span>
              <span className="text-xl font-semibold">{TUTOR_RATING_LABELS[tutorRating]}</span>
            </div>
            <p className="text-muted-foreground mb-4">
              {TUTOR_RATING_DESCRIPTIONS[tutorRating]}
            </p>
            <p className="text-sm text-muted-foreground border-t border-border pt-4">
              <Award className="w-4 h-4 inline mr-1" />
              Your results have been submitted for admin review.
            </p>
          </Card>
        </div>
      </section>

      {/* Score Breakdown by Section */}
      {sectionScores && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Score Breakdown</h2>
            <div className="grid gap-4">
              <Card className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Subject Knowledge</p>
                  <p className="text-sm text-muted-foreground">Accuracy across selected subjects</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${getScoreColor(sectionScores.subjectPoints * 2)}`}>
                    {sectionScores.subjectPoints}
                  </span>
                  <span className="text-muted-foreground text-sm"> / 50</span>
                </div>
              </Card>
              <Card className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Laptop className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Digital Tools</p>
                  <p className="text-sm text-muted-foreground">Self-rating + knowledge questions</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${getScoreColor(sectionScores.digitalPoints * 5)}`}>
                    {sectionScores.digitalPoints}
                  </span>
                  <span className="text-muted-foreground text-sm"> / 20</span>
                </div>
              </Card>
              <Card className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Psychological Profile</p>
                  <p className="text-sm text-muted-foreground">Patience, communication, empathy & more</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${getScoreColor(Math.round(sectionScores.psychPoints * (100/30)))}`}>
                    {sectionScores.psychPoints}
                  </span>
                  <span className="text-muted-foreground text-sm"> / 30</span>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Subject Breakdown */}
      <section className="py-12 md:py-16 bg-muted/20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Subject Details</h2>
          <div className="grid gap-4">
            {result.subjectResults.map((subjectResult, i) => (
              <Card
                key={subjectResult.subject}
                className={`p-6 border-2 animate-slide-up ${getStatusBgColor(subjectResult.status)}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={subjectResult.status} />
                    <div>
                      <h3 className="font-semibold text-lg">{SUBJECT_LABELS[subjectResult.subject]}</h3>
                      <p className="text-sm text-muted-foreground">
                        {subjectResult.score}/{subjectResult.totalQuestions} correct
                      </p>
                    </div>
                  </div>
                  <div className={`text-3xl font-bold ${getStatusColor(subjectResult.status)}`}>
                    {subjectResult.percentage}%
                  </div>
                </div>
                <Progress value={subjectResult.percentage} className="h-3 mb-4" />
                {subjectResult.weakTopics.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Areas to review:</p>
                    <div className="flex flex-wrap gap-2">
                      {subjectResult.weakTopics.map((topic, j) => (
                        <span key={j} className="px-3 py-1 bg-background rounded-full text-sm border border-border">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Psych Results */}
      {result.psychResults && result.psychResults.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Psychological Profile</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.psychResults.map((pr) => (
                <Card key={pr.category} className="p-5">
                  <p className="font-semibold mb-1">{PSYCH_CATEGORY_LABELS[pr.category]}</p>
                  <div className={`text-2xl font-bold mb-2 ${getScoreColor(pr.percentage)}`}>
                    {pr.percentage}%
                  </div>
                  <Progress value={pr.percentage} className="h-2 mb-2" />
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    pr.level === 'strong' ? 'bg-success/10 text-success' :
                    pr.level === 'adequate' ? 'bg-accent/10 text-accent' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {pr.level === 'strong' ? 'Strong' : pr.level === 'adequate' ? 'Adequate' : 'Needs Development'}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Question Review */}
      <QuestionReviewSection
        selectedSubjects={result.studentInfo.selectedSubjects}
        answers={result.answers}
      />

      {/* Next Steps */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">What's Next?</h2>
          <p className="text-muted-foreground mb-8">
            Your results have been sent to the admin team for review. You'll be contacted with next steps soon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2 gradient-primary text-primary-foreground" onClick={openWhatsApp}>
              <MessageCircle className="w-5 h-5" />
              Contact Us on WhatsApp
            </Button>
            <Link to="/assessment">
              <Button size="lg" variant="outline" className="gap-2">
                <RefreshCw className="w-5 h-5" />
                Retake Assessment
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="font-semibold text-foreground mb-1">ZaneTutors</p>
              <p className="text-sm text-muted-foreground">Learn. Grow. Lead. — Building Nigeria's best tutoring team.</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href={`tel:+${WHATSAPP_NUMBER}`} className="flex items-center gap-2 hover:text-foreground">
                <Phone className="w-4 h-4" /> +234 810 723 9402
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 hover:text-foreground">
                <Mail className="w-4 h-4" /> {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Results;
