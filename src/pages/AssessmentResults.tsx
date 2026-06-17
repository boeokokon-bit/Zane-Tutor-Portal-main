import { useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AssessmentResult,
  SUBJECT_LABELS,
  getFullName,
  TUTOR_RATING_LABELS,
  TUTOR_RATING_DESCRIPTIONS,
  getTutorRatingIcon as getTutorRatingIconName,
  PsychResult,
  DigitalToolsResult,
} from '@/types/assessment';
import {
  getStatusColor,
  getStatusBgColor,
} from '@/lib/assessmentUtils';
import QuestionReviewSection from '@/components/results/QuestionReviewSection';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { assessmentApi as wpApi } from '@/lib/api';
import { toast } from 'sonner';
import {
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
  ClipboardList,
  TrendingUp,
  ArrowDown,
  Star,
  BarChart3,
  Shield,
} from 'lucide-react';
import { resolveLane, getRequiredAssessments, type Lane } from '@/lib/lanes';

const WHATSAPP_NUMBER = '2348107239402';
const CONTACT_EMAIL = 'hello@zanetutors.com.ng';

const ratingIcons: Record<string, React.ReactNode> = {
  expert: <Star className="w-6 h-6 text-yellow-500" />,
  proficient: <TrendingUp className="w-6 h-6 text-primary" />,
  developing: <AlertTriangle className="w-6 h-6 text-warning" />,
  foundational: <ArrowDown className="w-6 h-6 text-destructive" />,
};

const AssessmentResults = () => {
  const location = useLocation();
  const result = location.state?.result as AssessmentResult | undefined;
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const wpSaveAttempted = useRef(false);
  const lane = resolveLane(user);
  const req = getRequiredAssessments(lane);

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
            <div className="flex justify-center mb-4">
              <ClipboardList className="w-16 h-16 text-muted-foreground" />
            </div>
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

  // Determine what sections to show based on lane
  const showSubjectResults = req.subject !== 'skip';
  const showDigitalResults = req.digital !== 'skip';
  const showPsychResults = req.psych !== 'skip';
  const isInsightOnly = req.subject !== 'required' && req.digital !== 'required' && req.psych !== 'required';

  // Digital tools data from result
  const digitalResults: DigitalToolsResult[] = (result as any).digitalToolsResults || [];
  const digitalOverall: { score: number; percentage: number } = (result as any).digitalToolsOverall || { score: 0, percentage: 0 };
  const digitalSelfRatings: Record<string, number> = (result as any).digitalToolsSelfRatings || {};

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className={`relative py-12 md:py-16 bg-gradient-to-b ${getRatingGradient()}`}>
        <div className="container mx-auto px-4">
          {isInsightOnly && (
            <div className="max-w-md mx-auto mb-6 p-3 rounded-lg bg-secondary/10 border border-secondary/30 text-sm text-center">
              <Shield className="w-4 h-4 inline mr-1.5 text-secondary" />
              <span className="font-semibold">Insight Mode</span> — These results are for your personal development only and do not affect approval.
            </div>
          )}
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
              {ratingIcons[tutorRating] || <Star className="w-6 h-6 text-muted-foreground" />}
              <span className="text-xl font-semibold">{TUTOR_RATING_LABELS[tutorRating]}</span>
            </div>
            <p className="text-muted-foreground mb-4">
              {TUTOR_RATING_DESCRIPTIONS[tutorRating]}
            </p>
            <p className="text-sm text-muted-foreground border-t border-border pt-4">
              <Award className="w-4 h-4 inline mr-1" />
              {isInsightOnly ? 'Your results have been recorded.' : 'Your results have been submitted for admin review.'}
            </p>
          </Card>
        </div>
      </section>

      {/* Score Breakdown by Section */}
      {sectionScores && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Score Breakdown</h2>
            <div className="grid gap-4">
              {showSubjectResults && (
                <Card className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
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
              )}
              {showDigitalResults && (
                <Card className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Laptop className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 text-left">
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
              )}
              {showPsychResults && (
                <Card className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1 text-left">
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
              )}
            </div>
          </div>
        </section>
      )}

      {/* Subject Breakdown */}
      {showSubjectResults && result.subjectResults.length > 0 && (
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
      )}

      {/* Digital Tools Results */}
      {showDigitalResults && digitalResults.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">Digital Tools Assessment</h2>
            <p className="text-center text-muted-foreground mb-8">Your digital literacy across key tool categories</p>
            
            {/* Overall Digital Score */}
            <Card className="p-6 mb-6 text-center border-2 border-accent/20 bg-accent/5">
              <Laptop className="w-10 h-10 text-accent mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">Overall Digital Score</p>
              <p className={`text-4xl font-bold ${getScoreColor(digitalOverall.percentage)}`}>{digitalOverall.percentage}%</p>
              <p className="text-sm text-muted-foreground mt-1">{digitalOverall.score} correct out of knowledge questions</p>
            </Card>

            {/* Category Breakdown */}
            <div className="grid gap-4">
              {digitalResults.map((dtResult, i) => (
                <Card key={dtResult.category} className="p-5 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <BarChart3 className={`w-5 h-5 ${getScoreColor(dtResult.percentage)}`} />
                      <span className="font-semibold">{dtResult.category}</span>
                    </div>
                    <span className={`text-xl font-bold ${getScoreColor(dtResult.percentage)}`}>{dtResult.percentage}%</span>
                  </div>
                  <Progress value={dtResult.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{dtResult.score}/{dtResult.totalQuestions} questions correct</p>
                </Card>
              ))}
            </div>

            {/* Self-Ratings Summary */}
            {Object.keys(digitalSelfRatings).length > 0 && (
              <Card className="mt-6 p-6">
                <h3 className="font-semibold mb-3 text-center">Your Self-Rated Proficiency</h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  {Object.entries(digitalSelfRatings).map(([key, val]) => {
                    const label = key.replace('rate_', '').replace(/_/g, ' ');
                    const stars = typeof val === 'number' ? val + 1 : 0;
                    return (
                      <div key={key} className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground capitalize">{label}</p>
                        <div className="flex justify-center gap-0.5 mt-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${s <= stars ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Personality & Style Analysis */}
      {showPsychResults && result.psychResults && result.psychResults.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">Personality & Style Analysis</h2>
            <p className="text-center text-muted-foreground mb-8">Your teaching personality and approach insights</p>
            
            {/* Overall Psych Summary */}
            {(result as any).psychOverall && (
              <Card className="p-6 mb-6 text-center border-2 border-secondary/20 bg-secondary/5">
                <Brain className="w-10 h-10 text-secondary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">Overall Psychological Profile</p>
                <p className={`text-3xl font-bold ${getScoreColor(Math.round((result as any).psychOverall.score))}`}>
                  {(result as any).psychOverall.score}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">{(result as any).psychOverall.level}</p>
              </Card>
            )}

            {/* Category Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
              {result.psychResults.map((psychResult: PsychResult, i: number) => {
                const getLevelColor = (level: string) => {
                  switch (level) {
                    case 'strong': return 'text-success border-success/20 bg-success/5';
                    case 'adequate': return 'text-accent border-accent/20 bg-accent/5';
                    case 'needs_development': return 'text-warning border-warning/20 bg-warning/5';
                    default: return 'text-muted-foreground';
                  }
                };
                return (
                  <Card key={psychResult.category} className={`p-5 border ${getLevelColor(psychResult.level)} animate-slide-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold capitalize">{psychResult.category}</span>
                      <span className={`text-sm font-medium capitalize px-2 py-0.5 rounded-full ${getLevelColor(psychResult.level)}`}>{psychResult.level.replace('_', ' ')}</span>
                    </div>
                    <Progress value={psychResult.percentage} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">{psychResult.percentage}% score</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Question Review */}
      {showSubjectResults && (
        <QuestionReviewSection
          selectedSubjects={result.studentInfo.selectedSubjects}
          answers={result.answers}
        />
      )}

      {/* Next Steps */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">What's Next?</h2>
          <p className="text-muted-foreground mb-8">
            {isInsightOnly 
              ? 'These results are for your personal development. Use them to identify strengths and areas for improvement.'
              : 'Your results have been sent to the admin team for review. You\'ll be contacted with next steps soon.'
            }
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

export default AssessmentResults;